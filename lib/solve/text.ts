import type { ProblemStatement } from "./schema";

const STOP = new Set([
  "the", "a", "an", "of", "to", "in", "on", "at", "and", "or", "is", "was",
  "were", "be", "for", "with", "by", "it", "this", "that", "from", "as",
  "are", "not", "did", "do", "does", "had", "has", "have",
]);

export function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOP.has(t)),
  );
}

/** Normalized token Jaccard similarity in [0, 1]. */
export function jaccard(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function truncate(text: string, max = 60): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export type ProblemCheck = {
  key: "actual" | "expected" | "location" | "timing" | "scope";
  label: string;
  hint: string;
  ok: boolean;
};

export function problemChecks(p: ProblemStatement): ProblemCheck[] {
  const has = (s?: string) => Boolean(s && s.trim().length >= 3);
  return [
    {
      key: "actual",
      label: "Actual condition",
      hint: "What happened, stated as an observed condition.",
      ok: has(p.whatHappened),
    },
    {
      key: "expected",
      label: "Expected condition",
      hint: "The requirement, standard, or drawing value.",
      ok: has(p.whatShouldHaveHappened),
    },
    {
      key: "location",
      label: "Location",
      hint: "Line, cell, station, machine, or site.",
      ok: has(p.where),
    },
    {
      key: "timing",
      label: "Timing",
      hint: "Date, shift, or the window when it occurred.",
      ok: has(p.when),
    },
    {
      key: "scope",
      label: "Scope and magnitude",
      hint: "How many, how often, and who or what is affected.",
      ok: has(p.frequency) || has(p.impact) || has(p.affected),
    },
  ];
}

function sentence(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** Deterministic, readable statement from the guided fields. */
export function generateStatement(p: ProblemStatement): string {
  const parts: string[] = [];
  const whereWhen = [p.where.trim(), p.when.trim()].filter(Boolean);
  if (p.whatHappened.trim()) {
    let first = p.whatHappened.trim().replace(/[.]+$/, "");
    if (whereWhen.length) {
      first += ` (${whereWhen.join(", ")})`;
    }
    parts.push(sentence(first));
  } else if (whereWhen.length) {
    parts.push(sentence(`Problem observed at ${whereWhen.join(", ")}`));
  }
  if (p.whatShouldHaveHappened.trim()) {
    parts.push(sentence(`Expected: ${p.whatShouldHaveHappened.trim()}`));
  }
  const scope: string[] = [];
  if (p.frequency.trim()) scope.push(`Frequency: ${p.frequency.trim()}`);
  if (p.impact.trim()) scope.push(`Impact: ${p.impact.trim()}`);
  if (p.affected.trim()) scope.push(`Affected: ${p.affected.trim()}`);
  if (scope.length) parts.push(sentence(scope.join("; ")));
  const flags = Object.entries(p.impactFlags)
    .filter(([, on]) => on)
    .map(([k]) => k);
  if (flags.length) parts.push(sentence(`Impact areas: ${flags.join(", ")}`));
  return parts.join(" ");
}
