import { newId, nowIso, patchIn, stamp } from "@/lib/loop/ids";
import type {
  ChangeRationale,
  Edge,
  HistoryEvent,
  Lane,
  LinkedInvestigation,
  MapVersion,
  PainPoint,
  ProcessMap,
  Scope,
  Step,
  TimeObservation,
  VersionKind,
} from "./schema";
import { SCHEMA_VERSION } from "./schema";
import { deriveStatus, isCurrentMapped } from "./status";
import { median } from "./time";

export { stamp };

export function emptyVersion(kind: VersionKind): MapVersion {
  return { kind, steps: [], edges: [], painPoints: [], rationale: {} };
}

export function createMap(input: { mapNumber: string; title?: string; id?: string }): ProcessMap {
  const at = nowIso();
  return {
    id: input.id ?? newId(),
    createdAt: at,
    updatedAt: at,
    schemaVersion: SCHEMA_VERSION,
    mapNumber: input.mapNumber,
    title: input.title ?? "",
    scope: { startsWith: "", endsWith: "" },
    unit: "minutes",
    lanes: [],
    versions: { current: emptyVersion("current") },
    investigations: [],
    history: [{ id: newId(), at, type: "created" }],
    status: "draft",
    shopFloorMode: false,
    noPainPoints: false,
  };
}

export function makeLane(name: string, kind: Lane["kind"], order: number, at = nowIso()): Lane {
  return { ...stamp(at), name, kind, order };
}

export function makeStep(input: Partial<Step> & { laneId: string }, at = nowIso()): Step {
  return {
    ...stamp(at),
    order: 0,
    type: "process",
    name: "",
    valueClass: "unclassified",
    timeSource: "unknown",
    observations: [],
    ...input,
  };
}

/** Lane presets for the Scope stage. */
export const LANE_PRESETS: { key: string; name: string; lanes: { name: string; kind: Lane["kind"] }[] }[] = [
  { key: "order-to-cash", name: "Order to cash", lanes: [{ name: "Customer", kind: "customer" }, { name: "Sales", kind: "department" }, { name: "Order Entry", kind: "role" }, { name: "Production", kind: "department" }, { name: "Shipping", kind: "department" }, { name: "Accounting", kind: "department" }] },
  { key: "quote-to-order", name: "Quote to order", lanes: [{ name: "Customer", kind: "customer" }, { name: "Sales", kind: "department" }, { name: "Estimating", kind: "role" }, { name: "Engineering", kind: "department" }, { name: "Order Entry", kind: "role" }] },
  { key: "receiving-to-stock", name: "Receiving to stock", lanes: [{ name: "Supplier", kind: "supplier" }, { name: "Receiving", kind: "department" }, { name: "Quality", kind: "department" }, { name: "Warehouse", kind: "department" }, { name: "ERP", kind: "system" }] },
  { key: "machining-cell", name: "Machining cell", lanes: [{ name: "Planner", kind: "role" }, { name: "Setup", kind: "role" }, { name: "Operator", kind: "role" }, { name: "Inspection", kind: "role" }, { name: "Material Handler", kind: "role" }] },
  { key: "maintenance-request", name: "Maintenance request", lanes: [{ name: "Operator", kind: "role" }, { name: "Supervisor", kind: "role" }, { name: "Maintenance", kind: "department" }, { name: "Stores", kind: "department" }, { name: "CMMS", kind: "system" }] },
];

export type FlowAction =
  | { type: "replace"; map: ProcessMap }
  | { type: "set_meta"; patch: Partial<Pick<ProcessMap, "title" | "process" | "owner" | "department" | "site" | "unit" | "shopFloorMode" | "noPainPoints">> }
  | { type: "set_scope"; patch: Partial<Scope> }
  | { type: "add_lane"; lane: Lane }
  | { type: "add_lanes"; lanes: Lane[] }
  | { type: "update_lane"; id: string; patch: Partial<Lane> }
  | { type: "remove_lane"; id: string }
  | { type: "reorder_lane"; id: string; direction: -1 | 1 }
  | { type: "add_step"; version: VersionKind; step: Step; afterStepId?: string | null }
  | { type: "update_step"; version: VersionKind; id: string; patch: Partial<Step> }
  | { type: "remove_step"; version: VersionKind; id: string }
  | { type: "move_step"; version: VersionKind; id: string; direction: -1 | 1 }
  | { type: "add_observation"; version: VersionKind; stepId: string; observation: TimeObservation }
  | { type: "remove_observation"; version: VersionKind; stepId: string; observationId: string }
  | { type: "add_edge"; version: VersionKind; edge: Edge }
  | { type: "update_edge"; version: VersionKind; id: string; patch: Partial<Edge> }
  | { type: "remove_edge"; version: VersionKind; id: string }
  | { type: "add_pain"; version: VersionKind; pain: PainPoint }
  | { type: "update_pain"; version: VersionKind; id: string; patch: Partial<PainPoint> }
  | { type: "remove_pain"; version: VersionKind; id: string }
  | { type: "set_version_notes"; version: VersionKind; notes: string }
  | { type: "link_investigation"; link: LinkedInvestigation; note?: string }
  | { type: "sync_investigation_status"; investigationId: string; status: string }
  | { type: "fork_future" }
  | { type: "discard_future" }
  | { type: "set_rationale"; key: string; rationale: ChangeRationale }
  | { type: "clear_rationale"; key: string };

function historyEvent(type: HistoryEvent["type"], at: string, note?: string): HistoryEvent {
  return { id: newId(), at, type, note };
}

/** Renumber steps 0..n-1 by current order and rebuild the primary edge chain. */
export function normalizeVersion(v: MapVersion, at: string): MapVersion {
  const steps = [...v.steps].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt)).map((s, i) => (s.order === i ? s : { ...s, order: i }));
  const ids = new Set(steps.map((s) => s.id));
  const oldPrimary = new Map<string, Edge>();
  for (const e of v.edges) if (e.isPrimary) oldPrimary.set(`${e.fromStepId}>${e.toStepId}`, e);
  const primary: Edge[] = [];
  for (let i = 1; i < steps.length; i += 1) {
    const key = `${steps[i - 1].id}>${steps[i].id}`;
    const existing = oldPrimary.get(key);
    primary.push(existing ?? { ...stamp(at), fromStepId: steps[i - 1].id, toStepId: steps[i].id, isPrimary: true });
  }
  const branches = v.edges.filter((e) => !e.isPrimary && ids.has(e.fromStepId) && ids.has(e.toStepId) && e.fromStepId !== e.toStepId);
  const painPoints = v.painPoints.filter((p) => ids.has(p.stepId));
  const forkedFromStepIds = v.forkedFromStepIds ? Object.fromEntries(Object.entries(v.forkedFromStepIds).filter(([id]) => ids.has(id))) : undefined;
  return { ...v, steps, edges: [...primary, ...branches], painPoints, forkedFromStepIds };
}

function withVersion(map: ProcessMap, kind: VersionKind, fn: (v: MapVersion) => MapVersion, at: string): ProcessMap {
  const v = kind === "current" ? map.versions.current : map.versions.future;
  if (!v) return map;
  const next = normalizeVersion(fn(v), at);
  return { ...map, versions: { ...map.versions, [kind]: next } };
}

function observedCycleTime(step: Step): Partial<Step> {
  const m = median(step.observations.map((o) => o.durationMin));
  return m === undefined ? {} : { cycleTimeMin: m, timeSource: "observed" };
}

export function forkVersion(current: MapVersion, at: string): MapVersion {
  const idMap = new Map<string, string>();
  const steps = current.steps.map((s) => {
    const id = newId();
    idMap.set(s.id, id);
    return { ...structuredClone(s), id, createdAt: at, updatedAt: at, observations: s.observations.map((o) => ({ ...o, id: newId() })) };
  });
  const edges = current.edges.map((e) => ({ ...e, id: newId(), createdAt: at, updatedAt: at, fromStepId: idMap.get(e.fromStepId) ?? e.fromStepId, toStepId: idMap.get(e.toStepId) ?? e.toStepId }));
  const painPoints = current.painPoints.map((p) => ({ ...p, id: newId(), createdAt: at, updatedAt: at, stepId: idMap.get(p.stepId) ?? p.stepId }));
  const forkedFromStepIds: Record<string, string> = {};
  for (const [from, to] of idMap) forkedFromStepIds[to] = from;
  return { kind: "future", steps, edges, painPoints, forkedFromStepIds, rationale: {}, notes: undefined };
}

function core(map: ProcessMap, action: FlowAction, at: string): ProcessMap {
  switch (action.type) {
    case "replace":
      return action.map;
    case "set_meta":
      return { ...map, ...action.patch };
    case "set_scope":
      return { ...map, scope: { ...map.scope, ...action.patch } };

    case "add_lane":
      return { ...map, lanes: [...map.lanes, { ...action.lane, order: map.lanes.length }] };
    case "add_lanes":
      return { ...map, lanes: [...map.lanes, ...action.lanes.map((l, i) => ({ ...l, order: map.lanes.length + i }))] };
    case "update_lane":
      return { ...map, lanes: patchIn(map.lanes, action.id, action.patch, at) };
    case "remove_lane": {
      const remaining = [...map.lanes].filter((l) => l.id !== action.id).sort((a, b) => a.order - b.order).map((l, order) => ({ ...l, order }));
      const target = remaining[0]?.id;
      const move = (v: MapVersion): MapVersion => ({ ...v, steps: v.steps.map((s) => (s.laneId === action.id && target ? { ...s, laneId: target, updatedAt: at } : s)).filter((s) => s.laneId !== action.id) });
      return {
        ...map,
        lanes: remaining,
        versions: { current: move(map.versions.current), future: map.versions.future ? move(map.versions.future) : undefined },
      };
    }
    case "reorder_lane": {
      const sorted = [...map.lanes].sort((a, b) => a.order - b.order);
      const i = sorted.findIndex((l) => l.id === action.id);
      const j = i + action.direction;
      if (i < 0 || j < 0 || j >= sorted.length) return map;
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      return { ...map, lanes: sorted.map((l, order) => ({ ...l, order })) };
    }

    case "add_step":
      return withVersion(
        map,
        action.version,
        (v) => {
          const sorted = [...v.steps].sort((a, b) => a.order - b.order);
          const idx = action.afterStepId ? sorted.findIndex((s) => s.id === action.afterStepId) : action.afterStepId === null ? -1 : sorted.length - 1;
          const insertAt = idx + 1;
          const steps = sorted.map((s, i) => ({ ...s, order: i < insertAt ? i : i + 1 }));
          return { ...v, steps: [...steps, { ...action.step, order: insertAt }] };
        },
        at,
      );
    case "update_step":
      return withVersion(map, action.version, (v) => ({ ...v, steps: patchIn(v.steps, action.id, action.patch, at) }), at);
    case "remove_step":
      return withVersion(
        map,
        action.version,
        (v) => ({
          ...v,
          steps: v.steps.filter((s) => s.id !== action.id),
          edges: v.edges.filter((e) => e.fromStepId !== action.id && e.toStepId !== action.id),
          painPoints: v.painPoints.filter((p) => p.stepId !== action.id),
        }),
        at,
      );
    case "move_step":
      return withVersion(
        map,
        action.version,
        (v) => {
          const sorted = [...v.steps].sort((a, b) => a.order - b.order);
          const i = sorted.findIndex((s) => s.id === action.id);
          const j = i + action.direction;
          if (i < 0 || j < 0 || j >= sorted.length) return v;
          [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
          return { ...v, steps: sorted.map((s, order) => ({ ...s, order })) };
        },
        at,
      );
    case "add_observation":
      return withVersion(
        map,
        action.version,
        (v) => ({
          ...v,
          steps: v.steps.map((s) => {
            if (s.id !== action.stepId) return s;
            const next = { ...s, observations: [...s.observations, action.observation], updatedAt: at };
            return { ...next, ...observedCycleTime(next) };
          }),
        }),
        at,
      );
    case "remove_observation":
      return withVersion(
        map,
        action.version,
        (v) => ({
          ...v,
          steps: v.steps.map((s) => {
            if (s.id !== action.stepId) return s;
            const next = { ...s, observations: s.observations.filter((o) => o.id !== action.observationId), updatedAt: at };
            return next.observations.length ? { ...next, ...observedCycleTime(next) } : { ...next, timeSource: next.timeSource === "observed" ? "estimated" : next.timeSource };
          }),
        }),
        at,
      );

    case "add_edge":
      return withVersion(map, action.version, (v) => ({ ...v, edges: [...v.edges, { ...action.edge, isPrimary: false }] }), at);
    case "update_edge":
      return withVersion(map, action.version, (v) => ({ ...v, edges: patchIn(v.edges, action.id, action.patch, at) }), at);
    case "remove_edge":
      return withVersion(map, action.version, (v) => ({ ...v, edges: v.edges.filter((e) => e.id !== action.id) }), at);

    case "add_pain":
      return withVersion(map, action.version, (v) => ({ ...v, painPoints: [...v.painPoints, action.pain] }), at);
    case "update_pain":
      return withVersion(map, action.version, (v) => ({ ...v, painPoints: patchIn(v.painPoints, action.id, action.patch, at) }), at);
    case "remove_pain":
      return withVersion(map, action.version, (v) => ({ ...v, painPoints: v.painPoints.filter((p) => p.id !== action.id) }), at);
    case "set_version_notes":
      return withVersion(map, action.version, (v) => ({ ...v, notes: action.notes }), at);

    case "link_investigation": {
      const pain = (v: MapVersion): MapVersion =>
        action.link.painPointId ? { ...v, painPoints: v.painPoints.map((p) => (p.id === action.link.painPointId ? { ...p, investigationId: action.link.investigationId, updatedAt: at } : p)) } : v;
      return {
        ...map,
        investigations: [...map.investigations, action.link],
        versions: { current: pain(map.versions.current), future: map.versions.future ? pain(map.versions.future) : undefined },
        history: [...map.history, historyEvent("investigation_opened", at, action.note)],
      };
    }
    case "sync_investigation_status": {
      const changed = map.investigations.some((l) => l.investigationId === action.investigationId && l.lastKnownStatus !== action.status);
      if (!changed) return map;
      return { ...map, investigations: map.investigations.map((l) => (l.investigationId === action.investigationId ? { ...l, lastKnownStatus: action.status } : l)) };
    }

    case "fork_future": {
      if (map.versions.current.steps.length < 3) return map;
      return {
        ...map,
        versions: { ...map.versions, future: forkVersion(map.versions.current, at) },
        history: [...map.history, historyEvent("future_forked", at)],
      };
    }
    case "discard_future":
      return map.versions.future ? { ...map, versions: { current: map.versions.current } } : map;
    case "set_rationale":
      return withVersion(map, "future", (v) => ({ ...v, rationale: { ...v.rationale, [action.key]: action.rationale } }), at);
    case "clear_rationale":
      return withVersion(
        map,
        "future",
        (v) => {
          const rationale = { ...v.rationale };
          delete rationale[action.key];
          return { ...v, rationale };
        },
        at,
      );
    default:
      return map;
  }
}

/** Pure reducer. Re-derives status and bumps updatedAt on every change. */
export function reduce(map: ProcessMap, action: FlowAction): ProcessMap {
  const at = nowIso();
  const next = core(map, action, at);
  if (next === map) return map;
  const status = deriveStatus(next);
  const mapped = action.type !== "replace" && isCurrentMapped(next) && !next.history.some((h) => h.type === "current_mapped")
    ? { ...next, history: [...next.history, historyEvent("current_mapped", at)] }
    : next;
  const withStatus = mapped.status === status ? mapped : { ...mapped, status };
  return { ...withStatus, updatedAt: action.type === "replace" ? withStatus.updatedAt : at };
}
