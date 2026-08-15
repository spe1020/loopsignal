/** LoopSource quote comparison types. Commercial math stays deterministic. */

export const optimizationModes = [
  "balanced",
  "cost",
  "lead_time",
  "risk",
  "startup_flexibility",
] as const;
export type OptimizationMode = (typeof optimizationModes)[number];

export const sourceModes = ["single", "dual"] as const;
export type SourceMode = (typeof sourceModes)[number];

export const dualSplits = ["80/20", "70/30", "50/50"] as const;
export type DualSplit = (typeof dualSplits)[number];

export const qualificationStatuses = [
  "qualified",
  "conditional",
  "new",
] as const;
export type QualificationStatus = (typeof qualificationStatuses)[number];

export const freightKinds = ["included", "per_unit", "annual", "not_included"] as const;
export type FreightKind = (typeof freightKinds)[number];

export const flagSeverities = ["red", "amber", "green"] as const;
export type FlagSeverity = (typeof flagSeverities)[number];

export const flagCodes = [
  "freight_missing",
  "tooling_high",
  "moq_above_initial",
  "quote_expiring_soon",
  "lead_time_above_requirement",
  "capacity_below_demand",
  "capacity_confirmation",
  "new_supplier",
  "conditional_qualification",
  "sample_required",
  "landed_cost_incomplete",
] as const;
export type FlagCode = (typeof flagCodes)[number];

export const exceptionCodes = [
  "lead_time",
  "capacity",
  "moq",
] as const;
export type ExceptionCode = (typeof exceptionCodes)[number];

export const demandPresets = [5000, 12000, 25000, 50000] as const;
export type DemandPreset = (typeof demandPresets)[number];

export const scenarioIds = ["machined_aluminum_bracket"] as const;
export type ScenarioId = (typeof scenarioIds)[number];

export type PriceBreak = {
  minQty: number;
  unitPrice: number;
};

export type FreightTerm =
  | { kind: "included" }
  | { kind: "not_included" }
  | { kind: "per_unit"; amount: number }
  | { kind: "annual"; amount: number };

/** Future quote ingest can populate this shape from CSV, Excel, or PDF. */
export type QuoteSource = "sample" | "upload";

export type SupplierQuote = {
  id: string;
  name: string;
  source: QuoteSource;
  unitPrice: number;
  priceBreaks: PriceBreak[];
  tooling: number;
  toolingNote: string;
  moq: number;
  leadWeeks: number;
  annualCapacity: number;
  paymentTerms: string;
  paymentDays: number;
  freight: FreightTerm;
  origin: string;
  quoteValidThrough: string;
  qualification: QualificationStatus;
  sampleLeadWeeks: number;
  notes: string;
  strength: string;
};

export type RfqScenario = {
  id: ScenarioId;
  title: string;
  partName: string;
  annualDemand: number;
  initialRelease: number;
  requiredLeadWeeks: number;
  qualityTarget: string;
  destination: string;
  minCapacity: number;
  quoteAsOf: string;
};

export type ScenarioSettings = {
  demand: number;
  priority: OptimizationMode;
  sourceMode: SourceMode;
  dualSplit: DualSplit;
  secondaryId?: string;
};

export type CostResult = {
  unitPrice: number;
  annualPieceCost: number;
  tooling: number;
  toolingPerUnit: number;
  freightAmount: number | null;
  freightLabel: string;
  freightComplete: boolean;
  firstYearCost: number;
  effectiveUnitCost: number;
};

export type RiskFlag = {
  code: FlagCode;
  label: string;
  detail: string;
  severity: FlagSeverity;
  category: "commercial" | "delivery" | "qualification";
};

export type RequirementCheck = {
  code: ExceptionCode;
  label: string;
  required: string;
  quoted: string;
  meets: boolean;
  detail?: string;
};

export type CategoryScores = {
  cost: number;
  delivery: number;
  risk: number;
  flexibility: number;
  overall: number;
};

export type ScoreWeights = {
  cost: number;
  delivery: number;
  risk: number;
  flexibility: number;
};

export type HighlightBadge = {
  label: string;
  tone: "green" | "amber" | "red" | "blue";
};

export type RankedSupplier = {
  quote: SupplierQuote;
  cost: CostResult;
  scores: CategoryScores;
  rank: number;
  flags: RiskFlag[];
  requirements: RequirementCheck[];
  meetsAllRequirements: boolean;
  highlights: HighlightBadge[];
  rankReason: string;
  keyConcern: string;
};

export type Tradeoff = {
  gains: string[];
  giveUps: string[];
  summary: string;
};

export type SourcingAction = {
  id: string;
  label: string;
  detail: string;
};

export type SupplierNarrative = {
  strengths: string[];
  concerns: string[];
  recommendedActions: string[];
  tradeoff: Tradeoff;
  immediateActions: SourcingAction[];
  longerTermActions: SourcingAction[];
};

export type DualSourceView = {
  split: DualSplit;
  primaryId: string;
  secondaryId: string;
  primaryShare: number;
  secondaryShare: number;
  blendedQuotedUnit: number;
  blendedEffectiveUnit: number;
  blendedFirstYearCost: number;
  benefits: string[];
  tradeoff: string;
};

export type ColumnHighlight = {
  effectiveCostId: string;
  leadTimeId: string;
  toolingId: string;
  paymentId: string;
};

export type ComparisonResult = {
  rfq: RfqScenario;
  settings: ScenarioSettings;
  ranked: RankedSupplier[];
  recommended: RankedSupplier;
  columnHighlights: ColumnHighlight;
  dual?: DualSourceView;
  weights: ScoreWeights;
};

export const modeLabels: Record<OptimizationMode, string> = {
  balanced: "Balanced",
  cost: "Cost",
  lead_time: "Lead Time",
  risk: "Risk",
  startup_flexibility: "Startup Flexibility",
};

export const qualificationLabels: Record<QualificationStatus, string> = {
  qualified: "Qualified Supplier",
  conditional: "Conditional Qualification",
  new: "New Supplier",
};

export const splitShares: Record<DualSplit, [number, number]> = {
  "80/20": [0.8, 0.2],
  "70/30": [0.7, 0.3],
  "50/50": [0.5, 0.5],
};
