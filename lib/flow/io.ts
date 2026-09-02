import { newId, nowIso } from "@/lib/loop/ids";
import { slugify } from "@/lib/loop/format";
import { readableZodError, runMigrations, type Migration } from "@/lib/loop/migrate";
import type { Investigation } from "@/lib/solve/schema";
import { InvestigationSchema } from "@/lib/solve/schema";
import type { ProcessMap } from "./schema";
import { MapBundleSchema, ProcessMapSchema, SCHEMA_VERSION } from "./schema";
import { deriveStatus } from "./status";

export type ImportResult =
  | { ok: true; map: ProcessMap; investigations: Investigation[] }
  | { ok: false; error: string };

/** Migrations keyed by the version they upgrade FROM. */
const migrations: Record<number, Migration> = {
  // 1 → 2 would go here.
};

export function migrate(doc: Record<string, unknown>): Record<string, unknown> {
  return runMigrations(doc, migrations, SCHEMA_VERSION);
}

export function serialize(map: ProcessMap): string {
  return JSON.stringify(map, null, 2);
}

/** "Export with investigations": the map plus the LoopSolve documents it links to. */
export function serializeBundle(map: ProcessMap, investigations: Investigation[]): string {
  return JSON.stringify({ kind: "loopflow-bundle", map, investigations }, null, 2);
}

function finish(doc: Record<string, unknown>, mapNumber: string): ImportResult {
  if (typeof doc.schemaVersion === "number" && doc.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, error: `This file was made by a newer LoopFlow (schema ${doc.schemaVersion}). Update LoopFlow to open it.` };
  }
  const result = ProcessMapSchema.safeParse(doc);
  if (!result.success) return { ok: false, error: readableZodError(result.error, "process map") };
  const at = nowIso();
  const map: ProcessMap = {
    ...result.data,
    id: newId(),
    mapNumber,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: at,
    history: [...result.data.history, { id: newId(), at, type: "imported", note: `Imported from ${result.data.mapNumber}` }],
  };
  map.status = deriveStatus(map);
  return { ok: true, map, investigations: [] };
}

/**
 * Parse an exported JSON string: either a bare map or a bundle. The result
 * is ALWAYS a copy with a new id so it never overwrites an existing map.
 * Bundled investigations keep their ids so the map's links still resolve;
 * the caller decides whether to save ones that already exist.
 */
export function parseImport(text: string, mapNumber: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "That file is not a LoopFlow process map." };
  }
  const obj = raw as Record<string, unknown>;
  if (obj.kind === "loopflow-bundle") {
    const bundle = MapBundleSchema.safeParse({ ...obj, map: migrate((obj.map ?? {}) as Record<string, unknown>) });
    if (!bundle.success) return { ok: false, error: readableZodError(bundle.error, "process map bundle") };
    const inner = finish(bundle.data.map as unknown as Record<string, unknown>, mapNumber);
    if (!inner.ok) return inner;
    const investigations = bundle.data.investigations.map((i) => InvestigationSchema.safeParse(i)).filter((r) => r.success).map((r) => r.data);
    return { ok: true, map: inner.map, investigations };
  }
  return finish(migrate(obj), mapNumber);
}

export function duplicateMap(source: ProcessMap, mapNumber: string): ProcessMap {
  const at = nowIso();
  const map: ProcessMap = {
    ...structuredClone(source),
    id: newId(),
    mapNumber,
    title: source.title ? `${source.title} (copy)` : "",
    createdAt: at,
    updatedAt: at,
    history: [...source.history, { id: newId(), at, type: "duplicated", note: `Duplicated from ${source.mapNumber}` }],
  };
  map.status = deriveStatus(map);
  return map;
}

export function exportFilename(map: ProcessMap, ext = "loopflow.json"): string {
  const slug = slugify(map.title);
  return `${map.mapNumber}${slug ? `-${slug}` : ""}.${ext}`;
}
