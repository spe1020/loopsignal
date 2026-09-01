import type { Investigation, InvestigationStatus } from "./schema";

/**
 * Derived investigation status. Never edited directly.
 *
 * closed        closedAt set and last history event is `closed`
 * reopened      last history event is `reopened` and no verification since
 * verification  ≥1 verification exists
 * action_open   ≥1 action exists
 * investigating ≥1 cause exists
 * draft         otherwise
 */
export function deriveStatus(inv: Investigation): InvestigationStatus {
  const last = inv.history[inv.history.length - 1];
  if (inv.closedAt && last?.type === "closed") return "closed";
  if (last?.type === "reopened") {
    const since = last.at;
    const verifiedSince = inv.verifications.some((v) => v.createdAt > since);
    if (!verifiedSince) return "reopened";
  }
  if (inv.verifications.length > 0) return "verification";
  if (inv.actions.length > 0) return "action_open";
  if (inv.causes.length > 0) return "investigating";
  return "draft";
}

export const statusLabels: Record<InvestigationStatus, string> = {
  draft: "Draft",
  investigating: "Investigating",
  action_open: "Actions open",
  verification: "Verifying",
  reopened: "Reopened",
  closed: "Closed",
};
