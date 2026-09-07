import { createHash, randomUUID } from "node:crypto";
import { transaction, type Tx } from "./db";
import {
  applyCommand,
  freshDocument,
  hostedBlockers,
  invalidateHosted,
} from "./domain";
import { graph } from "./graph";
import {
  administrator,
  canWrite,
  editor,
  ensure,
  Envelope,
  fullSeat,
  type Actor,
  type Attachment,
  type HostedDocument,
  type Member,
  type Org,
  type RecordEnvelope,
  type Role,
} from "./types";
export const hash = (v: string | Buffer) =>
  createHash("sha256").update(v).digest("hex");
export async function access(
  sql: Tx,
  actor: Actor,
  orgId: string,
  write = false,
) {
  // All membership/capacity and record writes take the same organization lock.
  await sql`select pg_advisory_xact_lock(hashtextextended(${orgId},1))`;
  const [org] = await sql<
    Org[]
  >`select * from company.organizations where id=${orgId}`;
  ensure(org, "Company unavailable", 404);
  const [member] = await sql<
    Member[]
  >`select * from company.memberships where org_id=${orgId} and user_id=${actor.id} and revoked_at is null`;
  ensure(member, "Company membership is unavailable", 403);
  if (write)
    ensure(
      canWrite(org),
      "This company is read-only. Billing and authorized export remain available during the grace period.",
      402,
    );
  return { org, member };
}
export async function filesFor(sql: Tx, org: string, id: string) {
  return await sql<
    Attachment[]
  >`select * from company.attachments where org_id=${org} and investigation_id=${id} order by created_at,id`;
}
export async function loadRecord(
  sql: Tx,
  org: string,
  id: string,
  lock = false,
): Promise<RecordEnvelope> {
  const rows = lock
    ? await sql`select * from company.investigations where org_id=${org} and id=${id} and deleted_at is null for update`
    : await sql`select * from company.investigations where org_id=${org} and id=${id} and deleted_at is null`;
  ensure(rows[0], "Investigation unavailable", 404);
  const row = rows[0] as RecordEnvelope;
  row.attachments = await filesFor(sql, org, id);
  invalidateHosted(row.document, row.attachments);
  return row;
}
export async function persist(
  sql: Tx,
  actor: Actor,
  row: RecordEnvelope,
  prior: number,
  c: { commandId: string; correlationId: string; type: string },
  original?: HostedDocument,
) {
  const { nodes, edges } = graph(row.document, row.attachments);
  await sql`update company.investigations set document=${JSON.stringify(row.document)}::text::jsonb,revision=${row.revision},updated_at=clock_timestamp() where org_id=${row.org_id} and id=${row.id} and revision=${prior}`;
  await sql`delete from company.edges where org_id=${row.org_id} and investigation_id=${row.id}`;
  // Existing identities remain stable. Entity removal is deliberately restricted in v1.
  for (const [id, kind] of nodes)
    await sql`insert into company.nodes(org_id,investigation_id,id,kind) values(${row.org_id},${row.id},${id},${kind}) on conflict(org_id,investigation_id,id) do nothing`;
  for (const [a, b, relation] of edges)
    await sql`insert into company.edges(org_id,investigation_id,source_id,target_id,relation) values(${row.org_id},${row.id},${a},${b},${relation}) on conflict do nothing`;
  const before = original?.investigation.verificationReviews ?? [];
  const changes = row.document.investigation.verificationReviews.flatMap((r) =>
    !before.some((b) => b.id === r.id)
      ? [{ type: "approval", reviewId: r.id, actor: r.approvedBy }]
      : r.invalidatedAt && !before.find((b) => b.id === r.id)?.invalidatedAt
        ? [{ type: "invalidation", reviewId: r.id, actor: actor.id }]
        : [],
  );
  await audit(
    sql,
    actor,
    row.org_id,
    c.commandId,
    c.type,
    row.id,
    prior,
    row.revision,
    c.correlationId,
    changes,
  );
  await sql`insert into company.outbox(id,org_id,actor,command_id,record_id,expected_revision,kind,payload,correlation_id) values(${randomUUID()},${row.org_id},${actor.id},${c.commandId},${row.id},${row.revision},'record_changed','{}',${c.correlationId})`;
}
export async function audit(
  sql: Tx,
  actor: Actor,
  org: string,
  commandId: string,
  command: string,
  record: string | null,
  prior: number | null,
  next: number | null,
  correlationId = commandId,
  events: unknown[] = [],
) {
  await sql`insert into company.audit_events(id,org_id,actor,command_id,command,record_id,prior_revision,new_revision,events,correlation_id) values(${randomUUID()},${org},${actor.id},${commandId},${command},${record},${prior},${next},${JSON.stringify(events)}::text::jsonb,${correlationId})`;
}
export async function receipt(
  sql: Tx,
  actor: Actor,
  org: string,
  id: string,
  request: unknown,
) {
  const digest = hash(JSON.stringify(request));
  const [r] =
    await sql`select * from company.command_receipts where org_id=${org} and id=${id}`;
  if (r)
    ensure(
      r.actor === actor.id && r.request_hash === digest,
      "Idempotency key was already used for different work",
      409,
    );
  return { digest, result: r?.result as { id: string } | undefined };
}
export async function saveReceipt(
  sql: Tx,
  actor: Actor,
  org: string,
  id: string,
  digest: string,
  result: unknown,
) {
  await sql`insert into company.command_receipts(org_id,id,actor,request_hash,result) values(${org},${id},${actor.id},${digest},${JSON.stringify(result)}::text::jsonb)`;
}
export async function execute(
  actor: Actor,
  input: unknown,
  objects?: import("./files").ObjectStore,
) {
  const cmd = Envelope.parse(input);
  return transaction(actor, async (sql) => {
    const { member } = await access(sql, actor, cmd.organizationId, true);
    const r = await receipt(sql, actor, cmd.organizationId, cmd.commandId, cmd);
    if (r.result) return loadRecord(sql, cmd.organizationId, r.result.id);
    let row: RecordEnvelope;
    if (cmd.command.type === "create_problem") {
      ensure(
        cmd.recordId === null && cmd.expectedRevision === 0,
        "New problems start at revision zero",
      );
      ensure(
        editor(member.role) || member.role === "participant",
        "Your role cannot report problems",
        403,
      );
      const [team] =
        await sql`select id from company.teams where org_id=${cmd.organizationId}`;
      const doc = freshDocument(cmd.command.data.title);
      row = {
        id: doc.investigation.id,
        org_id: cmd.organizationId,
        team_id: team.id,
        revision: 1,
        document: doc,
        attachments: [],
      };
      await sql`insert into company.investigations(org_id,id,team_id,revision,document,created_by) values(${row.org_id},${row.id},${row.team_id},1,${JSON.stringify(doc)}::text::jsonb,${actor.id})`;
    } else {
      ensure(cmd.recordId, "Choose an investigation");
      row = await loadRecord(sql, cmd.organizationId, cmd.recordId, true);
      ensure(
        row.revision === cmd.expectedRevision,
        "Another person saved a newer revision. Your draft is still in this editor. Reload the latest record and reconcile before resubmitting.",
        409,
      );
    }
    if (
      ["approve_verification", "close", "approve_lesson"].includes(
        cmd.command.type,
      ) &&
      row.attachments.some((f) => f.state === "ready")
    ) {
      const { privateObjects } = await import("./files");
      const storage = objects ?? privateObjects();
      for (const f of row.attachments.filter((f) => f.state === "ready")) {
        let bytes: Buffer;
        try {
          bytes = await storage.get(f.object_key);
        } catch {
          throw new (await import("./types")).CompanyError(
            422,
            "Source bytes are missing. Resolve the file before approving this work.",
          );
        }
        ensure(
          hash(bytes) === f.checksum,
          "Source checksum changed; resolve the file before approval",
          422,
        );
      }
    }
    const original = structuredClone(row.document);
    const prior = row.revision;
    const members = await sql<
      Member[]
    >`select * from company.memberships where org_id=${row.org_id}`;
    row.document = applyCommand(
      row.document,
      cmd.command,
      actor,
      member,
      members,
      row.attachments,
      prior,
    );
    if (cmd.command.type === "duplicate") {
      // Hosted duplicate is a point-in-time import with all historical decisions untrusted.
      const { importDocument } = await import("./imports");
      return importDocument(
        sql,
        actor,
        cmd.organizationId,
        row.document.investigation,
        {},
        cmd.commandId,
        cmd.correlationId,
        r.digest,
        "duplicate",
      );
    }
    if (cmd.command.type === "remove_attachment") {
      const file = row.attachments.find(
        (f) => f.id === (cmd.command as { id: string }).id,
      );
      ensure(file, "File unavailable", 404);
      file.state = "deleted";
      await sql`update company.attachments set state='deleted' where org_id=${row.org_id} and id=${file.id}`;
      await sql`insert into company.outbox(id,org_id,actor,command_id,record_id,kind,payload,correlation_id) values(${randomUUID()},${row.org_id},${actor.id},${cmd.commandId},${row.id},'object_delete',${JSON.stringify({ attachmentId: file.id })}::text::jsonb,${cmd.correlationId})`;
      invalidateHosted(row.document, row.attachments);
    }
    row.revision = prior + 1;
    await persist(
      sql,
      actor,
      row,
      prior,
      {
        commandId: cmd.commandId,
        correlationId: cmd.correlationId,
        type: cmd.command.type,
      },
      original,
    );
    if (cmd.command.type === "delete_record") {
      await sql`update company.investigations set deleted_at=clock_timestamp() where org_id=${row.org_id} and id=${row.id}`;
      await sql`insert into company.deletion_ledger(org_id,record_id) values(${row.org_id},${row.id}) on conflict do nothing`;
      // Immediate object revocation; physical deletion is an idempotent outbox operation.
      for (const file of row.attachments) {
        await sql`update company.attachments set state='deleted' where org_id=${row.org_id} and id=${file.id}`;
        await sql`insert into company.outbox(id,org_id,actor,command_id,record_id,kind,payload,correlation_id) values(${randomUUID()},${row.org_id},${actor.id},${randomUUID()},${row.id},'object_delete',${JSON.stringify({ attachmentId: file.id })}::text::jsonb,${cmd.correlationId})`;
      }
    }
    await saveReceipt(sql, actor, row.org_id, cmd.commandId, r.digest, {
      id: row.id,
    });
    return row;
  });
}
export async function companyState(actor: Actor, orgId?: string, query = "") {
  return transaction(actor, async (sql) => {
    const organizations =
      await sql`select o.*,m.role,m.reviewer from company.organizations o join company.memberships m on m.org_id=o.id and m.user_id=${actor.id} and m.revoked_at is null order by o.created_at`;
    if (!orgId) return { actor, organizations };
    const { org, member } = await access(sql, actor, orgId);
    const records =
      await sql`select id,revision,document,team_id,org_id from company.investigations where org_id=${orgId} and deleted_at is null and (document->'investigation'->>'title' ilike ${"%" + query + "%"} or document->'investigation'->'problem'->>'whatHappened' ilike ${"%" + query + "%"}) order by updated_at desc limit 100`;
    const members =
      await sql`select * from company.memberships where org_id=${orgId}`;
    const invitations = administrator(member.role)
      ? await sql`select id,email,role,reviewer,expires_at,revoked_at,accepted_at from company.invitations where org_id=${orgId} order by expires_at desc`
      : [];
    const teams =
      await sql`select t.*,s.name as site_name from company.teams t join company.sites s on s.org_id=t.org_id and s.id=t.site_id where t.org_id=${orgId}`;
    return {
      actor,
      organizations,
      org,
      member,
      records,
      members,
      invitations,
      team: teams[0],
    };
  });
}
export async function getRecord(actor: Actor, org: string, id: string) {
  return transaction(actor, async (sql) => {
    await access(sql, actor, org);
    const row = await loadRecord(sql, org, id);
    const history =
      await sql`select * from company.audit_events where org_id=${org} and record_id=${id} order by server_time`;
    return {
      ...row,
      blockers: hostedBlockers(row.document, row.attachments),
      audit: history,
    };
  });
}
export async function createCompany(
  actor: Actor,
  data: { name: string; site: string; team: string; commandId: string },
) {
  return transaction(actor, async (sql) => {
    // Actor-scoped advisory lock makes retries and concurrent creation deterministic.
    await sql`select pg_advisory_xact_lock(hashtextextended(${actor.id},0))`;
    const [old] =
      await sql`select id from company.organizations where id=${data.commandId} and creator=${actor.id}`;
    if (old) return { id: old.id };
    const org = data.commandId;
    await sql`insert into company.organizations(id,name,creator) values(${org},${data.name},${actor.id})`;
    await sql`insert into company.memberships(org_id,user_id,display_name,role) values(${org},${actor.id},${actor.email},'owner')`;
    const site = randomUUID();
    await sql`insert into company.sites(id,org_id,name) values(${site},${org},${data.site})`;
    await sql`insert into company.teams(id,org_id,site_id,name) values(${randomUUID()},${org},${site},${data.team})`;
    await sql`insert into company.billing(org_id) values(${org})`;
    await audit(
      sql,
      actor,
      org,
      data.commandId,
      "create_company",
      null,
      null,
      null,
    );
    return { id: org };
  });
}
export async function capacity(
  sql: Tx,
  org: Org,
  excludeUser?: string,
  excludeInvite?: string,
) {
  const [row] =
    await sql`select (select count(*) from company.memberships where org_id=${org.id} and revoked_at is null and role in ('owner','manager','collaborator') and user_id<>${excludeUser ?? "00000000-0000-0000-0000-000000000000"})+(select count(*) from company.invitations where org_id=${org.id} and accepted_at is null and revoked_at is null and expires_at>now() and role in ('manager','collaborator') and id<>${excludeInvite ?? "00000000-0000-0000-0000-000000000000"}) as used`;
  ensure(
    Number(row.used) < org.seats,
    "All full collaborator seats are assigned or reserved. Revoke an unused invitation or choose lightweight participation.",
    409,
  );
}
export async function changeMember(
  actor: Actor,
  input: {
    organizationId: string;
    userId: string;
    role: Role;
    reviewer: boolean;
    revoke: boolean;
    commandId: string;
  },
) {
  return transaction(actor, async (sql) => {
    const { org, member } = await access(
      sql,
      actor,
      input.organizationId,
      true,
    );
    ensure(administrator(member.role), "Manager access required", 403);
    const r = await receipt(sql, actor, org.id, input.commandId, input);
    if (r.result) return r.result;
    const [target] = await sql<
      Member[]
    >`select * from company.memberships where org_id=${org.id} and user_id=${input.userId}`;
    ensure(target, "Member unavailable", 404);
    ensure(
      target.role !== "owner" ||
        (!input.revoke &&
          input.role === "owner" &&
          actor.id === target.user_id),
      "Owner transfer is not supported",
    );
    ensure(
      input.role !== "owner" || target.role === "owner",
      "Cannot create another owner",
    );
    ensure(
      member.role === "owner" ||
        (!["owner", "manager", "billing_admin"].includes(target.role) &&
          !["owner", "manager", "billing_admin"].includes(input.role) &&
          input.reviewer === target.reviewer),
      "Only the owner can grant roles or reviewer authority",
      403,
    );
    if (fullSeat(input.role) && !input.revoke)
      await capacity(sql, org, target.user_id);
    ensure(
      !input.reviewer || editor(input.role),
      "This role cannot be a reviewer",
    );
    await sql`update company.memberships set role=${input.role},reviewer=${input.reviewer},revoked_at=${input.revoke ? new Date() : null} where org_id=${org.id} and user_id=${input.userId}`;
    await audit(
      sql,
      actor,
      org.id,
      input.commandId,
      "change_membership",
      null,
      null,
      null,
      input.commandId,
      [
        {
          userId: input.userId,
          role: input.role,
          reviewer: input.reviewer,
          revoked: input.revoke,
        },
      ],
    );
    await saveReceipt(sql, actor, org.id, input.commandId, r.digest, {
      id: input.userId,
    });
    return { id: input.userId };
  });
}
