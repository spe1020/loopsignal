import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { transaction } from "./db";
import {
  access,
  filesFor,
  hash,
  loadRecord,
  persist,
  receipt,
  saveReceipt,
} from "./service";
import { invalidateHosted } from "./domain";
import { editor, ensure, type Actor, type Attachment } from "./types";
export interface ObjectStore {
  put(key: string, bytes: Buffer, type: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}
export function privateObjects(): ObjectStore {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  ensure(url && key, "Private file storage is unavailable", 503);
  ensure(
    new URL(url).protocol === "https:" ||
      ["127.0.0.1", "localhost"].includes(new URL(url).hostname),
    "Hosted object storage requires HTTPS",
    503,
  );
  const storage = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from("company-evidence");
  return {
    async put(path, bytes, contentType) {
      const { error } = await storage.upload(path, bytes, {
        contentType,
        upsert: false,
      });
      if (error) throw new Error("Object upload failed");
    },
    async get(path) {
      const { data, error } = await storage.download(path);
      if (error || !data) throw new Error("Source bytes are unavailable");
      return Buffer.from(await data.arrayBuffer());
    },
    async remove(path) {
      const { error } = await storage.remove([path]);
      if (error) throw new Error("Object deletion failed");
    },
  };
}
export function validateBytes(bytes: Buffer, type: string) {
  ensure(
    bytes.length > 0 && bytes.length <= 10485760,
    "Files must be between 1 byte and 10 MiB",
  );
  const supported = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "text/plain",
    "text/csv",
  ];
  ensure(supported.includes(type), "Use PDF, PNG, JPEG, plain text, or CSV");
  if (type === "application/pdf")
    ensure(
      bytes.subarray(0, 5).toString() === "%PDF-",
      "The PDF header does not match its type",
    );
  if (type === "image/png")
    ensure(
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      "Invalid PNG header",
    );
  if (type === "image/jpeg")
    ensure(
      bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
      "Invalid JPEG header",
    );
  if (type.startsWith("text/"))
    ensure(!bytes.includes(0), "Binary content cannot be uploaded as text");
}
export type StageUpload = {
  organizationId: string;
  recordId: string;
  evidenceId: string;
  expectedRevision: number;
  commandId: string;
  filename: string;
  size: number;
  mediaType: string;
};
export async function stageUpload(actor: Actor, input: StageUpload) {
  return transaction(actor, async (sql) => {
    const { member } = await access(sql, actor, input.organizationId, true);
    ensure(
      editor(member.role) || member.role === "participant",
      "Evidence contribution access required",
      403,
    );
    const r = await receipt(
      sql,
      actor,
      input.organizationId,
      input.commandId,
      input,
    );
    if (r.result) {
      const files = await filesFor(sql, input.organizationId, input.recordId);
      return {
        attachment: files.find((f) => f.id === r.result!.id),
        record: await loadRecord(sql, input.organizationId, input.recordId),
      };
    }
    const row = await loadRecord(
      sql,
      input.organizationId,
      input.recordId,
      true,
    );
    ensure(
      row.revision === input.expectedRevision,
      "Reload the newer revision before staging this file. Your selected file is unchanged.",
      409,
    );
    ensure(
      row.document.investigation.evidence.some(
        (e) => e.id === input.evidenceId,
      ),
      "Evidence must belong to this investigation",
    );
    ensure(
      input.size > 0 &&
        input.size <= 10485760 &&
        [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "text/plain",
          "text/csv",
        ].includes(input.mediaType),
      "Unsupported file size or type",
    );
    const id = randomUUID(),
      version = randomUUID(),
      objectKey = `${row.org_id}/${row.id}/${id}/${version}`;
    const [file] = await sql<
      Attachment[]
    >`insert into company.attachments(org_id,investigation_id,id,evidence_id,object_key,object_version,filename,media_type,size,uploaded_by) values(${row.org_id},${row.id},${id},${input.evidenceId},${objectKey},${version},${input.filename.replace(/[^\w. -]/g, "_").slice(0, 160)},${input.mediaType},${input.size},${actor.id}) returning *`;
    const before = structuredClone(row.document);
    row.attachments.push(file);
    invalidateHosted(row.document, row.attachments);
    const prior = row.revision++;
    await persist(
      sql,
      actor,
      row,
      prior,
      {
        commandId: input.commandId,
        correlationId: input.commandId,
        type: "stage_attachment",
      },
      before,
    );
    await saveReceipt(sql, actor, row.org_id, input.commandId, r.digest, {
      id,
    });
    return { attachment: file, record: row };
  });
}
export async function finalizeUpload(
  actor: Actor,
  input: {
    organizationId: string;
    recordId: string;
    attachmentId: string;
    expectedRevision: number;
    commandId: string;
  },
  bytes: Buffer,
  store: ObjectStore = privateObjects(),
) {
  return transaction(actor, async (sql) => {
    const { member } = await access(sql, actor, input.organizationId, true);
    ensure(
      editor(member.role) || member.role === "participant",
      "Evidence contribution access required",
      403,
    );
    const checksum = hash(bytes);
    const r = await receipt(sql, actor, input.organizationId, input.commandId, {
      ...input,
      checksum,
    });
    if (r.result) return loadRecord(sql, input.organizationId, input.recordId);
    const row = await loadRecord(
      sql,
      input.organizationId,
      input.recordId,
      true,
    );
    ensure(
      row.revision === input.expectedRevision,
      "Reload before finalizing. The staged upload is recoverable.",
      409,
    );
    const file = row.attachments.find((f) => f.id === input.attachmentId);
    ensure(file && file.state === "staged", "Staged upload unavailable", 404);
    ensure(
      file.uploaded_by === actor.id || editor(member.role),
      "You cannot finalize another participant’s upload",
      403,
    );
    validateBytes(bytes, file.media_type);
    ensure(bytes.length === file.size, "File size changed; stage a new upload");
    // Recover an object written before a database rollback. Never overwrite bytes.
    let previous: Buffer | undefined;
    try {
      previous = await store.get(file.object_key);
    } catch {}
    if (previous)
      ensure(
        hash(previous) === checksum,
        "This immutable object already contains different bytes",
        409,
      );
    else await store.put(file.object_key, bytes, file.media_type);
    const verified = await store.get(file.object_key);
    ensure(
      hash(verified) === checksum,
      "Stored checksum verification failed",
      503,
    );
    await sql`update company.attachments set state='ready',checksum=${checksum},finalized_at=clock_timestamp() where org_id=${row.org_id} and id=${file.id}`;
    const before = structuredClone(row.document);
    file.state = "ready";
    file.checksum = checksum;
    if (row.document.provenance)
      row.document.provenance.missingFiles =
        row.document.provenance.missingFiles.filter(
          (id) => id !== file.evidence_id,
        );
    invalidateHosted(row.document, row.attachments);
    const prior = row.revision++;
    await persist(
      sql,
      actor,
      row,
      prior,
      {
        commandId: input.commandId,
        correlationId: input.commandId,
        type: "finalize_attachment",
      },
      before,
    );
    await saveReceipt(sql, actor, row.org_id, input.commandId, r.digest, {
      id: row.id,
    });
    return row;
  });
}
export async function downloadFile(
  actor: Actor,
  org: string,
  record: string,
  id: string,
  store: ObjectStore = privateObjects(),
) {
  return transaction(actor, async (sql) => {
    await access(sql, actor, org);
    const row = await loadRecord(sql, org, record, true);
    const file = row.attachments.find(
      (f) => f.id === id && f.state === "ready",
    );
    ensure(file, "File unavailable", 404);
    const bytes = await store.get(file.object_key);
    ensure(
      hash(bytes) === file.checksum,
      "Source checksum mismatch. Do not rely on this result; a manager must mark or replace the source.",
      409,
    );
    return { file, bytes };
  });
}
export async function exportRecord(
  actor: Actor,
  org: string,
  id: string,
  store: ObjectStore = privateObjects(),
) {
  return transaction(actor, async (sql) => {
    await access(sql, actor, org);
    const row = await loadRecord(sql, org, id, true);
    const files = [];
    for (const file of row.attachments.filter((f) => f.state === "ready")) {
      const bytes = await store.get(file.object_key);
      ensure(
        hash(bytes) === file.checksum,
        "Export stopped because a source checksum failed",
        409,
      );
      files.push({ ...file, base64: bytes.toString("base64") });
    }
    const audit =
      await sql`select * from company.audit_events where org_id=${org} and record_id=${id} order by server_time`;
    return {
      format: "loopsignal-company-export",
      version: 1,
      exportedAt: new Date().toISOString(),
      record: row,
      files,
      audit,
    };
  });
}
