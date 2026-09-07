import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { completedAction } from "../lib/workspace/__tests__/fixtures";
import { verificationCandidate } from "../lib/workspace/demo";
import { serialize } from "../lib/solve/io";
import { reduce } from "../lib/solve/reducer";
import type { Investigation } from "../lib/solve/schema";

async function importInvestigation(page: Page, inv: Investigation) {
  await page.goto("/solve");
  await page
    .getByLabel("Import a LoopSolve JSON file")
    .setInputFiles({
      name: "review-fixture.loopsolve.json",
      mimeType: "application/json",
      buffer: Buffer.from(serialize(inv)),
    });
  await page
    .getByRole("link", { name: /Oversized holes on the bracket line/ })
    .click();
  await page.waitForURL(/\/problem$/);
  return page.url().replace(/\/problem$/, "");
}
async function done(page: Page) {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Done", exact: true })
    .click();
}
async function exportDocument(
  page: Page,
  base: string,
): Promise<Investigation> {
  await page.goto(`${base}/summary`);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const file = await (await download).path();
  return JSON.parse(await readFile(file!, "utf8"));
}
async function openReview(page: Page) {
  await page
    .locator('[data-finding-code="action_unverified"]')
    .getByRole("button")
    .click();
}
async function approveAndClose(page: Page) {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Approve effective verification" })
    .click();
  await expect(
    page.getByRole("dialog").getByText(/Current review approved by/),
  ).toBeVisible();
  await done(page);
  await page
    .getByRole("button", { name: "Close investigation", exact: true })
    .click();
  await page.waitForURL(/\/summary$/);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      document.head.appendChild(style);
    }),
  );
});

test("ordinary LoopSolve withdraws edited evidence and scope approval; explicit re-review retains history", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = await importInvestigation(
    page,
    verificationCandidate(completedAction(), "effective"),
  );
  await page.goto(`${base}/verify`);
  await expect(
    page.getByRole("button", { name: "Close investigation", exact: true }),
  ).toBeDisabled();
  await openReview(page);
  await approveAndClose(page);
  const first = await exportDocument(page, base);
  expect(first.status).toBe("closed");
  expect(first.verificationReviews).toHaveLength(1);
  // The real evidence editor changes nonempty reviewed source content.
  await page.goto(`${base}/investigate?mode=evidence`);
  await page
    .getByRole("button", { name: /Three-lot follow-up/ })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("What does it show?")
    .fill(
      "Correction: all three lots exceeded the target. This previous approval must be reviewed.",
    );
  await done(page);
  await page.goto(`${base}/verify`);
  await expect(
    page.getByRole("button", { name: "Close investigation", exact: true }),
  ).toBeDisabled();
  await openReview(page);
  await page
    .getByRole("dialog")
    .getByLabel("Verifier", { exact: true })
    .fill("Alex Morgan (fictional demo reviewer)");
  await done(page);
  await expect(
    page.getByRole("button", { name: "Close investigation", exact: true }),
  ).toBeDisabled();
  // Correct the evidence from the supplied synthetic record, then deliberately review it again.
  await page.goto(`${base}/investigate?mode=evidence`);
  await page
    .getByRole("button", { name: /Three-lot follow-up/ })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("What does it show?")
    .fill(
      first.evidence.find(
        (e) => e.id === first.verifications[0].evidenceIds[0],
      )!.description,
    );
  await done(page);
  await page.goto(`${base}/verify`);
  await expect(
    page.getByRole("button", { name: "Close investigation", exact: true }),
  ).toBeDisabled();
  await openReview(page);
  await approveAndClose(page);
  const second = await exportDocument(page, base);
  expect(second.verificationReviews).toHaveLength(2);
  expect(second.verificationReviews[0]).toMatchObject(
    first.verificationReviews[0],
  );
  expect(second.verifications).toHaveLength(1);
  expect(second.verifications[0].checkAt).toBe(first.verifications[0].checkAt);
  expect(second.history.filter((h) => h.type === "reopened")).toHaveLength(1);
  // Material action editing also reopens the same investigation.
  await page.goto(`${base}/actions`);
  await page
    .getByRole("button", { name: /Replace the locator/ })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Description", { exact: true })
    .fill("Replace the locator and add a second documented PM wear check.");
  await done(page);
  await page.goto(`${base}/verify`);
  await expect(
    page.getByRole("button", { name: "Close investigation", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Close investigation", exact: true }),
  ).toBeDisabled();
  await openReview(page);
  await approveAndClose(page);
  const final = await exportDocument(page, base);
  expect(final.verificationReviews).toHaveLength(3);
  expect(final.history.filter((h) => h.type === "closed")).toHaveLength(3);
  expect(final.status).toBe("closed");
  expect(errors).toEqual([]);
});

test("all closure blockers are visible and navigate to the actual incomplete records", async ({
  page,
}) => {
  let inv = verificationCandidate(completedAction(), "effective");
  inv = reduce(inv, {
    type: "update_action",
    id: inv.actions[0].id,
    patch: { status: "in_progress" },
  });
  inv = reduce(inv, {
    type: "update_verification",
    id: inv.verifications[0].id,
    patch: { verifier: "" },
  });
  const base = await importInvestigation(page, inv);
  await page.goto(`${base}/verify`);
  for (const code of [
    "root_unaddressed",
    "action_incomplete",
    "verification_without_evidence",
    "action_unverified",
  ])
    await expect(page.locator(`[data-finding-code="${code}"]`)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close investigation", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("All closure requirements satisfied.", { exact: false }),
  ).toHaveCount(0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `docs/product-preview/screenshots/closure-blocked-${page.viewportSize()!.width}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page
    .locator('[data-finding-code="action_incomplete"]')
    .getByRole("button")
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Status", { exact: true })
    .selectOption("complete");
  await done(page);
  await expect(
    page.locator('[data-finding-code="action_incomplete"]'),
  ).toHaveCount(0);
  await page
    .locator('[data-finding-code="verification_without_evidence"]')
    .getByRole("button")
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Approve effective verification" }),
  ).toBeDisabled();
  await page
    .getByRole("dialog")
    .getByLabel("Verifier", { exact: true })
    .fill("Fictional quality reviewer");
  await done(page);
  await expect(
    page.getByRole("button", { name: "Close investigation", exact: true }),
  ).toBeDisabled();
  await openReview(page);
  await approveAndClose(page);
});


test("a ready action can be approved while a separate required action remains unfinished", async ({page}) => {
  let inv = verificationCandidate(completedAction(), "effective");
  inv = reduce(inv, {type: "add_action", item: {...inv.actions[0], id: "unfinished-preventive", title: "Roll out wear checks to other cells", kind: "preventive", requiredForClosure: true, status: "in_progress", owner: ""}});
  inv = reduce(inv, {type: "add_verification", item: {...inv.verifications[0], id: "unfinished-check", actionId: "unfinished-preventive", observed: "", verifier: "", evidenceIds: []}});
  const base = await importInvestigation(page, inv);
  await page.goto(`${base}/verify`);
  await page.locator('[data-finding-code="action_unverified"]').first().getByRole("button").click();
  await page.getByRole("dialog").getByRole("button", {name: "Approve effective verification"}).click();
  await expect(page.getByRole("dialog").getByText(/Current review approved by/)).toBeVisible();
  await done(page);
  await expect(page.getByRole("button", {name: "Close investigation", exact: true})).toBeDisabled();
  await expect(page.locator('[data-finding-code="action_incomplete"]')).toContainText("Roll out wear checks to other cells");
  await page.locator('[data-finding-code="action_unverified"]').getByRole("button").click();
  await expect(page.getByRole("dialog").getByRole("button", {name: "Approve effective verification"})).toBeDisabled();
});
