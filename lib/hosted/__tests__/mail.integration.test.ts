import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SMTPServer } from "smtp-server";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
import { createCompany } from "../service";
import { invite, revokeInvite } from "../invitations";
import { runOutbox } from "../outbox";
import { closeDatabase } from "../db";
const enabled = Boolean(process.env.COMPANY_TEST_ADMIN_URL);
(enabled ? describe : describe.skip)(
  "actual local SMTP sink and outbox authorization",
  () => {
    let server: SMTPServer, sql: ReturnType<typeof postgres>, org: string;
    const messages: string[] = [];
    const actor = { id: randomUUID(), email: "mail-owner@company.test" };
    beforeAll(async () => {
      server = new SMTPServer({
        authOptional: true,
        disabledCommands: ["AUTH", "STARTTLS"],
        onData(stream, _session, callback) {
          let body = "";
          stream.on("data", (chunk) => (body += chunk.toString()));
          stream.on("end", () => {
            messages.push(body);
            callback();
          });
        },
      });
      await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
      );
      process.env.COMPANY_SMTP_HOST = "127.0.0.1";
      process.env.COMPANY_SMTP_PORT = String(
        (server.server.address() as { port: number }).port,
      );
      sql = postgres(process.env.COMPANY_TEST_ADMIN_URL!, { max: 1 });
      await sql`insert into auth.users(id,email) values(${actor.id},${actor.email})`;
      org = (
        await createCompany(actor, {
          name: "Synthetic email team",
          site: "S1",
          team: "T1",
          commandId: randomUUID(),
        })
      ).id;
    });
    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(resolve));
      await sql.end();
      await closeDatabase();
    });
    it("sends one synthetic invitation to a local sink; repeats do not send a second completed job", async () => {
      await invite(actor, {
        organizationId: org,
        email: "recipient@company.test",
        role: "participant",
        reviewer: false,
        commandId: randomUUID(),
      });
      await runOutbox(actor, org);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain("recipient@company.test");
      expect(messages[0]).toContain("LoopSignal");
      await runOutbox(actor, org);
      expect(messages).toHaveLength(1);
      const [job] =
        await sql`select payload,completed_at from company.outbox where org_id=${org}`;
      expect(job.payload).toEqual({});
      expect(job.completed_at).toBeTruthy();
    });
    it("rechecks invitation revocation at delivery time", async () => {
      const result = await invite(actor, {
        organizationId: org,
        email: "revoked@company.test",
        role: "participant",
        reviewer: false,
        commandId: randomUUID(),
      });
      await revokeInvite(actor, org, result.id);
      await runOutbox(actor, org);
      expect(messages).toHaveLength(1);
      const [job] =
        await sql`select last_error,completed_at from company.outbox where org_id=${org} and completed_at is null`;
      expect(job.last_error).toContain("revoked");
      expect(job.completed_at).toBeNull();
    });
  },
);
