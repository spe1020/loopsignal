import { createStore, del, entries, get, set } from "idb-keyval";
import type { Investigation } from "./schema";
import { InvestigationSchema } from "./schema";

const LS_PREFIX = "loopsolve:inv:";
const SEQ_KEY = "loopsolve:rca-seq";

type Backend = {
  kind: "indexeddb" | "localstorage" | "memory";
  get(id: string): Promise<Investigation | undefined>;
  set(inv: Investigation): Promise<void>;
  del(id: string): Promise<void>;
  all(): Promise<Investigation[]>;
};

const memory = new Map<string, Investigation>();

function parse(raw: unknown): Investigation | undefined {
  const r = InvestigationSchema.safeParse(raw);
  return r.success ? r.data : undefined;
}

function localBackend(): Backend {
  return {
    kind: "localstorage",
    async get(id) {
      const raw = window.localStorage.getItem(LS_PREFIX + id);
      if (!raw) return undefined;
      try {
        return parse(JSON.parse(raw));
      } catch {
        return undefined; // corrupt entry
      }
    },
    async set(inv) {
      window.localStorage.setItem(LS_PREFIX + inv.id, JSON.stringify(inv));
    },
    async del(id) {
      window.localStorage.removeItem(LS_PREFIX + id);
    },
    async all() {
      const out: Investigation[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key?.startsWith(LS_PREFIX)) continue;
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        try {
          const inv = parse(JSON.parse(raw));
          if (inv) out.push(inv);
        } catch {
          // skip corrupt entry
        }
      }
      return out;
    },
  };
}

function memoryBackend(): Backend {
  return {
    kind: "memory",
    async get(id) {
      return memory.get(id);
    },
    async set(inv) {
      memory.set(inv.id, inv);
    },
    async del(id) {
      memory.delete(id);
    },
    async all() {
      return [...memory.values()];
    },
  };
}

function idbBackend(): Backend {
  const store = createStore("loopsolve", "investigations");
  return {
    kind: "indexeddb",
    async get(id) {
      return parse(await get(id, store));
    },
    async set(inv) {
      await set(inv.id, inv, store);
    },
    async del(id) {
      await del(id, store);
    },
    async all() {
      const rows = await entries<string, unknown>(store);
      return rows.map(([, v]) => parse(v)).filter((v): v is Investigation => Boolean(v));
    },
  };
}

let backend: Backend | null = null;

async function resolveBackend(): Promise<Backend> {
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
    window.localStorage.getItem("loopsolve:probe");
    backend = localBackend();
  } catch {
    backend = memoryBackend();
  }
  return backend;
}

/** Test seam. */
export function __setBackendForTests(kind: "memory" | "localstorage" | null) {
  backend = kind === "memory" ? memoryBackend() : kind === "localstorage" ? localBackend() : null;
  memory.clear();
}

export async function storageKind() {
  return (await resolveBackend()).kind;
}

export async function loadInvestigation(id: string) {
  return (await resolveBackend()).get(id);
}

export async function saveInvestigation(inv: Investigation) {
  return (await resolveBackend()).set(inv);
}

export async function deleteInvestigation(id: string) {
  return (await resolveBackend()).del(id);
}

export async function listInvestigations(): Promise<Investigation[]> {
  const all = await (await resolveBackend()).all();
  return all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/** Sequential per browser: RCA-2026-001, RCA-2026-002 … */
export function nextRcaNumber(now = new Date()): string {
  const year = now.getFullYear();
  let seq = 1;
  try {
    const raw = window.localStorage.getItem(SEQ_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { year: number; seq: number };
      if (parsed.year === year) seq = parsed.seq + 1;
    }
    window.localStorage.setItem(SEQ_KEY, JSON.stringify({ year, seq }));
  } catch {
    seq = Math.floor(Math.random() * 900) + 100;
  }
  return `RCA-${year}-${String(seq).padStart(3, "0")}`;
}
