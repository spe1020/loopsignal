import { describe, expect, it } from "vitest";
import { diffVersions } from "../diff";
import { createMap, makeLane, makeStep, reduce } from "../reducer";
import { buildSampleMap } from "../sample";

describe("fork and diff", () => {
  it("fork needs three steps, copies with new ids, and maps origins", () => {
    const at = "2026-01-01T00:00:00.000Z";
    let map = createMap({ mapNumber: "MAP-1" });
    const lane = makeLane("A", "role", 0, at);
    map = reduce(map, { type: "add_lane", lane });
    map = reduce(map, { type: "add_step", version: "current", step: makeStep({ laneId: lane.id, name: "one" }, at) });
    map = reduce(map, { type: "add_step", version: "current", step: makeStep({ laneId: lane.id, name: "two" }, at) });
    map = reduce(map, { type: "fork_future" });
    expect(map.versions.future).toBeUndefined();
    map = reduce(map, { type: "add_step", version: "current", step: makeStep({ laneId: lane.id, name: "three", cycleTimeMin: 5 }, at) });
    map = reduce(map, { type: "fork_future" });
    const f = map.versions.future!;
    expect(f.steps).toHaveLength(3);
    expect(f.steps.every((s) => !map.versions.current.steps.some((c) => c.id === s.id))).toBe(true);
    expect(Object.keys(f.forkedFromStepIds ?? {})).toHaveLength(3);
    expect(map.history.at(-1)?.type).toBe("future_forked");
    expect(map.status).toBe("future_drafted");

    // unchanged fork diffs as no changes
    const d0 = diffVersions(map.versions.current, f);
    expect(d0.changeCount).toBe(0);

    // remove one, change one, add one
    const [f1, f2] = [...f.steps].sort((a, b) => a.order - b.order);
    map = reduce(map, { type: "remove_step", version: "future", id: f1.id });
    map = reduce(map, { type: "update_step", version: "future", id: f2.id, patch: { cycleTimeMin: 99 } });
    map = reduce(map, { type: "add_step", version: "future", step: makeStep({ laneId: lane.id, name: "new" }, at), afterStepId: f2.id });
    const d1 = diffVersions(map.versions.current, map.versions.future!);
    expect(d1.removed).toHaveLength(1);
    expect(d1.changed).toHaveLength(1);
    expect(d1.changed[0].changes[0].field).toBe("cycleTimeMin");
    expect(d1.added).toHaveLength(1);
    expect(d1.missingRationale).toHaveLength(3);

    map = reduce(map, { type: "set_rationale", key: d1.removed[0].key, rationale: { text: "gone" } });
    map = reduce(map, { type: "set_rationale", key: d1.changed[0].key, rationale: { text: "faster" } });
    map = reduce(map, { type: "set_rationale", key: d1.added[0].key, rationale: { text: "needed" } });
    const d2 = diffVersions(map.versions.current, map.versions.future!);
    expect(d2.missingRationale).toHaveLength(0);
    expect(map.status).toBe("complete");
  });

  it("sample future state has a rationale on every change", () => {
    const map = buildSampleMap("MAP-2026-001");
    const d = diffVersions(map.versions.current, map.versions.future!);
    expect(d.removed.length).toBeGreaterThanOrEqual(5);
    expect(d.changed.length).toBeGreaterThanOrEqual(6);
    expect(d.missingRationale).toEqual([]);
    expect(map.status).toBe("complete");
  });

  it("removing a step keeps the primary chain and drops dangling branches", () => {
    const map = buildSampleMap("MAP-2026-001");
    const cur = map.versions.current;
    const decision = cur.steps.find((s) => s.name === "Needs engineering review?")!;
    const next = reduce(map, { type: "remove_step", version: "current", id: decision.id });
    const v = next.versions.current;
    const orders = [...v.steps].sort((a, b) => a.order - b.order).map((s) => s.order);
    expect(orders).toEqual(orders.map((_, i) => i));
    expect(v.edges.filter((e) => e.isPrimary)).toHaveLength(v.steps.length - 1);
    expect(v.edges.some((e) => e.fromStepId === decision.id || e.toStepId === decision.id)).toBe(false);
  });
});
