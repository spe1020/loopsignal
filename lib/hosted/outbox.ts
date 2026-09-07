import nodemailer from "nodemailer";
import { absoluteUrl } from "@/lib/site";
import { transaction } from "./db";
import { access, audit } from "./service";
import { administrator, canWrite, ensure, type Actor } from "./types";
import { privateObjects, type ObjectStore } from "./files";
export async function runOutbox(
  actor: Actor,
  orgId: string,
  store?: ObjectStore,
) {
  return transaction(actor, async (sql) => {
    const { org, member } = await access(sql, actor, orgId);
    ensure(
      administrator(member.role),
      "Manager access required for queued work",
      403,
    );
    const jobs =
      await sql`select * from company.outbox where org_id=${orgId} and completed_at is null order by created_at for update skip locked limit 20`;
    let complete = 0;
    for (const job of jobs) {
      const [initiator] =
        await sql`select role from company.memberships where org_id=${orgId} and user_id=${job.actor} and revoked_at is null`;
      try {
        ensure(initiator, "Initiating membership revoked", 403);
        if (job.kind === "invitation") {
          ensure(
            administrator(initiator.role) && canWrite(org),
            "Inviter authority or entitlement changed",
            403,
          );
          const [i] =
            await sql`select * from company.invitations where org_id=${orgId} and id=${job.payload.invitationId} and revoked_at is null and accepted_at is null and expires_at>now()`;
          ensure(i, "Invitation expired or revoked", 403);
          const host = process.env.COMPANY_SMTP_HOST,
            port = Number(process.env.COMPANY_SMTP_PORT ?? 54325);
          // This milestone sends only synthetic mail into an explicitly local sink.
          ensure(
            host && ["localhost", "127.0.0.1"].includes(host),
            "Local email sink unavailable",
            503,
          );
          ensure(
            /@[^@]+\.test$/i.test(i.email),
            "Synthetic invitation addresses only",
          );
          const transport = nodemailer.createTransport({
            host,
            port,
            secure: false,
            connectionTimeout: 3000,
            socketTimeout: 3000,
          });
          await transport.sendMail({
            from: "LoopSignal <pilot@loopsignal.test>",
            to: i.email,
            messageId: `<${job.id}@loopsignal.test>`,
            subject: `Join ${org.name} in LoopSignal — synthetic evaluation`,
            text: `Sign in with ${i.email}, then accept this invitation. It expires ${i.expires_at}.\n${absoluteUrl("/company")}#invite=${job.payload.token}`,
          });
        } else if (job.kind === "object_delete") {
          ensure(
            administrator(initiator.role),
            "Deletion authority revoked",
            403,
          );
          const [file] =
            await sql`select * from company.attachments where org_id=${orgId} and id=${job.payload.attachmentId} and state='deleted'`;
          ensure(file, "Object no longer scheduled for deletion");
          await (store ?? privateObjects()).remove(file.object_key);
        } else {
          // Consumer v1 only acknowledges events. No external action or derived cache.
          const [record] =
            await sql`select revision from company.investigations where org_id=${orgId} and id=${job.record_id} and deleted_at is null`;
          ensure(
            record && record.revision >= job.expected_revision,
            "Record unavailable or revision not reached",
          );
        }
        await sql`update company.outbox set completed_at=clock_timestamp(),payload='{}',attempts=attempts+1,last_error=null where id=${job.id}`;
        complete++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Job failed";
        await sql`update company.outbox set attempts=attempts+1,last_error=${message.slice(0, 160)} where id=${job.id}`;
      }
    }
    await audit(
      sql,
      actor,
      orgId,
      crypto.randomUUID(),
      "run_outbox",
      null,
      null,
      null,
    );
    return { processed: jobs.length, complete };
  });
}
