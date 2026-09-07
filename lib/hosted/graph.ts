import type { Attachment, HostedDocument } from "./types";
import { ensure, uuid } from "./types";
export function graph(doc: HostedDocument, files: Attachment[]) {
  const i = doc.investigation;
  const nodes: [string, string][] = [[i.id, "Investigation"]];
  const edges: [string, string, string][] = [];
  const add = (entities: { id: string }[], kind: string) =>
    entities.forEach((e) => nodes.push([e.id, kind]));
  add(i.evidence, "Evidence");
  add(i.causes, "Cause");
  add(i.actions, "Action");
  add(i.verifications, "Verification");
  add(i.verificationReviews, "VerificationReview");
  add(i.lessons, "Lesson");
  add(doc.observations, "MetricObservation");
  add(files, "Attachment");
  add(i.containment, "Containment");
  add(i.history, "History");
  add(i.evidenceLinks, "EvidenceLink");
  add(i.fishboneCategories, "Category");
  add(i.timeline, "Timeline");
  const edge = (a: string, b: string | undefined | null, r: string) => {
    if (b) edges.push([a, b, r]);
  };
  i.causes.forEach((c) => {
    edge(c.id, c.parentId, "parent");
    edge(c.id, c.categoryId, "category");
  });
  i.evidenceLinks.forEach((l) => {
    edge(l.id, l.causeId, "cause");
    edge(l.id, l.evidenceId, l.relation);
  });
  i.actions.forEach((a) =>
    a.linkedCauseIds.forEach((c) => edge(a.id, c, "cause")),
  );
  i.verifications.forEach((v) => {
    edge(v.id, v.actionId, "action");
    v.evidenceIds.forEach((e) => edge(v.id, e, "evidence"));
  });
  i.verificationReviews.forEach((r) => {
    edge(r.id, r.verificationId, "verification");
    edge(r.id, r.reopenedEventId, "reopening");
  });
  i.lessons.forEach((l) => {
    edge(l.id, l.sourceReviewId, "review");
    edge(l.id, l.sourceVerificationId, "verification");
  });
  doc.observations.forEach((o) => {
    edge(o.id, o.evidenceId, "evidence");
    edge(o.id, o.verificationId, "verification");
  });
  files.forEach((f) => edge(f.id, f.evidence_id, "evidence"));
  i.timeline.forEach((t) => edge(t.id, t.causeId, "cause"));
  ensure(
    !i.source,
    "Hosted process-map references require a future explicit import; local map IDs cannot become company references",
  );
  const ids = new Set<string>();
  for (const [id] of nodes) {
    uuid.parse(id);
    ensure(!ids.has(id), "Duplicate entity identity");
    ids.add(id);
  }
  for (const [a, b] of edges)
    ensure(
      ids.has(a) && ids.has(b),
      "Mixed-company or missing entity reference",
    );
  return { nodes, edges };
}
