import { analyzeBrief, todayStamp } from "./engine";
import { buildExecutiveSummary } from "./interpret";
import { getSampleSnapshot } from "./sample";
import type { BriefResult } from "./types";

export {
  analyzeBrief,
  filterActions,
  filterIssues,
  formatBriefDate,
  formatDays,
  formatPct,
  formatQty,
  productionStatusFor,
  round1,
  roundPct,
  todayStamp,
} from "./engine";
export {
  buildExecutiveSummary,
  buildExportText,
  recommendIssueCopy,
} from "./interpret";
export { getSampleSnapshot, sampleSnapshot } from "./sample";
export type { BriefInterpretationRequest, FutureBriefIngest } from "./ai";
export type {
  ActionHorizon,
  ActionStatus,
  ActionTiming,
  BriefAction,
  BriefIssue,
  BriefResult,
  Category,
  ChangeItem,
  MeetingStep,
  Owner,
  PlantStatus,
  PriorityItem,
  ProductionView,
  QualityView,
  RelatedLink,
  SampleSnapshot,
  ScenarioId,
  Severity,
  SupplyView,
} from "./types";
export {
  actionHorizonLabels,
  actionStatusLabels,
  actionStatuses,
  actionTimingLabels,
  actionTimings,
  categories,
  categoryLabels,
  meetingStepLabels,
  meetingSteps,
  owners,
  plantStatusLabels,
  productionStatusLabels,
  severityLabels,
  severityShort,
} from "./types";

export const SAMPLE_SCENARIO = "northfield_day_shift";

export function runSampleBrief(briefDate = todayStamp()): BriefResult {
  const analyzed = analyzeBrief(getSampleSnapshot(), briefDate);
  return {
    ...analyzed,
    summary: buildExecutiveSummary({
      production: analyzed.production,
      quality: analyzed.quality,
      supply: analyzed.supply,
      leadershipCount: analyzed.priorities.length,
    }),
  };
}

export function scenarioMeta() {
  return { sample_scenario: SAMPLE_SCENARIO };
}
