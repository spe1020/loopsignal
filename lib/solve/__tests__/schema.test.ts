import { describe, expect, it } from "vitest";
import { buildSample } from "../sample";
import { InvestigationSchema } from "../schema";
import { duplicateInvestigation, parseImport, serialize } from "../io";
import { createInvestigation } from "../reducer";

describe("schema round-trip", () => {
  it("export → import yields an equal document (except identity fields)", () => {
    const inv = buildSample("RCA-2026-001");
    const text = serialize(inv);
    const result = parseImport(text, "RCA-2026-002");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { id, rcaNumber, updatedAt, history, status, ...rest } = result.investigation;
    const { id: _id, rcaNumber: _r, updatedAt: _u, history: h0, status: s0, ...orig } = inv;
    void _id; void _r; void _u; void id; void rcaNumber; void updatedAt; void s0;
    expect(rest).toEqual(orig);
    expect(rcaNumber).toBe("RCA-2026-002");
    expect(id).not.toBe(inv.id);
    expect(history.length).toBe(h0.length + 1);
    expect(history[history.length - 1].type).toBe("imported");
    expect(status).toBe(inv.status);
  });

  it("rejects garbage with a readable error", () => {
    expect(parseImport("not json", "RCA-2026-003")).toEqual({ ok: false, error: "That file is not valid JSON." });
    const bad = parseImport(JSON.stringify({ hello: "world" }), "RCA-2026-003");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/Invalid investigation file/);
  });

  it("rejects newer schema versions", () => {
    const inv = createInvestigation({ rcaNumber: "RCA-2026-009" });
    const text = JSON.stringify({ ...inv, schemaVersion: 99 });
    const r = parseImport(text, "RCA-2026-010");
    expect(r.ok).toBe(false);
  });

  it("empty investigation validates", () => {
    const inv = createInvestigation({ rcaNumber: "RCA-2026-001" });
    expect(InvestigationSchema.safeParse(inv).success).toBe(true);
    expect(inv.fishboneCategories).toHaveLength(6);
  });

  it("duplicate gets a new id and history event", () => {
    const inv = buildSample("RCA-2026-001");
    const dup = duplicateInvestigation(inv, "RCA-2026-002");
    expect(dup.id).not.toBe(inv.id);
    expect(dup.title).toMatch(/\(copy\)$/);
    expect(dup.history.at(-1)?.type).toBe("duplicated");
    expect(dup.causes.length).toBe(inv.causes.length);
  });
});
