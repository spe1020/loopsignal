import { z } from "zod";

/** Bump when the document shape changes; add a migration in io.ts. */
export const SCHEMA_VERSION = 1;

const entity = {
  id: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
};

export const investigationStatuses = [
  "draft",
  "investigating",
  "action_open",
  "verification",
  "reopened",
  "closed",
] as const;
export const InvestigationStatusSchema = z.enum(investigationStatuses);
export type InvestigationStatus = z.infer<typeof InvestigationStatusSchema>;

export const ImpactFlagsSchema = z.object({
  customer: z.boolean().default(false),
  financial: z.boolean().default(false),
  safety: z.boolean().default(false),
  quality: z.boolean().default(false),
  delivery: z.boolean().default(false),
});
export type ImpactFlags = z.infer<typeof ImpactFlagsSchema>;

export const ProblemStatementSchema = z.object({
  whatHappened: z.string().default(""),
  whatShouldHaveHappened: z.string().default(""),
  where: z.string().default(""),
  when: z.string().default(""),
  whenIso: z.string().optional(),
  frequency: z.string().default(""),
  impact: z.string().default(""),
  affected: z.string().default(""),
  process: z.string().optional(),
  department: z.string().optional(),
  equipment: z.string().optional(),
  product: z.string().optional(),
  impactFlags: ImpactFlagsSchema.default({
    customer: false,
    financial: false,
    safety: false,
    quality: false,
    delivery: false,
  }),
  financialImpactNote: z.string().optional(),
  generatedStatement: z.string().default(""),
});
export type ProblemStatement = z.infer<typeof ProblemStatementSchema>;

export const containmentStatuses = [
  "open",
  "in_progress",
  "verified",
  "released",
] as const;
export const ContainmentActionSchema = z.object({
  ...entity,
  action: z.string().default(""),
  owner: z.string().default(""),
  scope: z.string().default(""),
  startedAt: z.string().optional(),
  quantityAffected: z.string().optional(),
  verificationNote: z.string().optional(),
  status: z.enum(containmentStatuses).default("open"),
});
export type ContainmentAction = z.infer<typeof ContainmentActionSchema>;
export type ContainmentStatus = ContainmentAction["status"];

export const causeOrigins = ["why", "fishbone", "promoted"] as const;
export const evidenceStates = [
  "assumption",
  "observed",
  "data_supported",
  "verified",
  "disproved",
] as const;
export const causeClassifications = [
  "unclassified",
  "symptom",
  "contributing",
  "root",
] as const;
export const removalTests = ["yes", "no", "not_sure"] as const;

export const CauseNodeSchema = z.object({
  ...entity,
  text: z.string().default(""),
  parentId: z.string().nullable().default(null),
  origin: z.enum(causeOrigins).default("why"),
  categoryId: z.string().optional(),
  evidenceState: z.enum(evidenceStates).default("assumption"),
  classification: z.enum(causeClassifications).default("unclassified"),
  rootCauseRationale: z.string().optional(),
  removalTest: z.enum(removalTests).optional(),
  note: z.string().optional(),
  challenged: z.boolean().default(false),
  candidate: z.boolean().default(false),
  collapsed: z.boolean().default(false),
  order: z.number().default(0),
});
export type CauseNode = z.infer<typeof CauseNodeSchema>;
export type CauseOrigin = CauseNode["origin"];
export type EvidenceState = CauseNode["evidenceState"];
export type CauseClassification = CauseNode["classification"];
export type RemovalTest = NonNullable<CauseNode["removalTest"]>;

export const FishboneCategorySchema = z.object({
  ...entity,
  name: z.string().default(""),
  order: z.number().default(0),
  isDefault: z.boolean().default(false),
});
export type FishboneCategory = z.infer<typeof FishboneCategorySchema>;

export const evidenceTypes = [
  "observation",
  "measurement",
  "document",
  "photo_ref",
  "test_result",
  "interview",
  "system_record",
  "historical_incident",
] as const;
export const EvidenceSchema = z.object({
  ...entity,
  title: z.string().default(""),
  type: z.enum(evidenceTypes).default("observation"),
  description: z.string().default(""),
  source: z.string().default(""),
  date: z.string().optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;
export type EvidenceType = Evidence["type"];

export const evidenceRelations = ["supports", "contradicts"] as const;
export const EvidenceLinkSchema = z.object({
  ...entity,
  evidenceId: z.string(),
  causeId: z.string(),
  relation: z.enum(evidenceRelations),
});
export type EvidenceLink = z.infer<typeof EvidenceLinkSchema>;
export type EvidenceRelation = EvidenceLink["relation"];

export const timelineTags = ["observed", "system_record", "reported"] as const;
export const TimelineEventSchema = z.object({
  ...entity,
  at: z.string(),
  text: z.string().default(""),
  tag: z.enum(timelineTags).default("observed"),
  causeId: z.string().optional(),
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type TimelineTag = TimelineEvent["tag"];

export const actionKinds = ["corrective", "preventive"] as const;
export const actionHorizons = ["immediate", "structural"] as const;
export const actionPriorities = ["critical", "high", "normal", "low"] as const;
export const actionStatuses = [
  "open",
  "in_progress",
  "ready_for_verification",
  "complete",
] as const;
export const ActionSchema = z.object({
  ...entity,
  kind: z.enum(actionKinds).default("corrective"),
  horizon: z.enum(actionHorizons).default("immediate"),
  title: z.string().default(""),
  description: z.string().default(""),
  linkedCauseIds: z.array(z.string()).default([]),
  owner: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(actionPriorities).default("normal"),
  status: z.enum(actionStatuses).default("open"),
  requiredForClosure: z.boolean().optional(),
  verificationMethod: z.string().optional(),
  expectedResult: z.string().optional(),
});
export type Action = z.infer<typeof ActionSchema>;
export type ActionKind = Action["kind"];
export type ActionHorizon = Action["horizon"];
export type ActionStatus = Action["status"];
export type ActionPriority = Action["priority"];

export const verificationResults = [
  "effective",
  "partially_effective",
  "not_effective",
  "monitoring",
] as const;
export const VerificationSchema = z.object({
  ...entity,
  actionId: z.string(),
  expected: z.string().default(""),
  observed: z.string().default(""),
  checkAt: z.string().optional(),
  verifier: z.string().optional(),
  result: z.enum(verificationResults).default("monitoring"),
  evidenceIds: z.array(z.string()).default([]),
});
export type Verification = z.infer<typeof VerificationSchema>;
export type VerificationResult = Verification["result"];

/** Additive v1 review history. Only the explicit review command creates entries. */
export const VerificationReviewSchema = z.object({
  id: z.string().min(1),
  verificationId: z.string().min(1),
  approvedAt: z.string().min(1),
  approvedBy: z.string().min(1),
  reopenedEventId: z.string().nullable(),
  snapshotVersion: z.literal(1),
  snapshot: z.string().min(1),
  invalidatedAt: z.string().optional(),
});
export type VerificationReview = z.infer<typeof VerificationReviewSchema>;

export const LessonLearnedSchema = z.object({
  ...entity,
  lesson: z.string().default(""),
  // Additive v1 fields: legacy lessons remain unapproved, never auto-credited.
  sourceVerificationId: z.string().optional(),
  sourceReviewId: z.string().optional(),
  approvedAt: z.string().optional(),
  approvedBy: z.string().optional(),
  relatedProcess: z.string().default(""),
  standardWorkUpdate: z.boolean().default(false),
  trainingUpdate: z.boolean().default(false),
  documentUpdate: z.boolean().default(false),
  similarProcessesToReview: z.string().optional(),
});
export type LessonLearned = z.infer<typeof LessonLearnedSchema>;

export const historyTypes = [
  "created",
  "status_changed",
  "closed",
  "reopened",
  "imported",
  "duplicated",
  "verification_reviewed",
] as const;
export const HistoryEventSchema = z.object({
  id: z.string(),
  at: z.string(),
  type: z.enum(historyTypes),
  from: z.string().optional(),
  to: z.string().optional(),
  note: z.string().optional(),
});
export type HistoryEvent = z.infer<typeof HistoryEventSchema>;

/** Where an investigation was opened from. Shown as a chip that links back. */
export const InvestigationSourceSchema = z.object({
  tool: z.literal("flow"),
  mapId: z.string(),
  mapNumber: z.string().optional(),
  stepId: z.string().optional(),
  painPointId: z.string().optional(),
  label: z.string().optional(),
});
export type InvestigationSource = z.infer<typeof InvestigationSourceSchema>;

export const InvestigationSchema = z.object({
  ...entity,
  schemaVersion: z.number().int().default(SCHEMA_VERSION),
  rcaNumber: z.string(),
  title: z.string().default(""),
  owner: z.string().optional(),
  department: z.string().optional(),
  status: InvestigationStatusSchema.default("draft"),
  shopFloorMode: z.boolean().default(false),
  problem: ProblemStatementSchema,
  containment: z.array(ContainmentActionSchema).default([]),
  causes: z.array(CauseNodeSchema).default([]),
  fishboneCategories: z.array(FishboneCategorySchema).default([]),
  evidence: z.array(EvidenceSchema).default([]),
  evidenceLinks: z.array(EvidenceLinkSchema).default([]),
  timeline: z.array(TimelineEventSchema).default([]),
  actions: z.array(ActionSchema).default([]),
  verifications: z.array(VerificationSchema).default([]),
  verificationReviews: z.array(VerificationReviewSchema).default([]),
  lessons: z.array(LessonLearnedSchema).default([]),
  history: z.array(HistoryEventSchema).default([]),
  closedAt: z.string().optional(),
  reopenedCount: z.number().int().default(0),
  source: InvestigationSourceSchema.optional(),
});
export type Investigation = z.infer<typeof InvestigationSchema>;

export const stages = [
  "problem",
  "contain",
  "investigate",
  "root-cause",
  "actions",
  "verify",
  "summary",
] as const;
export type Stage = (typeof stages)[number];

export function isStage(value: string): value is Stage {
  return (stages as readonly string[]).includes(value);
}
