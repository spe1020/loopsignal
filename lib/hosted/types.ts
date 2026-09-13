import { z } from "zod";
import type { Investigation } from "@/lib/solve/schema";
export const Roles = z.enum([
  "owner",
  "billing_admin",
  "manager",
  "collaborator",
  "participant",
  "viewer",
]);
export type Role = z.infer<typeof Roles>;
export type Actor = { id: string; email: string };
export type Member = {
  user_id: string;
  display_name: string;
  role: Role;
  reviewer: boolean;
  revoked_at: string | null;
};
export type Observation = {
  id: string;
  verificationId: string;
  evidenceId: string;
  value: number;
  unit: string;
  start: string;
  end: string;
};
export type Attachment = {
  id: string;
  evidence_id: string;
  object_key: string;
  object_version: string;
  checksum: string | null;
  state: "staged" | "ready" | "missing" | "deleted";
  filename: string;
  size: number;
  media_type: string;
  uploaded_by: string;
};
export type HostedDocument = {
  version: 1;
  investigation: Investigation;
  observations: Observation[];
  reviewDependencies: Record<
    string,
    { snapshot: string; revision: number; actor: string }
  >;
  lessonDecisions: {
    id: string;
    lessonId: string;
    reviewId: string;
    actor: string;
    at: string;
    text: string;
  }[];
  provenance?: {
    kind: "device_import" | "duplicate";
    checksum: string;
    originalId: string;
    schemaVersion: number;
    original: unknown;
    idMap: Record<string, string>;
    missingFiles: string[];
  };
};
export type RecordEnvelope = {
  id: string;
  org_id: string;
  team_id: string;
  revision: number;
  document: HostedDocument;
  attachments: Attachment[];
};
export type Org = {
  id: string;
  name: string;
  billing_state:
    | "unentitled"
    | "evaluation"
    | "pending"
    | "active"
    | "past_due"
    | "cancelled";
  evaluation_ends_at: string;
  grace_ends_at: string | null;
  seats: number;
};
export class CompanyError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
export function ensure(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new CompanyError(status, message);
}
export const fullSeat = (role: Role) =>
  ["owner", "manager", "collaborator"].includes(role);
export const editor = (role: Role) =>
  ["owner", "manager", "collaborator"].includes(role);
export const administrator = (role: Role) =>
  ["owner", "manager"].includes(role);
export function canWrite(org: Org, at = Date.now()) {
  return (
    org.billing_state === "active" ||
    (["evaluation", "pending"].includes(org.billing_state) &&
      at < Date.parse(org.evaluation_ends_at))
  );
}
export const uuid = z.string().uuid();
export const textField = z.string().trim().max(12000);
const id = { id: uuid };
const problem = z
  .object({
    title: textField.min(1).max(200),
    whatHappened: textField.min(1),
    where: textField,
    whatShouldHaveHappened: textField,
    impact: textField,
  })
  .strict();
const evidence = z
  .object({
    title: textField.min(1).max(200),
    description: textField.min(1),
    source: textField.min(1),
    type: z.enum([
      "observation",
      "measurement",
      "document",
      "photo_ref",
      "test_result",
      "interview",
      "system_record",
      "historical_incident",
    ]),
    date: z.string().date(),
  })
  .strict();
const cause = z
  .object({
    text: textField.min(1),
    evidenceState: z.enum([
      "assumption",
      "observed",
      "data_supported",
      "verified",
      "disproved",
    ]),
    classification: z.enum(["unclassified", "symptom", "contributing", "root"]),
    rootCauseRationale: textField,
    parentId: uuid.nullable(),
    challenged: z.boolean(),
  })
  .strict();
const action = z
  .object({
    title: textField.min(1).max(200),
    description: textField,
    owner: uuid.nullable(),
    linkedCauseIds: z.array(uuid).max(100),
    kind: z.enum(["corrective", "preventive"]),
    requiredForClosure: z.boolean(),
    dueDate: z.union([z.string().date(), z.literal("")]),
    verificationMethod: textField,
    expectedResult: textField,
  })
  .strict();
const verification = z
  .object({
    actionId: uuid,
    expected: textField.min(1),
    observed: textField.min(1),
    checkAt: z.string().date(),
    result: z.enum([
      "effective",
      "partially_effective",
      "not_effective",
      "monitoring",
    ]),
    evidenceIds: z.array(uuid).min(1).max(100),
  })
  .strict();
const observation = z
  .object({
    verificationId: uuid,
    evidenceId: uuid,
    value: z.number().finite(),
    unit: textField.min(1).max(80),
    start: z.string().date(),
    end: z.string().date(),
  })
  .strict()
  .refine((o) => o.start <= o.end, "Observation period is reversed");
export const Command = z.discriminatedUnion("type", [
  z.object({ type: z.literal("create_problem"), data: problem }).strict(),
  z.object({ type: z.literal("edit_problem"), data: problem }).strict(),
  z.object({ type: z.literal("add_evidence"), data: evidence }).strict(),
  z
    .object({ type: z.literal("edit_evidence"), ...id, data: evidence })
    .strict(),
  z.object({ type: z.literal("add_cause"), data: cause }).strict(),
  z.object({ type: z.literal("edit_cause"), ...id, data: cause }).strict(),
  z
    .object({
      type: z.literal("link_evidence"),
      evidenceId: uuid,
      causeId: uuid,
      relation: z.enum(["supports", "contradicts"]),
    })
    .strict(),
  z.object({ type: z.literal("add_action"), data: action }).strict(),
  z.object({ type: z.literal("edit_action"), ...id, data: action }).strict(),
  z
    .object({
      type: z.literal("action_status"),
      ...id,
      status: z.enum([
        "open",
        "in_progress",
        "ready_for_verification",
        "complete",
      ]),
    })
    .strict(),
  z
    .object({ type: z.literal("add_verification"), data: verification })
    .strict(),
  z
    .object({ type: z.literal("edit_verification"), ...id, data: verification })
    .strict(),
  z.object({ type: z.literal("add_observation"), data: observation }).strict(),
  z
    .object({ type: z.literal("edit_observation"), ...id, data: observation })
    .strict(),
  z
    .object({
      type: z.literal("approve_verification"),
      ...id,
      selfReviewAcknowledged: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal("set_containment"),
      id: uuid.optional(),
      data: z
        .object({
          action: textField.min(1),
          owner: uuid,
          scope: textField,
          status: z.enum(["open", "in_progress", "verified", "released"]),
          verificationNote: textField,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("add_lesson"),
      lesson: textField.min(1),
      relatedProcess: textField,
    })
    .strict(),
  z
    .object({
      type: z.literal("edit_lesson"),
      ...id,
      lesson: textField.min(1),
      relatedProcess: textField,
    })
    .strict(),
  z
    .object({ type: z.literal("approve_lesson"), ...id, reviewId: uuid })
    .strict(),
  z.object({ type: z.literal("close") }).strict(),
  z.object({ type: z.literal("reopen"), note: textField.min(1) }).strict(),
  z.object({ type: z.literal("verify_sources") }).strict(),
  z.object({ type: z.literal("duplicate") }).strict(),
  z
    .object({
      type: z.literal("delete_record"),
      confirmation: z.literal("DELETE"),
    })
    .strict(),
  z.object({ type: z.literal("remove_attachment"), ...id }).strict(),
]);
export type BusinessCommand = z.infer<typeof Command>;
export const Envelope = z
  .object({
    version: z.literal(1),
    organizationId: uuid,
    commandId: uuid,
    recordId: uuid.nullable(),
    expectedRevision: z.number().int().min(0),
    correlationId: uuid,
    command: Command,
  })
  .strict();
export type CommandEnvelope = z.infer<typeof Envelope>;
