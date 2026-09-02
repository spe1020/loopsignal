import type { Lane, MapVersion, Step, TimeUnit } from "./schema";
import { orderedSteps } from "./metrics";
import { formatMinutes, unitMinutes } from "./time";

/**
 * Deterministic swimlane layout. Lanes are rows; steps flow left to right in
 * sequence order, one column per step. Wait time is a hatched gap before the
 * step, proportional to time with a floor and a cap. Nothing is dragged.
 */

export const FLOW_LAYOUT = {
  marginX: 16,
  marginY: 12,
  laneHeaderW: 128,
  laneH: 108,
  laneGap: 6,
  stepW: 156,
  stepH: 66,
  decisionW: 120,
  decisionH: 76,
  terminalW: 96,
  terminalH: 44,
  colGap: 34,
  waitMinW: 18,
  waitMaxW: 150,
  channelH: 20,
  channelPad: 8,
} as const;

export type LaneRow = { id: string; name: string; kind: Lane["kind"]; y: number; height: number; index: number };

export type StepBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  laneIndex: number;
  col: number;
  type: Step["type"];
  /** Column origin (left edge of the wait gap). */
  colX: number;
  colWidth: number;
};

export type WaitGap = { stepId: string; x: number; y: number; width: number; height: number; minutes: number; capped: boolean; label: string };

export type EdgeKind = "primary" | "handoff" | "branch" | "rework";

export type EdgePath = {
  id: string;
  fromStepId: string;
  toStepId: string;
  kind: EdgeKind;
  path: string;
  label?: string;
  labelX?: number;
  labelY?: number;
  /** Handoff marker position. */
  markerX?: number;
  markerY?: number;
};

export type MapLayout = {
  width: number;
  height: number;
  lanes: LaneRow[];
  steps: StepBox[];
  waits: WaitGap[];
  edges: EdgePath[];
  /** y where lane rows start (after the top branch channels). */
  lanesTop: number;
  lanesBottom: number;
};

/** Pixels per minute by display unit so that one "typical" unit is ~60 px. */
export function waitScale(unit: TimeUnit): number {
  return 60 / unitMinutes[unit] / (unit === "minutes" ? 0.5 : 1);
}

export function waitWidth(minutes: number, unit: TimeUnit): { width: number; capped: boolean } {
  if (minutes <= 0) return { width: 0, capped: false };
  const raw = minutes * waitScale(unit);
  if (raw > FLOW_LAYOUT.waitMaxW) return { width: FLOW_LAYOUT.waitMaxW, capped: true };
  return { width: Math.max(FLOW_LAYOUT.waitMinW, raw), capped: false };
}

function boxSize(type: Step["type"]): { w: number; h: number } {
  const L = FLOW_LAYOUT;
  if (type === "decision") return { w: L.decisionW, h: L.decisionH };
  if (type === "start" || type === "end") return { w: L.terminalW, h: L.terminalH };
  return { w: L.stepW, h: L.stepH };
}

export function layoutMap(version: MapVersion, lanesIn: Lane[], unit: TimeUnit): MapLayout {
  const L = FLOW_LAYOUT;
  const lanes = [...lanesIn].sort((a, b) => a.order - b.order);
  const steps = orderedSteps(version).filter((s) => lanes.some((l) => l.id === s.laneId));
  const laneIndex = new Map(lanes.map((l, i) => [l.id, i]));
  const byId = new Map(steps.map((s) => [s.id, s]));

  // Branch channels: forward skips run above the lanes, rework loops below.
  const skips = version.edges.filter((e) => !e.isPrimary && byId.has(e.fromStepId) && byId.has(e.toStepId) && byId.get(e.toStepId)!.order > byId.get(e.fromStepId)!.order);
  const reworks = version.edges.filter((e) => !e.isPrimary && byId.has(e.fromStepId) && byId.has(e.toStepId) && byId.get(e.toStepId)!.order <= byId.get(e.fromStepId)!.order);
  const topChannels = skips.length;
  const bottomChannels = reworks.length;
  const lanesTop = L.marginY + (topChannels ? topChannels * L.channelH + L.channelPad : 0);

  const laneRows: LaneRow[] = lanes.map((l, i) => ({ id: l.id, name: l.name, kind: l.kind, y: lanesTop + i * (L.laneH + L.laneGap), height: L.laneH, index: i }));
  const lanesBottom = laneRows.length ? laneRows[laneRows.length - 1].y + L.laneH : lanesTop + L.laneH;

  const boxes: StepBox[] = [];
  const waits: WaitGap[] = [];
  let cursor = L.marginX + L.laneHeaderW + L.colGap;
  steps.forEach((s, col) => {
    const li = laneIndex.get(s.laneId) ?? 0;
    const row = laneRows[li];
    const { w, h } = boxSize(s.type);
    const waitMin = s.waitBeforeMin ?? 0;
    const { width: ww, capped } = waitWidth(waitMin, unit);
    const colX = cursor;
    const x = colX + ww;
    const y = row.y + (L.laneH - h) / 2;
    if (ww > 0) {
      waits.push({ stepId: s.id, x: colX, y: row.y + 10, width: ww, height: L.laneH - 20, minutes: waitMin, capped, label: formatMinutes(waitMin, { compact: true }) });
    }
    boxes.push({ id: s.id, x, y, width: w, height: h, laneIndex: li, col, type: s.type, colX, colWidth: ww + w });
    cursor = x + w + L.colGap;
  });

  const width = Math.max(cursor - L.colGap + L.marginX, L.marginX * 2 + L.laneHeaderW + 200);
  const height = lanesBottom + (bottomChannels ? bottomChannels * L.channelH + L.channelPad : 0) + L.marginY;

  const boxById = new Map(boxes.map((b) => [b.id, b]));
  const edges: EdgePath[] = [];
  const primaryLabel = new Map<string, string | undefined>();
  for (const e of version.edges) if (e.isPrimary) primaryLabel.set(`${e.fromStepId}>${e.toStepId}`, e.label);

  for (let i = 1; i < boxes.length; i += 1) {
    const a = boxes[i - 1];
    const b = boxes[i];
    const ax = a.x + a.width;
    const ay = a.y + a.height / 2;
    const bx = b.x;
    const by = b.y + b.height / 2;
    const label = primaryLabel.get(`${a.id}>${b.id}`);
    if (a.laneIndex === b.laneIndex) {
      edges.push({ id: `p-${a.id}`, fromStepId: a.id, toStepId: b.id, kind: "primary", path: `M ${ax} ${ay} L ${bx} ${by}`, label, labelX: ax + 6, labelY: ay - 6 });
    } else {
      const vx = b.colX - L.colGap / 2;
      edges.push({
        id: `p-${a.id}`,
        fromStepId: a.id,
        toStepId: b.id,
        kind: "handoff",
        path: `M ${ax} ${ay} L ${vx} ${ay} L ${vx} ${by} L ${bx} ${by}`,
        label,
        labelX: ax + 6,
        labelY: ay - 6,
        markerX: vx,
        markerY: (ay + by) / 2,
      });
    }
  }

  skips.forEach((e, k) => {
    const a = boxById.get(e.fromStepId)!;
    const b = boxById.get(e.toStepId)!;
    const cy = L.marginY + k * L.channelH + L.channelH / 2;
    const sx = a.x + a.width / 2;
    const tx = b.x + b.width / 2;
    edges.push({ id: e.id, fromStepId: a.id, toStepId: b.id, kind: "branch", path: `M ${sx} ${a.y} L ${sx} ${cy} L ${tx} ${cy} L ${tx} ${b.y}`, label: e.label, labelX: sx + 8, labelY: cy - 4 });
  });
  reworks.forEach((e, k) => {
    const a = boxById.get(e.fromStepId)!;
    const b = boxById.get(e.toStepId)!;
    const cy = lanesBottom + L.channelPad + k * L.channelH + L.channelH / 2;
    const sx = a.x + a.width / 2;
    const tx = b.x + b.width / 2;
    edges.push({ id: e.id, fromStepId: a.id, toStepId: b.id, kind: "rework", path: `M ${sx} ${a.y + a.height} L ${sx} ${cy} L ${tx} ${cy} L ${tx} ${b.y + b.height}`, label: e.label, labelX: sx - 8, labelY: cy - 4 });
  });

  return { width, height, lanes: laneRows, steps: boxes, waits, edges, lanesTop, lanesBottom };
}
