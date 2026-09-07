import { expect, test, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";

async function view(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Workspace views" })
    .getByRole("button", { name })
    .click();
}
async function review(page: Page, title: string) {
  const detail = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: title }) });
  await detail.locator("summary").click();
  await detail.getByRole("checkbox").check();
}
async function completeAction(page: Page) {
  await review(page, "Baseline inspection log");
  await review(page, "Fixture check and controlled trial");
  await review(page, "Material certificate and retained sample");
  await page
    .getByRole("button", { name: "Accept the supported cause" })
    .click();
  await view(page, "Actions");
  await page
    .getByRole("button", { name: "Connect this countermeasure" })
    .click();
  await page
    .getByLabel("Fictional action owner")
    .selectOption({ label: "Maya Chen · Manufacturing engineering" });
  await review(page, "Countermeasure completion record");
  await page
    .getByRole("button", { name: "Confirm demo action complete" })
    .click();
}
async function saved(page: Page) {
  await expect(
    page.getByText("Saved in this browser", { exact: true }),
  ).toBeVisible();
}
async function screenshot(page: Page, name: string, width: number) {
  if (![375, 768, 1440].includes(width)) return;
  await mkdir("docs/product-preview/screenshots", { recursive: true });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `docs/product-preview/screenshots/${name}-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      document.head.appendChild(style);
    });
  });
});

test("software homepage and full evidence → action → verification → lesson journey", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const width = page.viewportSize()!.width;
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Turn daily problems into improvements that last.",
  );
  await screenshot(page, "home", width);
  await page.getByRole("link", { name: "Try a live example" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Oversized holes on the bracket line" }),
  ).toBeVisible();
  await saved(page);
  await screenshot(page, "problem", width);
  await expect(page.getByTestId("milestone-2")).toHaveAttribute(
    "data-complete",
    "false",
  );
  await view(page, "Lessons");
  await expect(
    page.getByRole("button", { name: "Approve and save lesson" }),
  ).toBeDisabled();
  await view(page, "Results");
  await page.getByLabel("Your demo assessment").selectOption("effective");
  await expect(
    page.getByRole("button", { name: "Approve demo verification" }),
  ).toBeDisabled();
  await view(page, "Problems");
  await completeAction(page);
  await expect(page.getByTestId("action-status")).toHaveText("Complete");
  await expect(page.getByTestId("shared-action-status")).toHaveText("Complete");
  await expect(page.getByTestId("milestone-2")).toHaveAttribute(
    "data-complete",
    "false",
  );
  await saved(page);
  await screenshot(page, "action", width);
  await view(page, "Results");
  await expect(
    page.getByRole("button", { name: "Approve demo verification" }),
  ).toBeDisabled();
  await review(page, "Three-lot follow-up inspection");
  await page
    .getByLabel("Your demo assessment")
    .selectOption("partially_effective");
  await page.getByRole("button", { name: "Record review · keep open" }).click();
  await expect(page.getByTestId("milestone-2")).toHaveAttribute(
    "data-complete",
    "false",
  );
  await page.getByLabel("Your demo assessment").selectOption("effective");
  await page.getByRole("button", { name: "Approve demo verification" }).click();
  await expect(page.getByTestId("problem-status")).toHaveText(
    "Verified improvement",
  );
  await expect(page.getByTestId("milestone-2")).toHaveAttribute(
    "data-complete",
    "true",
  );
  await saved(page);
  await screenshot(page, "result", width);
  await view(page, "Lessons");
  await page.getByRole("button", { name: "Approve and save lesson" }).click();
  await expect(page.getByTestId("milestone-3")).toHaveAttribute(
    "data-complete",
    "true",
  );
  await saved(page);
  await screenshot(page, "lesson", width);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export demo" }).click();
  const file = await download;
  const exported = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(exported.mode).toBe("fictional-demo");
  expect(exported.investigation.actions[0].status).toBe("complete");
  expect(exported.investigation.lessons[0].sourceVerificationId).toBe(
    exported.investigation.verifications.at(-1).id,
  );
  await page.reload();
  await expect(page.getByTestId("problem-status")).toHaveText(
    "Verified improvement",
  );
  await expect(page.getByTestId("shared-action-status")).toHaveText("Complete");
  await view(page, "Lessons");
  await page.getByRole("button", { name: "Reopen for a new concern" }).click();
  await expect(page.getByTestId("problem-status")).toHaveText(
    "Reopened · review needed",
  );
  await expect(page.getByTestId("milestone-2")).toHaveAttribute(
    "data-complete",
    "false",
  );
  await expect(page.getByTestId("milestone-3")).toHaveAttribute(
    "data-complete",
    "false",
  );
  await expect(
    page.getByText("Retained · needs re-review", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("demo replay preserves actual user investigations and process maps byte for byte", async ({
  page,
}) => {
  await page.goto("/solve");
  await page
    .getByRole("button", { name: "New Investigation", exact: true })
    .first()
    .click();
  await page.waitForURL(/\/problem$/);
  await page
    .getByLabel("What happened?", { exact: true })
    .fill("Original user document: preserve every word.");
  await expect(
    page
      .getByText("Saved locally", { exact: false })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  // Capture both stores after creation through the actual tools.
  await page.goto("/flow");
  await page
    .getByRole("button", { name: "New Map", exact: true })
    .first()
    .click();
  await page.waitForURL(/\/scope$/);
  async function readStores() {
    return page.evaluate(async () => {
      async function rows(dbName: string, storeName: string) {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open(dbName);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        try {
          return await new Promise<unknown[]>((resolve, reject) => {
            const req = db
              .transaction(storeName)
              .objectStore(storeName)
              .getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
        } finally {
          db.close();
        }
      }
      return {
        investigations: await rows("loopsolve", "investigations"),
        maps: await rows("loopflow", "maps"),
        solveSequence: localStorage.getItem("loopsolve:rca-seq"),
        flowSequence: localStorage.getItem("loopflow:map-seq"),
      };
    });
  }
  const before = await readStores();
  expect(before.investigations).toHaveLength(1);
  expect(before.maps).toHaveLength(1);
  await page.goto("/workspace");
  await saved(page);
  await review(page, "Baseline inspection log");
  await saved(page);
  await page.getByRole("button", { name: "Replay demo" }).click();
  await page.getByRole("button", { name: "Restart fictional example" }).click();
  await saved(page);
  expect(await readStores()).toEqual(before);
  await expect(page.getByTestId("milestone-2")).toHaveAttribute(
    "data-complete",
    "false",
  );
});

test("localStorage failure keeps dirty edits exportable and a retry persists them", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { value: undefined });
  });
  await page.goto("/workspace");
  await saved(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Object.assign(window, {
      restoreWrites: () => {
        Storage.prototype.setItem = original;
      },
    });
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("loopsignal:fictional-preview:"))
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await review(page, "Baseline inspection log");
  await expect(
    page.getByRole("alert").filter({ hasText: "Save failed" }),
  ).toBeVisible();
  await expect(
    page.getByText("Unsaved changes · keep this page open"),
  ).toBeVisible();
  await expect(
    page.getByText("Saved in this browser", { exact: true }),
  ).not.toBeVisible();
  await page.getByRole("link", { name: "Join the pilot" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByText("Navigation paused because these edits are not saved.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export recovery JSON" }).click();
  const file = await download;
  const snapshot = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(snapshot.reviewedEvidenceIds).toContain("evidence-baseline");
  await page.evaluate(() =>
    (window as unknown as { restoreWrites: () => void }).restoreWrites(),
  );
  await page.getByRole("button", { name: "Retry save" }).click();
  await saved(page);
  await page.reload();
  await expect(page.getByText("Reviewed ✓", { exact: true })).toHaveCount(1);
});

test("temporary memory never says saved and exports the current snapshot", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { value: undefined });
    Object.defineProperty(window, "localStorage", {
      get: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });
  await page.goto("/workspace");
  await expect(
    page.getByRole("alert").filter({ hasText: "Temporary memory only" }),
  ).toBeVisible();
  await expect(
    page.getByText("Saved in this browser", { exact: true }),
  ).not.toBeVisible();
  await review(page, "Baseline inspection log");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export demo" }).click();
  const snapshot = JSON.parse(
    await readFile((await (await download).path())!, "utf8"),
  );
  expect(snapshot.reviewedEvidenceIds).toContain("evidence-baseline");
});

test("pilot validation, error, and success paths use mocked delivery only", async ({
  page,
}) => {
  let deliveries = 0;
  let succeed = false;
  await page.route("https://formspree.io/**", async (route) => {
    deliveries++;
    expect(route.request().postDataJSON()._subject).toContain(
      "LoopSignal software pilot",
    );
    await route.fulfill({
      status: succeed ? 200 : 500,
      contentType: "application/json",
      body: JSON.stringify({ ok: succeed }),
    });
  });
  await page.goto("/pilot");
  await page
    .getByRole("button", { name: "Join the pilot", exact: true })
    .click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  expect(deliveries).toBe(0);
  await page.getByLabel("Name", { exact: true }).fill("Demo Reviewer");
  await page
    .getByLabel("Company", { exact: true })
    .fill("Fictional Manufacturing");
  await page.getByLabel("Role", { exact: true }).fill("Quality lead");
  await page
    .getByLabel("Email or phone", { exact: true })
    .fill("preview@example.com");
  await page
    .getByRole("button", { name: "Join the pilot", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "We couldn’t send this." }),
  ).toBeVisible();
  succeed = true;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: /your pilot interest has been received/,
    }),
  ).toBeVisible();
  expect(deliveries).toBe(2);
});

test("keyboard and reduced-motion access to evidence and navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/workspace");
  await saved(page);
  const summary = page.locator("summary", {
    hasText: "Baseline inspection log",
  });
  await summary.focus();
  await page.keyboard.press("Enter");
  const checkbox = page
    .locator("details")
    .filter({ has: summary })
    .getByRole("checkbox");
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked();
  const actions = page
    .getByRole("navigation", { name: "Workspace views" })
    .getByRole("button", { name: "Actions" });
  await actions.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A countermeasure with a cause.",
  );
});
