import { expect, test } from "@playwright/test";

/**
 * Gate-report screenshots. Opt in with SCREENSHOTS=1 (and PHASE=n) so the
 * normal e2e run stays fast. Writes to docs/loopflow/screenshots/phase-<n>/.
 */
const on = process.env.SCREENSHOTS === "1";
const phase = process.env.PHASE ?? "1";
const dir = `docs/loopflow/screenshots/phase-${phase}`;

test.skip(!on, "screenshots only on demand");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = "nextjs-portal{display:none!important}";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
  });
});

test("home and stages", async ({ page }, info) => {
  const w = info.project.use.viewport?.width ?? 0;
  const shot = (name: string, full = false) => page.screenshot({ path: `${dir}/${name}-${w}.png`, fullPage: full });
  await page.goto("/flow");
  await page.waitForLoadState("networkidle");
  await shot("home");
  await page.getByRole("button", { name: "Explore Sample Map" }).first().click();
  await page.waitForURL(/\/flow\/[^/]+\/map/);
  const base = page.url().replace(/\/map.*$/, "");
  await page.goto(`${base}/scope`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("Map title")).toBeVisible();
  await shot("scope", true);
  await page.goto("/flow");
  await page.waitForLoadState("networkidle");
  await shot("home-recent", true);
  if (Number(phase) >= 2) {
    await page.goto(`${base}/map`);
    await page.waitForLoadState("networkidle");
    await shot("map", true);
    if (w >= 1024) {
      await page.getByRole("button", { name: /Engineering reviews manufacturability/ }).first().click();
      await page.waitForTimeout(300);
      await shot("map-step-panel");
    }
  }
  if (Number(phase) >= 3) {
    for (const s of ["analyze", "future", "summary"]) {
      await page.goto(`${base}/${s}`);
      await page.waitForLoadState("networkidle");
      await shot(s, true);
    }
  }
  if (Number(phase) >= 4) {
    await page.goto(`${base}/map?walk=1`);
    await page.waitForLoadState("networkidle");
    await shot("walk");
  }
});
