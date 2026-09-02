import { describe, expect, it } from "vitest";
import { completionPercent } from "../completion";
import { createMap, makeLane, makeStep, reduce } from "../reducer";
import { softFindings } from "../rules";
import { buildSampleMap } from "../sample";
import { deriveStatus } from "../status";

describe("rules", () => {
  it("coaches on boundaries, lanes, unknown time, unclassified, no waiting, missing triggers", () => {
    const at = "2026-01-01T00:00:00.000Z";
    let map = createMap({ mapNumber: "MAP-1" });
    let codes = softFindings(map).map((f) => f.code);
    expect(codes).toContain("no_boundaries");
    expect(codes).toContain("no_lanes");
    const a = makeLane("A", "role", 0, at);
    const b = makeLane("B", "role", 1, at);
    map = reduce(map, { type: "add_lanes", lanes: [a, b] });
    map = reduce(map, { type: "set_scope", patch: { startsWith: "x", endsWith: "y" } });
    map = reduce(map, { type: "add_step", version: "current", step: makeStep({ laneId: a.id, name: "one", cycleTimeMin: 10, valueClass: "va" }, at) });
    map = reduce(map, { type: "add_step", version: "current", step: makeStep({ laneId: a.id, name: "two" }, at) });
    map = reduce(map, { type: "add_step", version: "current", step: makeStep({ laneId: b.id, name: "three", cycleTimeMin: 5, valueClass: "nva" }, at) });
    codes = softFindings(map).map((f) => f.code);
    expect(codes).not.toContain("no_boundaries");
    expect(codes).toContain("unknown_time");
    expect(codes).toContain("unclassified");
    expect(codes).toContain("no_waiting");
    expect(codes).toContain("handoff_no_trigger");
    expect(codes).toContain("nva_no_pain");
  });

  it("sample: biggest steps are estimates is not raised (observed), low PCE is", () => {
    const map = buildSampleMap("MAP-2026-001");
    const f = softFindings(map);
    const codes = f.map((x) => x.code);
    expect(codes).toContain("low_pce");
    expect(codes).toContain("handoff_no_trigger"); // engineering review has no trigger
    expect(codes).not.toContain("removed_no_rationale");
    expect(codes).not.toContain("future_not_faster");
  });

  it("future not faster and removed without rationale", () => {
    const map = buildSampleMap("MAP-2026-001");
    const fut = map.versions.future!;
    const step = fut.steps.find((s) => s.name.startsWith("Engineering reviews"))!;
    let next = reduce(map, { type: "update_step", version: "future", id: step.id, patch: { waitBeforeMin: 30 * 1440 } });
    next = reduce(next, { type: "clear_rationale", key: step.id });
    const codes = softFindings(next).map((x) => x.code);
    expect(codes).toContain("future_not_faster");
    expect(codes).toContain("change_no_rationale");
    expect(next.status).toBe("future_drafted");
  });
});

describe("status and completion", () => {
  it("walks draft → current_mapped → future_drafted → improving → complete", () => {
    const at = "2026-01-01T00:00:00.000Z";
    let map = createMap({ mapNumber: "MAP-1" });
    expect(deriveStatus(map)).toBe("draft");
    expect(completionPercent(map)).toBe(0);
    const lane = makeLane("A", "role", 0, at);
    map = reduce(map, { type: "add_lane", lane });
    map = reduce(map, { type: "add_step", version: "current", step: makeStep({ laneId: lane.id, type: "start", name: "s" }, at) });
    for (const n of ["a", "b", "c"]) map = reduce(map, { type: "add_step", version: "current", step: makeStep({ laneId: lane.id, name: n, cycleTimeMin: 1, valueClass: "va" }, at) });
    expect(map.status).toBe("draft");
    map = reduce(map, { type: "add_step", version: "current", step: makeStep({ laneId: lane.id, type: "end", name: "e" }, at) });
    expect(map.status).toBe("current_mapped");
    expect(map.history.some((h) => h.type === "current_mapped")).toBe(true);
    map = reduce(map, { type: "fork_future" });
    expect(map.status).toBe("future_drafted");
    map = reduce(map, { type: "link_investigation", link: { id: "l1", investigationId: "inv1", openedAt: at, lastKnownStatus: "draft" } });
    expect(map.status).toBe("improving");
    map = reduce(map, { type: "sync_investigation_status", investigationId: "inv1", status: "closed" });
    // a fork with no changes is not complete
    expect(map.status).toBe("future_drafted");
    const fs = map.versions.future!.steps[1];
    map = reduce(map, { type: "update_step", version: "future", id: fs.id, patch: { cycleTimeMin: 99 } });
    expect(map.status).toBe("future_drafted");
    map = reduce(map, { type: "set_rationale", key: fs.id, rationale: { text: "why" } });
    expect(map.status).toBe("complete");
  });

  it("completion percent weights", () => {
    const map = buildSampleMap("MAP-2026-001");
    expect(completionPercent(map)).toBe(100);
    const noFuture = { ...map, versions: { current: map.versions.current } };
    expect(completionPercent(noFuture)).toBe(70);
  });
});
