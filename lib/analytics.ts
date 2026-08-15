import { track as vercelTrack } from "@vercel/analytics";
import {
  getLeadAttribution,
  getReferringPage,
  getUtmParams,
  type UtmParams,
} from "@/lib/attribution";

export const analyticsEvents = [
  "loopscan_cta_click",
  "loopscan_page_view",
  "loopscan_form_start",
  "loopscan_area_selected",
  "loopscan_form_submit",
  "loopscan_form_error",
  "schedule_click",
  "solution_interest",
  "insight_view",
  "insight_cta_click",
  "signal_page_view",
  "signal_sample_run",
  "signal_upload_start",
  "signal_analysis_success",
  "signal_analysis_error",
  "signal_loopscan_click",
  "loopknow_page_view",
  "loopknow_sample_question",
  "loopknow_search",
  "loopknow_document_view",
  "loopknow_answer_generated",
  "loopknow_no_answer",
  "loopknow_loopscan_click",
  "loopsource_page_view",
  "loopsource_sample_run",
  "loopsource_supplier_select",
  "loopsource_priority_change",
  "loopsource_volume_change",
  "loopsource_dual_source_toggle",
  "loopsource_loopscan_click",
  "loopbrief_page_view",
  "loopbrief_run",
  "loopbrief_category_filter",
  "loopbrief_owner_filter",
  "loopbrief_issue_select",
  "loopbrief_meeting_mode",
  "loopbrief_action_status_change",
  "loopbrief_copy",
  "loopbrief_loopscan_click",
] as const;

export type AnalyticsEvent = (typeof analyticsEvents)[number];

export type AnalyticsProps = Record<
  string,
  string | number | boolean | undefined
>;

export type CtaLocation =
  | "hero"
  | "solutions"
  | "loopscan_section"
  | "footer"
  | "article"
  | "navigation"
  | "use_cases"
  | "final_cta"
  | "about"
  | "how_it_works"
  | "not_found"
  | "signal"
  | "loopknow"
  | "loopsource"
  | "loopbrief"
  | "demo";

export type SolutionInterest =
  | "supply_chain"
  | "procurement"
  | "manufacturing"
  | "knowledge";

export type SolutionInteraction = "card_click" | "learn_more" | "cta_click";

export type OperationalArea =
  | "procurement"
  | "supply_chain"
  | "operations"
  | "quality"
  | "engineering"
  | "planning"
  | "knowledge"
  | "other";

export type FormErrorCategory = "server" | "network";

export type SignalErrorCategory =
  | "validation"
  | "size"
  | "parse"
  | "server"
  | "network";

export type SignalAnalysisMeta = {
  source: "sample" | "upload";
  row_count_bucket: string;
  inventory_fields: boolean;
};

const areaSlugs: Record<string, OperationalArea> = {
  Procurement: "procurement",
  "Supply Chain": "supply_chain",
  Operations: "operations",
  Quality: "quality",
  Engineering: "engineering",
  Planning: "planning",
  "Knowledge / Documentation": "knowledge",
  Other: "other",
};

export function toAreaSlug(area: string): OperationalArea {
  return areaSlugs[area] ?? "other";
}

function compact(
  props?: AnalyticsProps,
): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined;
  const next: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== "") next[key] = value;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function trackEvent(event: AnalyticsEvent, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;

  const data = compact(props);
  window.dispatchEvent(
    new CustomEvent("loopworks:analytics", { detail: { event, data } }),
  );
  vercelTrack(event, data);
}

export function trackLoopScanCTA(input: {
  location: CtaLocation;
  page?: string;
  cta_text?: string;
}) {
  trackEvent("loopscan_cta_click", {
    location: input.location,
    page: input.page ?? window.location.pathname,
    cta_text: input.cta_text,
  });
}

export function trackLoopScanPageView() {
  const utm = getUtmParams();
  trackEvent("loopscan_page_view", {
    referring_page: getReferringPage(),
    ...utm,
  });
}

export function trackLoopScanFormStart() {
  trackEvent("loopscan_form_start");
}

export function trackLoopScanAreaSelected(area: string) {
  trackEvent("loopscan_area_selected", { area: toAreaSlug(area) });
}

export function trackLoopScanFormSubmit(area: string) {
  trackEvent("loopscan_form_submit", {
    area: toAreaSlug(area),
    ...getUtmParams(),
  });
}

export function trackLoopScanFormError(input: {
  category: FormErrorCategory;
  area?: string;
}) {
  trackEvent("loopscan_form_error", {
    error_category: input.category,
    page: "/loopscan",
    area: input.area ? toAreaSlug(input.area) : undefined,
  });
}

export function trackScheduleClick() {
  const utm = getUtmParams();
  trackEvent("schedule_click", {
    source: "loopscan_confirmation",
    utm_source: utm.utm_source,
    utm_campaign: utm.utm_campaign,
  });
}

export function trackSolutionInterest(input: {
  solution: SolutionInterest;
  page?: string;
  interaction_type: SolutionInteraction;
}) {
  trackEvent("solution_interest", {
    solution: input.solution,
    page: input.page ?? window.location.pathname,
    interaction_type: input.interaction_type,
  });
}

export function trackInsightView(input: {
  article_slug: string;
  article_category: string;
}) {
  trackEvent("insight_view", {
    article_slug: input.article_slug,
    article_category: input.article_category,
    referring_source: getLeadAttribution().referringSource,
  });
}

export function trackInsightCtaClick(input: {
  article_slug?: string;
  page?: string;
  cta_text?: string;
  destination?: string;
}) {
  trackEvent("insight_cta_click", {
    article_slug: input.article_slug,
    page: input.page ?? window.location.pathname,
    cta_text: input.cta_text,
    destination: input.destination ?? "loopscan",
  });
}

export function trackSignalPageView() {
  trackEvent("signal_page_view", {
    referring_page: getReferringPage(),
  });
}

export function trackSignalSampleRun() {
  trackEvent("signal_sample_run", { source: "sample" });
}

export function trackSignalUploadStart() {
  trackEvent("signal_upload_start", { source: "upload" });
}

export function trackSignalAnalysisSuccess(meta: SignalAnalysisMeta) {
  trackEvent("signal_analysis_success", {
    source: meta.source,
    row_count_bucket: meta.row_count_bucket,
    inventory_fields: meta.inventory_fields,
  });
}

export function trackSignalAnalysisError(category: SignalErrorCategory) {
  trackEvent("signal_analysis_error", {
    error_category: category,
    page: "/signal",
  });
}

export function trackSignalLoopScanClick(input: { cta_text?: string }) {
  trackEvent("signal_loopscan_click", {
    page: "/signal",
    cta_text: input.cta_text,
    destination: "loopscan",
  });
}

export type KnowAnswerMeta = {
  question_category: string;
  answer_state: string;
  source_count: number;
  document_type?: string;
};

export function trackKnowPageView() {
  trackEvent("loopknow_page_view", {
    referring_page: getReferringPage(),
  });
}

export function trackKnowSampleQuestion(category: string) {
  trackEvent("loopknow_sample_question", {
    question_category: category,
  });
}

export function trackKnowSearch(input: { result_count: number; filter: string }) {
  trackEvent("loopknow_search", {
    result_count: input.result_count,
    document_filter: input.filter,
  });
}

export function trackKnowDocumentView(documentType: string) {
  trackEvent("loopknow_document_view", {
    document_type: documentType,
  });
}

export function trackKnowAnswerGenerated(meta: KnowAnswerMeta) {
  trackEvent("loopknow_answer_generated", {
    question_category: meta.question_category,
    answer_state: meta.answer_state,
    source_count: meta.source_count,
    document_type: meta.document_type,
  });
}

export function trackKnowNoAnswer(category: string) {
  trackEvent("loopknow_no_answer", {
    question_category: category,
    answer_state: "no_answer",
  });
}

export function trackKnowLoopScanClick(input: { cta_text?: string }) {
  trackEvent("loopknow_loopscan_click", {
    page: "/know",
    cta_text: input.cta_text,
    destination: "loopscan",
  });
}

export type SourceDemoMeta = {
  sample_scenario: string;
  optimization_mode: string;
  demand_bucket: string;
  source_mode: string;
  selected_supplier_rank?: number;
};

export function trackSourcePageView() {
  trackEvent("loopsource_page_view", {
    referring_page: getReferringPage(),
  });
}

export function trackSourceSampleRun(meta: SourceDemoMeta) {
  trackEvent("loopsource_sample_run", {
    sample_scenario: meta.sample_scenario,
    optimization_mode: meta.optimization_mode,
    demand_bucket: meta.demand_bucket,
    source_mode: meta.source_mode,
  });
}

export function trackSourceSupplierSelect(meta: SourceDemoMeta) {
  trackEvent("loopsource_supplier_select", {
    sample_scenario: meta.sample_scenario,
    optimization_mode: meta.optimization_mode,
    demand_bucket: meta.demand_bucket,
    source_mode: meta.source_mode,
    selected_supplier_rank: meta.selected_supplier_rank,
  });
}

export function trackSourcePriorityChange(meta: SourceDemoMeta) {
  trackEvent("loopsource_priority_change", {
    sample_scenario: meta.sample_scenario,
    optimization_mode: meta.optimization_mode,
    demand_bucket: meta.demand_bucket,
    source_mode: meta.source_mode,
  });
}

export function trackSourceVolumeChange(meta: SourceDemoMeta) {
  trackEvent("loopsource_volume_change", {
    sample_scenario: meta.sample_scenario,
    optimization_mode: meta.optimization_mode,
    demand_bucket: meta.demand_bucket,
    source_mode: meta.source_mode,
  });
}

export function trackSourceDualSourceToggle(meta: SourceDemoMeta) {
  trackEvent("loopsource_dual_source_toggle", {
    sample_scenario: meta.sample_scenario,
    optimization_mode: meta.optimization_mode,
    demand_bucket: meta.demand_bucket,
    source_mode: meta.source_mode,
  });
}

export function trackSourceLoopScanClick(input: { cta_text?: string }) {
  trackEvent("loopsource_loopscan_click", {
    page: "/source",
    cta_text: input.cta_text,
    destination: "loopscan",
  });
}

export type BriefDemoMeta = {
  sample_scenario?: string;
  category?: string;
  severity?: string;
  owner?: string;
  action_timing?: string;
  meeting_mode?: boolean;
};

export function trackBriefPageView() {
  trackEvent("loopbrief_page_view", {
    referring_page: getReferringPage(),
  });
}

export function trackBriefRun(meta: BriefDemoMeta = {}) {
  trackEvent("loopbrief_run", {
    sample_scenario: meta.sample_scenario ?? "northfield_day_shift",
  });
}

export function trackBriefCategoryFilter(meta: BriefDemoMeta) {
  trackEvent("loopbrief_category_filter", {
    sample_scenario: meta.sample_scenario,
    category: meta.category,
  });
}

export function trackBriefOwnerFilter(meta: BriefDemoMeta) {
  trackEvent("loopbrief_owner_filter", {
    sample_scenario: meta.sample_scenario,
    owner: meta.owner,
  });
}

export function trackBriefIssueSelect(meta: BriefDemoMeta) {
  trackEvent("loopbrief_issue_select", {
    sample_scenario: meta.sample_scenario,
    category: meta.category,
    severity: meta.severity,
  });
}

export function trackBriefMeetingMode(meta: BriefDemoMeta) {
  trackEvent("loopbrief_meeting_mode", {
    sample_scenario: meta.sample_scenario,
    meeting_mode: meta.meeting_mode,
  });
}

export function trackBriefActionStatusChange(meta: BriefDemoMeta) {
  trackEvent("loopbrief_action_status_change", {
    sample_scenario: meta.sample_scenario,
    action_timing: meta.action_timing,
    owner: meta.owner,
  });
}

export function trackBriefCopy(meta: BriefDemoMeta = {}) {
  trackEvent("loopbrief_copy", {
    sample_scenario: meta.sample_scenario ?? "northfield_day_shift",
  });
}

export function trackBriefLoopScanClick(input: { cta_text?: string }) {
  trackEvent("loopbrief_loopscan_click", {
    page: "/brief",
    cta_text: input.cta_text,
    destination: "loopscan",
  });
}

export type { UtmParams };
