import { hardFindings } from "./rules";
import type { Investigation, InvestigationStatus } from "./schema";

/**
 * Derived investigation status. Never edited directly.
 *
 * closed        closedAt set and latest close/reopen event is `closed`
 * reopened      latest lifecycle event is `reopened` and no new draft/review since
 * verification  ≥1 verification exists
 * action_open   ≥1 action exists
 * investigating ≥1 cause exists
 * draft         otherwise
 */
export function deriveStatus(inv: Investigation): InvestigationStatus {
  const last = [...inv.history]
    .reverse()
    .find((h) => h.type === "closed" || h.type === "reopened");
  if (inv.closedAt && last?.type === "closed" && hardFindings(inv).length === 0)
    return "closed";
  if (last?.type === "reopened") {
    const since = last.at;
    const verifiedSince =
      inv.verifications.some((v) => v.createdAt > since) ||
      inv.verificationReviews.some(
        (r) => !r.invalidatedAt && r.reopenedEventId === last.id,
      );
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

/** Read-time compatibility repair, without rewriting the stored original.
 * Keep the historical close event; require a fresh approval under current rules.
 */
export function normalizeClosure(inv: Investigation): Investigation {
  if (inv.closedAt && hardFindings(inv).length > 0) {
    return {
      ...inv,
      closedAt: undefined,
      status: "reopened",
      reopenedCount: inv.reopenedCount + 1,
      history: [
        ...inv.history,
        {
          id: `${inv.id}:review:${inv.closedAt}`,
          at: inv.updatedAt,
          type: "reopened",
          from: "closed",
          to: "reopened",
          note: "Historical closure requires review under current evidence and completion rules. The original close event is preserved.",
        },
      ],
    };
  }
  return { ...inv, status: deriveStatus(inv) };
}
