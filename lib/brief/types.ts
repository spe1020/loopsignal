/** LoopBrief daily operations types. Exception math stays deterministic. */

export const severities = ["red", "amber", "green", "blue"] as const;
export type Severity = (typeof severities)[number];

export const categories = [
  "production",
  "quality",
  "supply",
  "maintenance",
  "schedule",
] as const;
export type Category = (typeof categories)[number];

export const owners = [
  "Operations",
  "Supply Chain",
  "Buyer",
  "Quality",
  "Maintenance",
  "Planning",
  "Engineering",
] as const;
export type Owner = (typeof owners)[number];

export const actionTimings = [
  "now",
  "before_next_shift",
  "today",
  "this_week",
  "longer_term",
] as const;
export type ActionTiming = (typeof actionTimings)[number];

export const actionStatuses = [
  "open",
  "in_progress",
  "monitoring",
  "complete",
] as const;
export type ActionStatus = (typeof actionStatuses)[number];

export const actionHorizons = ["immediate", "structural"] as const;
export type ActionHorizon = (typeof actionHorizons)[number];

export const plantStatuses = ["stable", "watch", "action_required"] as const;
export type PlantStatus = (typeof plantStatuses)[number];

export const productionStatuses = [
  "on_plan",
  "watch",
  "action_required",
] as const;
export type ProductionStatus = (typeof productionStatuses)[number];

export const workCenters = [
  "CNC Machining",
  "Assembly Line 1",
  "Assembly Line 2",
  "Packaging Line",
  "Injection Molding",
] as const;
export type WorkCenter = (typeof workCenters)[number];

export const productFamilies = [
  "Machined Shaft Assembly",
  "Fastener Kit",
  "Molded Housing",
  "Aluminum Bracket",
  "Packaging Set",
  "Bearing Assembly",
] as const;
export type ProductFamily = (typeof productFamilies)[number];

export const meetingSteps = [
  "production",
  "quality",
  "supply",
  "maintenance",
  "schedule",
  "actions",
] as const;
export type MeetingStep = (typeof meetingSteps)[number];

export const relatedProducts = ["signal", "know", "source"] as const;
export type RelatedProduct = (typeof relatedProducts)[number];

export const scenarioIds = ["northfield_day_shift"] as const;
export type ScenarioId = (typeof scenarioIds)[number];

export type RelatedLink = {
  product: RelatedProduct;
  label: string;
  href: string;
};

export type ProductionRecord = {
  id: string;
  workCenter: WorkCenter;
  productFamily: ProductFamily;
  scheduledQty: number;
  actualQty: number;
  scheduledHours: number;
  actualHours: number;
  downtimeMinutes: number;
  previousDowntimeMinutes: number;
  previousAttainmentPct: number;
  primaryDowntimeReason: string;
  recoveryNote: string;
  recommendedAction: string;
};

export type QualityRecord = {
  id: string;
  workCenter: WorkCenter;
  productFamily: ProductFamily;
  issue: string;
  defectCategory: string;
  quantityAffected: number;
  scrapQty: number;
  reworkQty: number;
  inspectedQty: number;
  previousScrapPct: number;
  alertStatus: "active" | "cleared";
  containmentStatus: "active" | "none";
  owner: Owner;
  immediateAction: string;
  structuralAction: string;
};

export type SupplyRecord = {
  id: string;
  item: string;
  supplier: string;
  daysOfSupply: number;
  previousDaysOfSupply: number;
  replenishmentDays: number;
  affectedWorkCenter: WorkCenter;
  owner: Owner;
  immediateAction: string;
  structuralAction: string;
};

export type MaintenanceRecord = {
  id: string;
  asset: string;
  workCenter: WorkCenter;
  issue: string;
  downtimeMinutes: number;
  temporaryCountermeasure: string;
  permanentActionStatus: string;
  owner: Owner;
  immediateAction: string;
  structuralAction: string;
};

export type ScheduleRecord = {
  id: string;
  productFamily: ProductFamily;
  finishedGoodsDays: number;
  openDemand: number;
  nextShipment: string;
  shipmentInDays: number;
};

export type PlantProfile = {
  scenarioId: ScenarioId;
  name: string;
  shift: string;
  workCenters: WorkCenter[];
};

export type SampleSnapshot = {
  plant: PlantProfile;
  production: ProductionRecord[];
  quality: QualityRecord[];
  supply: SupplyRecord[];
  maintenance: MaintenanceRecord[];
  schedule: ScheduleRecord[];
};

export type ChangeDirection = "improved" | "declined" | "returned" | "unchanged";

export type ChangeItem = {
  id: string;
  category: Category;
  label: string;
  detail: string;
  direction: ChangeDirection;
  tone: Severity;
};

export const ownerTypes = ["human", "bot"] as const;
export type OwnerType = (typeof ownerTypes)[number];

export const humanRoles = [
  "Buyer",
  "Planner",
  "Quality Engineer",
  "Maintenance Technician",
  "Operations Supervisor",
  "Manufacturing Engineer",
  "Supply Chain Manager",
] as const;
export type HumanRole = (typeof humanRoles)[number];

export const botTypes = [
  "supplier_follow_up",
  "reporting",
  "knowledge",
  "sourcing",
  "monitoring",
] as const;
export type BotType = (typeof botTypes)[number];

export const botTaskStatuses = [
  "queued",
  "working",
  "ready_for_review",
  "approved",
  "complete",
  "needs_human_input",
] as const;
export type BotTaskStatus = (typeof botTaskStatuses)[number];

export const botControls = [
  "draft_only",
  "human_approval_required",
  "read_only_analysis",
] as const;
export type BotControl = (typeof botControls)[number];

export const actionOutcomes = [
  "resolved",
  "monitoring",
  "escalated",
  "permanent_action_required",
  "no_issue_found",
] as const;
export type ActionOutcome = (typeof actionOutcomes)[number];

export const personas = [
  "plant_manager",
  "buyer",
  "planner",
  "quality_engineer",
  "maintenance_lead",
  "operations_supervisor",
] as const;
export type Persona = (typeof personas)[number];

export const reportKinds = [
  "executive",
  "operations",
  "supply_chain",
  "procurement",
  "quality",
  "maintenance",
  "planning",
  "engineering",
  "open_actions",
] as const;
export type ReportKind = (typeof reportKinds)[number];

export const actionSources = [
  "loopbrief_production",
  "loopbrief_quality",
  "loopbrief_supply",
  "loopbrief_maintenance",
  "loopbrief_schedule",
  "loopsignal",
  "loopknow",
  "loopsource",
] as const;
export type ActionSource = (typeof actionSources)[number];

export const actionPriorityTiers = ["high", "medium", "low"] as const;
export type ActionPriorityTier = (typeof actionPriorityTiers)[number];

export type BriefAction = {
  id: string;
  issueId: string;
  action: string;
  title: string;
  owner: Owner;
  department: Owner;
  category: Category;
  priority: number;
  priorityTier: ActionPriorityTier;
  timing: ActionTiming;
  horizon: ActionHorizon;
  status: ActionStatus;
  severity: Severity;
  ownerType: OwnerType;
  assignedRole: HumanRole | "Demo Bot";
  botType?: BotType;
  botTask?: string;
  botControl?: BotControl;
  botStatus?: BotTaskStatus;
  source: ActionSource;
  sourceLabel: string;
  notes: string;
  overdue: boolean;
  dueAgeLabel?: string;
  related?: RelatedLink;
  eligibleForBot: boolean;
};

export type BriefIssue = {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  problem: string;
  area: string;
  workCenter?: WorkCenter;
  productFamily?: ProductFamily;
  owner: Owner;
  impact: string;
  immediateAction: string;
  structuralAction: string;
  related?: RelatedLink[];
  metrics: Array<{ label: string; value: string }>;
};

export type ProductionView = {
  record: ProductionRecord;
  attainmentPct: number;
  varianceQty: number;
  recoveryRequired: number;
  status: ProductionStatus;
  severity: Severity;
  statusLabel: string;
};

export type QualityView = {
  record: QualityRecord;
  scrapPct: number;
  severity: Severity;
  statusLabel: string;
};

export type SupplyView = {
  record: SupplyRecord;
  riskLevel: Severity;
  statusLabel: string;
};

export type MaintenanceView = {
  record: MaintenanceRecord;
  severity: Severity;
  statusLabel: string;
};

export type ScheduleView = {
  record: ScheduleRecord;
  status: "on_track" | "potential_risk";
  severity: Severity;
  statusLabel: string;
};

export type CategoryStripItem = {
  category: Category;
  severity: Severity;
  headline: string;
  detail: string;
};

export type PriorityItem = {
  rank: number;
  issue: BriefIssue;
};

export type PlantStatusView = {
  status: PlantStatus;
  label: string;
  reason: string;
  criticalCount: number;
  constraintCount: number;
};

export type BriefResult = {
  scenarioId: ScenarioId;
  plantName: string;
  shift: string;
  briefDate: string;
  briefDateLabel: string;
  summary: string;
  plantStatus: PlantStatusView;
  strip: CategoryStripItem[];
  production: ProductionView[];
  quality: QualityView[];
  supply: SupplyView[];
  maintenance: MaintenanceView[];
  schedule: ScheduleView[];
  issues: BriefIssue[];
  priorities: PriorityItem[];
  changes: ChangeItem[];
  actions: BriefAction[];
  overallAttainmentPct: number;
};

export const categoryLabels: Record<Category, string> = {
  production: "Production",
  quality: "Quality",
  supply: "Supply",
  maintenance: "Maintenance",
  schedule: "Schedule",
};

export const severityLabels: Record<Severity, string> = {
  red: "Immediate action required",
  amber: "Needs attention",
  green: "On plan",
  blue: "Follow-up",
};

export const severityShort: Record<Severity, string> = {
  red: "Immediate",
  amber: "Attention",
  green: "On Plan",
  blue: "Follow-up",
};

export const plantStatusLabels: Record<PlantStatus, string> = {
  stable: "Stable",
  watch: "Watch",
  action_required: "Action Required",
};

export const productionStatusLabels: Record<ProductionStatus, string> = {
  on_plan: "On Plan",
  watch: "Watch",
  action_required: "Action Required",
};

export const actionTimingLabels: Record<ActionTiming, string> = {
  now: "Now",
  before_next_shift: "Before Next Shift",
  today: "Today",
  this_week: "This Week",
  longer_term: "Longer Term",
};

export const actionStatusLabels: Record<ActionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  monitoring: "Monitoring",
  complete: "Complete",
};

export const actionHorizonLabels: Record<ActionHorizon, string> = {
  immediate: "Immediate",
  structural: "Structural",
};

export const meetingStepLabels: Record<MeetingStep, string> = {
  production: "Production",
  quality: "Quality",
  supply: "Supply",
  maintenance: "Maintenance",
  schedule: "Schedule",
  actions: "Open Actions",
};

export const ownerLabels: Record<Owner, Owner> = {
  Operations: "Operations",
  "Supply Chain": "Supply Chain",
  Buyer: "Buyer",
  Quality: "Quality",
  Maintenance: "Maintenance",
  Planning: "Planning",
  Engineering: "Engineering",
};

export const ownerTypeLabels: Record<OwnerType, string> = {
  human: "Human",
  bot: "Bot",
};

export const botTypeLabels: Record<BotType, string> = {
  supplier_follow_up: "Supplier Follow-Up Bot",
  reporting: "Reporting Bot",
  knowledge: "Knowledge Bot",
  sourcing: "Sourcing Bot",
  monitoring: "Monitoring Bot",
};

export const botStatusLabels: Record<BotTaskStatus, string> = {
  queued: "Queued",
  working: "Working",
  ready_for_review: "Ready for Review",
  approved: "Approved",
  complete: "Complete",
  needs_human_input: "Needs Human Input",
};

export const botControlLabels: Record<BotControl, string> = {
  draft_only: "Draft Only",
  human_approval_required: "Human Approval Required",
  read_only_analysis: "Read-Only Analysis",
};

export const outcomeLabels: Record<ActionOutcome, string> = {
  resolved: "Resolved",
  monitoring: "Monitoring",
  escalated: "Escalated",
  permanent_action_required: "Permanent Action Required",
  no_issue_found: "No Issue Found",
};

export const personaLabels: Record<Persona, string> = {
  plant_manager: "Plant Manager",
  buyer: "Buyer",
  planner: "Planner",
  quality_engineer: "Quality Engineer",
  maintenance_lead: "Maintenance Lead",
  operations_supervisor: "Operations Supervisor",
};

export const reportKindLabels: Record<ReportKind, string> = {
  executive: "Executive Summary",
  operations: "Operations Brief",
  supply_chain: "Supply Chain Brief",
  procurement: "Procurement Brief",
  quality: "Quality Brief",
  maintenance: "Maintenance Brief",
  planning: "Planning Brief",
  engineering: "Engineering Brief",
  open_actions: "Open Actions Report",
};

export const priorityTierLabels: Record<ActionPriorityTier, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function priorityTierFor(priority: number): ActionPriorityTier {
  if (priority <= 2) return "high";
  if (priority <= 3) return "medium";
  return "low";
}
