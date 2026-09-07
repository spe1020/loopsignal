import { z } from "zod";
import { currentReview } from "@/lib/solve/reviews";
import { createInvestigation, reduce } from "@/lib/solve/reducer";
import {
  ActionSchema,
  CauseNodeSchema,
  EvidenceSchema,
  InvestigationSchema,
  LessonLearnedSchema,
  VerificationSchema,
  type Investigation,
  type VerificationResult,
} from "@/lib/solve/schema";
import {
  reviewBlockers,
  isVerifiedImprovement,
  latestVerification,
} from "@/lib/solve/rules";
import { createMap, makeLane, makeStep } from "@/lib/flow/reducer";
import { ProcessMapSchema } from "@/lib/flow/schema";

export const ids = {
  problem: "demo-bracket",
  cause: "cause-wear-standard",
  hypothesis: "cause-material",
  action: "action-locator-standard",
  baseline: "evidence-baseline",
  fixture: "evidence-fixture",
  material: "evidence-material",
  implementation: "evidence-implementation",
  followup: "evidence-followup",
  lesson: "lesson-locator",
  map: "demo-bracket-process",
  step: "step-drill",
} as const;
export const owners = [
  "Maya Chen · Manufacturing engineering",
  "Luis Ortiz · Maintenance",
] as const;
const date = "2026-08-03T09:00:00.000Z";
const entity = (id: string) => ({ id, createdAt: date, updatedAt: date });
export const DemoSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.literal("manufacturing-preview"),
  updatedAt: z.string(),
  mode: z.literal("fictional-demo"),
  investigation: InvestigationSchema,
  map: ProcessMapSchema,
  reviewedEvidenceIds: z.array(z.string()),
  showProgress: z.boolean(),
  observations: z.array(
    z
      .object({
        id: z.string().min(1),
        problemId: z.string().min(1),
        evidenceId: z.string().min(1),
        phase: z.enum(["baseline", "followup"]),
        label: z.string(),
        date: z.string(),
        inspected: z.number().int().positive(),
        rejected: z.number().int().nonnegative(),
      })
      .refine(
        (o) => o.rejected <= o.inspected,
        "Rejected count cannot exceed inspected count",
      ),
  ),
});
export type Demo = z.infer<typeof DemoSchema>;

export function createDemo(): Demo {
  const inv = createInvestigation({
    id: ids.problem,
    rcaNumber: "LS-001",
    title: "Oversized holes on the bracket line",
  });
  inv.owner = "Alex Morgan · Quality lead (fictional)";
  inv.department = "Northfield Works · Cell 3 (fictional)";
  inv.status = "investigating";
  inv.problem = {
    ...inv.problem,
    whatHappened: "24 of 400 brackets were rejected for oversized holes.",
    whatShouldHaveHappened:
      "Hole diameter 10.00–10.10 mm; no more than 1% rejected.",
    where: "Northfield Works · Cell 3",
    when: "3 August 2026 · day shift",
    frequency: "24 / 400 parts (6%) in baseline lot B-803",
    impact: "Lot held for sorting. No savings estimate has been made.",
    affected: "Bracket BR-104",
    process: "Bracket drilling and final inspection",
    impactFlags: {
      customer: false,
      financial: false,
      safety: false,
      quality: true,
      delivery: true,
    },
    generatedStatement:
      "24 of 400 BR-104 brackets failed the 10.00–10.10 mm diameter requirement at Cell 3 on 3 August. Rejection rate: 6%; target: ≤1%.",
  };
  inv.containment = [
    {
      ...entity("containment-sort"),
      action: "Hold and sort baseline lot B-803",
      owner: "Alex Morgan",
      scope: "All 400 parts in the baseline lot",
      status: "verified",
      verificationNote:
        "Fictional inspection log confirms 24 rejects segregated; remaining parts rechecked.",
    },
  ];
  inv.causes = [
    CauseNodeSchema.parse({
      ...entity(ids.cause),
      text: "The fixture maintenance standard has no locator wear limit or replacement check.",
      evidenceState: "assumption",
      rootCauseRationale: "",
      removalTest: "not_sure",
    }),
    CauseNodeSchema.parse({
      ...entity(ids.hypothesis),
      text: "Incoming material hardness changed.",
      evidenceState: "assumption",
      order: 1,
    }),
  ];
  inv.evidence = [
    [
      ids.baseline,
      "Baseline inspection log",
      "measurement",
      "Lot B-803: 400 parts inspected, 24 rejected. Rejected hole diameters: 10.14–10.22 mm against a 10.00–10.10 mm requirement. Rejection rate: 24 ÷ 400 = 6%.",
      "Fictional Q-803 inspection log · rows 1–400",
      "2026-08-03",
    ],
    [
      ids.fixture,
      "Fixture check and controlled trial",
      "test_result",
      "The locator pin measured 0.18 mm wear. Standard PM-14 specified cleaning only, with no wear limit. With material and drilling settings held constant, 4/40 parts failed using the worn locator; 0/40 failed using a new locator. This supports fixture location as a cause; sustained effectiveness still needs follow-up.",
      "Fictional ENG-804 trial · sections 2–4; PM-14 rev A · task 6",
      "2026-08-04",
    ],
    [
      ids.material,
      "Material certificate and retained sample",
      "document",
      "The baseline lot and prior conforming lot used the same heat. Retained sample hardness was within the specified range. There is no supplied evidence of a hardness change; keep this explanation separate from the supported fixture cause.",
      "Fictional MAT-803 certificate · heat H-62; retained sample check · row 3",
      "2026-08-04",
    ],
    [
      ids.implementation,
      "Countermeasure completion record",
      "system_record",
      "Locator replaced. PM-14 rev B now specifies a maximum 0.05 mm locator wear, a check at each setup, and replacement above the limit. Setup sheet updated; maintenance and setup teams walked through the check. Released 5 August 2026.",
      "Fictional WO-805 · completion section; PM-14 rev B · task 6",
      "2026-08-05",
    ],
    [
      ids.followup,
      "Three-lot follow-up inspection",
      "measurement",
      "After the 5 August change: B-806 on 6 August, 2/400 rejected (0.50%); B-812 on 12 August, 1/400 (0.25%); B-819 on 19 August, 2/400 (0.50%). All three lots meet ≤1%. Total: 5/1,200 (0.42%). Ten working days, 6–19 August; all shifts included. Evidence supports this observation window, not a guarantee against future recurrence.",
      "Fictional Q-819 follow-up log · lots B-806, B-812, B-819",
      "2026-08-19",
    ],
  ].map(([id, title, type, description, source, date]) =>
    EvidenceSchema.parse({
      ...entity(id),
      title,
      type,
      description,
      source,
      date,
    }),
  );
  inv.actions = [
    ActionSchema.parse({
      ...entity(ids.action),
      title: "Replace the locator and add a wear check to standard work",
      description:
        "Use the supplied completion record to confirm the physical fix and the prevention of recurrence.",
      linkedCauseIds: [],
      status: "open",
      dueDate: "2026-08-05",
      verificationMethod:
        "Inspect three production lots across ten working days, covering all shifts.",
      expectedResult: "Every follow-up lot has ≤1% rejected parts.",
    }),
  ];
  const map = createMap({
    id: ids.map,
    mapNumber: "FLOW-001",
    title: "Bracket manufacturing",
  });
  const lane = {
    ...makeLane("Cell 3", "department", 0, date),
    id: "lane-cell3",
  };
  map.lanes = [lane];
  map.versions.current.steps = [
    "Receive material",
    "Locate & drill",
    "Inspect diameter",
    "Release lot",
  ].map((name, order) => ({
    ...makeStep({ laneId: lane.id, name, order }, date),
    id: order === 1 ? ids.step : `step-${order}`,
  }));
  map.versions.current.edges = map.versions.current.steps
    .slice(1)
    .map((s, i) => ({
      ...entity(`edge-${i}`),
      fromStepId: map.versions.current.steps[i].id,
      toStepId: s.id,
      isPrimary: true,
    }));
  map.versions.current.rationale[ids.step] = {
    text: "Fixture cause and countermeasure are held in the investigation.",
    linkedAction: { investigationId: inv.id, actionId: ids.action },
  };
  map.investigations = [
    {
      ...entity("link-investigation"),
      investigationId: inv.id,
      stepId: ids.step,
      openedAt: date,
    },
  ];
  inv.source = {
    tool: "flow",
    mapId: map.id,
    mapNumber: map.mapNumber,
    stepId: ids.step,
    label: "Locate & drill",
  };
  return DemoSchema.parse({
    schemaVersion: 1,
    id: "manufacturing-preview",
    updatedAt: date,
    mode: "fictional-demo",
    investigation: inv,
    map,
    reviewedEvidenceIds: [],
    showProgress: true,
    observations: [
      {
        id: "obs-baseline",
        problemId: inv.id,
        evidenceId: ids.baseline,
        phase: "baseline",
        label: "Baseline · 3 Aug",
        date: "2026-08-03",
        inspected: 400,
        rejected: 24,
      },
      {
        id: "obs-lot1",
        problemId: inv.id,
        evidenceId: ids.followup,
        phase: "followup",
        label: "Lot 1 · 6 Aug",
        date: "2026-08-06",
        inspected: 400,
        rejected: 2,
      },
      {
        id: "obs-lot2",
        problemId: inv.id,
        evidenceId: ids.followup,
        phase: "followup",
        label: "Lot 2 · 12 Aug",
        date: "2026-08-12",
        inspected: 400,
        rejected: 1,
      },
      {
        id: "obs-lot3",
        problemId: inv.id,
        evidenceId: ids.followup,
        phase: "followup",
        label: "Lot 3 · 19 Aug",
        date: "2026-08-19",
        inspected: 400,
        rejected: 2,
      },
    ],
  });
}

export type DemoCommand =
  | { type: "review_evidence"; id: string; reviewed: boolean }
  | { type: "accept_cause" }
  | { type: "connect_action" }
  | { type: "assign_owner"; owner: string }
  | { type: "complete_action" }
  | { type: "verify"; result: VerificationResult }
  | { type: "approve_lesson" }
  | { type: "reopen" }
  | { type: "toggle_progress" }
  | { type: "replace"; doc: Demo };

export function verificationCandidate(
  doc: Demo,
  result: VerificationResult,
  at = new Date().toISOString(),
): Investigation {
  const id = `verification-${doc.investigation.verifications.length + 1}`;
  const v = VerificationSchema.parse({
    id,
    createdAt: at,
    updatedAt: at,
    actionId: ids.action,
    expected: "≤1% rejected in each of three lots across ten working days.",
    observed: doc.reviewedEvidenceIds.includes(ids.followup)
      ? "2/400, 1/400, 2/400 rejected; each lot ≤1% across 6–19 August 2026 (ten working days)."
      : "",
    verifier: "Alex Morgan · fictional demo reviewer",
    checkAt: "2026-08-19",
    result,
    evidenceIds: doc.reviewedEvidenceIds.includes(ids.followup)
      ? [ids.followup]
      : [],
  });
  return reduce(doc.investigation, { type: "add_verification", item: v });
}
export function observationMetrics(doc: Demo) {
  const rows = doc.observations.map((o) => ({
    ...o,
    rate: (o.rejected / o.inspected) * 100,
  }));
  const followup = rows.filter((o) => o.phase === "followup");
  const inspected = followup.reduce((sum, o) => sum + o.inspected, 0);
  const rejected = followup.reduce((sum, o) => sum + o.rejected, 0);
  return {
    rows,
    baseline: rows.find((o) => o.phase === "baseline"),
    followup,
    inspected,
    rejected,
    rate: inspected ? (rejected / inspected) * 100 : null,
  };
}

export function verificationBlockers(doc: Demo): string[] {
  const candidate = verificationCandidate(doc, "effective");
  const problems = reviewBlockers(
    candidate,
    latestVerification(candidate, ids.action)!.id,
  );
  if (!doc.reviewedEvidenceIds.includes(ids.followup))
    problems.unshift("Inspect and include the three-lot follow-up evidence.");
  const { followup } = observationMetrics(doc);
  if (
    followup.length !== 3 ||
    followup.some(
      (o) =>
        o.rate > 1 ||
        o.problemId !== doc.investigation.id ||
        !doc.investigation.evidence.some((e) => e.id === o.evidenceId),
    )
  )
    problems.push(
      "Three linked follow-up observations must each meet the ≤1% rejection target.",
    );
  return [...new Set(problems)];
}
export function milestones(doc: Demo) {
  const inv = doc.investigation;
  const supported = inv.causes.some(
    (c) =>
      c.id === ids.cause &&
      c.classification === "root" &&
      inv.evidenceLinks.some(
        (l) =>
          l.causeId === c.id &&
          l.relation === "supports" &&
          inv.evidence.some((e) => e.id === l.evidenceId),
      ),
  );
  const verified =
    isVerifiedImprovement(inv) && verificationBlockers(doc).length === 0;
  const latest = latestVerification(inv, ids.action);
  const learned =
    verified &&
    inv.lessons.some(
      (l) =>
        l.approvedAt &&
        l.approvedBy &&
        latest &&
        l.sourceVerificationId === latest.id &&
        l.sourceReviewId === currentReview(inv, latest)?.id,
    );
  return [
    { label: "Cause supported by evidence", complete: supported },
    {
      label: "Countermeasure completed",
      complete:
        supported &&
        inv.actions.some(
          (a) =>
            a.id === ids.action &&
            a.status === "complete" &&
            a.linkedCauseIds.includes(ids.cause),
        ),
    },
    { label: "First verified improvement", complete: verified },
    { label: "Approved learning retained", complete: learned },
  ];
}
export function reduceDemo(doc: Demo, command: DemoCommand): Demo {
  if (command.type === "replace") return command.doc;
  if (command.type === "toggle_progress")
    return {
      ...doc,
      showProgress: !doc.showProgress,
      updatedAt: new Date().toISOString(),
    };
  let inv = doc.investigation;
  let reviewed = doc.reviewedEvidenceIds;
  const at = new Date().toISOString();
  switch (command.type) {
    case "review_evidence":
      if (!inv.evidence.some((e) => e.id === command.id)) return doc;
      reviewed = command.reviewed
        ? [...new Set([...reviewed, command.id])]
        : reviewed.filter((id) => id !== command.id);
      // Withdrawing support invalidates the result rather than leaving a stale green badge.
      if (!command.reviewed && command.id === ids.followup) {
        for (const v of inv.verifications)
          inv = reduce(inv, {
            type: "update_verification",
            id: v.id,
            patch: { evidenceIds: [] },
          });
      }
      if (!command.reviewed && command.id === ids.implementation)
        inv = reduce(inv, {
          type: "update_action",
          id: ids.action,
          patch: { status: "open" },
        });
      if (!command.reviewed && command.id === ids.fixture)
        inv = reduce(inv, {
          type: "unlink_evidence",
          causeId: ids.cause,
          evidenceId: ids.fixture,
        });
      break;
    case "accept_cause":
      if (
        ![ids.baseline, ids.fixture, ids.material].every((id) =>
          reviewed.includes(id),
        )
      )
        return doc;
      inv = reduce(inv, {
        type: "link_evidence",
        causeId: ids.cause,
        evidenceId: ids.fixture,
        relation: "supports",
      });
      inv = reduce(inv, {
        type: "update_cause",
        id: ids.cause,
        patch: {
          classification: "root",
          evidenceState: "data_supported",
          removalTest: "yes",
          rootCauseRationale:
            "The controlled trial isolates fixture location. PM-14 lacks a wear check, allowing the worn locator to remain in service. Replace the locator and define a recurring wear limit/check.",
        },
      });
      inv = reduce(inv, {
        type: "link_evidence",
        causeId: ids.hypothesis,
        evidenceId: ids.material,
        relation: "contradicts",
      });
      break;
    case "connect_action":
      if (!milestones(doc)[0].complete) return doc;
      inv = reduce(inv, {
        type: "update_action",
        id: ids.action,
        patch: { linkedCauseIds: [ids.cause] },
      });
      break;
    case "assign_owner":
      if (
        command.owner &&
        !(owners as readonly string[]).includes(command.owner)
      )
        return doc;
      inv = reduce(inv, {
        type: "update_action",
        id: ids.action,
        patch: { owner: command.owner || undefined },
      });
      break;
    case "complete_action": {
      const action = inv.actions.find((a) => a.id === ids.action);
      if (
        !action?.owner ||
        !action.linkedCauseIds.includes(ids.cause) ||
        !reviewed.includes(ids.implementation)
      )
        return doc;
      inv = reduce(inv, {
        type: "update_action",
        id: ids.action,
        patch: { status: "complete" },
      });
      break;
    }
    case "verify":
      if (command.result === "effective" && verificationBlockers(doc).length)
        return doc;
      inv = verificationCandidate(doc, command.result, at);
      if (command.result === "effective") {
        inv = reduce(inv, {
          type: "approve_verification",
          id: latestVerification(inv, ids.action)!.id,
        });
        inv = reduce(inv, {
          type: "close",
          note: "Fictional demo approval. Observation dates are supplied; time is compressed for this walkthrough.",
        });
      }
      break;
    case "approve_lesson": {
      const verification = latestVerification(inv, ids.action);
      if (!isVerifiedImprovement(inv) || !verification) return doc;
      const lesson = LessonLearnedSchema.parse({
        id: ids.lesson,
        createdAt: at,
        updatedAt: at,
        lesson:
          "A fixture replacement corrects today’s defect. A defined wear limit and setup check address recurrence. Verify the change across shifts and production lots before standardizing it elsewhere.",
        relatedProcess: "Bracket drilling · Cell 3",
        standardWorkUpdate: true,
        documentUpdate: true,
        similarProcessesToReview:
          "Review other locating fixtures before applying this lesson. Their wear limits may differ.",
        sourceVerificationId: verification.id,
        sourceReviewId: currentReview(inv, verification)!.id,
        approvedBy: "Alex Morgan · fictional demo reviewer",
        approvedAt: at,
      });
      inv = inv.lessons.some((l) => l.id === ids.lesson)
        ? reduce(inv, { type: "update_lesson", id: ids.lesson, patch: lesson })
        : reduce(inv, { type: "add_lesson", item: lesson });
      break;
    }
    case "reopen":
      if (inv.status === "reopened") return doc;
      inv = reduce(inv, {
        type: "reopen",
        note: "A new concern needs review. Prior evidence and learning are retained, pending re-verification.",
      });
      break;
  }
  return {
    ...doc,
    investigation: inv,
    reviewedEvidenceIds: reviewed,
    updatedAt: at,
  };
}
