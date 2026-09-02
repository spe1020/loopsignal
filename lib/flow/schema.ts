import { z } from "zod";

/** Bump when the document shape changes; add a migration in io.ts. */
export const SCHEMA_VERSION = 1;

const entity = {
  id: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
};

export const mapStatuses = ["draft", "current_mapped", "future_drafted", "improving", "complete"] as const;
export const MapStatusSchema = z.enum(mapStatuses);
export type MapStatus = z.infer<typeof MapStatusSchema>;

export const laneKinds = ["role", "department", "system", "customer", "supplier"] as const;
export const LaneSchema = z.object({
  ...entity,
  name: z.string().default(""),
  kind: z.enum(laneKinds).default("role"),
  order: z.number().default(0),
});
export type Lane = z.infer<typeof LaneSchema>;
export type LaneKind = Lane["kind"];

export const timeUnits = ["minutes", "hours", "days"] as const;
export type TimeUnit = (typeof timeUnits)[number];

export const stepTypes = ["process", "decision", "wait", "inspection", "transport", "storage", "start", "end"] as const;
export const valueClasses = ["va", "nnva", "nva", "unclassified"] as const;
export const timeSources = ["observed", "estimated", "system_record", "unknown"] as const;

export const TimeObservationSchema = z.object({
  id: z.string().min(1),
  at: z.string(),
  durationMin: z.number().nonnegative(),
  note: z.string().optional(),
});
export type TimeObservation = z.infer<typeof TimeObservationSchema>;

export const StepSchema = z.object({
  ...entity,
  laneId: z.string(),
  order: z.number().default(0),
  type: z.enum(stepTypes).default("process"),
  name: z.string().default(""),
  description: z.string().optional(),
  /** Touch time in minutes. undefined = unknown. Storage is always minutes. */
  cycleTimeMin: z.number().nonnegative().optional(),
  /** Queue / wait before this step starts, in minutes. undefined = none recorded. */
  waitBeforeMin: z.number().nonnegative().optional(),
  valueClass: z.enum(valueClasses).default("unclassified"),
  system: z.string().optional(),
  trigger: z.string().optional(),
  batchSize: z.number().positive().optional(),
  firstPassYield: z.number().min(0).max(1).optional(),
  timeSource: z.enum(timeSources).default("unknown"),
  observations: z.array(TimeObservationSchema).default([]),
});
export type Step = z.infer<typeof StepSchema>;
export type StepType = Step["type"];
export type ValueClass = Step["valueClass"];
export type TimeSource = Step["timeSource"];

export const EdgeSchema = z.object({
  ...entity,
  fromStepId: z.string(),
  toStepId: z.string(),
  label: z.string().optional(),
  /** The main path. Exactly one primary out-edge per step except the last. */
  isPrimary: z.boolean().default(false),
});
export type Edge = z.infer<typeof EdgeSchema>;

export const painCategories = ["waiting", "rework", "handoff", "information", "system", "quality", "safety", "other"] as const;
export const severities = ["low", "medium", "high"] as const;
export const PainPointSchema = z.object({
  ...entity,
  stepId: z.string(),
  text: z.string().default(""),
  category: z.enum(painCategories).default("other"),
  severity: z.enum(severities).default("medium"),
  /** LoopSolve investigation opened from this pain point. */
  investigationId: z.string().optional(),
});
export type PainPoint = z.infer<typeof PainPointSchema>;
export type PainCategory = PainPoint["category"];
export type Severity = PainPoint["severity"];

export const LinkedActionSchema = z.object({
  investigationId: z.string(),
  actionId: z.string(),
});
export type LinkedAction = z.infer<typeof LinkedActionSchema>;

/** Why a future-state step was added, changed, or removed. Keyed by step id. */
export const ChangeRationaleSchema = z.object({
  text: z.string().default(""),
  linkedAction: LinkedActionSchema.optional(),
});
export type ChangeRationale = z.infer<typeof ChangeRationaleSchema>;

export const versionKinds = ["current", "future"] as const;
export type VersionKind = (typeof versionKinds)[number];

export const MapVersionSchema = z.object({
  kind: z.enum(versionKinds),
  steps: z.array(StepSchema).default([]),
  edges: z.array(EdgeSchema).default([]),
  painPoints: z.array(PainPointSchema).default([]),
  notes: z.string().optional(),
  /** future step id → current step id it derives from. */
  forkedFromStepIds: z.record(z.string(), z.string()).optional(),
  /**
   * Rationale for every future-state change. Keyed by the future step id for
   * added / changed steps and by the current step id for removed steps.
   */
  rationale: z.record(z.string(), ChangeRationaleSchema).default({}),
});
export type MapVersion = z.infer<typeof MapVersionSchema>;

export const LinkedInvestigationSchema = z.object({
  id: z.string().min(1),
  /** LoopSolve id in the same browser store. */
  investigationId: z.string(),
  stepId: z.string().optional(),
  painPointId: z.string().optional(),
  openedAt: z.string(),
  /** LoopSolve status as last seen by the UI; refreshed on load. */
  lastKnownStatus: z.string().optional(),
});
export type LinkedInvestigation = z.infer<typeof LinkedInvestigationSchema>;

export const historyTypes = ["created", "current_mapped", "future_forked", "investigation_opened", "imported", "duplicated"] as const;
export const HistoryEventSchema = z.object({
  id: z.string(),
  at: z.string(),
  type: z.enum(historyTypes),
  note: z.string().optional(),
});
export type HistoryEvent = z.infer<typeof HistoryEventSchema>;

export const ScopeSchema = z.object({
  startsWith: z.string().default(""),
  endsWith: z.string().default(""),
});
export type Scope = z.infer<typeof ScopeSchema>;

export const ProcessMapSchema = z.object({
  ...entity,
  schemaVersion: z.number().int().default(SCHEMA_VERSION),
  mapNumber: z.string(),
  title: z.string().default(""),
  process: z.string().optional(),
  owner: z.string().optional(),
  department: z.string().optional(),
  site: z.string().optional(),
  scope: ScopeSchema.default({ startsWith: "", endsWith: "" }),
  unit: z.enum(timeUnits).default("minutes"),
  lanes: z.array(LaneSchema).default([]),
  versions: z.object({
    current: MapVersionSchema,
    future: MapVersionSchema.optional(),
  }),
  investigations: z.array(LinkedInvestigationSchema).default([]),
  history: z.array(HistoryEventSchema).default([]),
  status: MapStatusSchema.default("draft"),
  shopFloorMode: z.boolean().default(false),
  /** Explicit "we looked and there are no pain points." */
  noPainPoints: z.boolean().default(false),
});
export type ProcessMap = z.infer<typeof ProcessMapSchema>;

/** Portable bundle: a map plus the LoopSolve investigations it links to. */
export const MapBundleSchema = z.object({
  kind: z.literal("loopflow-bundle"),
  map: ProcessMapSchema,
  investigations: z.array(z.unknown()).default([]),
});
export type MapBundle = z.infer<typeof MapBundleSchema>;

export const stages = ["scope", "map", "analyze", "future", "summary"] as const;
export type Stage = (typeof stages)[number];

export function isStage(value: string): value is Stage {
  return (stages as readonly string[]).includes(value);
}
