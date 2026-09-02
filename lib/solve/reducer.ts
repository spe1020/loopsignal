import { newId, nowIso, patchIn, stamp } from "@/lib/loop/ids";
import type {
  Action,
  CauseNode,
  ContainmentAction,
  Evidence,
  EvidenceLink,
  EvidenceRelation,
  FishboneCategory,
  HistoryEvent,
  Investigation,
  LessonLearned,
  ProblemStatement,
  TimelineEvent,
  Verification,
} from "./schema";
import { SCHEMA_VERSION } from "./schema";
import { deriveStatus } from "./status";
import { generateStatement } from "./text";

export const DEFAULT_CATEGORIES = [
  "People",
  "Machine",
  "Method",
  "Material",
  "Measurement",
  "Environment",
] as const;

export const SUGGESTED_CATEGORIES = [
  "Management",
  "Software",
  "Supplier",
  "Process",
  "Policy",
] as const;

export { stamp };

export function emptyProblem(): ProblemStatement {
  return {
    whatHappened: "",
    whatShouldHaveHappened: "",
    where: "",
    when: "",
    frequency: "",
    impact: "",
    affected: "",
    impactFlags: {
      customer: false,
      financial: false,
      safety: false,
      quality: false,
      delivery: false,
    },
    generatedStatement: "",
  };
}

export function defaultCategories(at = nowIso()): FishboneCategory[] {
  return DEFAULT_CATEGORIES.map((name, order) => ({
    ...stamp(at),
    name,
    order,
    isDefault: true,
  }));
}

export function createInvestigation(input: {
  rcaNumber: string;
  title?: string;
  id?: string;
}): Investigation {
  const at = nowIso();
  return {
    id: input.id ?? newId(),
    createdAt: at,
    updatedAt: at,
    schemaVersion: SCHEMA_VERSION,
    rcaNumber: input.rcaNumber,
    title: input.title ?? "",
    status: "draft",
    shopFloorMode: false,
    problem: emptyProblem(),
    containment: [],
    causes: [],
    fishboneCategories: defaultCategories(at),
    evidence: [],
    evidenceLinks: [],
    timeline: [],
    actions: [],
    verifications: [],
    lessons: [],
    history: [{ id: newId(), at, type: "created" }],
    reopenedCount: 0,
  };
}

export type SolveAction =
  | { type: "replace"; investigation: Investigation }
  | { type: "set_meta"; patch: Partial<Pick<Investigation, "title" | "owner" | "department" | "shopFloorMode">> }
  | { type: "set_problem"; patch: Partial<ProblemStatement> }
  | { type: "add_containment"; item: ContainmentAction }
  | { type: "update_containment"; id: string; patch: Partial<ContainmentAction> }
  | { type: "remove_containment"; id: string }
  | { type: "add_cause"; cause: CauseNode }
  | { type: "update_cause"; id: string; patch: Partial<CauseNode> }
  | { type: "remove_cause_branch"; id: string }
  | { type: "move_cause"; id: string; patch: Pick<CauseNode, "parentId" | "origin"> & { categoryId?: string } }
  | { type: "add_category"; category: FishboneCategory }
  | { type: "update_category"; id: string; patch: Partial<FishboneCategory> }
  | { type: "remove_category"; id: string }
  | { type: "reorder_category"; id: string; direction: -1 | 1 }
  | { type: "add_evidence"; item: Evidence }
  | { type: "update_evidence"; id: string; patch: Partial<Evidence> }
  | { type: "remove_evidence"; id: string }
  | { type: "link_evidence"; evidenceId: string; causeId: string; relation: EvidenceRelation }
  | { type: "unlink_evidence"; evidenceId: string; causeId: string }
  | { type: "add_timeline"; item: TimelineEvent }
  | { type: "update_timeline"; id: string; patch: Partial<TimelineEvent> }
  | { type: "remove_timeline"; id: string }
  | { type: "add_action"; item: Action }
  | { type: "update_action"; id: string; patch: Partial<Action> }
  | { type: "remove_action"; id: string }
  | { type: "add_verification"; item: Verification }
  | { type: "update_verification"; id: string; patch: Partial<Verification> }
  | { type: "remove_verification"; id: string }
  | { type: "add_lesson"; item: LessonLearned }
  | { type: "update_lesson"; id: string; patch: Partial<LessonLearned> }
  | { type: "remove_lesson"; id: string }
  | { type: "reopen"; note?: string }
  | { type: "close"; note?: string };

export function descendantIds(causes: CauseNode[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of causes) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function supportCount(inv: Investigation, causeId: string) {
  let supports = 0;
  let contradicts = 0;
  for (const l of inv.evidenceLinks) {
    if (l.causeId !== causeId) continue;
    if (l.relation === "supports") supports += 1;
    else contradicts += 1;
  }
  return { supports, contradicts };
}

function historyEvent(type: HistoryEvent["type"], at: string, extra: Partial<HistoryEvent> = {}): HistoryEvent {
  return { id: newId(), at, type, ...extra };
}

function core(inv: Investigation, action: SolveAction, at: string): Investigation {
  switch (action.type) {
    case "replace":
      return action.investigation;
    case "set_meta":
      return { ...inv, ...action.patch };
    case "set_problem": {
      const problem = { ...inv.problem, ...action.patch };
      problem.generatedStatement = generateStatement(problem);
      return { ...inv, problem };
    }
    case "add_containment":
      return { ...inv, containment: [...inv.containment, action.item] };
    case "update_containment":
      return { ...inv, containment: patchIn(inv.containment, action.id, action.patch, at) };
    case "remove_containment":
      return { ...inv, containment: inv.containment.filter((c) => c.id !== action.id) };

    case "add_cause": {
      const siblings = inv.causes.filter((c) => c.parentId === action.cause.parentId);
      const order = action.cause.order ?? siblings.length;
      return { ...inv, causes: [...inv.causes, { ...action.cause, order }] };
    }
    case "update_cause": {
      const patch = { ...action.patch };
      // Field-level guard: `verified` requires ≥1 supporting evidence link.
      if (patch.evidenceState === "verified") {
        const { supports } = supportCount(inv, action.id);
        if (supports === 0) delete patch.evidenceState;
      }
      if (patch.classification && patch.classification !== "root") {
        // keep rationale text, it is harmless, but no longer required
      }
      return { ...inv, causes: patchIn(inv.causes, action.id, patch, at) };
    }
    case "remove_cause_branch": {
      const gone = descendantIds(inv.causes, action.id);
      return {
        ...inv,
        causes: inv.causes.filter((c) => !gone.has(c.id)),
        evidenceLinks: inv.evidenceLinks.filter((l) => !gone.has(l.causeId)),
        actions: inv.actions.map((a) => ({
          ...a,
          linkedCauseIds: a.linkedCauseIds.filter((id) => !gone.has(id)),
        })),
        timeline: inv.timeline.map((t) =>
          t.causeId && gone.has(t.causeId) ? { ...t, causeId: undefined } : t,
        ),
      };
    }
    case "move_cause": {
      const gone = descendantIds(inv.causes, action.id);
      if (action.patch.parentId && gone.has(action.patch.parentId)) return inv;
      const siblings = inv.causes.filter(
        (c) => c.parentId === action.patch.parentId && c.id !== action.id,
      );
      return {
        ...inv,
        causes: patchIn(
          inv.causes,
          action.id,
          {
            parentId: action.patch.parentId,
            origin: action.patch.origin,
            categoryId: action.patch.categoryId,
            order: siblings.length,
          },
          at,
        ),
      };
    }

    case "add_category":
      return { ...inv, fishboneCategories: [...inv.fishboneCategories, action.category] };
    case "update_category":
      return { ...inv, fishboneCategories: patchIn(inv.fishboneCategories, action.id, action.patch, at) };
    case "remove_category": {
      const remaining = inv.fishboneCategories.filter((c) => c.id !== action.id);
      return {
        ...inv,
        fishboneCategories: remaining.map((c, order) => ({ ...c, order })),
        causes: inv.causes.map((c) =>
          c.categoryId === action.id ? { ...c, categoryId: undefined, updatedAt: at } : c,
        ),
      };
    }
    case "reorder_category": {
      const sorted = [...inv.fishboneCategories].sort((a, b) => a.order - b.order);
      const i = sorted.findIndex((c) => c.id === action.id);
      const j = i + action.direction;
      if (i < 0 || j < 0 || j >= sorted.length) return inv;
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      return {
        ...inv,
        fishboneCategories: sorted.map((c, order) => ({ ...c, order })),
      };
    }

    case "add_evidence":
      return { ...inv, evidence: [...inv.evidence, action.item] };
    case "update_evidence":
      return { ...inv, evidence: patchIn(inv.evidence, action.id, action.patch, at) };
    case "remove_evidence":
      return {
        ...inv,
        evidence: inv.evidence.filter((e) => e.id !== action.id),
        evidenceLinks: inv.evidenceLinks.filter((l) => l.evidenceId !== action.id),
        verifications: inv.verifications.map((v) => ({
          ...v,
          evidenceIds: v.evidenceIds.filter((id) => id !== action.id),
        })),
      };
    case "link_evidence": {
      const existing = inv.evidenceLinks.find(
        (l) => l.evidenceId === action.evidenceId && l.causeId === action.causeId,
      );
      if (existing) {
        return {
          ...inv,
          evidenceLinks: patchIn(inv.evidenceLinks, existing.id, { relation: action.relation }, at),
        };
      }
      const link: EvidenceLink = {
        ...stamp(at),
        evidenceId: action.evidenceId,
        causeId: action.causeId,
        relation: action.relation,
      };
      return { ...inv, evidenceLinks: [...inv.evidenceLinks, link] };
    }
    case "unlink_evidence": {
      const links = inv.evidenceLinks.filter(
        (l) => !(l.evidenceId === action.evidenceId && l.causeId === action.causeId),
      );
      const stillSupported = links.some(
        (l) => l.causeId === action.causeId && l.relation === "supports",
      );
      return {
        ...inv,
        evidenceLinks: links,
        causes: inv.causes.map((c) =>
          c.id === action.causeId && c.evidenceState === "verified" && !stillSupported
            ? { ...c, evidenceState: "data_supported", updatedAt: at }
            : c,
        ),
      };
    }

    case "add_timeline":
      return { ...inv, timeline: [...inv.timeline, action.item] };
    case "update_timeline":
      return { ...inv, timeline: patchIn(inv.timeline, action.id, action.patch, at) };
    case "remove_timeline":
      return { ...inv, timeline: inv.timeline.filter((t) => t.id !== action.id) };

    case "add_action":
      return { ...inv, actions: [...inv.actions, action.item] };
    case "update_action":
      return { ...inv, actions: patchIn(inv.actions, action.id, action.patch, at) };
    case "remove_action":
      return {
        ...inv,
        actions: inv.actions.filter((a) => a.id !== action.id),
        verifications: inv.verifications.filter((v) => v.actionId !== action.id),
      };

    case "add_verification":
      return { ...inv, verifications: [...inv.verifications, action.item] };
    case "update_verification":
      return { ...inv, verifications: patchIn(inv.verifications, action.id, action.patch, at) };
    case "remove_verification":
      return { ...inv, verifications: inv.verifications.filter((v) => v.id !== action.id) };

    case "add_lesson":
      return { ...inv, lessons: [...inv.lessons, action.item] };
    case "update_lesson":
      return { ...inv, lessons: patchIn(inv.lessons, action.id, action.patch, at) };
    case "remove_lesson":
      return { ...inv, lessons: inv.lessons.filter((l) => l.id !== action.id) };

    case "reopen":
      return {
        ...inv,
        closedAt: undefined,
        reopenedCount: inv.reopenedCount + 1,
        history: [
          ...inv.history,
          historyEvent("reopened", at, { from: inv.status, to: "reopened", note: action.note }),
        ],
      };
    case "close":
      return {
        ...inv,
        closedAt: at,
        history: [
          ...inv.history,
          historyEvent("closed", at, { from: inv.status, to: "closed", note: action.note }),
        ],
      };
    default:
      return inv;
  }
}

/** Pure reducer. Re-derives status and bumps updatedAt on every change. */
export function reduce(inv: Investigation, action: SolveAction): Investigation {
  const at = nowIso();
  const next = core(inv, action, at);
  if (next === inv) return inv;
  const status = deriveStatus(next);
  const withStatus =
    status !== next.status || next.status !== inv.status
      ? {
          ...next,
          status,
          history:
            action.type === "replace" || status === inv.status || status === "closed" || status === "reopened"
              ? next.history
              : [...next.history, historyEvent("status_changed", at, { from: inv.status, to: status })],
        }
      : next;
  return { ...withStatus, updatedAt: action.type === "replace" ? withStatus.updatedAt : at };
}
