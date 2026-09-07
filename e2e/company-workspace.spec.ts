import { test, expect, type BrowserContext } from "@playwright/test";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import {
  execute,
  createCompany,
  changeMember,
  companyState,
  getRecord,
} from "../lib/hosted/service";
import { invite, acceptInvite } from "../lib/hosted/invitations";
import type { Actor } from "../lib/hosted/types";
// Real company UI and PostgreSQL commands. Auth/SMTP are deliberately substituted
// ONLY in this Playwright fixture. This is not a Supabase Auth acceptance test.
const databaseUrl = process.env.COMPANY_TEST_ADMIN_URL;
test("private workspace unavailable state never falls back to local data", async ({
  page,
}) => {
  await page.goto("/company");
  await expect(
    page.getByText("Private company workspace", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Company sign-in is unavailable|Sign in with a confirmed/),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k.includes("company")),
    ),
  ).toEqual([]);
});
test("two browser sessions share authored company work, preserve a conflicted draft, and approve learning", async ({
  browser,
}, info) => {
  test.skip(
    !databaseUrl,
    "Native PostgreSQL browser harness requires COMPANY_TEST_ADMIN_URL; Supabase auth remains a separate blocked check.",
  );
  test.setTimeout(180000);
  const sql = postgres(databaseUrl!, { max: 2 });
  const suffix = randomUUID().slice(0, 8);
  const owner: Actor = {
      id: randomUUID(),
      email: `owner-${suffix}@company.test`,
    },
    peer: Actor = { id: randomUUID(), email: `peer-${suffix}@company.test` };
  await sql`insert into auth.users(id,email) values(${owner.id},${owner.email}),(${peer.id},${peer.email})`;
  const a = await browser.newContext({
      viewport: info.project.use.viewport,
      reducedMotion: "reduce",
    }),
    b = await browser.newContext({
      viewport: info.project.use.viewport,
      reducedMotion: "reduce",
    });
  let failNext = false;
  let orgId = "";
  async function attach(context: BrowserContext, actor: Actor) {
    let signedIn = false;
    await context.route("**/api/company/**", async (route) => {
      const req = route.request(),
        url = new URL(req.url()),
        path = url.pathname.slice("/api/company/".length),
        data = req.method() === "POST" ? req.postDataJSON() : null;
      try {
        if (path === "auth/sign-in") {
          signedIn = true;
          await route.fulfill({ json: { ok: true, factors: [] } });
          return;
        }
        if (!signedIn) {
          await route.fulfill({
            status: 401,
            json: { error: "Sign in with a confirmed account to continue" },
          });
          return;
        }
        let result: unknown;
        if (path === "state")
          result = await companyState(
            actor,
            url.searchParams.get("organizationId") ?? undefined,
            url.searchParams.get("q") ?? "",
          );
        else if (path === "organizations") {
          result = await createCompany(actor, data);
          orgId = (result as { id: string }).id;
        } else if (path === "record")
          result = await getRecord(
            actor,
            url.searchParams.get("organizationId")!,
            url.searchParams.get("recordId")!,
          );
        else if (path === "members") result = await changeMember(actor, data);
        else if (path === "invitations") result = await invite(actor, data);
        else if (path === "invitations/accept")
          result = await acceptInvite(actor, data.token);
        else if (path === "commands") {
          if (failNext) {
            failNext = false;
            throw new Error(
              "Synthetic backend outage. Your draft remains unsaved.",
            );
          }
          result = await execute(actor, data);
        } else throw new Error(`Fixture does not implement ${path}`);
        await route.fulfill({ json: result });
      } catch (error) {
        await route.fulfill({
          status: 503,
          json: {
            error: error instanceof Error ? error.message : "Test error",
          },
        });
      }
    });
  }
  await attach(a, owner);
  await attach(b, peer);
  const page = await a.newPage(),
    colleague = await b.newPage();
  const signIn = async (p: typeof page, email: string) => {
    await p.goto("/company");
    await p.getByLabel("Email", { exact: true }).fill(email);
    await p
      .getByLabel("Password (12 or more characters)")
      .fill("Synthetic-only-123!");
    await p.getByRole("button", { name: "Sign in", exact: true }).click();
  };
  const save = async (p = page) => {
    await p.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(
      p.getByRole("status").filter({ hasText: "Saved to company" }),
    ).toBeVisible();
    await p.getByRole("button", { name: "Done", exact: true }).click();
  };
  try {
    await signIn(page, owner.email);
    await page
      .getByLabel("Company name", { exact: true })
      .fill("Synthetic shared assembly");
    await page.getByLabel("Initial site").fill("North plant");
    await page.getByLabel("Initial team").fill("Line 4");
    await page
      .getByRole("button", { name: "Create company workspace", exact: true })
      .click();
    await page.getByRole("button", { name: "Team", exact: true }).click();
    await page
      .getByLabel("Explicit reviewer authority", { exact: true })
      .check();
    await page.getByRole("button", { name: "Save member access" }).click();
    await page.getByLabel("Colleague’s synthetic email").fill(peer.email);
    await page
      .getByRole("button", { name: "Create synthetic invitation" })
      .click();
    await expect(
      page.getByText("Invitation queued.", { exact: false }),
    ).toBeVisible();
    const [job] =
      await sql`select payload from company.outbox where org_id=${orgId} and kind='invitation'`;
    await signIn(colleague, peer.email);
    await colleague.goto(`/company#invite=${job.payload.token}`);
    await colleague
      .getByRole("button", { name: "Accept invitation", exact: true })
      .click();
    await expect(
      colleague.getByRole("heading", { name: "Synthetic shared assembly" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Problems", exact: true }).click();
    await page.getByRole("button", { name: "Record a problem" }).click();
    await page
      .getByLabel("Short title", { exact: true })
      .fill("Locating fixture moves");
    await page
      .getByLabel("What happened?", { exact: true })
      .fill("Setup produced a measurable shift at the fixture");
    await page.getByLabel("Where?", { exact: true }).fill("Press 4");
    await page.getByRole("button", { name: "Save first problem" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Locating fixture moves",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Evidence", exact: true }).click();
    await page
      .getByRole("button", { name: "Add evidence", exact: true })
      .click();
    await page.getByLabel("Evidence title").fill("Setup readings");
    await page
      .getByLabel("What does it show?")
      .fill(
        "Shift follows fixture setup; observations recorded before and after stop installation.",
      );
    await page
      .getByLabel("Source / reference")
      .fill("Synthetic measurement log Q4");
    await save();
    await page.getByRole("button", { name: "Causes", exact: true }).click();
    await page.getByRole("button", { name: "Add cause", exact: true }).click();
    await page
      .getByLabel("Cause / hypothesis")
      .fill("Fixture has no positive stop");
    await page
      .getByLabel("Classification", { exact: true })
      .selectOption("root");
    await page
      .getByLabel("Evidence state", { exact: true })
      .selectOption("data_supported");
    await page
      .getByLabel("Why does this explain the problem?")
      .fill("The fixture moved when clamped without a datum stop.");
    await save();
    await page
      .getByRole("button", { name: "Link evidence", exact: true })
      .click();
    await save();
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("button", { name: "Add action", exact: true }).click();
    await page.getByLabel("Action title").fill("Install a positive stop");
    await page.getByLabel("Assigned to").selectOption(peer.id);
    await page
      .getByRole("checkbox", {
        name: "Fixture has no positive stop",
        exact: true,
      })
      .check();
    await save();
    await colleague
      .getByRole("button", { name: "Reload shared records" })
      .click();
    await colleague
      .getByRole("button", { name: /Locating fixture moves/ })
      .click();
    await colleague
      .getByRole("button", { name: "Actions", exact: true })
      .click();
    await colleague.getByLabel("Update action status").selectOption("complete");
    await expect(
      colleague.getByRole("status").filter({ hasText: "Saved to company" }),
    ).toBeVisible();
    // Reload preserves record navigation through the URL and authoritative state.
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "Locating fixture moves",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Results", exact: true }).click();
    await page
      .getByRole("button", { name: "Record result", exact: true })
      .click();
    await page
      .getByLabel("Expected result / acceptance criteria")
      .fill("Offset under 0.5 mm");
    await page
      .getByLabel("Observed result", { exact: true })
      .fill("Maximum offset is 0.2 mm");
    await page.getByLabel("Date checked").fill("2026-09-06");
    await page
      .getByLabel("Effectiveness", { exact: true })
      .selectOption("effective");
    await page
      .getByRole("checkbox", { name: "Setup readings", exact: true })
      .check();
    await save();
    await page
      .getByRole("button", { name: "Add measurement", exact: true })
      .click();
    await page.getByLabel("Measured value").fill("0.2");
    await page.getByLabel("Units", { exact: true }).fill("mm");
    await page.getByLabel("Observation period starts").fill("2026-09-04");
    await page.getByLabel("Observation period ends").fill("2026-09-06");
    await save();
    await page
      .getByRole("button", { name: "Review and approve", exact: true })
      .click();
    await page.getByRole("checkbox").check();
    await save();
    await page
      .getByRole("button", { name: "Close improvement", exact: true })
      .click();
    await expect(
      page.getByText("closed", { exact: false }).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Lessons", exact: true }).click();
    await page.getByRole("button", { name: "Add lesson", exact: true }).click();
    await page
      .getByLabel("Learning and standard work change")
      .fill("Verify positive stop engagement at every setup.");
    await save();
    await page
      .getByRole("button", { name: "Approve lesson", exact: true })
      .click();
    await save();
    await expect(
      page.getByText("Approved learning", { exact: true }),
    ).toBeVisible();
    await mkdir("docs/company/screenshots", { recursive: true });
    await page.screenshot({
      path: `docs/company/screenshots/approved-lesson-${info.project.name}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Problem", exact: true }).click();
    await page
      .getByRole("button", { name: "Edit problem", exact: true })
      .click();
    await page
      .getByLabel("Observed impact", { exact: true })
      .fill("Unsaved recovery text");
    failNext = true;
    await page
      .getByRole("button", { name: "Duplicate saved investigation" })
      .click();
    await expect(page.getByRole("alert")).toContainText(
      "Synthetic backend outage",
    );
    await expect(
      page.getByLabel("Observed impact", { exact: true }),
    ).toHaveValue("Unsaved recovery text");
    // A separate actor commits while this editor holds a draft.
    await colleague.reload();
    await colleague
      .getByRole("button", { name: "Edit problem", exact: true })
      .click();
    await colleague
      .getByLabel("Observed impact", { exact: true })
      .fill("Colleague update");
    await save(colleague);
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Load latest; keep my draft" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Load latest; keep my draft" })
      .click();
    await expect(
      page.getByLabel("Observed impact", { exact: true }),
    ).toHaveValue("Unsaved recovery text");
    await save();
    await expect(
      page.getByText("Unsaved recovery text", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((k) => k.includes("company")),
      ),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  } finally {
    await a.close();
    await b.close();
    await sql.end();
  }
});
