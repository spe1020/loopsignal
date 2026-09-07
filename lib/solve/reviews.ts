import type { Investigation, Verification, VerificationReview } from "./schema";

export function latestReopenId(inv: Investigation): string | null {
  return (
    [...inv.history].reverse().find((h) => h.type === "reopened")?.id ?? null
  );
}

/** Stable, readable snapshots, not security signatures. Field policy: docs/product-preview/reviews.md. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
}
const sorted = <T extends { id: string }>(items: T[]) =>
  [...items].sort((a, b) => a.id.localeCompare(b.id));
const without = (value: object, keys: string[]) =>
  Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key)),
  );
const unique = (ids: string[]) => [...new Set(ids)].sort();

export function reviewSnapshot(inv: Investigation, v: Verification): string {
  const action = inv.actions.find((a) => a.id === v.actionId);
  const causeIds = new Set([
    ...inv.causes.filter((c) => c.classification === "root").map((c) => c.id),
    ...(action?.linkedCauseIds ?? []),
  ]);
  // Include the causal chain, but ignore its diagram layout.
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of inv.causes)
      if (causeIds.has(c.id) && c.parentId && !causeIds.has(c.parentId)) {
        causeIds.add(c.parentId);
        grew = true;
      }
  }
  const links = inv.evidenceLinks.filter((l) => causeIds.has(l.causeId));
  const evidenceIds = unique([
    ...v.evidenceIds,
    ...links.map((l) => l.evidenceId),
  ]);
  const problem = without(inv.problem, ["generatedStatement"]);
  return canonical({
    investigationId: inv.id,
    problem,
    containment: sorted(inv.containment).map((c) =>
      without(c, ["createdAt", "updatedAt"]),
    ),
    requiredActions: sorted(
      inv.actions.filter(
        (a) => a.kind === "corrective" || a.requiredForClosure,
      ),
    ).map((a) => ({ id: a.id, kind: a.kind })),
    action: action
      ? {
          id: action.id,
          kind: action.kind,
          horizon: action.horizon,
          title: action.title,
          description: action.description,
          linkedCauseIds: unique(action.linkedCauseIds),
          owner: action.owner?.trim() ?? "",
          status: action.status,
          requiredForClosure: action.requiredForClosure ?? false,
          verificationMethod: action.verificationMethod ?? "",
          expectedResult: action.expectedResult ?? "",
        }
      : null,
    causeIds: unique([...causeIds]),
    causes: sorted(inv.causes.filter((c) => causeIds.has(c.id))).map((c) => ({
      id: c.id,
      text: c.text,
      parentId: c.parentId,
      evidenceState: c.evidenceState,
      classification: c.classification,
      rootCauseRationale: c.rootCauseRationale ?? "",
      removalTest: c.removalTest ?? null,
      note: c.note ?? "",
      challenged: c.challenged,
    })),
    links: links
      .map((l) => ({
        causeId: l.causeId,
        evidenceId: l.evidenceId,
        relation: l.relation,
      }))
      .sort((a, b) => canonical(a).localeCompare(canonical(b))),
    evidenceIds,
    evidence: sorted(
      inv.evidence.filter((e) => evidenceIds.includes(e.id)),
    ).map((e) => without(e, ["createdAt", "updatedAt"])),
    verification: {
      id: v.id,
      actionId: v.actionId,
      expected: v.expected,
      observed: v.observed,
      checkAt: v.checkAt ?? "",
      verifier: v.verifier?.trim() ?? "",
      result: v.result,
      evidenceIds: unique(v.evidenceIds),
    },
  });
}

export function currentReview(
  inv: Investigation,
  v: Verification,
): VerificationReview | undefined {
  const latest = inv.verificationReviews
    .filter((r) => r.verificationId === v.id)
    .at(-1);
  return latest &&
    !latest.invalidatedAt &&
    latest.reopenedEventId === latestReopenId(inv) &&
    latest.snapshotVersion === 1 &&
    latest.snapshot === reviewSnapshot(inv, v)
    ? latest
    : undefined;
}

/** A material change followed by a revert must still require deliberate review. */
export function invalidateChangedReviews(
  inv: Investigation,
  at: string,
): Investigation {
  let changed = false;
  const verificationReviews = inv.verificationReviews.map((r) => {
    if (r.invalidatedAt) return r;
    const v = inv.verifications.find((v) => v.id === r.verificationId);
    if (
      v &&
      r.reopenedEventId === latestReopenId(inv) &&
      r.snapshot === reviewSnapshot(inv, v)
    )
      return r;
    changed = true;
    return { ...r, invalidatedAt: at };
  });
  return changed ? { ...inv, verificationReviews } : inv;
}
