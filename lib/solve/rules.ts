import type { Investigation, Stage } from "./schema";
import { currentReview } from "./reviews";
import { supportCount } from "./evidence";
import { jaccard, problemChecks } from "./text";

export type FindingLevel = "hard" | "soft";

export type Finding = {
  code: string;
  level: FindingLevel;
  message: string;
  stage: Stage;
  entityType?: "cause" | "action" | "containment" | "problem";
  entityId?: string;
};

export const BLAME_TERMS = [
  "operator error",
  "human error",
  "forgot",
  "careless",
  "didn't follow procedure",
  "did not follow procedure",
  "not paying attention",
  "inattentive",
] as const;

export const BLAME_COACHING =
  "Consider whether a system, method, training, standard work, interface, workload, or process condition contributed to this behavior.";

export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isOverdue(
  action: { dueDate?: string; status: string },
  today = todayIso(),
): boolean {
  if (!action.dueDate || action.status === "complete") return false;
  return action.dueDate.slice(0, 10) < today;
}

/** Hard rules block closure only. */
export function hardFindings(inv: Investigation): Finding[] {
  const out: Finding[] = [];
  const roots = inv.causes.filter((c) => c.classification === "root");
  const rootsWithRationale = roots.filter(
    (c) => (c.rootCauseRationale ?? "").trim().length > 0,
  );
  if (rootsWithRationale.length === 0) {
    out.push({
      code: "no_root_cause",
      level: "hard",
      stage: "root-cause",
      message:
        "At least one cause must be classified as Root, with a rationale.",
    });
  }
  for (const root of roots) {
    if (!root.rootCauseRationale?.trim())
      out.push({
        code: "root_without_rationale",
        level: "hard",
        stage: "root-cause",
        entityType: "cause",
        entityId: root.id,
        message: `Root cause "${root.text}" needs its own rationale.`,
      });
    if (
      !["verified", "data_supported"].includes(root.evidenceState) ||
      root.challenged ||
      supportCount(inv, root.id).contradicts > 0
    )
      out.push({
        code: "root_unresolved",
        level: "hard",
        stage: "root-cause",
        entityType: "cause",
        entityId: root.id,
        message: `Resolve the evidence and any contradiction for "${root.text}" before closure.`,
      });
    if (
      !inv.actions.some(
        (a) =>
          a.kind === "corrective" &&
          a.linkedCauseIds.includes(root.id) &&
          a.status === "complete",
      )
    )
      out.push({
        code: "root_unaddressed",
        level: "hard",
        stage: "actions",
        entityType: "cause",
        entityId: root.id,
        message: `Root cause "${root.text}" needs a completed corrective action.`,
      });
    if (supportCount(inv, root.id).supports === 0) {
      out.push({
        code: "root_without_evidence",
        level: "hard",
        stage: "root-cause",
        entityType: "cause",
        entityId: root.id,
        message: `Root cause "${root.text || "untitled"}" has no supporting evidence linked.`,
      });
    }
  }
  const corrective = inv.actions.filter((a) => a.kind === "corrective");
  for (const a of inv.actions.filter(
    (a) => a.kind === "corrective" || a.requiredForClosure,
  )) {
    if (!a.linkedCauseIds.some((id) => inv.causes.some((c) => c.id === id))) {
      out.push({
        code: "action_unlinked",
        level: "hard",
        stage: "actions",
        entityType: "action",
        entityId: a.id,
        message: `Required action "${a.title || "untitled"}" is not linked to a cause.`,
      });
    }
    if (!a.owner?.trim())
      out.push({
        code: "action_without_owner",
        level: "hard",
        stage: "actions",
        entityType: "action",
        entityId: a.id,
        message: `Required action "${a.title}" needs an owner.`,
      });
    if (a.status !== "complete")
      out.push({
        code: "action_incomplete",
        level: "hard",
        stage: "actions",
        entityType: "action",
        entityId: a.id,
        message: `Required action "${a.title}" must be complete.`,
      });
    const latest = latestVerification(inv, a.id);
    if (!latest || latest.result !== "effective" || !currentReview(inv, latest)) {
      out.push({
        code: "action_unverified",
        level: "hard",
        stage: "verify",
        entityType: "action",
        entityId: a.id,
        message: latest
          ? `Required action "${a.title || "untitled"}" needs an explicit effective review of the current evidence and work after any reopening.`
          : `Required action "${a.title || "untitled"}" has no effectiveness verification.`,
      });
    }
    if (
      latest &&
      (!latest.expected.trim() ||
        !latest.observed.trim() ||
        !latest.verifier?.trim() ||
        !latest.checkAt || !Number.isFinite(Date.parse(latest.checkAt)) ||
        !latest.evidenceIds.length ||
        latest.evidenceIds.some(
          (id) =>
            !inv.evidence.some(
              (e) => e.id === id && e.description.trim() && e.source.trim(),
            ),
        ))
    ) {
      out.push({
        code: "verification_without_evidence",
        level: "hard",
        stage: "verify",
        entityType: "action",
        entityId: a.id,
        message: `Verification of "${a.title}" needs expected and observed results, reviewer, date, and linked source evidence.`,
      });
    }
  }
  if (corrective.length === 0) {
    out.push({
      code: "no_corrective_action",
      level: "hard",
      stage: "actions",
      message: "At least one corrective action is required before closing.",
    });
  }
  for (const c of inv.containment) {
    if (c.status !== "verified" && c.status !== "released") {
      out.push({
        code: "containment_open",
        level: "hard",
        stage: "contain",
        entityType: "containment",
        entityId: c.id,
        message: `Containment "${c.action || "untitled"}" is not yet Verified or Released.`,
      });
    }
  }
  return out;
}

/** Soft rules coach; they never block. */
export function softFindings(
  inv: Investigation,
  today = todayIso(),
): Finding[] {
  const out: Finding[] = [];
  for (const check of problemChecks(inv.problem)) {
    if (!check.ok) {
      out.push({
        code: `problem_missing_${check.key}`,
        level: "soft",
        stage: "problem",
        entityType: "problem",
        message: `Problem statement is missing the ${check.label.toLowerCase()}. ${check.hint}`,
      });
    }
  }

  if (inv.causes.length > 0 && inv.evidence.length === 0) {
    out.push({
      code: "no_evidence",
      level: "soft",
      stage: "investigate",
      message: "No evidence recorded yet. Every cause is still an assumption.",
    });
  }

  const roots = inv.causes.filter((c) => c.classification === "root");
  for (const c of inv.causes) {
    const lower = c.text.toLowerCase();
    if (c.classification === "root" || c.candidate) {
      if (BLAME_TERMS.some((t) => lower.includes(t))) {
        out.push({
          code: "blame_language",
          level: "soft",
          stage: "root-cause",
          entityType: "cause",
          entityId: c.id,
          message: BLAME_COACHING,
        });
      }
      if (
        inv.problem.whatHappened.trim() &&
        jaccard(c.text, inv.problem.whatHappened) >= 0.7
      ) {
        out.push({
          code: "restates_problem",
          level: "soft",
          stage: "root-cause",
          entityType: "cause",
          entityId: c.id,
          message:
            "This appears to restate the problem rather than explain why it occurred.",
        });
      }
    }
    if (c.classification === "root") {
      if (
        c.evidenceState !== "verified" &&
        c.evidenceState !== "data_supported"
      ) {
        out.push({
          code: "root_not_supported",
          level: "soft",
          stage: "root-cause",
          entityType: "cause",
          entityId: c.id,
          message:
            "This root cause has not yet been supported by verified evidence.",
        });
      }
    }
    if (c.removalTest === "not_sure") {
      out.push({
        code: "needs_investigation",
        level: "soft",
        stage: "investigate",
        entityType: "cause",
        entityId: c.id,
        message:
          "Needs further investigation: it is not yet clear that removing this cause would prevent recurrence.",
      });
    }
  }

  for (const a of inv.actions) {
    if (a.linkedCauseIds.length === 0) {
      out.push({
        code: "action_no_cause",
        level: "soft",
        stage: "actions",
        entityType: "action",
        entityId: a.id,
        message: "This action is not linked to any cause.",
      });
    } else {
      const linked = inv.causes.filter((c) => a.linkedCauseIds.includes(c.id));
      const supported = linked.some(
        (c) =>
          c.evidenceState === "verified" ||
          c.evidenceState === "data_supported",
      );
      if (linked.length > 0 && !supported) {
        out.push({
          code: "action_unverified_cause",
          level: "soft",
          stage: "actions",
          entityType: "action",
          entityId: a.id,
          message: "This action is not linked to a verified cause.",
        });
      }
    }
    if (isOverdue(a, today)) {
      out.push({
        code: "action_overdue",
        level: "soft",
        stage: "actions",
        entityType: "action",
        entityId: a.id,
        message: `"${a.title || "Untitled action"}" is overdue.`,
      });
    }
  }

  if (roots.length > 0 && !inv.actions.some((a) => a.kind === "preventive")) {
    out.push({
      code: "no_preventive",
      level: "soft",
      stage: "actions",
      message: "Consider a systemic action so this doesn't recur elsewhere.",
    });
  }

  return out;
}

export function allFindings(inv: Investigation, today = todayIso()): Finding[] {
  return [...hardFindings(inv), ...softFindings(inv, today)];
}

export function canClose(inv: Investigation): boolean {
  return inv.status !== "closed" && hardFindings(inv).length === 0;
}

export function findingsFor(
  findings: Finding[],
  entityType: Finding["entityType"],
  entityId: string,
): Finding[] {
  return findings.filter(
    (f) => f.entityType === entityType && f.entityId === entityId,
  );
}

/** Same selection rule in the domain and every view, including imported records. */
export function latestVerification(inv: Investigation, actionId: string) {
  return inv.verifications
    .filter((v) => v.actionId === actionId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1);
}

export function isVerifiedImprovement(inv: Investigation): boolean {
  return (
    inv.status === "closed" &&
    Boolean(inv.closedAt) &&
    hardFindings(inv).length === 0
  );
}

/** Explicit review readiness uses the same closure rules, excluding missing approvals (required actions can be reviewed in any order). */
export function reviewBlockers(inv: Investigation, verificationId: string): string[] {
  const v = inv.verifications.find((v) => v.id === verificationId);
  if (!v) return ["Choose an existing verification to review."];
  const issues = hardFindings(inv).filter((f) => f.code !== "action_unverified").map((f) => f.message);
  if (latestVerification(inv, v.actionId)?.id !== v.id) issues.push("Review the latest verification for this action.");
  if (v.result !== "effective") issues.push("Only an Effective result can receive closure approval. Other results keep the investigation open.");
  if (!inv.actions.some((a) => a.id === v.actionId && (a.kind === "corrective" || a.requiredForClosure))) issues.push("Choose a required action to review.");
  return issues;
}
