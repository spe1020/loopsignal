import type { MapVersion, Step } from "./schema";

export type StepChange = {
  field: "name" | "laneId" | "cycleTimeMin" | "waitBeforeMin" | "valueClass" | "type" | "system" | "trigger";
  before: unknown;
  after: unknown;
};

export type DiffEntry =
  | { kind: "removed"; currentStep: Step; key: string }
  | { kind: "added"; futureStep: Step; key: string }
  | { kind: "changed"; currentStep: Step; futureStep: Step; changes: StepChange[]; key: string }
  | { kind: "unchanged"; currentStep: Step; futureStep: Step; key: string };

export type VersionDiff = {
  entries: DiffEntry[];
  removed: Extract<DiffEntry, { kind: "removed" }>[];
  added: Extract<DiffEntry, { kind: "added" }>[];
  changed: Extract<DiffEntry, { kind: "changed" }>[];
  /** Change keys (rationale map keys) with no rationale text yet. */
  missingRationale: string[];
  changeCount: number;
};

const fields: StepChange["field"][] = ["name", "laneId", "type", "cycleTimeMin", "waitBeforeMin", "valueClass", "system", "trigger"];

function norm(v: unknown): unknown {
  if (typeof v === "string") return v.trim() || undefined;
  return v;
}

/**
 * Compare a future version against the current one via forkedFromStepIds.
 * Removed = current step no future step derives from. Added = future step
 * with no origin. Changed = derived step with a different name, lane, time,
 * wait, class, type, system, or trigger.
 */
export function diffVersions(current: MapVersion, future: MapVersion): VersionDiff {
  const origin = future.forkedFromStepIds ?? {};
  const currentById = new Map(current.steps.map((s) => [s.id, s]));
  const derivedFrom = new Set(future.steps.map((s) => origin[s.id]).filter(Boolean));
  const entries: DiffEntry[] = [];
  const rationale = future.rationale ?? {};

  for (const cs of [...current.steps].sort((a, b) => a.order - b.order)) {
    if (!derivedFrom.has(cs.id)) entries.push({ kind: "removed", currentStep: cs, key: cs.id });
  }
  for (const fs of [...future.steps].sort((a, b) => a.order - b.order)) {
    const from = origin[fs.id] ? currentById.get(origin[fs.id]) : undefined;
    if (!from) {
      entries.push({ kind: "added", futureStep: fs, key: fs.id });
      continue;
    }
    const changes: StepChange[] = [];
    for (const f of fields) {
      const a = norm(from[f]);
      const b = norm(fs[f]);
      if (a !== b) changes.push({ field: f, before: a, after: b });
    }
    if (changes.length) entries.push({ kind: "changed", currentStep: from, futureStep: fs, changes, key: fs.id });
    else entries.push({ kind: "unchanged", currentStep: from, futureStep: fs, key: fs.id });
  }
  const removed = entries.filter((e): e is Extract<DiffEntry, { kind: "removed" }> => e.kind === "removed");
  const added = entries.filter((e): e is Extract<DiffEntry, { kind: "added" }> => e.kind === "added");
  const changed = entries.filter((e): e is Extract<DiffEntry, { kind: "changed" }> => e.kind === "changed");
  const missingRationale = [...removed, ...added, ...changed].filter((e) => !(rationale[e.key]?.text ?? "").trim()).map((e) => e.key);
  return { entries, removed, added, changed, missingRationale, changeCount: removed.length + added.length + changed.length };
}
