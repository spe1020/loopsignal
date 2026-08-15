export const RISK_LEVELS = [
  "critical",
  "at_risk",
  "needs_confirmation",
  "on_track",
] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];

export const RISK_RANK: Record<RiskLevel, number> = {
  critical: 4,
  at_risk: 3,
  needs_confirmation: 2,
  on_track: 1,
};

export type ActionOwner =
  | "Buyer"
  | "Planner"
  | "Supply Chain"
  | "Procurement"
  | "Operations";

export type PrimaryActionKind = "contact" | "inventory" | "confirm";

export type PrimaryAction = {
  label: string;
  kind: PrimaryActionKind;
};

export type RiskFilter = "all" | RiskLevel;

export type SortKey =
  | "priority"
  | "open_value"
  | "days_late"
  | "supplier"
  | "buyer";

export const REASON_CODES = [
  "past_due",
  "no_promised_date",
  "due_soon",
  "due_approaching",
  "substantial_open",
  "coverage_gap",
  "tight_coverage",
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];

export type ExpectedDateSource = "promised" | "due";

export type RawPoRow = {
  poNumber: string;
  supplier: string;
  item: string;
  description: string;
  orderDate: string | null;
  dueDate: string;
  promisedDate: string | null;
  quantityOrdered: number;
  quantityReceived: number;
  buyer: string | null;
  inventoryOnHand: number | null;
  dailyUsage: number | null;
  leadTimeDays: number | null;
  unitCost: number | null;
};

export type InventoryCoverage = {
  daysOfSupply: number;
  expectedReplenishmentDays: number | null;
  coverageGapDays: number | null;
  replenishmentOverdue: boolean;
};

export type EngineOrder = {
  poNumber: string;
  supplier: string;
  item: string;
  description: string;
  buyer: string | null;
  quantityOrdered: number;
  quantityReceived: number;
  openQuantity: number;
  openPct: number;
  unitCost: number | null;
  openValue: number | null;
  orderDate: string | null;
  dueDate: string;
  promisedDate: string | null;
  expectedDate: string;
  expectedDateSource: ExpectedDateSource;
  daysPastDue: number;
  daysUntilDue: number;
  hasPromisedDate: boolean;
  inventoryOnHand: number | null;
  dailyUsage: number | null;
  inventory: InventoryCoverage | null;
  riskLevel: RiskLevel;
  reasonCodes: ReasonCode[];
  priority: number;
};

export type FollowUpDraft = {
  subject: string;
  body: string;
};

export type AnalyzedOrder = EngineOrder & {
  reasons: string[];
  whyItMatters: string;
  shortReason: string;
  immediateActions: string[];
  longerTermActions: string[];
  suggestedOwner: ActionOwner | null;
  primaryAction: PrimaryAction | null;
  followUp: FollowUpDraft;
};

export type RiskSummary = {
  critical: number;
  atRisk: number;
  needsConfirmation: number;
  onTrack: number;
};

export type SupplierSignal = {
  supplier: string;
  attentionCount: number;
  overdueCount: number;
  unconfirmedCount: number;
  criticalCount: number;
  atRiskCount: number;
  needsConfirmationCount: number;
  highestRisk: RiskLevel;
  flaggedValue: number | null;
  primaryIssue: string;
  summary: string;
};

export type ExposureMetrics = {
  hasCost: boolean;
  openValue: number | null;
  flaggedValue: number | null;
  criticalValue: number | null;
};

export type SignalDashboard = {
  summary: RiskSummary;
  brief: string;
  attention: AnalyzedOrder[];
  suppliers: SupplierSignal[];
  buyers: string[];
  exposure: ExposureMetrics;
  priorities: string[];
};

export type SignalMeta = {
  source: "sample" | "upload";
  asOfDate: string;
  rowCount: number;
  openCount: number;
  receivedCount: number;
  skippedRowCount: number;
  hasInventoryFields: boolean;
  hasBuyer: boolean;
  hasCostFields: boolean;
  rowCountBucket: string;
};

export type SignalAnalysisResult = {
  ok: true;
  meta: SignalMeta;
  orders: AnalyzedOrder[];
  dashboard: SignalDashboard;
};

export type SignalErrorResponse = {
  error: string;
};

export class SignalClientError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "SignalClientError";
    this.status = status;
  }
}

export const RISK_THRESHOLDS = {
  criticalPastDueDays: 7,
  atRiskPastDueDays: 1,
  dueSoonDays: 3,
  dueApproachingDays: 7,
  substantialOpenPct: 0.75,
  lateCoverageDays: 14,
  tightCoverageDays: 7,
} as const;

export const SIGNAL_LIMITS = {
  maxFileBytes: 1_048_576,
  maxRows: 2_500,
  maxFieldChars: 120,
} as const;
