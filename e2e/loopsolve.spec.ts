import { expect, test, type Page } from "@playwright/test";

/**
 * Full loop: create → why → branch → link evidence → root → action →
 * verify Not Effective → Reopen → verify Effective → Close.
 * Runs at 375×812, 1024×768, 1440×900 via playwright.config.ts projects.
 */

test.beforeEach(async ({ page }) => {
  // Hide the Next.js dev indicator so it never overlaps a tap target in tests.
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = "nextjs-portal{display:none!important}";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
  });
});

async function openPanelDone(page: Page) {
  const done = page.getByRole("dialog").getByRole("button", { name: "Done" });
  if (await done.isVisible().catch(() => false)) await done.click();
}

test("create an investigation and close the loop", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/solve");
  await page.getByRole("button", { name: "New Investigation" }).first().click();
  await page.waitForURL(/\/solve\/[^/]+\/problem/);
  const base = page.url().replace(/\/problem$/, "");

  // Problem
  await page.getByLabel("What happened?").fill("Cell 3 produced 42 brackets with an oversized hole");
  await page.getByLabel("What should have happened?").fill("10.00 ± 0.05 mm per drawing");
  await page.getByLabel("Where?").fill("Cell 3");
  await page.getByLabel("When?").fill("Second shift");
  await page.getByLabel("How often?").fill("One shift");
  await expect(page.getByText("Cell 3 produced 42 brackets", { exact: false }).first()).toBeVisible();

  // Contain
  await page.goto(`${base}/contain`);
  await page.getByRole("button", { name: "Segregate suspect inventory" }).click();
  await page.getByRole("dialog").getByLabel("Owner").fill("R. Delgado");
  await page.getByRole("dialog").getByLabel("Status").selectOption("verified");
  await openPanelDone(page);

  // Investigate — Five Whys
  await page.goto(`${base}/investigate`);
  await page.getByRole("button", { name: "Start the first why" }).first().click();
  const why = page.getByPlaceholder("Because…");
  await why.fill("The part shifted in the fixture");
  await why.press("Enter");
  await why.fill("The fixture locator was worn beyond its limit");
  await why.press("Enter");
  await page.getByRole("button", { name: "Done" }).first().click();
  await expect(page.getByText("The fixture locator was worn beyond its limit").first()).toBeVisible();
  // Branch from the first why
  await page.getByRole("button", { name: "Branch", exact: false }).first().click();
  await why.fill("Inspection could not detect the drift");
  await why.press("Enter");
  await page.getByRole("button", { name: "Done" }).first().click();
  await expect(page.getByText("Inspection could not detect the drift").first()).toBeVisible();

  // Evidence + link
  await page.goto(`${base}/investigate?mode=evidence`);
  await page.getByRole("button", { name: "Add evidence" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill("Locator pin measurement");
  await dialog.getByLabel("What does it show?").fill("Locator wear exceeded 0.15 mm; a controlled replacement trial held all 30 parts in tolerance.");
  await dialog.getByLabel("Source", { exact: true }).fill("Fictional QA measurement and replacement trial, rows 1–30");
  await dialog.getByLabel("Search causes").fill("locator");
  await dialog.getByRole("button", { name: "Supports" }).first().click();
  await openPanelDone(page);
  await expect(page.getByText("Supports:", { exact: false }).first()).toBeVisible();

  // Root cause
  await page.goto(`${base}/root-cause`);
  const card = page.locator("li", { hasText: "The fixture locator was worn beyond its limit" }).first();
  await card.getByRole("radio", { name: "Root cause" }).click();
  await card.getByLabel("Rationale").fill("Wear allowed the part to shift. Removing it prevents the drift.");
  await card.getByRole("radio", { name: "Yes" }).click();
  await expect(page.getByText("1 root cause")).toBeVisible();
  await card.getByRole("button", { name: "The fixture locator was worn beyond its limit", exact: true }).click();
  await page.getByRole("dialog").getByRole("radio", { name: "Data-supported", exact: true }).click();
  await openPanelDone(page);

  // Action
  await page.goto(`${base}/actions`);
  await page.getByRole("button", { name: "Corrective action" }).first().click();
  await page.getByRole("dialog").getByLabel("Title").fill("Replace worn fixture locator");
  await page.getByRole("dialog").getByRole("checkbox", { name: /fixture locator was worn/ }).check();
  await page.getByRole("dialog").getByLabel("Owner", { exact: true }).fill("Fictional engineer");
  await page.getByRole("dialog").getByLabel("Status", { exact: true }).selectOption("complete");
  await page.getByRole("dialog").getByLabel("Expected result", { exact: true }).fill("All 30 follow-up parts in tolerance.");
  await openPanelDone(page);
  await expect(page.getByText("Replace worn fixture locator").first()).toBeVisible();

  // Verify — Not Effective
  await page.goto(`${base}/verify`);
  await page.getByRole("button", { name: "Record verification" }).first().click();
  await page.getByRole("dialog").getByLabel("Observed result").fill("Still seeing oversize holes on one shift.");
  await page.getByRole("dialog").getByRole("radio", { name: "Not effective" }).click();
  await openPanelDone(page);
  await expect(page.getByText("The problem is not closed.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Close investigation" })).toBeDisabled();

  // Reopen
  await page.getByRole("button", { name: "Reopen Investigation" }).click();
  await page.waitForURL(/\/investigate/);
  await expect(page.getByText("Reopened").first()).toBeVisible();

  // Re-verify Effective and Close
  await page.goto(`${base}/verify`);
  await expect(page.getByText("Reopened after this result")).toBeVisible();
  await page.getByRole("button", { name: "Re-verify" }).first().click();
  await page.getByRole("dialog").getByLabel("Observed result").fill("30 pieces in tolerance in the controlled replacement trial.");
  await page.getByRole("dialog").getByLabel("Check date").fill("2026-08-30");
  await page.getByRole("dialog").getByLabel("Verifier", { exact: true }).fill("Fictional quality reviewer");
  await page.getByRole("dialog").getByRole("checkbox", { name: /Locator pin measurement/ }).check();
  await page.getByRole("dialog").getByRole("radio", { name: "Effective", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Approve effective verification" }).click();
  await openPanelDone(page);
  const closeBtn = page.getByRole("button", { name: "Close investigation" });
  await expect(closeBtn).toBeEnabled();
  await closeBtn.click();
  await page.waitForURL(/\/summary/);
  await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Start with LoopScan" })).toBeVisible();

  // Home lists it as closed
  await page.goto("/solve");
  await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});

test("sample loads and prints without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/solve");
  await page.getByRole("button", { name: "Explore Sample Investigation" }).first().click();
  await page.waitForURL(/\/problem/);
  const base = page.url().replace(/\/problem$/, "");
  for (const stage of ["contain", "investigate", "investigate?mode=fishbone", "investigate?mode=evidence", "investigate?mode=timeline", "root-cause", "actions", "verify", "summary"]) {
    await page.goto(`${base}/${stage}`);
    await page.waitForLoadState("networkidle");
  }
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".loop-print-header")).toBeVisible();
  await expect(page.locator(".loop-report svg").first()).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});

test("facilitation mode adds whys with the keyboard", async ({ page }) => {
  await page.goto("/solve");
  await page.getByRole("button", { name: "New Investigation" }).first().click();
  await page.waitForURL(/\/problem/);
  const base = page.url().replace(/\/problem$/, "");
  await page.goto(`${base}/investigate?facilitate=1`);
  const input = page.getByPlaceholder("Because…");
  await input.fill("First why");
  await input.press("Enter");
  await expect(page.getByText("Why First why?")).toBeVisible();
  await input.fill("Second why");
  await input.press("Enter");
  await expect(page.getByText("WHY #3")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.waitForURL((u) => !u.searchParams.has("facilitate"));
  await expect(page.getByText("Second why").first()).toBeVisible();
});
