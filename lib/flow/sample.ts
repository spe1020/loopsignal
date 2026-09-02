import { newId } from "@/lib/loop/ids";
import { createMap, forkVersion, makeLane, makeStep, normalizeVersion } from "./reducer";
import type { Edge, PainPoint, ProcessMap, Step } from "./schema";
import { deriveStatus } from "./status";
import { DAY_MIN, HOUR_MIN } from "./time";

/**
 * Fully fictional sample: "Quote to order — custom bracket."
 * Five lanes, fourteen working steps, two decisions, one rework loop, a
 * two-day wait at engineering review, three pain points, and a future state
 * that removes two handoffs and cuts lead time from ~9 days to ~3.
 * Regenerated with fresh ids every time it is loaded.
 */
export function buildSampleMap(mapNumber: string, opts: { linkInvestigation?: { id: string; status: string }; now?: Date } = {}): ProcessMap {
  const now = opts.now ?? new Date();
  const anchor = new Date(now.getTime() - 20 * DAY_MIN * 60_000);
  anchor.setHours(9, 0, 0, 0);
  const day = (d: number, h = 9, m = 0) => {
    const dt = new Date(anchor.getTime() + (d - 1) * DAY_MIN * 60_000);
    dt.setHours(h, m, 0, 0);
    return dt.toISOString();
  };
  const t0 = day(1);
  const map = createMap({ mapNumber, title: "Quote to order — custom bracket" });
  map.createdAt = t0;
  map.updatedAt = day(6, 15);
  map.process = "Quote to order";
  map.owner = "D. Whitfield";
  map.department = "Sales Operations";
  map.site = "Northfield plant";
  map.scope = { startsWith: "Customer sends an RFQ with a drawing", endsWith: "Customer receives an order acknowledgment" };
  map.unit = "hours";
  map.history = [{ id: newId(), at: t0, type: "created" }];

  const lanes = {
    customer: makeLane("Customer", "customer", 0, t0),
    sales: makeLane("Sales", "department", 1, t0),
    estimating: makeLane("Estimating", "role", 2, t0),
    engineering: makeLane("Engineering", "department", 3, t0),
    orderEntry: makeLane("Order Entry", "role", 4, t0),
  };
  map.lanes = Object.values(lanes);

  let order = 0;
  const st = (laneId: string, input: Partial<Step>, at = day(2)) => makeStep({ laneId, order: order++, ...input }, at);
  const obs = (at: string, durationMin: number, note?: string) => ({ id: newId(), at, durationMin, note });

  const s1 = st(lanes.customer.id, { type: "start", name: "RFQ received", valueClass: "nnva", timeSource: "system_record", cycleTimeMin: 0 });
  const s2 = st(lanes.customer.id, { name: "Customer emails RFQ with drawing", cycleTimeMin: 15, valueClass: "nnva", system: "Email", trigger: "Customer need", timeSource: "estimated" });
  const s3 = st(lanes.sales.id, { name: "Sales logs RFQ in CRM", waitBeforeMin: 8 * HOUR_MIN, cycleTimeMin: 10, valueClass: "nnva", system: "CRM", trigger: "Daily inbox sweep", timeSource: "observed", observations: [obs(day(3, 10, 5), 9), obs(day(3, 14, 20), 12), obs(day(4, 10, 0), 10)] });
  const s4 = st(lanes.sales.id, { type: "inspection", name: "Sales checks drawing completeness", waitBeforeMin: 2 * HOUR_MIN, cycleTimeMin: 15, valueClass: "nnva", system: "Email", trigger: "CRM record created", timeSource: "estimated" });
  const s5 = st(lanes.sales.id, { type: "decision", name: "Needs engineering review?", cycleTimeMin: 5, valueClass: "nnva", timeSource: "estimated", trigger: "Drawing checked" });
  const s6 = st(lanes.engineering.id, { name: "Engineering reviews manufacturability", waitBeforeMin: 2 * DAY_MIN, cycleTimeMin: 90, valueClass: "va", system: "Email + CAD", timeSource: "estimated" });
  const s7 = st(lanes.engineering.id, { type: "transport", name: "Engineering returns notes to Sales", waitBeforeMin: 4 * HOUR_MIN, cycleTimeMin: 10, valueClass: "nva", system: "Email", trigger: "Review done", timeSource: "estimated" });
  const s8 = st(lanes.estimating.id, { name: "Estimating builds cost model", waitBeforeMin: 16 * HOUR_MIN, cycleTimeMin: 120, valueClass: "va", system: "Spreadsheet", trigger: "Email from Sales", timeSource: "observed", observations: [obs(day(4, 13, 0), 135), obs(day(5, 9, 30), 105), obs(day(5, 14, 0), 120)] });
  const s9 = st(lanes.estimating.id, { name: "Estimating prices quote", waitBeforeMin: 30, cycleTimeMin: 30, valueClass: "va", system: "Spreadsheet", trigger: "Cost model complete", timeSource: "observed", observations: [obs(day(4, 15, 30), 28), obs(day(5, 11, 40), 32)] });
  const s10 = st(lanes.sales.id, { name: "Sales reviews and sends quote", waitBeforeMin: DAY_MIN, cycleTimeMin: 20, valueClass: "nnva", system: "Email", trigger: "Quote in shared folder", timeSource: "estimated" });
  const s11 = st(lanes.customer.id, { type: "decision", name: "Quote accepted?", waitBeforeMin: 4 * DAY_MIN, cycleTimeMin: 10, valueClass: "nnva", trigger: "Quote email", timeSource: "estimated" });
  const s12 = st(lanes.customer.id, { name: "Customer sends PO", waitBeforeMin: 8 * HOUR_MIN, cycleTimeMin: 10, valueClass: "nnva", system: "Email", trigger: "Internal approval", timeSource: "estimated" });
  const s13 = st(lanes.orderEntry.id, { name: "Order Entry re-keys quote into ERP", waitBeforeMin: 8 * HOUR_MIN, cycleTimeMin: 45, valueClass: "nva", system: "ERP", trigger: "PO email forwarded", timeSource: "observed", observations: [obs(day(5, 10, 0), 40), obs(day(5, 15, 10), 50), obs(day(6, 9, 15), 45)] });
  const s14 = st(lanes.orderEntry.id, { name: "Order Entry confirms order to customer", waitBeforeMin: HOUR_MIN, cycleTimeMin: 10, valueClass: "nnva", system: "Email", trigger: "ERP order number", timeSource: "estimated" });
  const s15 = st(lanes.orderEntry.id, { type: "end", name: "Order acknowledged", valueClass: "nnva", timeSource: "system_record", cycleTimeMin: 0 });
  const steps = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15];

  const edge = (from: Step, to: Step, label: string, isPrimary: boolean): Edge => ({ id: newId(), createdAt: day(2), updatedAt: day(2), fromStepId: from.id, toStepId: to.id, label, isPrimary });
  const edges: Edge[] = [
    edge(s5, s6, "Yes", true),
    edge(s5, s8, "No", false),
    edge(s11, s12, "Accepted", true),
    edge(s11, s8, "Revise", false),
  ];

  const pain = (step: Step, text: string, category: PainPoint["category"], severity: PainPoint["severity"], at: string, investigationId?: string): PainPoint => ({ id: newId(), createdAt: at, updatedAt: at, stepId: step.id, text, category, severity, investigationId });
  const painPoints: PainPoint[] = [
    pain(s3, "RFQs sit in the shared Sales inbox until the daily sweep. Two RFQs last month were found three days late.", "waiting", "medium", day(4, 11)),
    pain(s6, "Manufacturability review does not check drawing tolerances against fixture capability. The BR-2210 oversize hole surfaced in production, not at quote.", "quality", "high", day(4, 11, 20), opts.linkInvestigation?.id),
    pain(s13, "Quote is re-keyed into ERP by hand. Two order errors last month traced to typos in quantity and revision.", "rework", "high", day(5, 16)),
  ];

  map.versions.current = normalizeVersion({ kind: "current", steps, edges, painPoints, rationale: {} }, day(2));

  if (opts.linkInvestigation) {
    map.investigations = [{ id: newId(), investigationId: opts.linkInvestigation.id, stepId: s6.id, painPointId: painPoints[1].id, openedAt: day(4, 11, 30), lastKnownStatus: opts.linkInvestigation.status }];
    map.history.push({ id: newId(), at: day(4, 11, 30), type: "investigation_opened", note: "Opened from step 6 (Engineering reviews manufacturability)." });
  }
  map.history.push({ id: newId(), at: day(2, 16), type: "current_mapped" });

  // ---- Future state: forked from current, then edited with a rationale on every change.
  const forkedAt = day(6, 10);
  const future = forkVersion(map.versions.current, forkedAt);
  const fid = (cur: Step) => Object.entries(future.forkedFromStepIds ?? {}).find(([, from]) => from === cur.id)![0];
  const f = new Map(future.steps.map((s) => [s.id, s]));
  const set = (cur: Step, patch: Partial<Step>, rationale: string) => {
    const id = fid(cur);
    f.set(id, { ...f.get(id)!, ...patch, updatedAt: forkedAt });
    future.rationale[id] = { text: rationale };
  };
  const remove = (cur: Step, rationale: string) => {
    f.delete(fid(cur));
    future.rationale[cur.id] = { text: rationale };
  };
  set(s2, { name: "Customer submits RFQ in portal with drawing", system: "Quote portal" }, "The portal captures the required fields and the drawing up front, so nothing bounces back for missing information.");
  remove(s3, "Portal submission creates the CRM record automatically. No one has to sweep an inbox.");
  remove(s4, "The portal validates the drawing and required fields before the customer can submit.");
  set(s5, { laneId: lanes.estimating.id, waitBeforeMin: HOUR_MIN, trigger: "Portal queue, checked twice daily" }, "Estimating triages the queue twice a day and routes to Engineering directly; Sales no longer relays.");
  set(s6, { waitBeforeMin: 8 * HOUR_MIN, trigger: "Portal review queue", system: "Quote portal + CAD" }, "Engineering runs a 15-minute daily triage of the review queue. The two-day wait was queue time, not review time.");
  remove(s7, "Engineering notes live on the RFQ record; Estimating sees them the moment the review is marked done.");
  set(s8, { waitBeforeMin: 2 * HOUR_MIN, trigger: "Queue notification" }, "Estimating is notified from the queue instead of email, so work starts the same half-day.");
  set(s10, { laneId: lanes.estimating.id, name: "Quote sent to customer from quote tool", waitBeforeMin: HOUR_MIN, cycleTimeMin: 10, system: "Quote portal", trigger: "Price approved in tool" }, "Sales approval is required only above $25k. Standard quotes go out from the quote tool, which removes a handoff and a one-day wait.");
  set(s11, { waitBeforeMin: 2 * DAY_MIN, trigger: "Quote in portal with accept button" }, "The quote carries a 48-hour follow-up and a one-click accept in the portal. Customer decision time is theirs, but the follow-up halves it in the pilot.");
  set(s12, { name: "Customer accepts quote in portal (creates PO)", cycleTimeMin: 5, waitBeforeMin: 2 * HOUR_MIN, system: "Quote portal", trigger: "Accept clicked" }, "Acceptance in the portal is the PO. No separate PO email to wait for.");
  remove(s13, "The ERP sales order is created from the accepted quote record. Nothing is re-keyed, so the typo errors cannot happen.");
  remove(s14, "The portal sends the acknowledgment automatically when the ERP order exists.");
  set(s15, { laneId: lanes.customer.id, name: "Order acknowledged automatically" }, "Acknowledgment is a system event the customer sees in the portal, not an Order Entry task.");
  // Rework loop still exists (Revise → cost model) but is now inside the tool; keep it.
  future.steps = [...f.values()].sort((a, b) => a.order - b.order);
  map.versions.future = normalizeVersion(future, forkedAt);
  map.history.push({ id: newId(), at: forkedAt, type: "future_forked" });

  map.status = deriveStatus(map);
  return map;
}
