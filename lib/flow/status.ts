import type { MapStatus, ProcessMap } from "./schema";
import { diffVersions } from "./diff";

/**
 * Derived map status. Never edited directly.
 *
 * complete        future exists with at least one change, every change has a
 *                 rationale, and no linked investigation is still open
 * improving       any linked investigation is not closed
 * future_drafted  future state exists
 * current_mapped  ≥5 steps including a start and an end
 * draft           otherwise
 */
export function isCurrentMapped(map: ProcessMap): boolean {
  const steps = map.versions.current.steps;
  return steps.length >= 5 && steps.some((s) => s.type === "start") && steps.some((s) => s.type === "end");
}

export function deriveStatus(map: ProcessMap): MapStatus {
  const future = map.versions.future;
  const openInvestigation = map.investigations.some((l) => l.lastKnownStatus && l.lastKnownStatus !== "closed");
  if (future) {
    const diff = diffVersions(map.versions.current, future);
    if (diff.changeCount > 0 && diff.missingRationale.length === 0 && !openInvestigation) return "complete";
  }
  if (openInvestigation) return "improving";
  if (future) return "future_drafted";
  if (isCurrentMapped(map)) return "current_mapped";
  return "draft";
}

export const statusLabels: Record<MapStatus, string> = {
  draft: "Draft",
  current_mapped: "Current mapped",
  future_drafted: "Future drafted",
  improving: "Improving",
  complete: "Complete",
};
