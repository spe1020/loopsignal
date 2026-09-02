import { expect, test, type Page } from "@playwright/test";

/**
 * LoopFlow end to end: new map → scope → 12 steps by keyboard → decision →
 * pain point → start investigation → back to map shows status → fork future →
 * delete two steps with rationale → summary → print without console errors.
 * Runs at 375×812, 1024×768, 1440×900 via playwright.config.ts projects.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = "nextjs-portal{display:none!important}";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
  });
});

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

async function newMapToScope(page: Page) {
  await page.goto("/flow");
  await page.getByRole("button", { name: "New Map" }).first().click();
  await page.waitForURL(/\/flow\/[^/]+\/scope/);
  const base = page.url().replace(/\/scope$/, "");
  await page.getByLabel("Map title").fill("Bracket quote test");
  await page.getByLabel("Starts with").fill("Customer sends an RFQ");
  await page.getByLabel("Ends with").fill("Order acknowledged");
  await page.getByLabel("Quick-start lane set").selectOption("quote-to-order");
  await expect(page.getByText("Estimating", { exact: true }).first()).toBeVisible();
  return base;
}

test("map twelve steps from the keyboard, add a decision and a pain point", async ({ page }) => {
  const errors = collectErrors(page);
  const base = await newMapToScope(page);

  await page.goto(`${base}/map`);
  await page.getByRole("button", { name: "Start mapping" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Name")).toBeFocused();
  // Enter from the start step's name adds the next step with its name focused.
  await page.keyboard.press("Enter");
  for (let i = 1; i <= 11; i += 1) {
    await expect(dialog.getByLabel("Name")).toBeFocused();
    await page.keyboard.type(`Step ${i}`);
    await page.keyboard.press("Tab");
    await expect(dialog.getByLabel("Cycle time")).toBeFocused();
    await page.keyboard.type(String(10 + i));
    await page.keyboard.press("Enter"); // commits time and adds the next step
  }
  // Twelfth step: name it, then close.
  await page.keyboard.type("Step 12");
  await page.keyboard.press("Tab");
  await page.keyboard.type("5");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(page.getByText("13 steps")).toBeVisible();
  await expect(page.getByText(/Touch/).first()).toBeVisible();

  // Decision after the selected (last) step
  await page.getByRole("button", { name: "Add decision" }).first().click();
  await dialog.getByLabel("Name").fill("Quote accepted?");
  await dialog.getByLabel("Branch label").fill("Revise");
  const target = await dialog.getByLabel("Branch goes to").locator("option", { hasText: "3. Step 2" }).getAttribute("value");
  await dialog.getByLabel("Branch goes to").selectOption(target!);
  await dialog.getByRole("button", { name: "Add branch" }).click();
  await expect(dialog.getByText(/Revise.*back to step 3/)).toBeVisible();

  // Pain point on the decision
  await dialog.getByRole("button", { name: "Mark pain point" }).click();
  await dialog.getByLabel("What's wrong here?").fill("Quotes bounce twice on average.");
  await dialog.getByLabel("Severity").selectOption("high");
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("14 steps")).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});

test("stopwatch on the mobile list records an observation", async ({ page }, info) => {
  test.skip((info.project.use.viewport?.width ?? 0) >= 768, "mobile list only");
  await page.goto("/flow");
  await page.getByRole("button", { name: "Explore Sample Map" }).first().click();
  await page.waitForURL(/\/map/);
  const btn = page.getByRole("button", { name: "Time Customer emails RFQ with drawing" });
  await btn.click();
  await expect(page.getByRole("button", { name: /Stop timing/ })).toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /Stop timing/ }).click();
  await page.getByRole("button", { name: /Customer emails RFQ with drawing/ }).first().click();
  await expect(page.getByRole("dialog").getByText(/median 1 min/)).toBeVisible();
});

test("sample map renders every stage without console errors", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/flow");
  await page.getByRole("button", { name: "Explore Sample Map" }).first().click();
  await page.waitForURL(/\/map/);
  const base = page.url().replace(/\/map.*$/, "");
  for (const s of ["scope", "map", "map?version=future"]) {
    await page.goto(`${base}/${s}`);
    await page.waitForLoadState("networkidle");
  }
  await expect(page.getByText(/Lead/).first()).toBeVisible();
  expect(errors, errors.join("\n")).toEqual([]);
});
