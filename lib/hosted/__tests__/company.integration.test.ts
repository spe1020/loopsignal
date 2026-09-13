import { backup, restore } from "../../../scripts/company/recovery";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, writeFile, unlink, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  execute,
  createCompany,
  changeMember,
  getRecord,
  companyState,
} from "../service";
import { acceptInvite, invite, revokeInvite } from "../invitations";
import { confirmImport, importManifest } from "../imports";
import { closeDatabase, transaction } from "../db";
import {
  downloadFile,
  exportRecord,
  finalizeUpload,
  stageUpload,
  type ObjectStore,
} from "../files";
import { currentReview } from "@/lib/solve/reviews";
import { runOutbox } from "../outbox";
import {
  Envelope,
  type Actor,
  type BusinessCommand,
  type RecordEnvelope,
} from "../types";
const enabled = Boolean(process.env.COMPANY_TEST_ADMIN_URL);
const describeDb = enabled ? describe : describe.skip;
const actor = (label: string): Actor => ({
  id: randomUUID(),
  email: `${label}-${randomUUID().slice(0, 8)}@company.test`,
});
const owner = actor("owner"),
  peer = actor("colleague"),
  outsider = actor("outsider"),
  participant = actor("reporter"),
  viewer = actor("viewer"),
  billing = actor("billing");
let admin: ReturnType<typeof postgres>,
  org: string,
  other: string,
  row: RecordEnvelope,
  store: ObjectStore,
  bytesDirectory: string;
const envelope = (
  r: RecordEnvelope,
  c: BusinessCommand,
  id = randomUUID(),
) => ({
  version: 1 as const,
  organizationId: r.org_id,
  commandId: id,
  correlationId: id,
  recordId: r.id,
  expectedRevision: r.revision,
  command: c,
});
async function send(c: BusinessCommand, who = owner) {
  row = await execute(who, envelope(row, c), store);
  return row;
}
const evidence = {
  title: "Gauge sample from press 4",
  type: "measurement" as const,
  description: "Measured ten production samples using fixture G4.",
  source: "Synthetic quality log G4-001",
  date: "2026-09-01",
};
const action = {
  title: "Install the locating stop",
  description: "Locate the fixture consistently before clamping",
  owner: peer.id,
  linkedCauseIds: [] as string[],
  kind: "corrective" as const,
  requiredForClosure: true,
  dueDate: "2026-09-06",
  verificationMethod: "Measure ten samples",
  expectedResult: "No offset above 0.5 mm",
};
describeDb("actual PostgreSQL policies and company commands", () => {
  beforeAll(async () => {
    admin = postgres(process.env.COMPANY_TEST_ADMIN_URL!, { max: 2 });
    for (const a of [owner, peer, outsider, participant, viewer, billing])
      await admin`insert into auth.users(id,email) values(${a.id},${a.email})`;
    org = (
      await createCompany(owner, {
        name: "Synthetic Assembly Works",
        site: "Site 1",
        team: "Quality",
        commandId: randomUUID(),
      })
    ).id;
    other = (
      await createCompany(outsider, {
        name: "Other Synthetic Company",
        site: "Other site",
        team: "Other team",
        commandId: randomUUID(),
      })
    ).id;
    for (const [a, role] of [
      [peer, "collaborator"],
      [participant, "participant"],
      [viewer, "viewer"],
      [billing, "billing_admin"],
    ] as const)
      await admin`insert into company.memberships(org_id,user_id,display_name,role) values(${org},${a.id},${a.email},${role})`;
    await changeMember(owner, {
      organizationId: org,
      userId: owner.id,
      role: "owner",
      reviewer: true,
      revoke: false,
      commandId: randomUUID(),
    });
    const id = randomUUID();
    row = await execute(owner, {
      version: 1,
      organizationId: org,
      commandId: id,
      correlationId: id,
      recordId: null,
      expectedRevision: 0,
      command: {
        type: "create_problem",
        data: {
          title: "Fixture drifts during setup",
          whatHappened: "Press 4 produced offset parts after setup",
          where: "Press 4",
          whatShouldHaveHappened: "Offset remains below 0.5 mm",
          impact: "Ten parts held for inspection",
        },
      },
    });
    bytesDirectory = await mkdtemp(path.join(os.tmpdir(), "loopsignal-files-"));
    const file = (key: string) =>
      path.join(bytesDirectory, key.replaceAll("/", "_"));
    store = {
      put: async (key, bytes) => {
        await writeFile(file(key), bytes, { flag: "wx" });
      },
      get: (key) => readFile(file(key)),
      remove: async (key) => {
        try {
          await unlink(file(key));
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
        }
      },
    };
  }, 30000);
  afterAll(async () => {
    await admin?.end();
    await closeDatabase();
  });
  it("denies cross-company reads, searches, exports, jobs and mixed IDs", async () => {
    await expect(getRecord(outsider, org, row.id)).rejects.toThrow();
    await expect(getRecord(owner, other, row.id)).rejects.toThrow();
    await expect(companyState(outsider, org, "fixture")).rejects.toThrow();
    await expect(exportRecord(outsider, org, row.id, store)).rejects.toThrow();
    await expect(runOutbox(outsider, org, store)).rejects.toThrow();
    await expect(
      send({
        type: "add_action",
        data: { ...action, linkedCauseIds: [randomUUID()] },
      }),
    ).rejects.toThrow("Reference");
    const result = await admin.begin(async (sql) => {
      await sql`set local role authenticated`;
      await sql`select set_config('request.jwt.claim.sub',${outsider.id},true)`;
      return sql`select * from company.investigations where org_id=${org}`;
    });
    expect(result).toHaveLength(0);
  });
  it("accepts current PostgREST JSON claims for authorized reads and denies foreign claims", async () => {
    const read = async (who: Actor) =>
      admin.begin(async (tx) => {
        await tx`set local role authenticated`;
        await tx`select set_config('request.jwt.claims',${JSON.stringify({ sub: who.id, role: "authenticated" })},true)`;
        return tx`select id from company.investigations where org_id=${org}`;
      });
    expect((await read(owner)).map((r) => r.id)).toContain(row.id);
    expect(await read(outsider)).toHaveLength(0);
  });
  it("denies direct forged writes, role escalation, audit modification and whole-document replacement", async () => {
    await expect(
      admin.begin(async (sql) => {
        await sql`set local role authenticated`;
        await sql`select set_config('request.jwt.claim.sub',${owner.id},true)`;
        await sql`update company.investigations set document='{}' where org_id=${org}`;
      }),
    ).rejects.toThrow("permission denied");
    await expect(
      changeMember(peer, {
        organizationId: org,
        userId: peer.id,
        role: "owner",
        reviewer: true,
        revoke: false,
        commandId: randomUUID(),
      }),
    ).rejects.toThrow();
    await expect(
      transaction(
        owner,
        (sql) =>
          sql`update company.audit_events set command='forged' where org_id=${org}`,
      ),
    ).rejects.toThrow();
    expect(() =>
      Envelope.parse({
        ...envelope(row, { type: "close" }),
        actor: outsider.id,
      }),
    ).toThrow();
    await expect(
      execute(owner, {
        ...envelope(row, { type: "close" }),
        command: { type: "replace", document: { status: "closed" } },
      }),
    ).rejects.toThrow();
    await expect(
      execute(owner, {
        ...envelope(row, { type: "close" }),
        command: {
          type: "approve_verification",
          id: randomUUID(),
          approvedBy: "CEO",
          snapshot: "forged",
        },
      }),
    ).rejects.toThrow();
    await expect(send({ type: "close" })).rejects.toThrow();
    await expect(
      send({ type: "add_evidence", data: evidence }, viewer),
    ).rejects.toThrow();
    await expect(
      send({ type: "add_evidence", data: evidence }, billing),
    ).rejects.toThrow();
  });
  it("commits one concurrent edit and rejects a stale revision without data loss", async () => {
    const c: BusinessCommand = { type: "add_evidence", data: evidence };
    const requests = await Promise.allSettled([
      execute(owner, envelope(row, c)),
      execute(peer, envelope(row, c)),
    ]);
    expect(requests.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(requests.filter((r) => r.status === "rejected")).toHaveLength(1);
    row = await getRecord(owner, org, row.id);
    expect(row.document.investigation.evidence).toHaveLength(1);
  });
  it("replays the same command once and rejects changed payloads", async () => {
    const req = envelope(row, {
      type: "add_evidence",
      data: { ...evidence, title: "Second reading" },
    });
    const first = await execute(peer, req),
      second = await execute(peer, req);
    expect(first.document).toEqual(second.document);
    expect(second.document.investigation.evidence).toHaveLength(2);
    row = second;
    await expect(
      execute(peer, {
        ...req,
        command: {
          type: "add_evidence",
          data: { ...evidence, title: "Changed retry" },
        },
      }),
    ).rejects.toThrow("Idempotency");
  });
  it("two actors investigate, assign, contribute, review, close and explicitly approve learning", async () => {
    await send({
      type: "add_cause",
      data: {
        text: "Fixture lacked a positive locating stop",
        evidenceState: "data_supported",
        classification: "root",
        rootCauseRationale:
          "Repeated setup moved the fixture relative to the datum",
        parentId: null,
        challenged: false,
      },
    });
    const inv = row.document.investigation;
    const root = inv.causes[0].id,
      source = inv.evidence[0].id;
    await send({
      type: "link_evidence",
      causeId: root,
      evidenceId: source,
      relation: "supports",
    });
    await send({
      type: "add_action",
      data: { ...action, linkedCauseIds: [root] },
    });
    const a = row.document.investigation.actions[0].id;
    await send({ type: "action_status", id: a, status: "complete" }, peer);
    await send(
      {
        type: "add_verification",
        data: {
          actionId: a,
          expected: "Offset ≤ 0.5 mm",
          observed: "Maximum measured offset 0.2 mm",
          checkAt: "2026-09-04",
          result: "effective",
          evidenceIds: [source],
        },
      },
      peer,
    );
    const v = row.document.investigation.verifications[0].id;
    await expect(
      send(
        { type: "approve_verification", id: v, selfReviewAcknowledged: true },
        peer,
      ),
    ).rejects.toThrow("reviewer authority");
    await send(
      {
        type: "add_observation",
        data: {
          verificationId: v,
          evidenceId: source,
          value: 0.2,
          unit: "mm",
          start: "2026-09-02",
          end: "2026-09-04",
        },
      },
      peer,
    );
    await send({
      type: "approve_verification",
      id: v,
      selfReviewAcknowledged: true,
    });
    const review = row.document.investigation.verificationReviews.at(-1)!;
    expect(review.approvedBy).toBe(owner.id);
    expect(row.document.reviewDependencies[review.id].actor).toBe(owner.id);
    await send({ type: "close" });
    expect(row.document.investigation.status).toBe("closed");
    await send({
      type: "add_lesson",
      lesson: "Include locating-stop confirmation in fixture setup",
      relatedProcess: "Press setup",
    });
    await send({
      type: "approve_lesson",
      id: row.document.investigation.lessons[0].id,
      reviewId: review.id,
    });
    const loaded = await getRecord(peer, org, row.id);
    expect(loaded.document.investigation.lessons[0].sourceReviewId).toBe(
      review.id,
    );
    expect(loaded.document.investigation.status).toBe("closed");
  });
  it("withdraws approval on material edit and does not revive it after revert or incidental edit", async () => {
    const v = row.document.investigation.verifications[0],
      source = row.document.investigation.evidence[0];
    const old = row.document.investigation.verificationReviews.at(-1)!.id;
    await send({
      type: "edit_evidence",
      id: source.id,
      data: { ...evidence, description: "Materially different reading" },
    });
    expect(row.document.investigation.closedAt).toBeUndefined();
    await send({ type: "edit_evidence", id: source.id, data: evidence });
    expect(currentReview(row.document.investigation, v)).toBeUndefined();
    await send({
      type: "approve_verification",
      id: v.id,
      selfReviewAcknowledged: true,
    });
    expect(row.document.investigation.verificationReviews.at(-1)!.id).not.toBe(
      old,
    );
    await send({ type: "close" });
    expect(row.document.investigation.lessons[0].sourceReviewId).toBe(old);
    await send({ type: "reopen", note: "Recheck after next setup" });
    await send({
      type: "edit_problem",
      data: {
        title: "Updated display title",
        ...{
          whatHappened: row.document.investigation.problem.whatHappened,
          where: "Press 4",
          whatShouldHaveHappened: "Offset remains below 0.5 mm",
          impact: "Ten parts held for inspection",
        },
      },
    });
    expect(
      currentReview(
        row.document.investigation,
        row.document.investigation.verifications[0],
      ),
    ).toBeUndefined();
    await send({
      type: "approve_verification",
      id: v.id,
      selfReviewAcknowledged: true,
    });
    expect(row.document.investigation.verifications[0].checkAt).toBe(
      "2026-09-04",
    );
  });
  it("supports per-action approval while another required action lacks an owner/result", async () => {
    await send({
      type: "add_action",
      data: {
        ...action,
        title: "Second required action",
        owner: null,
        linkedCauseIds: [row.document.investigation.causes[0].id],
      },
    });
    await send({
      type: "approve_verification",
      id: row.document.investigation.verifications[0].id,
      selfReviewAcknowledged: true,
    });
    expect(
      currentReview(
        row.document.investigation,
        row.document.investigation.verifications[0],
      ),
    ).toBeDefined();
    await expect(send({ type: "close" })).rejects.toThrow();
  });
  it("checks only this result's byte dependencies during per-action approval", async () => {
    const evidenceId = row.document.investigation.evidence[1].id;
    const bytes = Buffer.from("Unrelated sample\n");
    const staged = await stageUpload(peer, {
      organizationId: org,
      recordId: row.id,
      evidenceId,
      expectedRevision: row.revision,
      commandId: randomUUID(),
      filename: "unrelated.txt",
      mediaType: "text/plain",
      size: bytes.length,
    });
    row = await finalizeUpload(
      peer,
      {
        organizationId: org,
        recordId: row.id,
        attachmentId: staged.attachment!.id,
        expectedRevision: staged.record.revision,
        commandId: randomUUID(),
      },
      bytes,
      store,
    );
    await store.remove(staged.attachment!.object_key);
    await send({
      type: "approve_verification",
      id: row.document.investigation.verifications[0].id,
      selfReviewAcknowledged: true,
    });
    expect(
      currentReview(
        row.document.investigation,
        row.document.investigation.verifications[0],
      ),
    ).toBeDefined();
    await send({ type: "remove_attachment", id: staged.attachment!.id });
  });
  it("stages immutable bytes, verifies checksums, denies foreign access and binds file versions into approval", async () => {
    const source = row.document.investigation.evidence[0].id,
      bytes = Buffer.from("synthetic measurement,0.2,mm\n");
    const stage = {
      organizationId: org,
      recordId: row.id,
      evidenceId: source,
      expectedRevision: row.revision,
      commandId: randomUUID(),
      filename: "measurement.csv",
      size: bytes.length,
      mediaType: "text/csv",
    };
    const staged = await stageUpload(peer, stage);
    row = staged.record;
    const attachmentId = staged.attachment!.id;
    await expect(
      downloadFile(owner, org, row.id, attachmentId, store),
    ).rejects.toThrow();
    const request = {
      organizationId: org,
      recordId: row.id,
      attachmentId,
      expectedRevision: row.revision,
      commandId: randomUUID(),
    };
    row = await finalizeUpload(peer, request, bytes, store);
    expect((await finalizeUpload(peer, request, bytes, store)).revision).toBe(
      row.revision,
    );
    await expect(
      downloadFile(outsider, org, row.id, attachmentId, store),
    ).rejects.toThrow();
    expect(
      (await downloadFile(peer, org, row.id, attachmentId, store)).bytes,
    ).toEqual(bytes);
    const storedFile = row.attachments.find(
      (file) => file.id === attachmentId,
    )!;
    await admin`insert into storage.objects(bucket_id,name) values('company-evidence',${storedFile.object_key})`;
    const storageRead = (who: Actor) =>
      admin.begin(async (tx) => {
        await tx`set local role authenticated`;
        await tx`select set_config('request.jwt.claims',${JSON.stringify({ sub: who.id, role: "authenticated" })},true)`;
        return tx`select name from storage.objects where name=${storedFile.object_key}`;
      });
    expect(await storageRead(owner)).toHaveLength(1);
    expect(await storageRead(outsider)).toHaveLength(0);
    await send({
      type: "approve_verification",
      id: row.document.investigation.verifications[0].id,
      selfReviewAcknowledged: true,
    });
    const review = row.document.investigation.verificationReviews.at(-1)!;
    expect(row.document.reviewDependencies[review.id].snapshot).toContain(
      row.attachments.find((file) => file.id === attachmentId)!.checksum,
    );
    const bundle = await exportRecord(owner, org, row.id, store);
    expect(bundle.files[0].base64).toBe(bytes.toString("base64"));
    const start = Date.now();
    const backupDir = await mkdtemp(
      path.join(os.tmpdir(), "loopsignal-backup-"),
    );
    const captured = await backup(
      process.env.COMPANY_TEST_ADMIN_URL!,
      backupDir,
      store,
    );
    const restoreDb = "loopsignal_restore_" + randomUUID().replaceAll("-", "");
    await admin.unsafe("create database " + restoreDb);
    const restoreUrl = new URL(process.env.COMPANY_TEST_ADMIN_URL!);
    restoreUrl.pathname = "/" + restoreDb;
    const destination = await mkdtemp(
      path.join(os.tmpdir(), "loopsignal-restored-files-"),
    );
    const restoredStore: ObjectStore = {
      put: (key, b) =>
        writeFile(path.join(destination, key.replaceAll("/", "_")), b, {
          flag: "wx",
        }),
      get: (key) => readFile(path.join(destination, key.replaceAll("/", "_"))),
      remove: (key) => unlink(path.join(destination, key.replaceAll("/", "_"))),
    };
    const restored = await restore(
      restoreUrl.href,
      backupDir,
      restoredStore,
      [],
    );
    expect(restored.filesRestored).toBeGreaterThan(0);
    const readyFile = row.attachments.find((file) => file.id === attachmentId)!;
    expect(await restoredStore.get(readyFile.object_key)).toEqual(bytes);
    const restoredSql = postgres(restoreUrl.href, { max: 1 });
    try {
      const [recovered] =
        await restoredSql`select document from company.investigations where org_id=${org} and id=${row.id}`;
      expect(
        recovered.document.investigation.verificationReviews.at(-1).id,
      ).toBe(review.id);
      expect(
        currentReview(
          recovered.document.investigation,
          recovered.document.investigation.verifications[0],
        )?.id,
      ).toBe(review.id);
      const denied = await restoredSql.begin(async (tx) => {
        await tx`set local role authenticated`;
        await tx`select set_config('request.jwt.claim.sub',${outsider.id},true)`;
        return tx`select * from company.investigations where org_id=${org}`;
      });
      expect(denied).toHaveLength(0);
    } finally {
      await restoredSql.end();
    }
    const deletedTarget =
      "loopsignal_deleted_restore_" + randomUUID().replaceAll("-", "");
    await admin.unsafe("create database " + deletedTarget);
    const deletedUrl = new URL(process.env.COMPANY_TEST_ADMIN_URL!);
    deletedUrl.pathname = "/" + deletedTarget;
    const afterDeletion = await restore(
      deletedUrl.href,
      backupDir,
      restoredStore,
      [{ org_id: org, record_id: row.id }],
    );
    expect(afterDeletion.filesRestored).toBe(0);
    const deletedSql = postgres(deletedUrl.href, { max: 1 });
    try {
      const [tombstone] =
        await deletedSql`select deleted_at from company.investigations where org_id=${org} and id=${row.id}`;
      expect(tombstone.deleted_at).toBeTruthy();
    } finally {
      await deletedSql.end();
    }
    await mkdir("docs/company/evidence", { recursive: true });
    await writeFile(
      "docs/company/evidence/restore.json",
      JSON.stringify(
        {
          kind: "isolated local PostgreSQL and filesystem bytes",
          durationMs: Date.now() - start,
          backupCompletedAt: captured.completedAt,
          filesRestored: restored.filesRestored,
          checks: [
            "byte checksum",
            "exact review relationship",
            "foreign keys",
            "cross-company RLS denial after restore",
            "newer deletion ledger suppresses old record and file restoration",
          ],
          providerStorageRestore: "not run: Supabase stack unavailable",
        },
        null,
        2,
      ),
    );

    const copied = await execute(
      owner,
      envelope(row, { type: "duplicate" }),
      store,
    );
    expect(copied.document.observations).toHaveLength(
      row.document.observations.length,
    );
    expect(copied.document.provenance?.missingFiles).toContain(
      copied.document.investigation.evidence[0].id,
    );
    expect(copied.document.investigation.verificationReviews).toHaveLength(0);
    await store.remove(readyFile.object_key);
    await send({ type: "verify_sources" });
    expect(
      row.attachments.find((file) => file.id === attachmentId)!.state,
    ).toBe("missing");
    expect(
      row.document.investigation.verificationReviews.find(
        (r) => r.id === review.id,
      )?.invalidatedAt,
    ).toBeDefined();
    await store.put(readyFile.object_key, bytes, "text/csv");
    await expect(
      send({
        type: "approve_verification",
        id: row.document.investigation.verifications[0].id,
        selfReviewAcknowledged: true,
      }),
    ).rejects.toThrow();
    await send({ type: "remove_attachment", id: attachmentId });
    expect(
      row.document.investigation.verificationReviews.find(
        (r) => r.id === review.id,
      )?.invalidatedAt,
    ).toBeDefined();
    await expect(
      downloadFile(peer, org, row.id, attachmentId, store),
    ).rejects.toThrow();
  });
  it("enforces participant assignment and stale membership revocation", async () => {
    await expect(
      send(
        {
          type: "action_status",
          id: row.document.investigation.actions[0].id,
          status: "open",
        },
        participant,
      ),
    ).rejects.toThrow("assigned");
    await changeMember(owner, {
      organizationId: org,
      userId: peer.id,
      role: "collaborator",
      reviewer: false,
      revoke: true,
      commandId: randomUUID(),
    });
    await expect(getRecord(peer, org, row.id)).rejects.toThrow();
    await expect(
      send({ type: "add_evidence", data: evidence }, peer),
    ).rejects.toThrow();
    await expect(
      admin.begin(async (sql) => {
        await sql`set local role authenticated`;
        await sql`select set_config('request.jwt.claim.sub',${peer.id},true)`;
        const records = await sql`select * from company.investigations`;
        expect(records).toHaveLength(0);
      }),
    ).resolves.toBeUndefined();
  });
  it("enforces invitation expiry, recipient, revocation, idempotency and concurrent seat reservations", async () => {
    const newUser = actor("new");
    await admin`insert into auth.users(id,email) values(${newUser.id},${newUser.email})`;
    const req = {
      organizationId: org,
      email: newUser.email,
      role: "participant" as const,
      reviewer: false,
      commandId: randomUUID(),
    };
    const result = await invite(owner, req);
    expect((await invite(owner, req)).id).toBe(result.id);
    const [job] =
      await admin`select payload from company.outbox where command_id=${req.commandId}`;
    const token = job.payload.token;
    await expect(acceptInvite(outsider, token)).rejects.toThrow();
    expect((await acceptInvite(newUser, token)).id).toBe(org);
    expect((await acceptInvite(newUser, token)).id).toBe(org);
    const expired = await invite(owner, {
      ...req,
      email: "expired@company.test",
      commandId: randomUUID(),
    });
    await revokeInvite(owner, org, expired.id);
    const [revoked] =
      await admin`select o.payload from company.outbox o where o.payload->>'invitationId'=${expired.id}`;
    await expect(
      acceptInvite(newUser, revoked.payload.token),
    ).rejects.toThrow();
    await admin`update company.organizations set seats=2 where id=${org}`;
    const race = await Promise.allSettled([
      invite(owner, {
        ...req,
        email: "seat1@company.test",
        role: "collaborator",
        commandId: randomUUID(),
      }),
      invite(owner, {
        ...req,
        email: "seat2@company.test",
        role: "collaborator",
        commandId: randomUUID(),
      }),
    ]);
    expect(race.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(race.filter((r) => r.status === "rejected")).toHaveLength(1);
    await admin`update company.organizations set seats=10 where id=${org}`;
  });
  it("imports explicitly, remaps references, preserves originals and requires hosted approval", async () => {
    const original = structuredClone(row.document.investigation);
    const before = JSON.stringify(original);
    const manifest = importManifest(original),
      mapping = Object.fromEntries(
        manifest.names.map((n) => [n, n === peer.id ? null : n]),
      );
    const input = {
      organizationId: org,
      commandId: randomUUID(),
      checksum: manifest.checksum,
      mapping,
      document: original,
      confirmed: true,
    };
    const imported = await confirmImport(owner, input);
    expect((await confirmImport(owner, input)).id).toBe(imported.id);
    expect(imported.id).not.toBe(original.id);
    expect(imported.document.investigation.verificationReviews).toHaveLength(0);
    expect(imported.document.provenance?.originalId).toBe(original.id);
    expect(JSON.stringify(original)).toBe(before);
    expect(imported.document.investigation.actions[0].linkedCauseIds[0]).toBe(
      imported.document.investigation.causes[0].id,
    );
    await expect(
      confirmImport(owner, {
        ...input,
        commandId: randomUUID(),
        confirmed: false,
      }),
    ).rejects.toThrow();
  });
  it("database composite references reject mixed-company entities; storage policy denies unrelated bytes", async () => {
    await expect(
      admin`insert into company.edges(org_id,investigation_id,source_id,target_id,relation) values(${other},${row.id},${row.id},${row.document.investigation.evidence[0].id},'forged')`,
    ).rejects.toThrow();
    const f = row.attachments[0];
    await admin`insert into storage.objects(bucket_id,name) values('company-evidence',${f.object_key})`;
    const result = await admin.begin(async (sql) => {
      await sql`set local role authenticated`;
      await sql`select set_config('request.jwt.claim.sub',${outsider.id},true)`;
      return sql`select * from storage.objects`;
    });
    expect(result).toHaveLength(0);
    await expect(
      admin.begin(async (sql) => {
        await sql`set local role authenticated`;
        await sql`insert into storage.objects(bucket_id,name) values('company-evidence','forged')`;
      }),
    ).rejects.toThrow();
  });
});
