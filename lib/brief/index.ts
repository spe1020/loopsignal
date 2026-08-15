import { SAMPLE_AS_OF_DATE } from "@/lib/sample-as-of";
import { analyzeBrief } from "./engine";
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
export {
  buildExecutiveEmail,
  buildMyActionsText,
  buildReport,
  resolveActions,
} from "./reports";
export {
  EMAIL_SENDING_ENABLED,
  demoSchedules,
  executiveGroup,
} from "./delivery";
export { botDraft, botPreview, botCapabilities, defaultBotForAction } from "./bots";
export {
  accountabilityCounts,
  actionsForPersona,
  defaultAccountabilityFilter,
  filterAccountability,
  makeStructuralFollowUp,
} from "./ops";
export type { BriefInterpretationRequest, FutureBriefIngest, FutureEmailSend } from "./ai";
export type {
  ActionHorizon,
  ActionOutcome,
  ActionStatus,
  ActionTiming,
  BotType,
  BriefAction,
  BriefIssue,
  BriefResult,
  Category,
  ChangeItem,
  HumanRole,
  MeetingStep,
  Owner,
  OwnerType,
  Persona,
  PlantStatus,
  PriorityItem,
  ProductionView,
  QualityView,
  RelatedLink,
  ReportKind,
  SampleSnapshot,
  ScenarioId,
  Severity,
  SupplyView,
} from "./types";
export {
  actionHorizonLabels,
  actionOutcomes,
  actionStatusLabels,
  actionStatuses,
  actionTimingLabels,
  actionTimings,
  botControls,
  botControlLabels,
  botStatusLabels,
  botTaskStatuses,
  botTypeLabels,
  botTypes,
  categories,
  categoryLabels,
  humanRoles,
  meetingStepLabels,
  meetingSteps,
  outcomeLabels,
  owners,
  ownerTypeLabels,
  personaLabels,
  personas,
  plantStatusLabels,
  priorityTierLabels,
  productionStatusLabels,
  reportKindLabels,
  reportKinds,
  severityLabels,
  severityShort,
} from "./types";

export const SAMPLE_SCENARIO = "northfield_day_shift";

export { SAMPLE_AS_OF_DATE, formatSampleAsOf } from "@/lib/sample-as-of";

export function runSampleBrief(briefDate = SAMPLE_AS_OF_DATE): BriefResult {
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
