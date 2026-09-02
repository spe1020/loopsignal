import type { Edge, Lane, MapVersion, Step, ValueClass } from "./schema";

/**
 * Pure metrics. The map computes; the user never does arithmetic.
 *
 * Time model (all minutes):
 *  - Every step is on the primary sequence, ordered by `order`.
 *  - waitBeforeMin is queue time before a step. A `wait` step's cycle time is
 *    also waiting, not touch time.
 *  - Branch edges (skips and rework loops) are reported separately; they do
 *    not change the primary-path totals.
 */

export type Handoff = {
  fromStepId: string;
  toStepId: string;
  fromLaneId: string;
  toLaneId: string;
  trigger?: string;
  /** Wait recorded before the receiving step. */
  waitAfterMin: number;
};

export type LaneLoad = { laneId: string; touchMin: number; waitMin: number; stepCount: number };

export type ValueBreakdown = Record<ValueClass, { min: number; share: number }>;

export type VersionMetrics = {
  stepCount: number;
  leadTimeMin: number;
  touchTimeMin: number;
  waitTimeMin: number;
  /** touch / lead, or null when lead time is zero. */
  pce: number | null;
  value: ValueBreakdown;
  handoffs: Handoff[];
  handoffCount: number;
  longestWait: { stepId: string; min: number } | null;
  longestStep: { stepId: string; min: number } | null;
  unknownTimeStepIds: string[];
  unclassifiedStepIds: string[];
  reworkLoops: Edge[];
  skipBranches: Edge[];
  lanes: LaneLoad[];
};

export function orderedSteps(version: MapVersion): Step[] {
  return [...version.steps].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export function isTimed(step: Step): boolean {
  return step.type !== "start" && step.type !== "end";
}

export function isWaiting(step: Step): boolean {
  return step.type === "wait";
}

/** Minutes this step contributes to waiting (queue before + its own time if it is a wait step). */
export function stepWaitMin(step: Step): number {
  return (step.waitBeforeMin ?? 0) + (isWaiting(step) ? step.cycleTimeMin ?? 0 : 0);
}

/** Minutes this step contributes to touch time. */
export function stepTouchMin(step: Step): number {
  return isWaiting(step) ? 0 : step.cycleTimeMin ?? 0;
}

export function computeMetrics(version: MapVersion, lanes: Lane[]): VersionMetrics {
  const steps = orderedSteps(version);
  const byId = new Map(steps.map((s) => [s.id, s]));
  let touch = 0;
  let wait = 0;
  const value: ValueBreakdown = {
    va: { min: 0, share: 0 },
    nnva: { min: 0, share: 0 },
    nva: { min: 0, share: 0 },
    unclassified: { min: 0, share: 0 },
  };
  let longestWait: VersionMetrics["longestWait"] = null;
  let longestStep: VersionMetrics["longestStep"] = null;
  const unknownTimeStepIds: string[] = [];
  const unclassifiedStepIds: string[] = [];
  const laneMap = new Map<string, LaneLoad>(lanes.map((l) => [l.id, { laneId: l.id, touchMin: 0, waitMin: 0, stepCount: 0 }]));

  for (const s of steps) {
    const t = stepTouchMin(s);
    const w = stepWaitMin(s);
    touch += t;
    wait += w;
    if (isTimed(s)) {
      if (s.cycleTimeMin === undefined) unknownTimeStepIds.push(s.id);
      if (s.valueClass === "unclassified") unclassifiedStepIds.push(s.id);
      // Wait steps are waiting regardless of the class the user picked.
      const cls: ValueClass = isWaiting(s) ? "nva" : s.valueClass;
      value[cls].min += t + (isWaiting(s) ? s.cycleTimeMin ?? 0 : 0);
      if (t > 0 && (!longestStep || t > longestStep.min)) longestStep = { stepId: s.id, min: t };
    }
    if (w > 0 && (!longestWait || w > longestWait.min)) longestWait = { stepId: s.id, min: w };
    const lane = laneMap.get(s.laneId);
    if (lane) {
      lane.touchMin += t;
      lane.waitMin += w;
      lane.stepCount += 1;
    }
  }
  // Queue time before a step is unclassified waste unless it is on a wait step (already counted above).
  const queueOnly = steps.reduce((sum, s) => sum + (s.waitBeforeMin ?? 0), 0);
  value.nva.min += queueOnly;

  const lead = touch + wait;
  for (const k of Object.keys(value) as ValueClass[]) value[k].share = lead > 0 ? value[k].min / lead : 0;

  const handoffs: Handoff[] = [];
  for (let i = 1; i < steps.length; i += 1) {
    const from = steps[i - 1];
    const to = steps[i];
    if (from.laneId !== to.laneId) {
      handoffs.push({ fromStepId: from.id, toStepId: to.id, fromLaneId: from.laneId, toLaneId: to.laneId, trigger: to.trigger?.trim() || undefined, waitAfterMin: to.waitBeforeMin ?? 0 });
    }
  }

  const reworkLoops: Edge[] = [];
  const skipBranches: Edge[] = [];
  for (const e of version.edges) {
    if (e.isPrimary) continue;
    const a = byId.get(e.fromStepId);
    const b = byId.get(e.toStepId);
    if (!a || !b) continue;
    if (b.order <= a.order) reworkLoops.push(e);
    else skipBranches.push(e);
  }

  return {
    stepCount: steps.length,
    leadTimeMin: lead,
    touchTimeMin: touch,
    waitTimeMin: wait,
    pce: lead > 0 ? touch / lead : null,
    value,
    handoffs,
    handoffCount: handoffs.length,
    longestWait,
    longestStep,
    unknownTimeStepIds,
    unclassifiedStepIds,
    reworkLoops,
    skipBranches,
    lanes: [...laneMap.values()],
  };
}

export type MetricDelta = { key: string; label: string; current: number | null; future: number | null; change: number | null; format: "time" | "count" | "percent" };

/** Future vs current for the headline numbers. Negative change is an improvement for everything but PCE. */
export function metricsDelta(current: VersionMetrics, future: VersionMetrics): MetricDelta[] {
  const row = (key: string, label: string, c: number | null, f: number | null, format: MetricDelta["format"]): MetricDelta => ({
    key,
    label,
    current: c,
    future: f,
    change: c === null || f === null ? null : f - c,
    format,
  });
  return [
    row("lead", "Lead time", current.leadTimeMin, future.leadTimeMin, "time"),
    row("touch", "Touch time", current.touchTimeMin, future.touchTimeMin, "time"),
    row("wait", "Waiting", current.waitTimeMin, future.waitTimeMin, "time"),
    row("pce", "Process cycle efficiency", current.pce, future.pce, "percent"),
    row("handoffs", "Handoffs", current.handoffCount, future.handoffCount, "count"),
    row("nva", "NVA minutes", current.value.nva.min, future.value.nva.min, "time"),
    row("steps", "Steps", current.stepCount, future.stepCount, "count"),
    row("rework", "Rework loops", current.reworkLoops.length, future.reworkLoops.length, "count"),
    row("unknown", "Steps with unknown time", current.unknownTimeStepIds.length, future.unknownTimeStepIds.length, "count"),
  ];
}
