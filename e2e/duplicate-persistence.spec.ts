import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const tools = [
  {
    route: "solve",
    create: "New Investigation",
    stage: "problem",
    field: "What happened?",
    prefix: "loopsolve:inv:",
    seq: "loopsolve:rca-seq",
  },
  {
    route: "flow",
    create: "New Map",
    stage: "scope",
    field: "Starts with",
    prefix: "loopflow:map:",
    seq: "loopflow:map-seq",
  },
] as const;
async function duplicate(page: Page) {
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Duplicate", exact: true }).click();
}
async function recovery(page: Page) {
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export recovery JSON", exact: true })
    .click();
  return JSON.parse(await readFile((await (await download).path())!, "utf8"));
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
for (const tool of tools) {
  test(`${tool.route}: failed source save blocks Duplicate and preserves recoverable edits`, async ({
    page,
  }) => {
    await page.addInitScript(() =>
      Object.defineProperty(window, "indexedDB", { value: undefined }),
    );
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/${tool.route}`);
    await page
      .getByRole("button", { name: tool.create, exact: true })
      .first()
      .click();
    await page.waitForURL(new RegExp(`/${tool.route}/[^/]+/${tool.stage}$`));
    const originalUrl = page.url();
    const id = new URL(originalUrl).pathname.split("/")[2];
    const key = tool.prefix + id;
    const before = await page.evaluate(
      ({ key, seq }) => ({
        doc: localStorage.getItem(key),
        sequence: localStorage.getItem(seq),
      }),
      { key, seq: tool.seq },
    );
    await page.evaluate((key) => {
      const original = Storage.prototype.setItem;
      Object.assign(window, {
        restoreWrites: () => {
          Storage.prototype.setItem = original;
        },
      });
      Storage.prototype.setItem = function (k, value) {
        if (k === key)
          throw new DOMException("Source write failed", "QuotaExceededError");
        return original.call(this, k, value); // A copy could still save: navigation must depend on the source receipt.
      };
    }, key);
    await page.getByLabel(tool.field).fill("Unsaved correction to preserve");
    await expect(
      page.getByRole("alert").filter({ hasText: "Save failed" }),
    ).toBeVisible();
    await duplicate(page);
    await expect(
      page.getByText("Duplicate paused", { exact: false }),
    ).toBeVisible();
    await expect(page).toHaveURL(originalUrl);
    expect(
      await page.evaluate(
        ({ key, seq }) => ({
          doc: localStorage.getItem(key),
          sequence: localStorage.getItem(seq),
        }),
        { key, seq: tool.seq },
      ),
    ).toEqual(before);
    expect(JSON.stringify(await recovery(page))).toContain(
      "Unsaved correction to preserve",
    );
    await page.evaluate(() =>
      (window as unknown as { restoreWrites: () => void }).restoreWrites(),
    );
    await page.getByRole("button", { name: "Retry save", exact: true }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Save failed" }),
    ).toHaveCount(0);
    await duplicate(page);
    await page.waitForURL((url) => url.href !== originalUrl);
    await expect(page.getByLabel(tool.field)).toHaveValue(
      "Unsaved correction to preserve",
    );
    await page.reload();
    await expect(page.getByLabel(tool.field)).toHaveValue(
      "Unsaved correction to preserve",
    );
    expect(
      await page.evaluate((key) => localStorage.getItem(key), key),
    ).toContain("Unsaved correction to preserve");
    expect(errors).toEqual([]);
  });
  test(`${tool.route}: a failed copy write stays in the current document without unhandled errors`, async ({
    page,
  }) => {
    await page.addInitScript(() =>
      Object.defineProperty(window, "indexedDB", { value: undefined }),
    );
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/${tool.route}`);
    await page
      .getByRole("button", { name: tool.create, exact: true })
      .first()
      .click();
    await page.waitForURL(new RegExp(`/${tool.route}/[^/]+/${tool.stage}$`));
    const originalUrl = page.url();
    const id = new URL(originalUrl).pathname.split("/")[2];
    await page.evaluate(
      ({ prefix, id }) => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key.startsWith(prefix) && key !== prefix + id)
            throw new DOMException("Copy quota", "QuotaExceededError");
          return original.call(this, key, value);
        };
      },
      { prefix: tool.prefix, id },
    );
    await duplicate(page);
    await expect(
      page.getByText("Could not save the duplicate", { exact: false }),
    ).toBeVisible();
    await expect(page).toHaveURL(originalUrl);
    expect(errors).toEqual([]);
  });
  test(`${tool.route}: memory-only writes never authorize Duplicate navigation`, async ({
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
    await page.goto(`/${tool.route}`);
    await page
      .getByRole("button", { name: tool.create, exact: true })
      .first()
      .click();
    await page.waitForURL(new RegExp(`/${tool.route}/[^/]+/${tool.stage}$`));
    const originalUrl = page.url();
    await page.getByLabel(tool.field).fill("Memory-only edit");
    await duplicate(page);
    await expect(
      page.getByText("Duplicate paused", { exact: false }),
    ).toBeVisible();
    await expect(page).toHaveURL(originalUrl);
    await expect(page.getByText("Saved locally", { exact: false })).toHaveCount(
      0,
    );
    expect(JSON.stringify(await recovery(page))).toContain("Memory-only edit");
  });
  test(`${tool.route}: Duplicate waits for a pending write and uses the newer saved snapshot`, async ({
    page,
  }) => {
    await page.goto(`/${tool.route}`);
    await page
      .getByRole("button", { name: tool.create, exact: true })
      .first()
      .click();
    await page.waitForURL(new RegExp(`/${tool.route}/[^/]+/${tool.stage}$`));
    const originalUrl = page.url();
    await page.evaluate(
      (dbName) => {
        const descriptor = Object.getOwnPropertyDescriptor(
          IDBTransaction.prototype,
          "oncomplete",
        )!;
        const pending: (() => void)[] = [];
        let hold = true;
        Object.assign(window, {
          pendingWrites: pending,
          releaseOneWrite: () => pending.shift()?.(),
          releaseWrites: () => {
            hold = false;
            pending.splice(0).forEach((done) => done());
          },
        });
        Object.defineProperty(IDBTransaction.prototype, "oncomplete", {
          ...descriptor,
          set(this: IDBTransaction, handler: ((event: Event) => void) | null) {
            descriptor.set!.call(
              this,
              handler &&
                ((event: Event) => {
                  const done = () => handler.call(this, event);
                  if (
                    hold &&
                    this.mode === "readwrite" &&
                    this.db.name === dbName
                  )
                    pending.push(done);
                  else done();
                }),
            );
          },
        });
      },
      tool.route === "solve" ? "loopsolve" : "loopflow",
    );
    await page.getByLabel(tool.field).fill("First snapshot");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { pendingWrites: unknown[] }).pendingWrites
              .length,
        ),
      )
      .toBeGreaterThan(0);
    await duplicate(page);
    await page.getByLabel(tool.field).fill("Newer edit while saving");
    await expect(page).toHaveURL(originalUrl);
    // Release the old source, then the newer source; hold the copy's acknowledgement.
    for (let i = 0; i < 2; i += 1) {
      await page.evaluate(() =>
        (
          window as unknown as { releaseOneWrite: () => void }
        ).releaseOneWrite(),
      );
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as unknown as { pendingWrites: unknown[] }).pendingWrites
                .length,
          ),
        )
        .toBeGreaterThan(0);
    }
    await page.getByLabel(tool.field).fill("Another edit while the copy saves");
    await page.evaluate(() =>
      (window as unknown as { releaseOneWrite: () => void }).releaseOneWrite(),
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { pendingWrites: unknown[] }).pendingWrites
              .length,
        ),
      )
      .toBeGreaterThan(0);
    await page.evaluate(() =>
      (window as unknown as { releaseWrites: () => void }).releaseWrites(),
    );
    await page.waitForURL((url) => url.href !== originalUrl);
    await expect(page.getByLabel(tool.field)).toHaveValue(
      "Newer edit while saving",
    );
    await page.reload();
    await expect(page.getByLabel(tool.field)).toHaveValue(
      "Newer edit while saving",
    );
    await page.goto(originalUrl);
    await expect(page.getByLabel(tool.field)).toHaveValue(
      "Another edit while the copy saves",
    );
  });
}
