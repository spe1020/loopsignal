import type { Investigation, Stage } from "./schema";
import { hardFindings } from "./rules";
import { problemChecks } from "./text";

export type StageScore = 0 | 0.5 | 1;

export function stageScore(inv: Investigation, stage: Stage): StageScore {
  switch (stage) {
    case "problem": {
      const ok = problemChecks(inv.problem).filter((c) => c.ok).length;
      if (ok >= 5) return 1;
      if (ok >= 3) return 0.5;
      return 0;
    }
    case "contain": {
      if (inv.containment.length === 0) return 0;
      const done = inv.containment.every(
        (c) => c.status === "verified" || c.status === "released",
      );
      return done ? 1 : 0.5;
    }
    case "investigate": {
      if (inv.causes.length === 0) return 0;
      return inv.evidenceLinks.length > 0 ? 1 : 0.5;
    }
    case "root-cause": {
      const root = inv.causes.some(
        (c) => c.classification === "root" && (c.rootCauseRationale ?? "").trim().length > 0,
      );
      return root ? 1 : 0;
    }
    case "actions": {
      const linked = inv.actions.filter((a) => a.linkedCauseIds.length > 0);
      if (linked.length === 0) return 0;
      return inv.actions.every((a) => a.status === "complete") ? 1 : 0.5;
    }
    case "verify": {
      if (inv.verifications.length === 0) return 0;
      return hardFindings(inv).length === 0 ? 1 : 0.5;
    }
    case "summary":
      return inv.lessons.length > 0 ? 1 : 0;
  }
}

const weighted: Stage[] = [
  "problem",
  "contain",
  "investigate",
  "root-cause",
  "actions",
  "verify",
  "summary",
];

/** Equal-weighted average of the seven stage scores, 0–100. */
export function completionPercent(inv: Investigation): number {
  const total = weighted.reduce((sum, s) => sum + stageScore(inv, s), 0);
  return Math.round((total / weighted.length) * 100);
}
