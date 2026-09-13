import {
  hostSnapshot,
  hostedBlockers,
  hostedReviewBlockers,
} from "./domain-view";
export {
  hostSnapshot,
  hostedBlockers,
  hostedReviewBlockers,
} from "./domain-view";
import { randomUUID } from "node:crypto";
import {
  createInvestigation,
  reduce,
  type SolveAction,
} from "@/lib/solve/reducer";
import {
  InvestigationSchema,
  ActionSchema,
  CauseNodeSchema,
  EvidenceSchema,
  VerificationSchema,
  ContainmentActionSchema,
  LessonLearnedSchema,
  type Investigation,
} from "@/lib/solve/schema";
import { currentReview, invalidateChangedReviews } from "@/lib/solve/reviews";
import { hardFindings } from "@/lib/solve/rules";
import { deriveStatus } from "@/lib/solve/status";
import {
  administrator,
  editor,
  ensure,
  type Actor,
  type Attachment,
  type BusinessCommand,
  type HostedDocument,
  type Member,
} from "./types";
export const stamp = () => ({
  id: randomUUID(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
export function freshDocument(
  title: string,
  id = randomUUID(),
): HostedDocument {
  const inv = createInvestigation({
    id,
    title,
    rcaNumber: `LS-${id.slice(0, 8).toUpperCase()}`,
  });
  inv.fishboneCategories = [];
  inv.history = inv.history.map((h) => ({ ...h, id: randomUUID() }));
  return {
    version: 1,
    investigation: inv,
    observations: [],
    reviewDependencies: {},
    lessonDecisions: [],
  };
}
function normalizeIds(before: Investigation, next: Investigation) {
  const old = new Set(
    [
      ...before.history,
      ...before.verificationReviews,
      ...before.evidenceLinks,
    ].map((e) => e.id),
  );
  const map = new Map<string, string>();
  for (const e of [
    ...next.history,
    ...next.verificationReviews,
    ...next.evidenceLinks,
  ])
    if (!old.has(e.id) && !/^.{8}-.{4}-.{4}-.{4}-.{12}$/.test(e.id))
      map.set(e.id, randomUUID());
  // Generated IDs only, never rewrite user text or persisted snapshot values.
  next.history = next.history.map((h) => ({
    ...h,
    id: map.get(h.id) ?? h.id,
    note: h.note?.replace(
      /Review ([^.]+)\./,
      (_, id) => `Review ${map.get(id) ?? id}.`,
    ),
  }));
  next.verificationReviews = next.verificationReviews.map((r) => ({
    ...r,
    id: map.get(r.id) ?? r.id,
    reopenedEventId: r.reopenedEventId
      ? (map.get(r.reopenedEventId) ?? r.reopenedEventId)
      : null,
  }));
  next.evidenceLinks = next.evidenceLinks.map((e) => ({
    ...e,
    id: map.get(e.id) ?? e.id,
  }));
  return next;
}
function apply(doc: HostedDocument, c: SolveAction) {
  doc.investigation = normalizeIds(
    doc.investigation,
    reduce(doc.investigation, c),
  );
}
export function invalidateHosted(doc: HostedDocument, files: Attachment[]) {
  const at = new Date().toISOString();
  doc.investigation = invalidateChangedReviews(doc.investigation, at);
  for (const review of doc.investigation.verificationReviews) {
    if (review.invalidatedAt) continue;
    const dependency = doc.reviewDependencies[review.id];
    if (
      !dependency ||
      dependency.snapshot !== hostSnapshot(doc, review.verificationId, files)
    )
      review.invalidatedAt = at;
  }
  if (doc.investigation.closedAt && hardFindings(doc.investigation).length)
    apply(doc, {
      type: "reopen",
      note: "Reviewed dependencies changed; approval withdrawn. Historical decisions remain available.",
    });
  doc.investigation.status = deriveStatus(doc.investigation);
}
export function applyCommand(
  source: HostedDocument,
  c: BusinessCommand,
  actor: Actor,
  member: Member,
  members: Member[],
  files: Attachment[],
  revision: number,
): HostedDocument {
  const doc = structuredClone(source);
  invalidateHosted(doc, files);
  const inv = doc.investigation;
  ensure(member.revoked_at === null, "Membership revoked", 403);
  const participant =
    c.type === "add_evidence" ||
    c.type === "action_status" ||
    c.type === "create_problem";
  ensure(
    editor(member.role) || (member.role === "participant" && participant),
    "Your role cannot perform this command",
    403,
  );
  const assigned = (id: string | null) => {
    if (id)
      ensure(
        members.some(
          (m) =>
            m.user_id === id &&
            !m.revoked_at &&
            ["owner", "manager", "collaborator", "participant"].includes(
              m.role,
            ),
        ),
        "Choose a current member who can own work",
      );
  };
  const existing = (items: { id: string }[], id: string) =>
    ensure(
      items.some((i) => i.id === id),
      "Reference does not belong to this investigation",
    );
  switch (c.type) {
    case "create_problem":
    case "edit_problem": {
      const { title, ...problem } = c.data;
      apply(doc, { type: "set_meta", patch: { title } });
      apply(doc, { type: "set_problem", patch: problem });
      break;
    }
    case "add_evidence":
      apply(doc, {
        type: "add_evidence",
        item: EvidenceSchema.parse({ ...stamp(), ...c.data }),
      });
      break;
    case "edit_evidence":
      existing(inv.evidence, c.id);
      apply(doc, { type: "update_evidence", id: c.id, patch: c.data });
      break;
    case "add_cause":
    case "edit_cause": {
      if (c.data.parentId) existing(inv.causes, c.data.parentId);
      if (c.type === "edit_cause") {
        existing(inv.causes, c.id);
        let parent = c.data.parentId;
        const seen = new Set([c.id]);
        while (parent) {
          ensure(!seen.has(parent), "Cause relationships cannot form a cycle");
          seen.add(parent);
          parent = inv.causes.find((p) => p.id === parent)?.parentId ?? null;
        }
        apply(doc, { type: "update_cause", id: c.id, patch: c.data });
      } else
        apply(doc, {
          type: "add_cause",
          cause: CauseNodeSchema.parse({ ...stamp(), ...c.data }),
        });
      break;
    }
    case "link_evidence":
      existing(inv.evidence, c.evidenceId);
      existing(inv.causes, c.causeId);
      apply(doc, c);
      break;
    case "add_action":
    case "edit_action": {
      assigned(c.data.owner);
      c.data.linkedCauseIds.forEach((id) => existing(inv.causes, id));
      const data = {
        ...c.data,
        owner: c.data.owner ?? undefined,
        dueDate: c.data.dueDate || undefined,
      };
      if (c.type === "add_action")
        apply(doc, {
          type: "add_action",
          item: ActionSchema.parse({ ...stamp(), ...data }),
        });
      else {
        existing(inv.actions, c.id);
        apply(doc, { type: "update_action", id: c.id, patch: data });
      }
      break;
    }
    case "action_status":
      existing(inv.actions, c.id);
      ensure(
        member.role !== "participant" ||
          inv.actions.some((a) => a.id === c.id && a.owner === actor.id),
        "Only your currently assigned action can be updated",
        403,
      );
      apply(doc, {
        type: "update_action",
        id: c.id,
        patch: { status: c.status },
      });
      break;
    case "add_verification":
    case "edit_verification": {
      existing(inv.actions, c.data.actionId);
      c.data.evidenceIds.forEach((id) => existing(inv.evidence, id));
      // This is authorship, never approval. The explicit reviewer is installed on approval.
      const data = { ...c.data, verifier: actor.id };
      if (c.type === "add_verification")
        apply(doc, {
          type: "add_verification",
          item: VerificationSchema.parse({ ...stamp(), ...data }),
        });
      else {
        existing(inv.verifications, c.id);
        apply(doc, { type: "update_verification", id: c.id, patch: data });
      }
      break;
    }
    case "add_observation":
    case "edit_observation": {
      existing(inv.verifications, c.data.verificationId);
      existing(inv.evidence, c.data.evidenceId);
      if (c.type === "add_observation")
        doc.observations.push({ id: randomUUID(), ...c.data });
      else {
        existing(doc.observations, c.id);
        doc.observations = doc.observations.map((o) =>
          o.id === c.id ? { id: c.id, ...c.data } : o,
        );
      }
      break;
    }
    case "approve_verification": {
      ensure(member.reviewer, "Explicit reviewer authority is required", 403);
      existing(inv.verifications, c.id);
      const v = inv.verifications.find((v) => v.id === c.id)!;
      ensure(
        inv.actions.find((a) => a.id === v.actionId)?.owner !== actor.id ||
          c.selfReviewAcknowledged,
        "Acknowledge that you are reviewing your own action",
      );
      if (currentReview(inv, v)) break;
      apply(doc, {
        type: "update_verification",
        id: c.id,
        patch: { verifier: actor.id },
      });
      const blockers = hostedReviewBlockers(doc, c.id, files);
      ensure(!blockers.length, blockers.join(" "), 422);
      apply(doc, { type: "approve_verification", id: c.id });
      const r = doc.investigation.verificationReviews.at(-1)!;
      ensure(r && r.verificationId === c.id, "Approval did not commit", 422);
      doc.reviewDependencies[r.id] = {
        actor: actor.id,
        revision,
        snapshot: hostSnapshot(doc, c.id, files),
      };
      break;
    }
    case "set_containment":
      assigned(c.data.owner);
      if (["verified", "released"].includes(c.data.status))
        ensure(
          c.data.verificationNote.trim(),
          "Record why containment is resolved",
        );
      if (c.id) {
        existing(inv.containment, c.id);
        apply(doc, { type: "update_containment", id: c.id, patch: c.data });
      } else
        apply(doc, {
          type: "add_containment",
          item: ContainmentActionSchema.parse({ ...stamp(), ...c.data }),
        });
      break;
    case "add_lesson":
      apply(doc, {
        type: "add_lesson",
        item: LessonLearnedSchema.parse({
          ...stamp(),
          lesson: c.lesson,
          relatedProcess: c.relatedProcess,
        }),
      });
      break;
    case "edit_lesson":
      existing(inv.lessons, c.id);
      apply(doc, {
        type: "update_lesson",
        id: c.id,
        patch: {
          lesson: c.lesson,
          relatedProcess: c.relatedProcess,
          approvedAt: undefined,
          approvedBy: undefined,
          sourceReviewId: undefined,
          sourceVerificationId: undefined,
        },
      });
      break;
    case "approve_lesson": {
      ensure(member.reviewer, "Explicit reviewer authority is required", 403);
      ensure(
        inv.status === "closed" && !hostedBlockers(doc, files).length,
        "Close the supported improvement before approving learning",
        422,
      );
      existing(inv.lessons, c.id);
      const r = inv.verificationReviews.find((r) => r.id === c.reviewId),
        v = inv.verifications.find((v) => v.id === r?.verificationId);
      ensure(
        r && v && currentReview(inv, v)?.id === r.id,
        "Choose the exact current supporting review",
        422,
      );
      const lesson = inv.lessons.find((l) => l.id === c.id)!;
      const at = new Date().toISOString();
      doc.lessonDecisions.push({
        id: randomUUID(),
        lessonId: c.id,
        reviewId: r.id,
        actor: actor.id,
        at,
        text: lesson.lesson,
      });
      apply(doc, {
        type: "update_lesson",
        id: c.id,
        patch: {
          sourceReviewId: r.id,
          sourceVerificationId: v.id,
          approvedAt: at,
          approvedBy: actor.id,
        },
      });
      break;
    }
    case "close":
      ensure(member.reviewer, "Explicit reviewer authority is required", 403);
      ensure(
        !hostedBlockers(doc, files).length,
        hostedBlockers(doc, files)
          .map((f) => f.message)
          .join(" "),
        422,
      );
      apply(doc, c);
      break;
    case "reopen":
      apply(doc, c);
      break;
    case "remove_attachment":
    case "delete_record":
      ensure(administrator(member.role), "Manager access required", 403);
      break;
    case "verify_sources":
    case "duplicate":
      break;
  }
  invalidateHosted(doc, files);
  doc.investigation = InvestigationSchema.parse(doc.investigation);
  return doc;
}
