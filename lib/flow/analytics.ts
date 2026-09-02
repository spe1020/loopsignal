import { trackTool } from "@/lib/loop/analytics";
import type { Stage } from "./schema";

export const flowEvents = [
  "loopflow_new",
  "loopflow_sample_open",
  "loopflow_step_added",
  "loopflow_decision_added",
  "loopflow_observation_recorded",
  "loopflow_pain_added",
  "loopflow_investigation_started",
  "loopflow_future_forked",
  "loopflow_walk_enter",
  "loopflow_export",
  "loopflow_import",
  "loopflow_print",
] as const;

export type FlowEvent = (typeof flowEvents)[number];

/** Only the event name, the stage, and numeric counts. Never step, lane, or pain text. */
export type FlowEventProps = { stage?: Stage } & Record<string, number | Stage | undefined>;

export function trackFlow(event: FlowEvent, props: FlowEventProps = {}) {
  trackTool(event, props, ["stage"]);
}
