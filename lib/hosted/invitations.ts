import { randomBytes, randomUUID } from "node:crypto";
import { transaction } from "./db";
import { access, audit, capacity, hash, receipt, saveReceipt } from "./service";
import {
  administrator,
  editor,
  ensure,
  fullSeat,
  type Actor,
  type Role,
} from "./types";
export async function invite(
  actor: Actor,
  input: {
    organizationId: string;
    email: string;
    role: Exclude<Role, "owner">;
    reviewer: boolean;
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
    ensure(
      member.role === "owner" ||
        (!["manager", "billing_admin"].includes(input.role) && !input.reviewer),
      "Only the owner can grant elevated access",
      403,
    );
    ensure(!input.reviewer || editor(input.role), "This role cannot review");
    const r = await receipt(sql, actor, org.id, input.commandId, input);
    if (r.result) return r.result;
    ensure(
      /@[^@]+\.test$/i.test(input.email),
      "This synthetic evaluation accepts invitation addresses ending in .test only",
    );
    if (fullSeat(input.role)) await capacity(sql, org);
    const [existing] =
      await sql`select id from company.invitations where org_id=${org.id} and lower(email)=${input.email.toLowerCase()} and accepted_at is null and revoked_at is null and expires_at>now()`;
    ensure(
      !existing,
      "An active invitation already exists for this address",
      409,
    );
    const id = randomUUID(),
      token = randomBytes(32).toString("base64url");
    await sql`insert into company.invitations(id,org_id,email,role,reviewer,token_hash,invited_by) values(${id},${org.id},${input.email.toLowerCase()},${input.role},${input.reviewer},${hash(token)},${actor.id})`;
    // Token exists only in protected pending outbox payload, and is removed on delivery.
    await sql`insert into company.outbox(id,org_id,actor,command_id,kind,payload,correlation_id) values(${randomUUID()},${org.id},${actor.id},${input.commandId},'invitation',${JSON.stringify({ invitationId: id, token })}::text::jsonb,${input.commandId})`;
    await audit(
      sql,
      actor,
      org.id,
      input.commandId,
      "invite_member",
      null,
      null,
      null,
    );
    await saveReceipt(sql, actor, org.id, input.commandId, r.digest, { id });
    return { id };
  });
}
export async function revokeInvite(actor: Actor, orgId: string, id: string) {
  return transaction(actor, async (sql) => {
    const { member } = await access(sql, actor, orgId);
    ensure(administrator(member.role), "Manager access required", 403);
    await sql`update company.invitations set revoked_at=clock_timestamp() where org_id=${orgId} and id=${id}`;
    await audit(
      sql,
      actor,
      orgId,
      randomUUID(),
      "revoke_invitation",
      null,
      null,
      null,
    );
    return { ok: true };
  });
}
export async function acceptInvite(actor: Actor, token: string) {
  return transaction(actor, async (sql) => {
    const [row] =
      await sql`select company.accept_invitation(${hash(token)},${actor.email},${actor.email}) as id`;
    return { id: row.id };
  });
}
