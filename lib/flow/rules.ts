import { computeMetrics, isTimed, isWaiting, orderedSteps } from "./metrics";
import type { ProcessMap, Stage } from "./schema";
import { diffVersions } from "./diff";
import { formatMinutes } from "./time";

export type Finding = {
  code: string;
  level: "soft" | "info";
  message: string;
  stage: Stage;
  version?: "current" | "future";
  stepId?: string;
  laneId?: string;
};

/**
 * Soft coaching only. Nothing here blocks editing. "Fork future state"
 * requires ≥3 steps, which is enforced in the reducer, not here.
 */
export function softFindings(map: ProcessMap): Finding[] {
  const out: Finding[] = [];
  const cur = map.versions.current;
  const lanes = new Map(map.lanes.map((l) => [l.id, l]));
  const steps = orderedSteps(cur);

  if (!map.scope.startsWith.trim() || !map.scope.endsWith.trim()) {
    out.push({ code: "no_boundaries", level: "soft", stage: "scope", message: "Set where the process starts and ends. A map without boundaries sprawls." });
  }
  if (map.lanes.length === 0) {
    out.push({ code: "no_lanes", level: "soft", stage: "scope", message: "No lanes yet — add at least the roles that touch this process." });
  }

  const timed = steps.filter(isTimed);
  for (const s of timed) {
    if (s.cycleTimeMin === undefined) out.push({ code: "unknown_time", level: "soft", stage: "map", version: "current", stepId: s.id, message: `"${s.name || "Untitled step"}" has no time. Observe it, estimate it, or mark why it is unknown.` });
    if (s.valueClass === "unclassified" && !isWaiting(s)) out.push({ code: "unclassified", level: "soft", stage: "map", version: "current", stepId: s.id, message: `"${s.name || "Untitled step"}" has no value class. Does the customer pay for this step?` });
  }

  if (timed.length >= 3 && steps.every((s) => !(s.waitBeforeMin && s.waitBeforeMin > 0) && !(isWaiting(s) && (s.cycleTimeMin ?? 0) > 0))) {
    out.push({ code: "no_waiting", level: "soft", stage: "map", version: "current", message: "No waiting anywhere is unusual. Check queues before each step." });
  }

  const m = computeMetrics(cur, map.lanes);
  for (const h of m.handoffs) {
    if (!h.trigger) {
      const lane = lanes.get(h.toLaneId)?.name || "the next lane";
      out.push({ code: "handoff_no_trigger", level: "soft", stage: "map", version: "current", stepId: h.toStepId, laneId: h.toLaneId, message: `How does ${lane} know to start? Record the trigger.` });
    }
  }

  const longest = [...timed].filter((s) => (s.cycleTimeMin ?? 0) > 0 && !isWaiting(s)).sort((a, b) => (b.cycleTimeMin ?? 0) - (a.cycleTimeMin ?? 0)).slice(0, 3);
  if (longest.length >= 2 && longest.every((s) => s.timeSource === "estimated")) {
    out.push({ code: "biggest_estimated", level: "soft", stage: "map", version: "current", message: "The biggest steps are estimates. Observe them if you can." });
  }

  const painBy = new Set(cur.painPoints.map((p) => p.stepId));
  for (const s of timed) {
    if (s.valueClass === "nva" && !isWaiting(s) && !painBy.has(s.id)) {
      out.push({ code: "nva_no_pain", level: "soft", stage: "analyze", version: "current", stepId: s.id, message: `"${s.name || "Untitled step"}" adds no value. Is it a problem, or required?` });
    }
  }
  for (const e of m.reworkLoops) {
    if (!painBy.has(e.fromStepId) && !painBy.has(e.toStepId)) {
      const from = steps.find((s) => s.id === e.fromStepId);
      out.push({ code: "rework_no_pain", level: "soft", stage: "analyze", version: "current", stepId: e.fromStepId, message: `Rework loop from "${from?.name || "a step"}" has no pain point. Rework is rarely free.` });
    }
  }

  if (m.pce !== null && m.pce < 0.05 && m.leadTimeMin > 0) {
    out.push({ code: "low_pce", level: "info", stage: "analyze", version: "current", message: `Process cycle efficiency is ${(m.pce * 100).toFixed(1)}%. This is value-added time divided by recorded lead time. Review estimates, missing times, and value classifications before drawing conclusions.` });
  }

  const future = map.versions.future;
  if (future) {
    const diff = diffVersions(cur, future);
    for (const r of diff.removed) {
      if (diff.missingRationale.includes(r.key)) {
        out.push({ code: "removed_no_rationale", level: "soft", stage: "future", version: "future", stepId: r.currentStep.id, message: `"${r.currentStep.name || "Untitled step"}" was removed without a rationale. What change makes this step unnecessary?` });
      }
    }
    for (const c of [...diff.added, ...diff.changed]) {
      if (diff.missingRationale.includes(c.key)) {
        out.push({ code: "change_no_rationale", level: "soft", stage: "future", version: "future", stepId: c.futureStep.id, message: `"${c.futureStep.name || "Untitled step"}" ${c.kind === "added" ? "was added" : "changed"} without a rationale. What corrective action makes this real?` });
      }
    }
    const fm = computeMetrics(future, map.lanes);
    if (fm.leadTimeMin >= m.leadTimeMin && m.leadTimeMin > 0) {
      out.push({ code: "future_not_faster", level: "soft", stage: "future", version: "future", message: `Future state doesn't reduce lead time (${formatMinutes(fm.leadTimeMin)} vs ${formatMinutes(m.leadTimeMin)}). Is that intended?` });
    }
  }

  return out;
}

export function findingsFor(findings: Finding[], stepId: string): Finding[] {
  return findings.filter((f) => f.stepId === stepId);
}
