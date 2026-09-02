import { describe, expect, it } from "vitest";
import { rectsOverlap } from "@/lib/loop/svg";
import { layoutMap } from "../layout";
import { makeLane, makeStep, normalizeVersion } from "../reducer";
import { buildSampleMap } from "../sample";
import type { Edge, MapVersion } from "../schema";
import { mapSvg } from "../svg";

describe("swimlane layout", () => {
  it("5 lanes × 20 steps with 3 decisions has no overlapping boxes, waits, or lane rows", () => {
    const at = "2026-01-01T00:00:00.000Z";
    const lanes = Array.from({ length: 5 }, (_, i) => makeLane(`Lane ${i}`, "role", i, at));
    const steps = Array.from({ length: 20 }, (_, i) =>
      makeStep(
        { laneId: lanes[(i * 3) % 5].id, order: i, name: `Step ${i}`, type: i === 4 || i === 9 || i === 14 ? "decision" : i === 0 ? "start" : i === 19 ? "end" : "process", cycleTimeMin: 10 + i, waitBeforeMin: (i * 37) % 200 },
        at,
      ),
    );
    const edge = (from: number, to: number, label: string): Edge => ({ id: `e${from}-${to}`, createdAt: at, updatedAt: at, fromStepId: steps[from].id, toStepId: steps[to].id, label, isPrimary: false });
    const version: MapVersion = normalizeVersion({ kind: "current", steps, edges: [edge(4, 8, "No"), edge(9, 12, "No"), edge(14, 6, "Rework")], painPoints: [], rationale: {} }, at);
    const layout = layoutMap(version, lanes, "minutes");
    expect(layout.steps).toHaveLength(20);
    expect(layout.lanes).toHaveLength(5);
    const rects = [...layout.steps, ...layout.waits];
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        expect(rectsOverlap(rects[i], rects[j])).toBe(false);
      }
    }
    // every box sits inside its lane row
    for (const b of layout.steps) {
      const lane = layout.lanes[b.laneIndex];
      expect(b.y).toBeGreaterThanOrEqual(lane.y);
      expect(b.y + b.height).toBeLessThanOrEqual(lane.y + lane.height);
    }
    expect(layout.edges.filter((e) => e.kind === "rework")).toHaveLength(1);
    expect(layout.edges.filter((e) => e.kind === "branch")).toHaveLength(2);
    expect(layout.edges.filter((e) => e.kind === "primary" || e.kind === "handoff")).toHaveLength(19);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(layout.lanesBottom);
  });

  it("caps long waits and floors tiny ones", () => {
    const at = "2026-01-01T00:00:00.000Z";
    const lane = makeLane("A", "role", 0, at);
    const steps = [makeStep({ laneId: lane.id, order: 0, name: "a" }, at), makeStep({ laneId: lane.id, order: 1, name: "b", waitBeforeMin: 1 }, at), makeStep({ laneId: lane.id, order: 2, name: "c", waitBeforeMin: 3 * 1440 }, at)];
    const version = normalizeVersion({ kind: "current", steps, edges: [], painPoints: [], rationale: {} }, at);
    const layout = layoutMap(version, [lane], "minutes");
    expect(layout.waits[0].width).toBe(18);
    expect(layout.waits[1].capped).toBe(true);
    expect(layout.waits[1].label).toBe("3 d");
  });

  it("sample renders both versions to SVG", () => {
    const map = buildSampleMap("MAP-2026-001");
    const cur = mapSvg(map, "current", { title: true });
    const fut = mapSvg(map, "future");
    expect(cur.startsWith("<svg")).toBe(true);
    expect(cur).toContain("Engineering reviews");
    expect(fut).toContain("Future state");
    expect(cur).toContain("lf-arrow-red"); // rework loop drawn red
  });
});
