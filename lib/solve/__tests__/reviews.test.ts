import { afterEach, describe, expect, it, vi } from "vitest";
import { completedAction } from "@/lib/workspace/__tests__/fixtures";
import { ids, reduceDemo, verificationCandidate } from "@/lib/workspace/demo";
import { reduce, type SolveAction } from "../reducer";
import {
  canClose,
  hardFindings,
  isVerifiedImprovement,
  reviewBlockers,
} from "../rules";
import { currentReview } from "../reviews";
import { duplicateInvestigation, parseImport, serialize } from "../io";
import { InvestigationSchema } from "../schema";
import { normalizeClosure } from "../status";

function approved() {
  return reduceDemo(
    reduceDemo(completedAction(), { type: "verify", result: "effective" }),
    { type: "approve_lesson" },
  ).investigation;
}
afterEach(() => vi.useRealTimers());

describe("explicit verification reviews", () => {
  const changes: [string, SolveAction][] = [
    [
      "follow-up evidence",
      {
        type: "update_evidence",
        id: ids.followup,
        patch: {
          description:
            "Correction: all three lots exceeded the rejection target.",
        },
      },
    ],
    [
      "supporting source",
      {
        type: "update_evidence",
        id: ids.fixture,
        patch: { source: "Corrected fixture-trial source, revision B" },
      },
    ],
    [
      "countermeasure scope",
      {
        type: "update_action",
        id: ids.action,
        patch: {
          description:
            "Changed scope: replace fixture only; omit PM wear checks.",
        },
      },
    ],
    [
      "owner",
      {
        type: "update_action",
        id: ids.action,
        patch: { owner: "Different engineer" },
      },
    ],
    [
      "root rationale",
      {
        type: "update_cause",
        id: ids.cause,
        patch: { rootCauseRationale: "New causal explanation" },
      },
    ],
    [
      "acceptance target",
      {
        type: "set_problem",
        patch: { whatShouldHaveHappened: "Zero rejects in every lot" },
      },
    ],
    [
      "containment scope",
      {
        type: "update_containment",
        id: "contain-brackets",
        patch: { scope: "Changed held-lot scope" },
      },
    ],
  ];
  it.each(changes)(
    "withdraws closure on material %s changes and retains prior review/learning",
    (label, command) => {
      const inv = approved();
      if (command.type === "update_containment")
        command = { ...command, id: inv.containment[0].id };
      const prior = inv.verificationReviews[0];
      const changed = reduce(inv, command);
      expect(changed.status, label).toBe("reopened");
      expect(changed.closedAt).toBeUndefined();
      expect(isVerifiedImprovement(changed)).toBe(false);
      expect(changed.verificationReviews[0]).toMatchObject(prior);
      expect(changed.verificationReviews[0].invalidatedAt).toBeTruthy();
      expect(changed.lessons).toEqual(inv.lessons);
      expect(changed.history).toEqual(expect.arrayContaining(inv.history));
      expect(reduce(changed, { type: "close" })).toBe(changed);
      expect(hardFindings(changed).map((f) => f.code)).toContain(
        "action_unverified",
      );
    },
  );
  it("ignores presentation, scheduling and unrelated records", () => {
    let inv = approved();
    const reviews = inv.verificationReviews;
    const cosmetic: SolveAction[] = [
      {
        type: "set_meta",
        patch: { title: "My display title", shopFloorMode: true },
      },
      {
        type: "update_cause",
        id: ids.cause,
        patch: { collapsed: true, order: 10, categoryId: "display-group" },
      },
      {
        type: "update_action",
        id: ids.action,
        patch: { priority: "high", dueDate: "2026-09-20" },
      },
      {
        type: "update_evidence",
        id: ids.material,
        patch: { title: "Unrelated unaccepted hypothesis source" },
      },
      {
        type: "update_verification",
        id: inv.verifications[0].id,
        patch: { verifier: `  ${inv.verifications[0].verifier}  ` },
      },
    ];
    for (const command of cosmetic) {
      inv = reduce(inv, command);
      expect(isVerifiedImprovement(inv), command.type).toBe(true);
    }
    expect(inv.verificationReviews).toEqual(reviews);
  });
  it.each(["verifier", "observed", "expected"] as const)(
    "a generic %s edit after reopening never establishes fresh approval",
    (field) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-07T10:00:00Z"));
      let inv = approved();
      const original = inv.verifications[0];
      const oldReview = inv.verificationReviews[0];
      vi.advanceTimersByTime(1000);
      inv = reduce(inv, { type: "reopen", note: "Review this concern" });
      vi.advanceTimersByTime(1000);
      inv = reduce(inv, {
        type: "update_verification",
        id: original.id,
        patch: { [field]: original[field] + " " },
      });
      expect(canClose(inv)).toBe(false);
      expect(inv.verificationReviews).toHaveLength(1);
      expect(inv.verificationReviews[0].approvedAt).toBe(oldReview.approvedAt);
      expect(reduce(inv, { type: "close" })).toBe(inv);
      const beforeReview = inv;
      inv = reduce(inv, { type: "approve_verification", id: original.id });
      expect(canClose(inv)).toBe(true);
      expect(inv.verifications).toEqual(beforeReview.verifications); // No invented observations or dates.
      expect(inv.verificationReviews).toHaveLength(2);
      expect(inv.verificationReviews[1].reopenedEventId).toBe(
        beforeReview.history.filter((h) => h.type === "reopened").at(-1)?.id,
      );
      expect(isVerifiedImprovement(reduce(inv, { type: "close" }))).toBe(true);
    },
  );
  it("uses reopening identity even when the clock is unchanged or moves backwards", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-07T10:00:00Z"));
    let inv = approved();
    inv = reduce(inv, { type: "reopen" });
    expect(canClose(inv)).toBe(false);
    vi.setSystemTime(new Date("2026-09-07T09:00:00Z"));
    inv = reduce(inv, {
      type: "approve_verification",
      id: inv.verifications[0].id,
    });
    expect(canClose(inv)).toBe(true);
  });
  it("does not restore approval when changed text is reverted, even before closure", () => {
    let inv = verificationCandidate(completedAction(), "effective");
    const v = inv.verifications[0];
    inv = reduce(inv, { type: "approve_verification", id: v.id });
    inv = reduce(inv, {
      type: "update_verification",
      id: v.id,
      patch: { observed: "Corrected observation" },
    });
    inv = reduce(inv, {
      type: "update_verification",
      id: v.id,
      patch: { observed: v.observed },
    });
    expect(canClose(inv)).toBe(false);
    expect(currentReview(inv, inv.verifications[0])).toBeUndefined();
    inv = reduce(inv, { type: "approve_verification", id: v.id });
    expect(canClose(inv)).toBe(true);
  });
  it("enforces review readiness in the reducer and never approves an incomplete draft", () => {
    let inv = verificationCandidate(completedAction(), "effective");
    const v = inv.verifications[0];
    expect(canClose(inv)).toBe(false);
    for (const patch of [
      { verifier: "" },
      { observed: "" },
      { checkAt: "invalid-date" },
      { evidenceIds: ["missing"] },
      { result: "monitoring" as const },
    ]) {
      const changed = reduce(inv, {
        type: "update_verification",
        id: v.id,
        patch,
      });
      expect(reviewBlockers(changed, v.id).length).toBeGreaterThan(0);
      expect(reduce(changed, { type: "approve_verification", id: v.id })).toBe(
        changed,
      );
    }
    inv = reduce(inv, {
      type: "update_action",
      id: ids.action,
      patch: { status: "in_progress" },
    });
    expect(reduce(inv, { type: "approve_verification", id: v.id })).toBe(inv);
  });
  it("allows required actions to receive explicit reviews in either order", () => {
    let inv = verificationCandidate(completedAction(), "effective");
    inv = reduce(inv, {
      type: "add_action",
      item: {
        ...inv.actions[0],
        id: "preventive",
        kind: "preventive",
        requiredForClosure: true,
      },
    });
    inv = reduce(inv, {
      type: "add_verification",
      item: {
        ...inv.verifications[0],
        id: "preventive-check",
        actionId: "preventive",
      },
    });
    for (const v of inv.verifications)
      inv = reduce(inv, { type: "approve_verification", id: v.id });
    expect(canClose(inv)).toBe(true);
  });
  it("rejects reviews of superseded verification records", () => {
    let inv = approved();
    const old = inv.verifications[0];
    inv = reduce(inv, {
      type: "add_verification",
      item: { ...old, id: "new-result", createdAt: "2099-01-01" },
    });
    expect(reviewBlockers(inv, old.id)).toContain(
      "Review the latest verification for this action.",
    );
    expect(reduce(inv, { type: "approve_verification", id: old.id })).toBe(inv);
  });
  it("retains exact review snapshots through JSON and requires a new review for imported copies", () => {
    const inv = approved();
    const original = serialize(inv);
    expect(
      isVerifiedImprovement(InvestigationSchema.parse(JSON.parse(original))),
    ).toBe(true);
    const imported = parseImport(original, "RCA-2026-900");
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    for (const copy of [
      imported.investigation,
      normalizeClosure(duplicateInvestigation(inv, "RCA-2026-901")),
    ]) {
      expect(copy.verificationReviews).toEqual(inv.verificationReviews);
      expect(copy.lessons).toEqual(inv.lessons);
      expect(copy.history).toEqual(expect.arrayContaining(inv.history));
      expect(copy.status).toBe("reopened");
      expect(canClose(copy)).toBe(false);
      expect(
        canClose(
          reduce(copy, {
            type: "approve_verification",
            id: copy.verifications[0].id,
          }),
        ),
      ).toBe(true);
    }
    expect(serialize(inv)).toBe(original);
  });
  it("repairs legacy closure without inventing approval metadata or changing the source", () => {
    const raw = JSON.parse(serialize(approved()));
    delete raw.verificationReviews;
    const original = JSON.stringify(raw);
    const legacy = InvestigationSchema.parse(raw);
    const repaired = normalizeClosure(legacy);
    expect(repaired.status).toBe("reopened");
    expect(repaired.verificationReviews).toEqual([]);
    expect(repaired.history).toEqual(expect.arrayContaining(legacy.history));
    expect(normalizeClosure(repaired)).toEqual(repaired);
    expect(JSON.stringify(raw)).toBe(original);
    const imported = parseImport(original, "RCA-2026-999");
    if (!imported.ok) throw new Error(imported.error);
    expect(imported.investigation.verificationReviews).toEqual([]);
  });
});
