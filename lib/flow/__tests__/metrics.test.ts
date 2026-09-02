import { describe, expect, it } from "vitest";
import { computeMetrics, metricsDelta } from "../metrics";
import { createMap, makeLane, makeStep, normalizeVersion, reduce } from "../reducer";
import { buildSampleMap } from "../sample";
import type { Edge, MapVersion } from "../schema";
import { DAY_MIN, HOUR_MIN, formatMinutes, parseTime } from "../time";

function fixture() {
  const at = "2026-01-01T00:00:00.000Z";
  const a = makeLane("A", "role", 0, at);
  const b = makeLane("B", "department", 1, at);
  const s = (laneId: string, order: number, p: Parameters<typeof makeStep>[0] extends infer T ? Partial<T> : never) => makeStep({ laneId, order, ...p }, at);
  const steps = [
    s(a.id, 0, { type: "start", name: "Start" }),
    s(a.id, 1, { name: "One", cycleTimeMin: 10, valueClass: "va" }),
    s(b.id, 2, { type: "decision", name: "OK?", cycleTimeMin: 5, waitBeforeMin: 60, valueClass: "nnva" }),
    s(b.id, 3, { name: "Two", cycleTimeMin: 20, waitBeforeMin: 30, valueClass: "nva" }),
    s(a.id, 4, { type: "wait", name: "Queue", cycleTimeMin: 120 }),
    s(a.id, 5, { name: "Three", valueClass: "va" }), // unknown time
    s(a.id, 6, { type: "end", name: "End" }),
  ];
  const edge = (from: number, to: number, label: string): Edge => ({ id: `e${from}${to}`, createdAt: at, updatedAt: at, fromStepId: steps[from].id, toStepId: steps[to].id, label, isPrimary: false });
  const version: MapVersion = normalizeVersion({ kind: "current", steps, edges: [edge(2, 5, "Skip"), edge(3, 1, "Rework")], painPoints: [], rationale: {} }, at);
  return { lanes: [a, b], version, steps, a, b };
}

describe("metrics", () => {
  it("computes lead, touch, wait, PCE, value split, handoffs, loops", () => {
    const { lanes, version, steps } = fixture();
    const m = computeMetrics(version, lanes);
    expect(m.touchTimeMin).toBe(10 + 5 + 20);
    expect(m.waitTimeMin).toBe(60 + 30 + 120);
    expect(m.leadTimeMin).toBe(245);
    expect(m.pce).toBeCloseTo(35 / 245);
    expect(m.value.va.min).toBe(10);
    expect(m.value.nnva.min).toBe(5);
    // nva: step Two 20 + wait step 120 + queue time 90
    expect(m.value.nva.min).toBe(20 + 120 + 90);
    expect(m.handoffCount).toBe(2); // A→B at decision, B→A at Queue
    expect(m.handoffs[0].fromLaneId).toBe(lanes[0].id);
    expect(m.handoffs[0].waitAfterMin).toBe(60);
    expect(m.reworkLoops).toHaveLength(1);
    expect(m.skipBranches).toHaveLength(1);
    expect(m.longestWait?.stepId).toBe(steps[4].id);
    expect(m.longestStep?.stepId).toBe(steps[3].id);
    expect(m.unknownTimeStepIds).toEqual([steps[5].id]);
    expect(m.unclassifiedStepIds).toEqual([]);
    expect(m.lanes.find((l) => l.laneId === lanes[1].id)?.touchMin).toBe(25);
  });

  it("sample map has the promised shape", () => {
    const map = buildSampleMap("MAP-2026-001");
    const cur = computeMetrics(map.versions.current, map.lanes);
    const fut = computeMetrics(map.versions.future!, map.lanes);
    expect(map.lanes).toHaveLength(5);
    expect(map.versions.current.steps.length).toBeGreaterThanOrEqual(14);
    expect(map.versions.current.steps.filter((s) => s.type === "decision")).toHaveLength(2);
    expect(cur.reworkLoops).toHaveLength(1);
    expect(cur.leadTimeMin).toBeGreaterThan(8.5 * DAY_MIN);
    expect(cur.leadTimeMin).toBeLessThan(10 * DAY_MIN);
    expect(fut.leadTimeMin).toBeGreaterThan(2 * DAY_MIN);
    expect(fut.leadTimeMin).toBeLessThan(3.5 * DAY_MIN);
    expect(cur.handoffCount - fut.handoffCount).toBe(2);
    expect(map.versions.current.painPoints).toHaveLength(3);
    const delta = metricsDelta(cur, fut);
    expect(delta.find((d) => d.key === "lead")?.change).toBeLessThan(0);
    expect(delta.find((d) => d.key === "handoffs")?.change).toBe(-2);
  });

  it("stopwatch observations set the median and mark the step observed", () => {
    const at = "2026-01-01T00:00:00.000Z";
    let map = createMap({ mapNumber: "MAP-1" });
    const lane = makeLane("A", "role", 0, at);
    map = reduce(map, { type: "add_lane", lane });
    const step = makeStep({ laneId: lane.id, name: "X" }, at);
    map = reduce(map, { type: "add_step", version: "current", step });
    for (const d of [30, 10, 20]) map = reduce(map, { type: "add_observation", version: "current", stepId: step.id, observation: { id: `o${d}`, at, durationMin: d } });
    const s = map.versions.current.steps[0];
    expect(s.cycleTimeMin).toBe(20);
    expect(s.timeSource).toBe("observed");
  });

  it("time helpers parse and format", () => {
    expect(parseTime("30", "minutes")).toBe(30);
    expect(parseTime("2", "hours")).toBe(120);
    expect(parseTime("1.5", "days")).toBe(1.5 * DAY_MIN);
    expect(parseTime("2d 4h", "minutes")).toBe(2 * DAY_MIN + 4 * HOUR_MIN);
    expect(parseTime("", "minutes")).toBeUndefined();
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(135)).toBe("2 h 15 min");
    expect(formatMinutes(2 * DAY_MIN + 4 * HOUR_MIN)).toBe("2 d 4 h");
    expect(formatMinutes(undefined)).toBe("?");
  });
});
