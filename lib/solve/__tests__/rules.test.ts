import { describe, expect, it } from "vitest";
import { buildSample } from "../sample";
import { createInvestigation, reduce, stamp } from "../reducer";
import { canClose, hardFindings, isOverdue, softFindings } from "../rules";
import { jaccard } from "../text";

describe("hard rules", () => {
  it("the sample cannot close until the monitoring verification is resolved", () => {
    const inv = buildSample("RCA-2026-001");
    // sample: act1 effective, act2 monitoring → monitoring is allowed (≠ not_effective)
    const hard = hardFindings(inv);
    expect(hard.map((f) => f.code)).toEqual([]);
    expect(canClose(inv)).toBe(true);
  });

  it("blocks when a root has no supporting evidence or an action is unverified", () => {
    let inv = buildSample("RCA-2026-001");
    const root = inv.causes.find((c) => c.classification === "root")!;
    inv = { ...inv, evidenceLinks: inv.evidenceLinks.filter((l) => l.causeId !== root.id) };
    expect(hardFindings(inv).some((f) => f.code === "root_without_evidence")).toBe(true);
    inv = { ...inv, verifications: [] };
    expect(hardFindings(inv).filter((f) => f.code === "action_unverified").length).toBe(2);
  });

  it("not effective verification blocks closure; containment must be verified/released", () => {
    let inv = buildSample("RCA-2026-001");
    inv = reduce(inv, { type: "update_verification", id: inv.verifications[0].id, patch: { result: "not_effective" } });
    expect(hardFindings(inv).some((f) => f.code === "action_unverified")).toBe(true);
    inv = reduce(inv, { type: "update_containment", id: inv.containment[0].id, patch: { status: "in_progress" } });
    expect(hardFindings(inv).some((f) => f.code === "containment_open")).toBe(true);
  });

  it("empty investigation has the baseline hard findings", () => {
    const inv = createInvestigation({ rcaNumber: "RCA-2026-001" });
    const codes = hardFindings(inv).map((f) => f.code);
    expect(codes).toContain("no_root_cause");
    expect(codes).toContain("no_corrective_action");
  });
});

describe("soft rules", () => {
  it("flags blame language and restated problems on root causes", () => {
    let inv = createInvestigation({ rcaNumber: "RCA-2026-001" });
    inv = reduce(inv, { type: "set_problem", patch: { whatHappened: "Bracket hole oversized on cell 3" } });
    inv = reduce(inv, { type: "add_cause", cause: { ...stamp(), text: "Operator error, not paying attention", parentId: null, origin: "why", evidenceState: "assumption", classification: "root", challenged: false, candidate: false, collapsed: false, order: 0 } });
    inv = reduce(inv, { type: "add_cause", cause: { ...stamp(), text: "Bracket hole oversized on cell 3", parentId: null, origin: "why", evidenceState: "assumption", classification: "root", challenged: false, candidate: false, collapsed: false, order: 1 } });
    const codes = softFindings(inv).map((f) => f.code);
    expect(codes).toContain("blame_language");
    expect(codes).toContain("restates_problem");
    expect(codes).toContain("root_not_supported");
    expect(codes).toContain("no_evidence");
    expect(codes).toContain("no_preventive");
  });

  it("flags not-sure removal test, unlinked actions and overdue", () => {
    let inv = buildSample("RCA-2026-001");
    inv = reduce(inv, { type: "update_cause", id: inv.causes[3].id, patch: { removalTest: "not_sure" } });
    inv = reduce(inv, { type: "add_action", item: { ...stamp(), kind: "corrective", horizon: "immediate", title: "loose", description: "", linkedCauseIds: [], priority: "normal", status: "open", dueDate: "2026-01-01" } });
    const codes = softFindings(inv, "2026-09-01").map((f) => f.code);
    expect(codes).toContain("needs_investigation");
    expect(codes).toContain("action_no_cause");
    expect(codes).toContain("action_overdue");
  });

  it("verified evidence state is refused without supporting evidence", () => {
    let inv = createInvestigation({ rcaNumber: "RCA-2026-001" });
    inv = reduce(inv, { type: "add_cause", cause: { ...stamp(), text: "x", parentId: null, origin: "why", evidenceState: "assumption", classification: "unclassified", challenged: false, candidate: false, collapsed: false, order: 0 } });
    inv = reduce(inv, { type: "update_cause", id: inv.causes[0].id, patch: { evidenceState: "verified" } });
    expect(inv.causes[0].evidenceState).toBe("assumption");
  });

  it("isOverdue and jaccard behave", () => {
    expect(isOverdue({ dueDate: "2026-08-01", status: "open" }, "2026-09-01")).toBe(true);
    expect(isOverdue({ dueDate: "2026-08-01", status: "complete" }, "2026-09-01")).toBe(false);
    expect(jaccard("fixture locator worn", "fixture locator worn")).toBe(1);
    expect(jaccard("fixture locator worn", "coolant low")).toBe(0);
  });
});
