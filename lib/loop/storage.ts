import { createStore as createIdbStore, del, entries, get, set } from "idb-keyval";

/**
 * Local-only document store shared by every Loop tool. IndexedDB first,
 * localStorage second, memory last. One store per tool, keyed by id.
 */

export type BackendKind = "indexeddb" | "localstorage" | "memory";
export type SaveReceipt = { kind: BackendKind; durable: boolean };


type Backend<T> = {
  kind: BackendKind;
  get(id: string): Promise<T | undefined>;
  set(doc: T): Promise<void>;
  del(id: string): Promise<void>;
  all(): Promise<T[]>;
};

export type StoreConfig<T extends { id: string; updatedAt: string }> = {
  /** IndexedDB database name, e.g. "loopsolve". */
  dbName: string;
  /** IndexedDB object store name, e.g. "investigations". */
  storeName: string;
  /** localStorage key prefix, e.g. "loopsolve:inv:". */
  lsPrefix: string;
  /** Validate a raw record; return undefined to skip it. */
  parse: (raw: unknown) => T | undefined;
};

export type DocumentStore<T extends { id: string; updatedAt: string }> = {
  kind(): Promise<BackendKind>;
  load(id: string): Promise<T | undefined>;
  save(doc: T): Promise<SaveReceipt>;
  remove(id: string): Promise<void>;
  /** Sorted by updatedAt, newest first. */
  list(): Promise<T[]>;
  /** Test seam. */
  __setBackendForTests(kind: "memory" | "localstorage" | null): void;
};

export function createDocumentStore<T extends { id: string; updatedAt: string }>(config: StoreConfig<T>): DocumentStore<T> {
  const memory = new Map<string, T>();
  let backend: Backend<T> | null = null;

  function localBackend(): Backend<T> {
    return {
      kind: "localstorage",
      async get(id) {
        const raw = window.localStorage.getItem(config.lsPrefix + id);
        if (!raw) return undefined;
        try {
          return config.parse(JSON.parse(raw));
        } catch {
          return undefined; // corrupt entry
        }
      },
      async set(doc) {
        window.localStorage.setItem(config.lsPrefix + doc.id, JSON.stringify(doc));
      },
      async del(id) {
        window.localStorage.removeItem(config.lsPrefix + id);
      },
      async all() {
        const out: T[] = [];
        for (let i = 0; i < window.localStorage.length; i += 1) {
          const key = window.localStorage.key(i);
          if (!key?.startsWith(config.lsPrefix)) continue;
          const raw = window.localStorage.getItem(key);
          if (!raw) continue;
          try {
            const doc = config.parse(JSON.parse(raw));
            if (doc) out.push(doc);
          } catch {
            // skip corrupt entry
          }
        }
        return out;
      },
    };
  }

  function memoryBackend(): Backend<T> {
    return {
      kind: "memory",
      async get(id) {
        return memory.get(id);
      },
      async set(doc) {
        memory.set(doc.id, doc);
      },
      async del(id) {
        memory.delete(id);
      },
      async all() {
        return [...memory.values()];
      },
    };
  }

  function idbBackend(): Backend<T> {
    const store = createIdbStore(config.dbName, config.storeName);
    return {
      kind: "indexeddb",
      async get(id) {
        return config.parse(await get(id, store));
      },
      async set(doc) {
        await set(doc.id, doc, store);
      },
      async del(id) {
        await del(id, store);
      },
      async all() {
        const rows = await entries<string, unknown>(store);
        return rows.map(([, v]) => config.parse(v)).filter((v): v is T => Boolean(v));
      },
    };
  }

  async function resolve(): Promise<Backend<T>> {
    if (backend) return backend;
    if (typeof window === "undefined") {
      backend = memoryBackend();
      return backend;
    }
    if (typeof indexedDB !== "undefined") {
      try {
        const idb = idbBackend();
        await idb.all();
        backend = idb;
        return backend;
      } catch {
        // fall through
      }
    }
    try {
      window.localStorage.getItem(`${config.dbName}:probe`);
      backend = localBackend();
    } catch {
      backend = memoryBackend();
    }
    return backend;
  }

  return {
    async kind() {
      return (await resolve()).kind;
    },
    async load(id) {
      return (await resolve()).get(id);
    },
    async save(doc) {
      const target = await resolve();
      await target.set(doc); // Never downgrade a failed write to a success in memory.
      return { kind: target.kind, durable: target.kind !== "memory" };
    },
    async remove(id) {
      return (await resolve()).del(id);
    },
    async list() {
      const all = await (await resolve()).all();
      return all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    __setBackendForTests(kind) {
      backend = kind === "memory" ? memoryBackend() : kind === "localstorage" ? localBackend() : null;
      memory.clear();
    },
  };
}

/**
 * Sequential per browser and per year: PREFIX-2026-001, PREFIX-2026-002 …
 * Falls back to a random number when localStorage is unavailable.
 */
export function nextSequenceNumber(seqKey: string, prefix: string, now = new Date()): string {
  const year = now.getFullYear();
  let seq = 1;
  try {
    const raw = window.localStorage.getItem(seqKey);
    if (raw) {
      const parsed = JSON.parse(raw) as { year: number; seq: number };
      if (parsed.year === year) seq = parsed.seq + 1;
    }
    window.localStorage.setItem(seqKey, JSON.stringify({ year, seq }));
  } catch {
    seq = Math.floor(Math.random() * 900) + 100;
  }
  return `${prefix}-${year}-${String(seq).padStart(3, "0")}`;
}
