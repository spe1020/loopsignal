import type { CauseNode } from "../schema";

export type WhyBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  parentId: string | null;
};

export type WhyEdge = { from: string; to: string; path: string };

export type WhyLayout = {
  boxes: WhyBox[];
  edges: WhyEdge[];
  width: number;
  height: number;
  root: WhyBox;
};

export const WHY_NODE = { width: 236, height: 126, hGap: 20, vGap: 56 } as const;
export const WHY_ROOT_ID = "__problem__";

type Tree = { id: string; children: Tree[] };

function buildTree(causes: CauseNode[], respectCollapse: boolean): Tree {
  const byParent = new Map<string | null, CauseNode[]>();
  for (const c of causes) {
    if (c.origin === "fishbone" && c.parentId === null) continue;
    const list = byParent.get(c.parentId) ?? [];
    list.push(c);
    byParent.set(c.parentId, list);
  }
  const collapsed = new Set(causes.filter((c) => c.collapsed).map((c) => c.id));
  const make = (id: string | null, key: string): Tree => ({
    id: key,
    children:
      respectCollapse && id && collapsed.has(id)
        ? []
        : (byParent.get(id) ?? [])
            .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
            .map((c) => make(c.id, c.id)),
  });
  return make(null, WHY_ROOT_ID);
}

/**
 * Top-down tree layout. Siblings are spaced by subtree width so boxes never
 * overlap. Deterministic, no external libraries.
 */
export function layoutWhys(causes: CauseNode[], opts: { respectCollapse?: boolean } = {}): WhyLayout {
  const { width: W, height: H, hGap, vGap } = WHY_NODE;
  const tree = buildTree(causes, opts.respectCollapse ?? true);
  const widths = new Map<string, number>();
  const measure = (t: Tree): number => {
    if (t.children.length === 0) {
      widths.set(t.id, W);
      return W;
    }
    const total = t.children.reduce((sum, c) => sum + measure(c), 0) + hGap * (t.children.length - 1);
    const w = Math.max(W, total);
    widths.set(t.id, w);
    return w;
  };
  measure(tree);

  const boxes: WhyBox[] = [];
  const edges: WhyEdge[] = [];
  const place = (t: Tree, left: number, depth: number, parentId: string | null) => {
    const span = widths.get(t.id) ?? W;
    const x = left + span / 2 - W / 2;
    const y = depth * (H + vGap);
    boxes.push({ id: t.id, x, y, width: W, height: H, depth, parentId });
    let cursor = left;
    for (const child of t.children) {
      const cw = widths.get(child.id) ?? W;
      place(child, cursor, depth + 1, t.id);
      const cx = cursor + cw / 2;
      const x0 = x + W / 2;
      const y0 = y + H;
      const y1 = y + H + vGap;
      const my = y0 + vGap / 2;
      edges.push({ from: t.id, to: child.id, path: `M ${x0} ${y0} C ${x0} ${my}, ${cx} ${my}, ${cx} ${y1}` });
      cursor += cw + hGap;
    }
  };
  place(tree, 0, 0, null);
  const width = widths.get(WHY_ROOT_ID) ?? W;
  const maxDepth = boxes.reduce((m, b) => Math.max(m, b.depth), 0);
  const height = (maxDepth + 1) * H + maxDepth * vGap;
  const root = boxes[0];
  return { boxes, edges, width, height, root };
}

export function boxesOverlap(a: WhyBox, b: WhyBox): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export function depthOf(causes: CauseNode[], id: string): number {
  const byId = new Map(causes.map((c) => [c.id, c]));
  let d = 1;
  let cur = byId.get(id);
  while (cur?.parentId) {
    d += 1;
    cur = byId.get(cur.parentId);
    if (d > 100) break;
  }
  return d;
}

export function maxDepth(causes: CauseNode[]): number {
  return causes.reduce((m, c) => Math.max(m, depthOf(causes, c.id)), 0);
}
