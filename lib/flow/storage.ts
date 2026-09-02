import { createDocumentStore, nextSequenceNumber } from "@/lib/loop/storage";
import type { ProcessMap } from "./schema";
import { ProcessMapSchema } from "./schema";

const SEQ_KEY = "loopflow:map-seq";

const store = createDocumentStore<ProcessMap>({
  dbName: "loopflow",
  storeName: "maps",
  lsPrefix: "loopflow:map:",
  parse(raw) {
    const r = ProcessMapSchema.safeParse(raw);
    return r.success ? r.data : undefined;
  },
});

/** Test seam. */
export function __setBackendForTests(kind: "memory" | "localstorage" | null) {
  store.__setBackendForTests(kind);
}

export const storageKind = () => store.kind();
export const loadMap = (id: string) => store.load(id);
export const saveMap = (map: ProcessMap) => store.save(map);
export const deleteMap = (id: string) => store.remove(id);
export const listMaps = () => store.list();

/** Sequential per browser: MAP-2026-001, MAP-2026-002 … */
export function nextMapNumber(now = new Date()): string {
  return nextSequenceNumber(SEQ_KEY, "MAP", now);
}
