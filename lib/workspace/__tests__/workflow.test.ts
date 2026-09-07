import { completedAction } from "./fixtures";
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  createDemo,
  DemoSchema,
  ids,
  milestones,
  reduceDemo,
  verificationBlockers,
} from "../demo";
import {
  hardFindings,
  canClose,
  isVerifiedImprovement,
} from "@/lib/solve/rules";
import { reduce } from "@/lib/solve/reducer";
import { InvestigationSchema } from "@/lib/solve/schema";
import { parseImport, serialize } from "@/lib/solve/io";
import { deriveStatus, normalizeClosure } from "@/lib/solve/status";

function verifiedDemo() {
  return reduceDemo(completedAction(), { type: "verify", result: "effective" });
}
afterEach(() => vi.useRealTimers());

describe("manufacturing workflow", () => {
  it("gates cause acceptance, completion, verification, and learning on their prerequisites", () => {
    const d = createDemo();
    for (const command of [
      { type: "accept_cause" },
      { type: "connect_action" },
      { type: "complete_action" },
      { type: "approve_lesson" },
      { type: "verify", result: "effective" },
    ] as const)
      expect(reduceDemo(d, command)).toBe(d);
    expect(milestones(d).every((m) => !m.complete)).toBe(true);
    expect(verificationBlockers(d).length).toBeGreaterThan(0);
  });
  it("only earns verified and learning milestones from complete, effective, supported records", () => {
    let d = completedAction();
    expect(milestones(d).map((m) => m.complete)).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(verificationBlockers(d)).toEqual([]);
    d = reduceDemo(d, { type: "verify", result: "effective" });
    expect(isVerifiedImprovement(d.investigation)).toBe(true);
    d = reduceDemo(d, { type: "approve_lesson" });
    expect(milestones(d).every((m) => m.complete)).toBe(true);
    expect(d.investigation.lessons[0].sourceVerificationId).toBe(
      d.investigation.verifications[0].id,
    );
    expect(
      d.map.versions.current.rationale[ids.step].linkedAction?.actionId,
    ).toBe(d.investigation.actions[0].id);
    expect(d.map.investigations[0].investigationId).toBe(d.investigation.id);
  });
  it.each(["monitoring", "partially_effective", "not_effective"] as const)(
    "%s cannot close or earn a verified milestone",
    (result) => {
      const d = reduceDemo(completedAction(), { type: "verify", result });
      expect(canClose(d.investigation)).toBe(false);
      expect(reduce(d.investigation, { type: "close" })).toBe(d.investigation);
      expect(milestones(d)[2].complete).toBe(false);
    },
  );
  it("missing or dangling follow-up evidence blocks verification", () => {
    let d = completedAction();
    d = reduceDemo(d, {
      type: "review_evidence",
      id: ids.followup,
      reviewed: false,
    });
    expect(reduceDemo(d, { type: "verify", result: "effective" })).toBe(d);
    const inv = verifiedDemo().investigation;
    inv.verifications[0].evidenceIds = ["missing-source"];
    expect(hardFindings(inv).map((f) => f.code)).toContain(
      "verification_without_evidence",
    );
  });
  it("uses source-linked observations for the result and refuses an out-of-target lot", () => {
    const d = completedAction();
    d.observations[1].rejected = 8;
    expect(verificationBlockers(d)).toContain(
      "Three linked follow-up observations must each meet the ≤1% rejection target.",
    );
    expect(reduceDemo(d, { type: "verify", result: "effective" })).toBe(d);
  });
  it("every root needs its own rationale, support, and completed countermeasure", () => {
    const inv = verifiedDemo().investigation;
    const other = {
      ...inv.causes[0],
      id: "unaddressed-root",
      rootCauseRationale: "",
    };
    inv.causes.push(other);
    expect(hardFindings(inv).map((f) => f.code)).toEqual(
      expect.arrayContaining([
        "root_without_rationale",
        "root_without_evidence",
        "root_unaddressed",
      ]),
    );
    inv.evidenceLinks.push({
      ...inv.evidenceLinks[0],
      id: "dangling",
      causeId: other.id,
      evidenceId: "missing",
    });
    expect(
      hardFindings(inv).some(
        (f) => f.code === "root_without_evidence" && f.entityId === other.id,
      ),
    ).toBe(true);
  });
  it("open required actions, unresolved contradictions, and missing reviewer prevent closure", () => {
    const original = verifiedDemo().investigation;
    for (const status of [
      "open",
      "in_progress",
      "ready_for_verification",
    ] as const) {
      const inv = structuredClone(original);
      inv.actions[0].status = status;
      expect(
        hardFindings(inv).some((f) => f.code === "action_incomplete"),
      ).toBe(true);
    }
    const contradiction = structuredClone(original);
    contradiction.evidenceLinks.push({
      ...contradiction.evidenceLinks[0],
      id: "contradiction",
      relation: "contradicts",
    });
    expect(
      hardFindings(contradiction).some((f) => f.code === "root_unresolved"),
    ).toBe(true);
    const missingReviewer = structuredClone(original);
    missingReviewer.verifications[0].verifier = "";
    expect(isVerifiedImprovement(missingReviewer)).toBe(false);
  });
  it("a required preventive action also blocks closure; optional work has an explicit boundary", () => {
    const inv = verifiedDemo().investigation;
    inv.actions.push({
      ...inv.actions[0],
      id: "preventive",
      kind: "preventive",
      requiredForClosure: true,
      status: "open",
    });
    expect(hardFindings(inv).some((f) => f.entityId === "preventive")).toBe(
      true,
    );
    inv.actions[1].requiredForClosure = false;
    expect(hardFindings(inv)).toEqual([]);
  });
  it("reopening retains learning but requires a new verification and lesson review", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-07T10:00:00Z"));
    let d = reduceDemo(verifiedDemo(), { type: "approve_lesson" });
    vi.advanceTimersByTime(1000);
    d = reduceDemo(d, { type: "reopen" });
    expect(d.investigation.lessons).toHaveLength(1);
    expect(milestones(d).map((m) => m.complete)).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(canClose(d.investigation)).toBe(false);
    vi.advanceTimersByTime(1000);
    d = reduceDemo(d, { type: "verify", result: "effective" });
    expect(milestones(d)[2].complete).toBe(true);
    expect(milestones(d)[3].complete).toBe(false);
    d = reduceDemo(d, { type: "approve_lesson" });
    expect(d.investigation.lessons).toHaveLength(1);
    expect(milestones(d)[3].complete).toBe(true);
  });
  it("re-reviewing the same verification requires a separate new lesson decision", () => {
    let d = reduceDemo(verifiedDemo(), { type: "approve_lesson" });
    const lesson = d.investigation.lessons[0];
    d = reduceDemo(d, { type: "reopen" });
    let inv = reduce(d.investigation, { type: "approve_verification", id: lesson.sourceVerificationId! });
    inv = reduce(inv, { type: "close" });
    d = { ...d, investigation: inv };
    expect(milestones(d)[2].complete).toBe(true);
    expect(milestones(d)[3].complete).toBe(false);
    expect(d.investigation.lessons[0]).toEqual(lesson);
    d = reduceDemo(d, { type: "approve_lesson" });
    expect(milestones(d)[3].complete).toBe(true);
    expect(d.investigation.lessons[0].sourceReviewId).not.toBe(lesson.sourceReviewId);
  });
  it("withdrawing evidence or reopening an action invalidates a previously closed result", () => {
    let d = reduceDemo(verifiedDemo(), { type: "approve_lesson" });
    d = reduceDemo(d, {
      type: "review_evidence",
      id: ids.followup,
      reviewed: false,
    });
    expect(d.investigation.status).toBe("reopened");
    expect(milestones(d)[2].complete).toBe(false);
    expect(milestones(d)[3].complete).toBe(false);
    expect(d.investigation.lessons).toHaveLength(1);
    const inv = reduce(verifiedDemo().investigation, {
      type: "update_action",
      id: ids.action,
      patch: { status: "open" },
    });
    expect(inv.closedAt).toBeUndefined();
    expect(inv.status).toBe("reopened");
  });
  it("does not trust historical closed flags and selects latest verification by record date", () => {
    const inv = verifiedDemo().investigation;
    inv.verifications.unshift({
      ...inv.verifications[0],
      id: "newer-monitoring",
      createdAt: "2099-01-01T00:00:00Z",
      result: "monitoring",
    });
    expect(deriveStatus(inv)).not.toBe("closed");
    expect(isVerifiedImprovement(inv)).toBe(false);
  });
  it("repairs historical false closure without changing the original or re-closing on edit", () => {
    const inv = verifiedDemo().investigation;
    inv.verifications[0].result = "monitoring";
    const original = serialize(inv);
    const repaired = normalizeClosure(inv);
    expect(serialize(inv)).toBe(original);
    expect(repaired.closedAt).toBeUndefined();
    expect(repaired.status).toBe("reopened");
    expect(repaired.history.some((h) => h.type === "closed")).toBe(true);
    expect(normalizeClosure(repaired).reopenedCount).toBe(
      repaired.reopenedCount,
    );
    const edited = reduce(repaired, {
      type: "update_verification",
      id: repaired.verifications[0].id,
      patch: { result: "effective" },
    });
    expect(edited.status).not.toBe("closed");
  });
  it("preserves v1 files; legacy lessons never gain an inferred approval", () => {
    const legacy = createDemo().investigation;
    legacy.lessons = [
      {
        id: "old-lesson",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        lesson: "Original user notes",
        relatedProcess: "Original process",
        standardWorkUpdate: false,
        trainingUpdate: false,
        documentUpdate: true,
      },
    ];
    const raw = serialize(legacy);
    const parsed = parseImport(raw, "RCA-2026-999");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.investigation.id).not.toBe(legacy.id);
    expect(parsed.investigation.lessons[0].lesson).toBe("Original user notes");
    expect(parsed.investigation.lessons[0].approvedAt).toBeUndefined();
    expect(serialize(legacy)).toBe(raw);
    expect(
      InvestigationSchema.safeParse(verifiedDemo().investigation).success,
    ).toBe(true);
    expect(
      DemoSchema.parse(JSON.parse(JSON.stringify(verifiedDemo()))).mode,
    ).toBe("fictional-demo");
  });
});
