import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
// Explicitly opt-in, actual Supabase/API boundary. No route interceptions.
test("provider-backed sessions, private bytes, commands and tenant denial", async ({
  browser,
  baseURL,
}) => {
  test.skip(
    process.env.COMPANY_PROVIDER_E2E !== "1",
    "Requires running local Supabase, seeded accounts and configured Next server; not replaced with mocks.",
  );
  test.setTimeout(120000);
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY,
    adminUrl = process.env.COMPANY_TEST_ADMIN_URL;
  if (
    !url ||
    !key ||
    !adminUrl ||
    !["localhost", "127.0.0.1"].includes(new URL(url).hostname) ||
    !["localhost", "127.0.0.1"].includes(new URL(adminUrl).hostname)
  )
    throw new Error(
      "This fixture requires explicitly configured LOCAL Supabase",
    );
  const a = await browser.newContext(),
    b = await browser.newContext(),
    c = await browser.newContext();
  const owner = await a.newPage(),
    peer = await b.newPage(),
    other = await c.newPage();
  const sql = postgres(adminUrl, { max: 1 });
  const password = "Synthetic-local-only-2026!";
  const login = async (p: Page, email: string) => {
    await p.goto("/company");
    await p.getByLabel("Email", { exact: true }).fill(email);
    await p.getByLabel("Password (12 or more characters)").fill(password);
    await p.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(p.getByRole("button", { name: "Sign out" })).toBeVisible();
  };
  const post = async (p: Page, path: string, data: unknown) => {
    const response = await p.request.post(`/api/company/${path}`, {
      data,
      headers: { Origin: new URL(baseURL!).origin },
    });
    expect(response.ok(), await response.text()).toBe(true);
    return response.json();
  };
  try {
    await login(owner, "owner@factory.test");
    await login(peer, "colleague@factory.test");
    await login(other, "other-owner@factory.test");
    const org = await post(owner, "organizations", {
      commandId: randomUUID(),
      name: "Provider synthetic company",
      site: "Local site",
      team: "Test team",
    });
    const foreign = await post(other, "organizations", {
      commandId: randomUUID(),
      name: "Foreign provider company",
      site: "S2",
      team: "T2",
    });
    const actor = (await (await owner.request.get("/api/company/state")).json())
      .actor;
    await post(owner, "members", {
      organizationId: org.id,
      userId: actor.id,
      role: "owner",
      reviewer: true,
      revoke: false,
      commandId: randomUUID(),
    });
    const inviteId = randomUUID();
    await post(owner, "invitations", {
      organizationId: org.id,
      email: "colleague@factory.test",
      role: "collaborator",
      reviewer: false,
      commandId: inviteId,
    });
    const [job] =
      await sql`select payload from company.outbox where org_id=${org.id} and command_id=${inviteId}`;
    await post(owner, "jobs", { organizationId: org.id });
    await post(peer, "invitations/accept", { token: job.payload.token });
    const peerActor = (
      await (await peer.request.get("/api/company/state")).json()
    ).actor;
    const createId = randomUUID();
    let record = await post(owner, "commands", {
      version: 1,
      organizationId: org.id,
      commandId: createId,
      correlationId: createId,
      recordId: null,
      expectedRevision: 0,
      command: {
        type: "create_problem",
        data: {
          title: "Provider-backed fixture movement",
          whatHappened: "Fixture shifts during setup",
          where: "Test cell",
          whatShouldHaveHappened: "Offset under 0.5 mm",
          impact: "",
        },
      },
    });
    const command = async (p: Page, value: unknown) => {
      const id = randomUUID();
      record = await post(p, "commands", {
        version: 1,
        organizationId: org.id,
        commandId: id,
        correlationId: id,
        recordId: record.id,
        expectedRevision: record.revision,
        command: value,
      });
    };
    await command(peer, {
      type: "add_evidence",
      data: {
        title: "Provider test reading",
        type: "measurement",
        description: "Synthetic sample measured at 0.2 mm",
        source: "Synthetic fixture log",
        date: "2026-09-06",
      },
    });
    const evidence = record.document.investigation.evidence[0].id;
    const bytes = Buffer.from("synthetic provider reading,0.2,mm\n");
    const stage = await post(peer, "upload/stage", {
      organizationId: org.id,
      recordId: record.id,
      evidenceId: evidence,
      expectedRevision: record.revision,
      commandId: randomUUID(),
      filename: "source.csv",
      mediaType: "text/csv",
      size: bytes.length,
    });
    record = stage.record;
    const query = new URLSearchParams({
      organizationId: org.id,
      recordId: record.id,
      attachmentId: stage.attachment.id,
      expectedRevision: String(record.revision),
      commandId: randomUUID(),
    });
    const finalized = await peer.request.post(
      `/api/company/upload/finalize?${query}`,
      {
        data: bytes,
        headers: {
          Origin: new URL(baseURL!).origin,
          "Content-Type": "application/octet-stream",
        },
      },
    );
    expect(finalized.ok()).toBe(true);
    record = await finalized.json();
    const downloaded = await peer.request.get(
      `/api/company/file?organizationId=${org.id}&recordId=${record.id}&attachmentId=${stage.attachment.id}`,
    );
    expect(await downloaded.body()).toEqual(bytes);
    const denied = await other.request.get(
      `/api/company/record?organizationId=${org.id}&recordId=${record.id}`,
    );
    expect([403, 404]).toContain(denied.status());
    const mixed = await owner.request.get(
      `/api/company/record?organizationId=${foreign.id}&recordId=${record.id}`,
    );
    expect([403, 404]).toContain(mixed.status());
    const foreignClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    await foreignClient.auth.signInWithPassword({
      email: "other-owner@factory.test",
      password,
    });
    const fileDenied = await foreignClient.storage
      .from("company-evidence")
      .download(stage.attachment.object_key);
    expect(fileDenied.error).toBeTruthy();
    const writeDenied = await foreignClient
      .schema("company")
      .from("investigations")
      .update({ document: { status: "closed" } })
      .eq("id", record.id);
    expect(writeDenied.error).toBeTruthy();
    await command(owner, {
      type: "add_cause",
      data: {
        text: "Locating stop is absent",
        classification: "root",
        evidenceState: "data_supported",
        rootCauseRationale: "Fixture movement follows missing stop",
        parentId: null,
        challenged: false,
      },
    });
    const cause = record.document.investigation.causes[0].id;
    await command(owner, {
      type: "link_evidence",
      causeId: cause,
      evidenceId: evidence,
      relation: "supports",
    });
    await command(owner, {
      type: "add_action",
      data: {
        title: "Install the stop",
        description: "Install datum stop",
        owner: peerActor.id,
        linkedCauseIds: [cause],
        kind: "corrective",
        requiredForClosure: true,
        dueDate: "",
        verificationMethod: "Measure ten samples",
        expectedResult: "Under 0.5 mm",
      },
    });
    const action = record.document.investigation.actions[0].id;
    await command(peer, {
      type: "action_status",
      id: action,
      status: "complete",
    });
    await command(peer, {
      type: "add_verification",
      data: {
        actionId: action,
        expected: "Under 0.5 mm",
        observed: "0.2 mm maximum",
        checkAt: "2026-09-06",
        result: "effective",
        evidenceIds: [evidence],
      },
    });
    const verification = record.document.investigation.verifications[0].id;
    await command(peer, {
      type: "add_observation",
      data: {
        verificationId: verification,
        evidenceId: evidence,
        value: 0.2,
        unit: "mm",
        start: "2026-09-04",
        end: "2026-09-06",
      },
    });
    await command(owner, {
      type: "approve_verification",
      id: verification,
      selfReviewAcknowledged: true,
    });
    await command(owner, { type: "close" });
    await command(owner, {
      type: "add_lesson",
      lesson: "Check locating stop at setup",
      relatedProcess: "Fixture setup",
    });
    await command(owner, {
      type: "approve_lesson",
      id: record.document.investigation.lessons[0].id,
      reviewId: record.document.investigation.verificationReviews.at(-1).id,
    });
    await peer.goto(`/company?organizationId=${org.id}&recordId=${record.id}`);
    await peer.getByRole("button", { name: "Lessons", exact: true }).click();
    await expect(
      peer.getByText("Approved learning", { exact: true }),
    ).toBeVisible();
    await peer.reload();
    await expect(
      peer.getByRole("heading", { name: "Provider-backed fixture movement" }),
    ).toBeVisible();
    await post(owner, "members", {
      organizationId: org.id,
      userId: peerActor.id,
      role: "collaborator",
      reviewer: false,
      revoke: true,
      commandId: randomUUID(),
    });
    const revoked = await peer.request.get(
      `/api/company/file?organizationId=${org.id}&recordId=${record.id}&attachmentId=${stage.attachment.id}`,
    );
    expect([403, 404]).toContain(revoked.status());
  } finally {
    await a.close();
    await b.close();
    await c.close();
    await sql.end();
  }
});
