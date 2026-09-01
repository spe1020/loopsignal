import type { CauseNode, FishboneCategory } from "../schema";

export type FishboneCauseBox = {
  id: string;
  categoryId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  side: "top" | "bottom";
};

export type FishboneRib = {
  id: string;
  name: string;
  side: "top" | "bottom";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
  labelWidth: number;
  labelHeight: number;
  causes: FishboneCauseBox[];
};

export type FishboneLayout = {
  width: number;
  height: number;
  spineY: number;
  spineX1: number;
  spineX2: number;
  head: { x: number; y: number; width: number; height: number };
  ribs: FishboneRib[];
};

export const FISHBONE = {
  cause: { width: 184, height: 60, gap: 10 },
  label: { width: 132, height: 34 },
  ribRun: 72,
  bandGap: 28,
  headWidth: 220,
  headHeight: 96,
  margin: 24,
  minRibRise: 110,
} as const;

/**
 * Real Ishikawa: horizontal spine to a head box; categories alternate
 * above/below in order. Ribs grow to fit their causes; labels never overlap
 * because each rib owns a horizontal band = max(label, cause) width + gap.
 */
export function layoutFishbone(
  categories: FishboneCategory[],
  causes: CauseNode[],
  problemText: string,
): FishboneLayout {
  void problemText;
  const F = FISHBONE;
  const cats = [...categories].sort((a, b) => a.order - b.order);
  const byCat = new Map<string, CauseNode[]>();
  for (const c of causes) {
    if (c.parentId !== null || !c.categoryId) continue;
    const list = byCat.get(c.categoryId) ?? [];
    list.push(c);
    byCat.set(c.categoryId, list);
  }
  for (const list of byCat.values()) list.sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));

  const top = cats.filter((_, i) => i % 2 === 0);
  const bottom = cats.filter((_, i) => i % 2 === 1);
  const countFor = (cs: FishboneCategory[]) => cs.reduce((m, c) => Math.max(m, byCat.get(c.id)?.length ?? 0), 0);
  const riseTop = Math.max(F.minRibRise, countFor(top) * (F.cause.height + F.cause.gap) + F.label.height + 40);
  const riseBottom = Math.max(F.minRibRise, countFor(bottom) * (F.cause.height + F.cause.gap) + F.label.height + 40);

  const band = F.cause.width + 16 + F.ribRun + F.bandGap;
  const columns = Math.max(top.length, bottom.length);
  const spineX1 = F.margin;
  const spineY = F.margin + riseTop;
  const width = F.margin * 2 + columns * band + 24 + F.headWidth;
  const spineX2 = width - F.margin - F.headWidth - 8;
  const height = F.margin * 2 + riseTop + riseBottom;
  const head = { x: spineX2 + 8, y: spineY - F.headHeight / 2, width: F.headWidth, height: F.headHeight };

  const ribs: FishboneRib[] = [];
  const makeRib = (cat: FishboneCategory, col: number, side: "top" | "bottom") => {
    const rise = side === "top" ? riseTop : riseBottom;
    const bandLeft = spineX1 + col * band;
    const tipX = bandLeft + F.cause.width + 16;
    const footX = tipX + F.ribRun; // where the rib meets the spine
    const tipY = side === "top" ? spineY - rise + F.label.height : spineY + rise - F.label.height;
    const labelX = tipX - F.label.width / 2;
    const labelY = side === "top" ? tipY - F.label.height - 4 : tipY + 4;
    const list = byCat.get(cat.id) ?? [];
    const dx = footX - tipX;
    const dy = spineY - tipY;
    const causesOut: FishboneCauseBox[] = list.map((c, i) => {
      const t = (i + 1) / (list.length + 1);
      const anchorX = tipX + dx * t;
      const anchorY = tipY + dy * t;
      const x = anchorX - F.cause.width - 6;
      const y = anchorY - F.cause.height / 2;
      return { id: c.id, categoryId: cat.id, x, y, width: F.cause.width, height: F.cause.height, anchorX, anchorY, side };
    });
    // spread vertically so cards never overlap each other
    const sorted = [...causesOut].sort((a, b) => a.y - b.y);
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      if (sorted[i].y < prev.y + prev.height + F.cause.gap) sorted[i].y = prev.y + prev.height + F.cause.gap;
    }
    ribs.push({
      id: cat.id,
      name: cat.name,
      side,
      x1: tipX,
      y1: tipY,
      x2: footX,
      y2: spineY,
      labelX,
      labelY,
      labelWidth: F.label.width,
      labelHeight: F.label.height,
      causes: causesOut,
    });
  };
  top.forEach((c, i) => makeRib(c, i, "top"));
  bottom.forEach((c, i) => makeRib(c, i, "bottom"));

  return { width, height, spineY, spineX1, spineX2, head, ribs };
}

export function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}
