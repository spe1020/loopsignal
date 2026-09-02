/**
 * Future hooks. Interfaces only — no implementation in V1.
 * A facilitator only suggests; a person decides what goes on the map.
 */
import { computeMetrics } from "./metrics";
import type { PainPoint, ProcessMap } from "./schema";

export type LoopScanFinding = {
  mapNumber: string;
  process: string;
  leadTimeMin: number;
  touchTimeMin: number;
  pce: number | null;
  handoffs: number;
  worstWaits: { step: string; lane: string; minutes: number }[];
  painPoints: { text: string; category: PainPoint["category"]; severity: PainPoint["severity"] }[];
  futureLeadTimeMin?: number;
};

/** Typed summary for a LoopScan report. Pure and safe to call today. */
export function toLoopScanFindings(map: ProcessMap): LoopScanFinding {
  const cur = map.versions.current;
  const m = computeMetrics(cur, map.lanes);
  const lanes = new Map(map.lanes.map((l) => [l.id, l.name]));
  const steps = new Map(cur.steps.map((s) => [s.id, s]));
  const worstWaits = [...cur.steps]
    .filter((s) => (s.waitBeforeMin ?? 0) > 0)
    .sort((a, b) => (b.waitBeforeMin ?? 0) - (a.waitBeforeMin ?? 0))
    .slice(0, 3)
    .map((s) => ({ step: s.name, lane: lanes.get(s.laneId) ?? "", minutes: s.waitBeforeMin ?? 0 }));
  return {
    mapNumber: map.mapNumber,
    process: map.process ?? map.title,
    leadTimeMin: m.leadTimeMin,
    touchTimeMin: m.touchTimeMin,
    pce: m.pce,
    handoffs: m.handoffCount,
    worstWaits,
    painPoints: cur.painPoints.map((p) => ({ text: p.text, category: p.category, severity: p.severity })).filter((p) => steps.size > 0),
    futureLeadTimeMin: map.versions.future ? computeMetrics(map.versions.future, map.lanes).leadTimeMin : undefined,
  };
}

export type LoopKnowMapPayload = {
  mapNumber: string;
  title: string;
  process?: string;
  scope: { startsWith: string; endsWith: string };
  lanes: string[];
  steps: { name: string; lane: string; system?: string }[];
  changeRationale: string[];
};

/** Shape the map for LoopKnow. Pure and safe to call today. */
export function publishToLoopKnow(map: ProcessMap): LoopKnowMapPayload {
  const lanes = new Map(map.lanes.map((l) => [l.id, l.name]));
  const future = map.versions.future;
  return {
    mapNumber: map.mapNumber,
    title: map.title,
    process: map.process,
    scope: map.scope,
    lanes: [...map.lanes].sort((a, b) => a.order - b.order).map((l) => l.name),
    steps: [...map.versions.current.steps].sort((a, b) => a.order - b.order).map((s) => ({ name: s.name, lane: lanes.get(s.laneId) ?? "", system: s.system })),
    changeRationale: future ? Object.values(future.rationale).map((r) => r.text).filter(Boolean) : [],
  };
}

export type Suggestion = { text: string; stepId?: string; reason?: string };

export interface Facilitator {
  suggestPainPoints(map: ProcessMap): Promise<Suggestion[]>;
}

export class NoopFacilitator implements Facilitator {
  suggestPainPoints() {
    return Promise.resolve([]);
  }
}

export const facilitator: Facilitator = new NoopFacilitator();
