import { describe, expect, it } from "vitest";
import { buildSample } from "../sample";
import { completionPercent, stageScore } from "../completion";
import { createInvestigation } from "../reducer";
import { stageState } from "../stages";

describe("completion", () => {
  it("empty is 0", () => {
    expect(completionPercent(createInvestigation({ rcaNumber: "x" }))).toBe(0);
  });
  it("sample scores each stage as specified", () => {
    const inv = buildSample("RCA-2026-001");
    expect(stageScore(inv, "problem")).toBe(1);
    expect(stageScore(inv, "contain")).toBe(1);
    expect(stageScore(inv, "investigate")).toBe(1);
    expect(stageScore(inv, "root-cause")).toBe(1);
    expect(stageScore(inv, "actions")).toBe(0.5);
    expect(stageScore(inv, "verify")).toBe(1);
    expect(stageScore(inv, "summary")).toBe(1);
    expect(completionPercent(inv)).toBe(93);
  });
  it("stage states", () => {
    const inv = buildSample("RCA-2026-001");
    expect(stageState(inv, "problem")).toBe("complete");
    expect(stageState(inv, "actions")).toBe("in_progress");
    expect(stageState(createInvestigation({ rcaNumber: "x" }), "problem")).toBe("empty");
  });
});
