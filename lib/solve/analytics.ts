import { trackTool } from "@/lib/loop/analytics";
import type { Stage } from "./schema";

export const solveEvents = [
  "loopsolve_new",
  "loopsolve_sample_open",
  "loopsolve_why_added",
  "loopsolve_branch_added",
  "loopsolve_fishbone_cause_added",
  "loopsolve_evidence_added",
  "loopsolve_root_cause_selected",
  "loopsolve_action_created",
  "loopsolve_verification_complete",
  "loopsolve_closed",
  "loopsolve_reopened",
  "loopsolve_export",
  "loopsolve_import",
  "loopsolve_shopfloor_toggle",
  "loopsolve_facilitation_enter",
  "loopsolve_print",
] as const;

export type SolveEvent = (typeof solveEvents)[number];

/** Only the event name, the stage, and numeric counts. Never text. */
export type SolveEventProps = { stage?: Stage } & Record<string, number | Stage | undefined>;

export function trackSolve(event: SolveEvent, props: SolveEventProps = {}) {
  trackTool(event, props, ["stage"]);
}
