import { randomUUID } from "node:crypto";
import { InvestigationSchema } from "@/lib/solve/schema";
import { deriveStatus } from "@/lib/solve/status";
import type { Tx } from "./db";
import { transaction } from "./db";
import {
  access,
  hash,
  loadRecord,
  persist,
  receipt,
  saveReceipt,
} from "./service";
import {
  editor,
  ensure,
  type Actor,
  type Attachment,
  type HostedDocument,
  type Member,
  type RecordEnvelope,
} from "./types";
export function importManifest(raw: unknown) {
  const inv = InvestigationSchema.parse(raw);
  ensure(
    inv.schemaVersion === 1,
    "Only schema version 1 device documents can be imported",
  );
  const lists = [
    inv.evidence,
    inv.causes,
    inv.actions,
    inv.verifications,
    inv.verificationReviews,
    inv.lessons,
    inv.history,
    inv.fishboneCategories,
    inv.evidenceLinks,
    inv.containment,
    inv.timeline,
  ];
  const ids = [inv.id, ...lists.flatMap((a) => a.map((x) => x.id))];
  ensure(
    new Set(ids).size === ids.length,
    "The document contains duplicate IDs",
  );
  const ref = (id: string | undefined | null, items: { id: string }[]) => {
    if (id)
      ensure(
        items.some((i) => i.id === id),
        "The document has a missing relationship. Repair it in the original tool before import.",
      );
  };
  inv.causes.forEach((c) => {
    ref(c.parentId, inv.causes);
    ref(c.categoryId, inv.fishboneCategories);
    let p = c.parentId;
    const seen = new Set([c.id]);
    while (p) {
      ensure(!seen.has(p), "Cyclic cause relationship");
      seen.add(p);
      p = inv.causes.find((c) => c.id === p)?.parentId ?? null;
    }
  });
  inv.actions.forEach((a) =>
    a.linkedCauseIds.forEach((c) => ref(c, inv.causes)),
  );
  inv.evidenceLinks.forEach((l) => {
    ref(l.causeId, inv.causes);
    ref(l.evidenceId, inv.evidence);
  });
  inv.verifications.forEach((v) => {
    ref(v.actionId, inv.actions);
    v.evidenceIds.forEach((e) => ref(e, inv.evidence));
  });
  inv.verificationReviews.forEach((r) => {
    ref(r.verificationId, inv.verifications);
    ref(r.reopenedEventId, inv.history);
  });
  inv.lessons.forEach((l) => {
    ref(l.sourceReviewId, inv.verificationReviews);
    ref(l.sourceVerificationId, inv.verifications);
  });
  inv.timeline.forEach((t) => ref(t.causeId, inv.causes));
  return {
    investigation: inv,
    checksum: hash(JSON.stringify(raw)),
    schemaVersion: inv.schemaVersion,
    originalId: inv.id,
    title: inv.title,
    counts: {
      evidence: inv.evidence.length,
      causes: inv.causes.length,
      actions: inv.actions.length,
      results: inv.verifications.length,
      lessons: inv.lessons.length,
      untrustedReviews: inv.verificationReviews.length,
    },
    names: [
      ...new Set(
        [
          ...inv.actions.map((a) => a.owner),
          ...inv.containment.map((c) => c.owner),
        ].filter((s): s is string => Boolean(s)),
      ),
    ],
    files: inv.evidence
      .filter(
        (e) =>
          ["document", "photo_ref"].includes(e.type) ||
          /^(file:|blob:|data:)/i.test(e.source),
      )
      .map((e) => ({
        evidenceId: e.id,
        title: e.title,
        status: "Bytes must be explicitly uploaded after import",
      })),
  };
}
export async function importDocument(
  sql: Tx,
  actor: Actor,
  org: string,
  raw: unknown,
  mapping: Record<string, string | null>,
  commandId: string,
  correlationId: string,
  digest: string,
  kind: "device_import" | "duplicate" = "device_import",
  hostedSource?: HostedDocument,
  sourceFiles: Attachment[] = [],
) {
  const manifest = importManifest(raw);
  const members = await sql<
    Member[]
  >`select * from company.memberships where org_id=${org} and revoked_at is null`;
  for (const name of manifest.names) {
    if (kind === "duplicate" && !Object.hasOwn(mapping, name))
      mapping[name] = members.some((m) => m.user_id === name) ? name : null;
    ensure(
      Object.hasOwn(mapping, name),
      "Map every local owner name, or explicitly leave it unassigned",
    );
    const id = mapping[name];
    if (id)
      ensure(
        members.some(
          (m) =>
            m.user_id === id &&
            ["owner", "manager", "collaborator", "participant"].includes(
              m.role,
            ),
        ),
        "Mapped member is unavailable",
      );
  }
  const inv = structuredClone(manifest.investigation);
  const all = [
    inv,
    ...inv.evidence,
    ...inv.causes,
    ...inv.actions,
    ...inv.verifications,
    ...inv.verificationReviews,
    ...inv.lessons,
    ...inv.history,
    ...inv.fishboneCategories,
    ...inv.evidenceLinks,
    ...inv.containment,
    ...inv.timeline,
  ];
  const idMap = Object.fromEntries(all.map((e) => [e.id, randomUUID()]));
  for (const observation of hostedSource?.observations ?? [])
    idMap[observation.id] = randomUUID();
  const remap = (id: string) => idMap[id];
  for (const e of all) e.id = remap(e.id);
  inv.actions.forEach((a) => {
    a.linkedCauseIds = a.linkedCauseIds.map(remap);
    a.owner = a.owner ? (mapping[a.owner] ?? undefined) : undefined;
  });
  inv.causes.forEach((c) => {
    c.parentId = c.parentId ? remap(c.parentId) : null;
    c.categoryId = c.categoryId ? remap(c.categoryId) : undefined;
  });
  inv.evidenceLinks.forEach((l) => {
    l.causeId = remap(l.causeId);
    l.evidenceId = remap(l.evidenceId);
  });
  inv.verifications.forEach((v) => {
    v.actionId = remap(v.actionId);
    v.evidenceIds = v.evidenceIds.map(remap);
    v.verifier = undefined;
  });
  inv.lessons.forEach((l) => {
    l.approvedAt = undefined;
    l.approvedBy = undefined;
    l.sourceReviewId = undefined;
    l.sourceVerificationId = l.sourceVerificationId
      ? remap(l.sourceVerificationId)
      : undefined;
  });
  inv.containment.forEach((c) => {
    c.owner = mapping[c.owner] ?? "";
  });
  inv.timeline.forEach((t) => {
    t.causeId = t.causeId ? remap(t.causeId) : undefined;
  });
  inv.verificationReviews = [];
  inv.closedAt = undefined;
  inv.reopenedCount = 0;
  inv.source = undefined;
  inv.owner = actor.id;
  inv.history = [
    {
      id: randomUUID(),
      at: new Date().toISOString(),
      type: "imported",
      note: "Explicit company import. Local decisions and map references are untrusted provenance; new hosted approval is required.",
    },
  ];
  inv.rcaNumber = `LS-${inv.id.slice(0, 8).toUpperCase()}`;
  inv.status = deriveStatus(inv);
  const doc: HostedDocument = {
    version: 1,
    investigation: inv,
    observations: (hostedSource?.observations ?? []).map((o) => ({
      ...o,
      id: remap(o.id),
      verificationId: remap(o.verificationId),
      evidenceId: remap(o.evidenceId),
    })),
    reviewDependencies: {},
    lessonDecisions: [],
    provenance: {
      kind,
      checksum: hostedSource
        ? hash(JSON.stringify(hostedSource))
        : manifest.checksum,
      originalId: manifest.originalId,
      schemaVersion: manifest.schemaVersion,
      original: hostedSource ?? raw,
      idMap,
      missingFiles: [
        ...new Set([
          ...manifest.files.map((f) => f.evidenceId),
          ...sourceFiles
            .filter((f) => f.state !== "deleted")
            .map((f) => f.evidence_id),
          ...(hostedSource?.provenance?.missingFiles ?? []),
        ]),
      ].map(remap),
    },
  };
  const [team] = await sql`select id from company.teams where org_id=${org}`;
  const row: RecordEnvelope = {
    id: inv.id,
    org_id: org,
    team_id: team.id,
    revision: 1,
    document: doc,
    attachments: [],
  };
  await sql`insert into company.investigations(org_id,id,team_id,revision,document,created_by) values(${org},${inv.id},${team.id},1,${JSON.stringify(doc)}::text::jsonb,${actor.id})`;
  await persist(sql, actor, row, 1, { commandId, correlationId, type: kind });
  await saveReceipt(sql, actor, org, commandId, digest, { id: row.id });
  return row;
}
export async function confirmImport(
  actor: Actor,
  input: {
    organizationId: string;
    commandId: string;
    checksum: string;
    mapping: Record<string, string | null>;
    document: unknown;
    confirmed: boolean;
  },
) {
  ensure(
    input.confirmed,
    "Confirm the destination company and manifest before uploading",
  );
  const manifest = importManifest(input.document);
  ensure(manifest.checksum === input.checksum, "Import manifest changed");
  return transaction(actor, async (sql) => {
    const { member } = await access(sql, actor, input.organizationId, true);
    ensure(editor(member.role), "Full collaborator access required", 403);
    const r = await receipt(
      sql,
      actor,
      input.organizationId,
      input.commandId,
      input,
    );
    if (r.result) return loadRecord(sql, input.organizationId, r.result.id);
    return importDocument(
      sql,
      actor,
      input.organizationId,
      input.document,
      input.mapping,
      input.commandId,
      input.commandId,
      r.digest,
    );
  });
}
