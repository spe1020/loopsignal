import { describe, expect, it } from "vitest";
import { buildSample } from "../sample";
import { stamp } from "../reducer";
import type { CauseNode } from "../schema";
import { boxesOverlap, layoutWhys } from "../layout/whys";
import { layoutFishbone, rectsOverlap } from "../layout/fishbone";

function node(text: string, parentId: string | null, order: number): CauseNode {
  return { ...stamp(), text, parentId, origin: "why", evidenceState: "assumption", classification: "unclassified", challenged: false, candidate: false, collapsed: false, order };
}

describe("five whys layout", () => {
  it("3 branches × 6 deep has no overlapping boxes", () => {
    const causes: CauseNode[] = [];
    for (let b = 0; b < 3; b += 1) {
      let parent: string | null = null;
      for (let d = 0; d < 6; d += 1) {
        const n = node(`b${b}d${d}`, parent, b);
        // fan out at depth 2 to stress sibling spacing
        causes.push(n);
        if (d === 2) causes.push(node(`b${b}d${d}-alt`, parent, b + 10));
        parent = n.id;
      }
    }
    const layout = layoutWhys(causes, { respectCollapse: false });
    expect(layout.boxes.length).toBe(causes.length + 1);
    for (let i = 0; i < layout.boxes.length; i += 1) {
      for (let j = i + 1; j < layout.boxes.length; j += 1) {
        expect(boxesOverlap(layout.boxes[i], layout.boxes[j])).toBe(false);
      }
    }
    expect(layout.edges.length).toBe(causes.length);
    expect(layout.height).toBeGreaterThan(0);
  });

  it("collapsed nodes hide their children", () => {
    const a = node("a", null, 0);
    const b = node("b", a.id, 0);
    const collapsed = { ...a, collapsed: true };
    expect(layoutWhys([collapsed, b]).boxes.length).toBe(2);
    expect(layoutWhys([a, b]).boxes.length).toBe(3);
  });
});

describe("fishbone layout", () => {
  it("sample ribs, labels and cause cards do not overlap", () => {
    const inv = buildSample("RCA-2026-001");
    const layout = layoutFishbone(inv.fishboneCategories, inv.causes, inv.problem.generatedStatement);
    expect(layout.ribs.length).toBe(6);
    const labels = layout.ribs.map((r) => ({ x: r.labelX, y: r.labelY, width: r.labelWidth, height: r.labelHeight }));
    const cards = layout.ribs.flatMap((r) => r.causes);
    const all = [...labels, ...cards, layout.head];
    for (let i = 0; i < all.length; i += 1) {
      for (let j = i + 1; j < all.length; j += 1) {
        expect(rectsOverlap(all[i], all[j])).toBe(false);
      }
    }
    const placed = cards.length;
    const expected = inv.causes.filter((c) => c.parentId === null && c.categoryId).length;
    expect(placed).toBe(expected);
  });
});
