import { createDocumentStore, nextSequenceNumber } from "@/lib/loop/storage";
import type { Investigation } from "./schema";
import { InvestigationSchema } from "./schema";

const SEQ_KEY = "loopsolve:rca-seq";

const store = createDocumentStore<Investigation>({
  dbName: "loopsolve",
  storeName: "investigations",
  lsPrefix: "loopsolve:inv:",
  parse(raw) {
    const r = InvestigationSchema.safeParse(raw);
    return r.success ? r.data : undefined;
  },
});

/** Test seam. */
export function __setBackendForTests(kind: "memory" | "localstorage" | null) {
  store.__setBackendForTests(kind);
}

export async function storageKind() {
  return store.kind();
}

export async function loadInvestigation(id: string) {
  return store.load(id);
}

export async function saveInvestigation(inv: Investigation) {
  return store.save(inv);
}

export async function deleteInvestigation(id: string) {
  return store.remove(id);
}

export async function listInvestigations(): Promise<Investigation[]> {
  return store.list();
}

/** Sequential per browser: RCA-2026-001, RCA-2026-002 … */
export function nextRcaNumber(now = new Date()): string {
  return nextSequenceNumber(SEQ_KEY, "RCA", now);
}
