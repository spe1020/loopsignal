import { readableZodError, runMigrations, type Migration } from "@/lib/loop/migrate";
import { newId, nowIso } from "./ids";
import type { Investigation } from "./schema";
import { InvestigationSchema, SCHEMA_VERSION } from "./schema";
import { deriveStatus, normalizeClosure } from "./status";

export type ImportResult =
  | { ok: true; investigation: Investigation }
  | { ok: false; error: string };

/** Migrations keyed by the version they upgrade FROM. */
const migrations: Record<number, Migration> = {
  // 1 → 2 would go here.
};

export function migrate(doc: Record<string, unknown>): Record<string, unknown> {
  return runMigrations(doc, migrations, SCHEMA_VERSION);
}

export function serialize(inv: Investigation): string {
  return JSON.stringify(inv, null, 2);
}

/**
 * Parse an exported JSON string. The result is ALWAYS a copy with a new id and an
 * "imported" history event so it never overwrites an existing investigation.
 */
export function parseImport(text: string, rcaNumber: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "That file is not a LoopSolve investigation." };
  }
  const doc = migrate(raw as Record<string, unknown>);
  if (typeof doc.schemaVersion === "number" && doc.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error: `This file was made by a newer LoopSolve (schema ${doc.schemaVersion}). Update LoopSolve to open it.`,
    };
  }
  const result = InvestigationSchema.safeParse(doc);
  if (!result.success) return { ok: false, error: readableZodError(result.error, "investigation") };
  const at = nowIso();
  const inv: Investigation = {
    ...result.data,
    id: newId(),
    rcaNumber,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: at,
    history: [
      ...result.data.history,
      { id: newId(), at, type: "imported", note: `Imported from ${result.data.rcaNumber}` },
    ],
  };
  inv.status = deriveStatus(inv);
  return { ok: true, investigation: normalizeClosure(inv) };
}

export function duplicateInvestigation(source: Investigation, rcaNumber: string): Investigation {
  const at = nowIso();
  const inv: Investigation = {
    ...structuredClone(source),
    id: newId(),
    rcaNumber,
    title: source.title ? `${source.title} (copy)` : "",
    createdAt: at,
    updatedAt: at,
    history: [
      ...source.history,
      { id: newId(), at, type: "duplicated", note: `Duplicated from ${source.rcaNumber}` },
    ],
  };
  inv.status = deriveStatus(inv);
  return normalizeClosure(inv);
}

export function exportFilename(inv: Investigation): string {
  const slug = inv.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${inv.rcaNumber}${slug ? `-${slug}` : ""}.loopsolve.json`;
}
