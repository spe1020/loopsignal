import { normalizeClosure } from "@/lib/solve/status";
import { createDocumentStore } from "@/lib/loop/storage";
import { createDemo, DemoSchema, type Demo } from "./demo";

// No writes to loopsolve/loopflow or their sequence counters, including replay.
export const demoStore = createDocumentStore<Demo>({
  dbName: "loopsignal-fictional-preview",
  storeName: "demo",
  lsPrefix: "loopsignal:fictional-preview:",
  parse: (raw) => {
    const r = DemoSchema.safeParse(raw);
    return r.success
      ? { ...r.data, investigation: normalizeClosure(r.data.investigation) }
      : undefined;
  },
});
export async function loadDemo() {
  const saved = await demoStore.load("manufacturing-preview");
  if (saved) return saved;
  return createDemo();
}
