import { beforeEach, describe, expect, it, vi } from "vitest";
import { indexedDB } from "fake-indexeddb";
import { createDocumentStore } from "../storage";
import { createSaveQueue } from "../saveQueue";

type Doc = { id: string; updatedAt: string; text: string };
const rows = new Map<string, string>();
const localStorage = {
  getItem: (key: string) => rows.get(key) ?? null,
  setItem: (key: string, value: string) => {
    rows.set(key, value);
  },
  removeItem: (key: string) => {
    rows.delete(key);
  },
  key: (i: number) => [...rows.keys()][i] ?? null,
  get length() {
    return rows.size;
  },
};
const config = {
  dbName: "storage-test",
  storeName: "documents",
  lsPrefix: "test:",
  parse: (raw: unknown) =>
    raw && typeof raw === "object" && "id" in raw ? (raw as Doc) : undefined,
};
const doc = {
  id: "user-document",
  updatedAt: "2026-09-07",
  text: "Preserve this",
};
beforeEach(() => {
  rows.clear();
  vi.unstubAllGlobals();
  vi.stubGlobal("window", { localStorage });
  vi.stubGlobal("indexedDB", indexedDB);
});

describe("honest local persistence", () => {
  it("reports IndexedDB durability and reloads through a new adapter", async () => {
    const store = createDocumentStore(config);
    expect(await store.save(doc)).toEqual({ kind: "indexeddb", durable: true });
    expect(await createDocumentStore(config).load(doc.id)).toEqual(doc);
  });
  it("preserves localStorage keys and only removes its named document", async () => {
    const store = createDocumentStore(config);
    store.__setBackendForTests("localstorage");
    rows.set("loopsolve:inv:original", "original bytes");
    expect(await store.save(doc)).toEqual({
      kind: "localstorage",
      durable: true,
    });
    await store.remove(doc.id);
    expect(rows.get("loopsolve:inv:original")).toBe("original bytes");
  });
  it("temporary memory is a successful write but never a durable receipt", async () => {
    const store = createDocumentStore(config);
    store.__setBackendForTests("memory");
    expect(await store.save(doc)).toEqual({ kind: "memory", durable: false });
    expect(await store.load(doc.id)).toEqual(doc);
    const fresh = createDocumentStore(config);
    fresh.__setBackendForTests("memory");
    expect(await fresh.load(doc.id)).toBeUndefined();
  });
  it("write failures propagate, preserve the last stored document, and never fall back silently", async () => {
    const store = createDocumentStore(config);
    store.__setBackendForTests("localstorage");
    await store.save(doc);
    vi.stubGlobal("window", {
      localStorage: {
        ...localStorage,
        setItem: () => {
          throw new Error("Quota exceeded");
        },
      },
    });
    await expect(store.save({ ...doc, text: "Unsaved edits" })).rejects.toThrow(
      "Quota exceeded",
    );
    expect(await store.kind()).toBe("localstorage");
    expect(await store.load(doc.id)).toEqual(doc);
  });
  it("serializes writes and continues after a rejected write", async () => {
    const completed: string[] = [];
    let release!: () => void;
    const first = new Promise<void>((resolve) => {
      release = resolve;
    });
    const save = createSaveQueue(async (text: string) => {
      if (text === "old") await first;
      if (text === "fail") throw new Error("failure");
      completed.push(text);
      return text;
    });
    const old = save("old");
    const latest = save("new");
    await Promise.resolve();
    expect(completed).toEqual([]);
    release();
    await Promise.all([old, latest]);
    expect(completed).toEqual(["old", "new"]);
    await expect(save("fail")).rejects.toThrow();
    await expect(save("retry")).resolves.toBe("retry");
  });
});
