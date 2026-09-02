import { describe, expect, it } from "vitest";
import { duplicateMap, parseImport, serialize, serializeBundle } from "../io";
import { createMap } from "../reducer";
import { buildSampleMap } from "../sample";
import { ProcessMapSchema } from "../schema";
import { buildSample as buildSolveSample } from "@/lib/solve/sample";

describe("schema round-trip", () => {
  it("export → import yields an equal document (except identity fields)", () => {
    const map = buildSampleMap("MAP-2026-001");
    const result = parseImport(serialize(map), "MAP-2026-002");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { id, mapNumber, updatedAt, history, status, ...rest } = result.map;
    const { id: _i, mapNumber: _n, updatedAt: _u, history: h0, status: s0, ...orig } = map;
    void _i; void _n; void _u; void id; void updatedAt;
    expect(rest).toEqual(orig);
    expect(mapNumber).toBe("MAP-2026-002");
    expect(history.length).toBe(h0.length + 1);
    expect(history.at(-1)?.type).toBe("imported");
    expect(status).toBe(s0);
  });

  it("bundle export → import returns the linked investigations", () => {
    const inv = buildSolveSample("RCA-2026-001");
    const map = buildSampleMap("MAP-2026-001", { linkInvestigation: { id: inv.id, status: inv.status } });
    const result = parseImport(serializeBundle(map, [inv]), "MAP-2026-002");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.investigations).toHaveLength(1);
    expect(result.investigations[0].id).toBe(inv.id);
    expect(result.map.investigations[0].investigationId).toBe(inv.id);
  });

  it("rejects garbage with a readable error", () => {
    expect(parseImport("not json", "MAP-2026-003")).toEqual({ ok: false, error: "That file is not valid JSON." });
    const bad = parseImport(JSON.stringify({ hello: "world" }), "MAP-2026-003");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/Invalid process map file/);
  });

  it("rejects newer schema versions", () => {
    const map = createMap({ mapNumber: "MAP-2026-009" });
    const r = parseImport(JSON.stringify({ ...map, schemaVersion: 99 }), "MAP-2026-010");
    expect(r.ok).toBe(false);
  });

  it("empty map validates", () => {
    const map = createMap({ mapNumber: "MAP-2026-001" });
    expect(ProcessMapSchema.safeParse(map).success).toBe(true);
    expect(map.status).toBe("draft");
  });

  it("duplicate gets a new id and history event", () => {
    const map = buildSampleMap("MAP-2026-001");
    const dup = duplicateMap(map, "MAP-2026-002");
    expect(dup.id).not.toBe(map.id);
    expect(dup.title).toMatch(/\(copy\)$/);
    expect(dup.history.at(-1)?.type).toBe("duplicated");
    expect(dup.versions.current.steps.length).toBe(map.versions.current.steps.length);
  });
});
