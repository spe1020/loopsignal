import { orderedSteps, stepTouchMin, stepWaitMin } from "./metrics";
import type { ProcessMap, VersionKind } from "./schema";

function cell(v: unknown): string {
  const s = v === undefined || v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Steps table, one row per step, minutes throughout. */
export function stepsCsv(map: ProcessMap, kind: VersionKind = "current"): string {
  const v = kind === "current" ? map.versions.current : map.versions.future;
  if (!v) return "";
  const lanes = new Map(map.lanes.map((l) => [l.id, l.name]));
  const pain = new Map<string, number>();
  for (const p of v.painPoints) pain.set(p.stepId, (pain.get(p.stepId) ?? 0) + 1);
  const header = ["order", "step", "type", "lane", "wait_before_min", "cycle_time_min", "wait_min", "touch_min", "value_class", "time_source", "system", "trigger", "batch_size", "first_pass_yield", "pain_points", "observations"];
  const rows = orderedSteps(v).map((s) => [
    s.order + 1,
    s.name,
    s.type,
    lanes.get(s.laneId) ?? "",
    s.waitBeforeMin ?? "",
    s.cycleTimeMin ?? "",
    stepWaitMin(s),
    stepTouchMin(s),
    s.valueClass,
    s.timeSource,
    s.system ?? "",
    s.trigger ?? "",
    s.batchSize ?? "",
    s.firstPassYield ?? "",
    pain.get(s.id) ?? 0,
    s.observations.length,
  ]);
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}
