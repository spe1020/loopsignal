import type { Investigation, Stage } from "./schema";
import { stages } from "./schema";
import { stageScore } from "./completion";
import { hardFindings } from "./rules";

export type StageState = "empty" | "in_progress" | "needs_attention" | "complete" | "verified";

export type StageMeta = {
  stage: Stage;
  label: string;
  short: string;
  index: number;
  eightD: string;
  prompt: string;
};

export const stageMeta: Record<Stage, StageMeta> = {
  problem: { stage: "problem", label: "Problem", short: "Problem", index: 1, eightD: "D0–D2", prompt: "Define the problem clearly." },
  contain: { stage: "contain", label: "Contain", short: "Contain", index: 2, eightD: "D3", prompt: "Protect the customer while you investigate." },
  investigate: { stage: "investigate", label: "Investigate", short: "Investigate", index: 3, eightD: "D4", prompt: "Follow the evidence." },
  "root-cause": { stage: "root-cause", label: "Root Cause", short: "Root", index: 4, eightD: "D4", prompt: "Decide which causes are root." },
  actions: { stage: "actions", label: "Actions", short: "Actions", index: 5, eightD: "D5–D7", prompt: "Correct the cause, not the symptom." },
  verify: { stage: "verify", label: "Verify", short: "Verify", index: 6, eightD: "D6", prompt: "Prove the problem stayed solved." },
  summary: { stage: "summary", label: "Summary", short: "Summary", index: 7, eightD: "D8", prompt: "Report, learn, close the loop." },
};

export const stageOrder: Stage[] = [...stages];

export function nextStage(stage: Stage): Stage | null {
  const i = stageOrder.indexOf(stage);
  return i >= 0 && i < stageOrder.length - 1 ? stageOrder[i + 1] : null;
}

export function prevStage(stage: Stage): Stage | null {
  const i = stageOrder.indexOf(stage);
  return i > 0 ? stageOrder[i - 1] : null;
}

export function stageState(inv: Investigation, stage: Stage): StageState {
  const score = stageScore(inv, stage);
  const hard = hardFindings(inv);
  const attentionHere = hard.some((f) => f.stage === stage);
  const started = inv.status !== "draft";
  switch (stage) {
    case "problem":
      if (score === 1) return "complete";
      if (score === 0.5) return "in_progress";
      return started ? "needs_attention" : "empty";
    case "contain":
      if (inv.containment.length === 0) return "empty";
      return score === 1 ? "complete" : attentionHere && started ? "needs_attention" : "in_progress";
    case "investigate": {
      if (inv.causes.length === 0) return "empty";
      const needs = inv.causes.some((c) => c.removalTest === "not_sure");
      if (needs) return "needs_attention";
      return score === 1 ? "complete" : "in_progress";
    }
    case "root-cause": {
      const hasCandidates = inv.causes.some(
        (c) => c.classification !== "unclassified" || c.evidenceState !== "assumption" || c.candidate,
      );
      if (score === 1) return attentionHere ? "needs_attention" : "complete";
      if (inv.actions.length > 0 || inv.status === "reopened") return "needs_attention";
      return hasCandidates ? "in_progress" : "empty";
    }
    case "actions":
      if (inv.actions.length === 0) return inv.status === "verification" ? "needs_attention" : "empty";
      if (attentionHere && inv.verifications.length > 0) return "needs_attention";
      return score === 1 ? "complete" : "in_progress";
    case "verify": {
      if (inv.verifications.length === 0) return "empty";
      const notEffective = inv.verifications.some((v) => v.result === "not_effective");
      if (notEffective && inv.status !== "reopened") return "needs_attention";
      if (inv.status === "closed") return "verified";
      return score === 1 ? "complete" : "in_progress";
    }
    case "summary":
      if (inv.status === "closed") return "complete";
      return inv.lessons.length > 0 ? "in_progress" : "empty";
  }
}

export const stageStateLabels: Record<StageState, string> = {
  empty: "Empty",
  in_progress: "In progress",
  needs_attention: "Needs attention",
  complete: "Complete",
  verified: "Verified",
};
