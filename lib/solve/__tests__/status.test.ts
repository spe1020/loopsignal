import { describe, expect, it } from "vitest";
import { buildSample } from "../sample";
import { createInvestigation, reduce, stamp } from "../reducer";
import { deriveStatus } from "../status";

describe("deriveStatus", () => {
  it("walks draft → investigating → action_open → verification → closed", () => {
    let inv = createInvestigation({ rcaNumber: "RCA-2026-001" });
    expect(deriveStatus(inv)).toBe("draft");
    inv = reduce(inv, { type: "add_cause", cause: { ...stamp(), text: "x", parentId: null, origin: "why", evidenceState: "assumption", classification: "unclassified", challenged: false, candidate: false, collapsed: false, order: 0 } });
    expect(inv.status).toBe("investigating");
    const causeId = inv.causes[0].id;
    inv = reduce(inv, { type: "add_action", item: { ...stamp(), kind: "corrective", horizon: "immediate", title: "fix", description: "", linkedCauseIds: [causeId], priority: "normal", status: "open" } });
    expect(inv.status).toBe("action_open");
    inv = reduce(inv, { type: "add_verification", item: { ...stamp(), actionId: inv.actions[0].id, expected: "", observed: "", result: "effective", evidenceIds: [] } });
    expect(inv.status).toBe("verification");
    inv = reduce(inv, { type: "close" });
    expect(inv.status).toBe("closed");
    expect(inv.closedAt).toBeTruthy();
    expect(inv.history.at(-1)?.type).toBe("closed");
  });

  it("reopen sets reopened until a new verification is recorded", async () => {
    let inv = buildSample("RCA-2026-001");
    expect(inv.status).toBe("verification");
    inv = reduce(inv, { type: "reopen" });
    expect(inv.status).toBe("reopened");
    expect(inv.reopenedCount).toBe(1);
    expect(inv.history.at(-1)?.type).toBe("reopened");
    // everything preserved
    expect(inv.causes.length).toBe(11);
    expect(inv.verifications.length).toBe(2);
    await new Promise((r) => setTimeout(r, 5));
    inv = reduce(inv, { type: "add_verification", item: { ...stamp(), actionId: inv.actions[0].id, expected: "", observed: "", result: "effective", evidenceIds: [] } });
    expect(inv.status).toBe("verification");
  });

  it("closed requires closedAt and a trailing closed event", () => {
    const inv = buildSample("RCA-2026-001");
    expect(deriveStatus({ ...inv, closedAt: "2026-01-01T00:00:00Z" })).toBe("verification");
  });
});
