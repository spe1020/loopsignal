import { diffVersions } from "./diff";
import { isTimed } from "./metrics";
import type { ProcessMap } from "./schema";

export type CompletionPart = { key: string; label: string; weight: number; done: boolean };

/**
 * Scope complete (boundaries + ≥2 lanes) 20 · ≥5 steps 20 · all steps have
 * time and value class 20 · ≥1 pain point or explicit "no pain points" 10 ·
 * future state forked 20 · all future changes have rationale 10.
 */
export function completionParts(map: ProcessMap): CompletionPart[] {
  const cur = map.versions.current;
  const timed = cur.steps.filter(isTimed);
  const future = map.versions.future;
  const diff = future ? diffVersions(cur, future) : null;
  return [
    { key: "scope", label: "Scope: boundaries and at least two lanes", weight: 20, done: Boolean(map.scope.startsWith.trim() && map.scope.endsWith.trim()) && map.lanes.length >= 2 },
    { key: "steps", label: "At least five steps", weight: 20, done: cur.steps.length >= 5 },
    { key: "times", label: "Every step has a time and a value class", weight: 20, done: timed.length > 0 && timed.every((s) => s.cycleTimeMin !== undefined && s.valueClass !== "unclassified") },
    { key: "pain", label: "Pain points recorded (or none, explicitly)", weight: 10, done: cur.painPoints.length > 0 || map.noPainPoints },
    { key: "future", label: "Future state forked", weight: 20, done: Boolean(future) },
    { key: "rationale", label: "Every future change has a rationale", weight: 10, done: Boolean(diff) && diff!.changeCount > 0 && diff!.missingRationale.length === 0 },
  ];
}

export function completionPercent(map: ProcessMap): number {
  return completionParts(map).reduce((sum, p) => sum + (p.done ? p.weight : 0), 0);
}
