import { z } from "zod";
import { newId, nowIso } from "./ids";
import type { Investigation } from "./schema";
import { InvestigationSchema, SCHEMA_VERSION } from "./schema";
import { deriveStatus } from "./status";

export type ImportResult =
  | { ok: true; investigation: Investigation }
  | { ok: false; error: string };

/** Migrations keyed by the version they upgrade FROM. */
const migrations: Record<number, (doc: Record<string, unknown>) => Record<string, unknown>> = {
  // 1 → 2 would go here.
};

export function migrate(doc: Record<string, unknown>): Record<string, unknown> {
  let version = typeof doc.schemaVersion === "number" ? doc.schemaVersion : 1;
  let current = doc;
  while (version < SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) break;
    current = step(current);
    version += 1;
    current.schemaVersion = version;
  }
  return current;
}

export function serialize(inv: Investigation): string {
  return JSON.stringify(inv, null, 2);
}

function readable(err: z.ZodError): string {
  const first = err.issues[0];
  if (!first) return "The file is not a LoopSolve investigation.";
  const path = first.path.length ? first.path.join(".") : "document";
  return `Invalid investigation file: ${path} — ${first.message}.`;
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
  if (!result.success) return { ok: false, error: readable(result.error) };
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
  return { ok: true, investigation: inv };
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
  return inv;
}

export function exportFilename(inv: Investigation): string {
  const slug = inv.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${inv.rcaNumber}${slug ? `-${slug}` : ""}.loopsolve.json`;
}
