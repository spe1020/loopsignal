import { newId } from "./ids";
import { createInvestigation, defaultCategories } from "./reducer";
import type {
  Action,
  CauseNode,
  ContainmentAction,
  Evidence,
  EvidenceLink,
  Investigation,
  LessonLearned,
  TimelineEvent,
  Verification,
} from "./schema";
import { deriveStatus } from "./status";
import { generateStatement } from "./text";

/**
 * Fully fictional sample: "Machined bracket hole diameter out of tolerance."
 * Regenerated with fresh ids every time it is loaded.
 */
export function buildSample(rcaNumber: string, now = new Date()): Investigation {
  const base = createInvestigation({ rcaNumber, title: "Machined bracket hole diameter out of tolerance" });
  // Anchor the fictional incident 12 days before "now" so every timestamp is in the past.
  const anchor = new Date(now.getTime() - 12 * 86_400_000);
  anchor.setHours(0, 0, 0, 0);
  const day = (d: number, h = 8, m = 0) => {
    const dt = new Date(anchor.getTime() + (d - 1) * 86_400_000);
    dt.setHours(h, m, 0, 0);
    return dt.toISOString();
  };
  const dateLabel = (d: number) =>
    new Date(anchor.getTime() + (d - 1) * 86_400_000).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const shortLabel = (d: number) =>
    new Date(anchor.getTime() + (d - 1) * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const isoDate = (d: number) => day(d, 12).slice(0, 10);
  const D1 = dateLabel(1);
  const t0 = day(1, 6);
  const s = (at: string) => ({ id: newId(), createdAt: at, updatedAt: at });

  base.createdAt = day(1, 9);
  base.updatedAt = day(9, 14);
  base.owner = "M. Okafor";
  base.department = "Quality";
  base.history = [{ id: newId(), at: base.createdAt, type: "created" }];

  base.problem = {
    whatHappened:
      `Assembly Cell 3 produced 42 brackets (P/N BR-2210) with an oversized locating hole during second shift on ${D1}. Measured values ranged from 10.08–10.14 mm`,
    whatShouldHaveHappened: "Drawing BR-2210 rev C requires 10.00 ± 0.05 mm",
    where: "Assembly Cell 3, Drill Station 3B",
    when: `${D1}, second shift (approx. 15:40–21:10)`,
    whenIso: day(1, 15, 40),
    frequency: "One shift; two earlier hourly samples were in tolerance",
    impact: "42 brackets on hold; one customer shipment delayed by two days",
    affected: "Order SO-88231 (Northfield Assemblies), downstream weld cell",
    process: "Drill and ream",
    department: "Machining",
    equipment: "Drill Station 3B, fixture FX-118",
    product: "Bracket BR-2210",
    impactFlags: { customer: true, financial: true, safety: false, quality: true, delivery: true },
    financialImpactNote: "Scrap + rework estimated at $1,860; expedite freight $410.",
    generatedStatement: "",
  };
  base.problem.generatedStatement = generateStatement(base.problem);

  const categories = defaultCategories(t0);
  base.fishboneCategories = categories;
  const cat = (name: string) => categories.find((c) => c.name === name)!.id;

  // --- Five Whys, branch A: fixture locator wear
  const a1: CauseNode = { ...s(day(2, 9)), text: "Drill wandered off the nominal hole position, enlarging the hole on entry", parentId: null, origin: "why", categoryId: cat("Machine"), evidenceState: "data_supported", classification: "symptom", challenged: false, candidate: false, collapsed: false, order: 0 };
  const a2: CauseNode = { ...s(day(2, 9, 10)), text: "The part shifted in fixture FX-118 during the drill cycle", parentId: a1.id, origin: "why", evidenceState: "data_supported", classification: "contributing", challenged: false, candidate: true, collapsed: false, order: 0, removalTest: "yes", rootCauseRationale: "" };
  const a3: CauseNode = { ...s(day(2, 9, 20)), text: "Fixture locator pin was worn 0.11 mm below its minimum diameter", parentId: a2.id, origin: "why", evidenceState: "verified", classification: "contributing", challenged: false, candidate: true, collapsed: false, order: 0, removalTest: "yes" };
  const a4: CauseNode = { ...s(day(2, 9, 30)), text: "Locator wear was not caught because the fixture PM interval (12 months) is longer than the locator's wear life at current volume", parentId: a3.id, origin: "why", evidenceState: "verified", classification: "root", rootCauseRationale: "Wear measurements on FX-118 and its sister fixture show locators leave tolerance around month 7 at current volume. The 12-month PM interval was set in 2019 at half today's volume. Removing this cause (shorter interval) prevents the shift that caused the oversize hole.", removalTest: "yes", challenged: true, candidate: true, collapsed: false, order: 0 };
  // --- branch B: inspection frequency / setup standard
  const b1: CauseNode = { ...s(day(2, 10)), text: "The oversize condition ran for roughly five hours before it was detected", parentId: null, origin: "why", categoryId: cat("Measurement"), evidenceState: "data_supported", classification: "symptom", challenged: false, candidate: false, collapsed: false, order: 1 };
  const b2: CauseNode = { ...s(day(2, 10, 10)), text: "Hourly in-process check uses a go/no-go plug that passes up to 10.10 mm, and the setup check does not look at the fixture", parentId: b1.id, origin: "why", evidenceState: "data_supported", classification: "contributing", challenged: false, candidate: true, collapsed: false, order: 0, removalTest: "yes" };
  const b3: CauseNode = { ...s(day(2, 10, 20)), text: "Setup standard SW-0312 has no fixture locator wear check, so wear is only found at PM", parentId: b2.id, origin: "why", evidenceState: "verified", classification: "root", rootCauseRationale: "The setup standard was written before the locator was changed to a hardened pin in 2022 and never updated. Adding a wear check at setup catches wear regardless of PM timing. Both branches converge on the fixture, so both roots must be addressed.", removalTest: "yes", challenged: false, candidate: true, collapsed: false, order: 0 };
  // fishbone-only causes
  const f1: CauseNode = { ...s(day(3, 8)), text: "Second-shift operator was new to Cell 3 (third week)", parentId: null, origin: "fishbone", categoryId: cat("People"), evidenceState: "observed", classification: "unclassified", challenged: true, candidate: false, collapsed: false, order: 2, note: "Checked: operator followed SW-0312 as written. Not a cause on its own." };
  const f2: CauseNode = { ...s(day(3, 8, 5)), text: "Bar stock lot 4471 hardness at upper end of spec", parentId: null, origin: "fishbone", categoryId: cat("Material"), evidenceState: "disproved", classification: "unclassified", challenged: false, candidate: false, collapsed: false, order: 3, note: "Lot 4471 also ran on first shift with holes in tolerance." };
  const f3: CauseNode = { ...s(day(3, 8, 10)), text: "Reamer changed mid-shift without a first-piece check", parentId: null, origin: "fishbone", categoryId: cat("Method"), evidenceState: "disproved", classification: "unclassified", challenged: false, candidate: false, collapsed: false, order: 4, note: `Tool log shows no reamer change on ${shortLabel(1)}.` };
  const f4: CauseNode = { ...s(day(3, 8, 15)), text: "Coolant concentration low (5.8% vs 7–9%)", parentId: null, origin: "fishbone", categoryId: cat("Environment"), evidenceState: "observed", classification: "unclassified", challenged: false, candidate: false, collapsed: false, order: 5, note: "Would affect finish more than size. Logged for the maintenance team." };
  base.causes = [a1, a2, a3, a4, b1, b2, b3, f1, f2, f3, f4];

  const ev = (title: string, type: Evidence["type"], description: string, source: string, date: string): Evidence => ({
    ...s(day(3, 10)), title, type, description, source, date,
  });
  const e1 = ev("CMM report, 42 held brackets", "measurement", "All 42 held parts measured 10.08–10.14 mm; scatter pattern elongated along the fixture's Y axis.", `CMM-02 report #${isoDate(2).replace(/-/g, "")}-17`, day(2, 8));
  const e2 = ev("Locator pin measurement, FX-118", "measurement", "Pin measured 7.89 mm against a 8.00 +0/-0.02 mm spec; visible polish wear on one side.", "Tool room inspection sheet", day(2, 11));
  const e3 = ev("Fixture PM record, FX-118", "system_record", `Last PM completed ${new Date(anchor.getTime() - 322 * 86_400_000).toISOString().slice(0, 10)}. Interval 12 months. No wear measurements recorded at PM.`, "CMMS work order WO-55120", day(2, 13));
  const e4 = ev("Sister fixture FX-119 locator measurement", "measurement", "FX-119 (same design, 7 months since PM) measured 7.95 mm — already below minimum.", "Tool room inspection sheet", day(4, 9));
  const e5 = ev("Setup standard SW-0312 rev B", "document", "Setup checklist covers spindle speed, reamer size, first-piece plug check. No fixture or locator check.", "Document control", day(3, 9));
  const e6 = ev("Operator interview, second shift", "interview", "Operator confirmed hourly plug checks passed; noticed 'slightly more chatter' around 16:00 but no size issue on the plug.", `Interview notes, ${shortLabel(3)}`, day(3, 14));
  const e7 = ev("Plug gauge calibration record", "system_record", "Go/no-go plug set P-118: go 9.95, no-go 10.10 mm. Certified in May. Does not detect 10.06–10.10.", "Gauge control log", day(3, 15));
  const e8 = ev("Photo: FX-118 locator wear", "photo_ref", `Photo of locator pin wear against a new pin. File: qa-share/rca/${rcaNumber}/locator-wear.jpg`, "QA shared drive", day(2, 11, 30));
  base.evidence = [e1, e2, e3, e4, e5, e6, e7, e8];

  const link = (evidenceId: string, causeId: string, relation: EvidenceLink["relation"]): EvidenceLink => ({ ...s(day(3, 11)), evidenceId, causeId, relation });
  base.evidenceLinks = [
    link(e1.id, a1.id, "supports"),
    link(e1.id, a2.id, "supports"),
    link(e2.id, a3.id, "supports"),
    link(e8.id, a3.id, "supports"),
    link(e3.id, a4.id, "supports"),
    link(e4.id, a4.id, "supports"),
    link(e1.id, b1.id, "supports"),
    link(e7.id, b2.id, "supports"),
    link(e6.id, b2.id, "supports"),
    link(e5.id, b3.id, "supports"),
    link(e6.id, f1.id, "contradicts"),
    link(e1.id, f2.id, "contradicts"),
  ];

  const tl = (at: string, text: string, tag: TimelineEvent["tag"], causeId?: string): TimelineEvent => ({ ...s(at), at, text, tag, causeId });
  base.timeline = [
    tl(day(1, 15, 0), "Second shift starts; setup check on Drill Station 3B signed off per SW-0312.", "system_record"),
    tl(day(1, 15, 40), "Estimated first oversize part (based on CMM order of parts in the hold bin).", "observed", a2.id),
    tl(day(1, 16, 5), "Operator notes slightly more chatter; hourly plug check passes.", "reported", b2.id),
    tl(day(1, 21, 10), "Weld cell reports brackets loose on locating pin; production stops on 3B.", "reported"),
    tl(day(1, 21, 30), "42 brackets segregated and tagged HOLD; 100% inspection ordered.", "system_record"),
    tl(day(2, 11, 0), "Tool room measures FX-118 locator pin at 7.89 mm.", "observed", a3.id),
  ];

  const cont = (action: string, owner: string, scope: string, status: ContainmentAction["status"], extra: Partial<ContainmentAction> = {}): ContainmentAction => ({ ...s(day(1, 21, 30)), action, owner, scope, status, ...extra });
  base.containment = [
    cont(`Segregate and tag all BR-2210 brackets produced on second shift ${shortLabel(1)}`, "R. Delgado", "42 parts, hold bin H-3", "verified", { startedAt: day(1, 21, 30), quantityAffected: "42", verificationNote: "Hold tags checked against CMM list; count matches." }),
    cont(`100% CMM inspection of BR-2210 WIP from ${shortLabel(1)}–${shortLabel(2)} before release to weld`, "M. Okafor", "All 3B output until fixture repaired", "released", { startedAt: day(2, 6), quantityAffected: "118 inspected, 76 released", verificationNote: `No further oversize parts after locator replacement on ${shortLabel(2)}.` }),
  ];

  const act = (kind: Action["kind"], horizon: Action["horizon"], title: string, description: string, linkedCauseIds: string[], owner: string, dueDate: string, status: Action["status"], priority: Action["priority"] = "high", extra: Partial<Action> = {}): Action => ({ ...s(day(4, 10)), kind, horizon, title, description, linkedCauseIds, owner, dueDate, status, priority, ...extra });
  const act1 = act("corrective", "immediate", "Replace worn fixture locator on FX-118", "Install new hardened locator pin; verify with first-piece CMM.", [a3.id], "T. Brandt", isoDate(3), "complete", "critical", { verificationMethod: "CMM first-piece + 30-piece capability study", expectedResult: "Hole diameter within 10.00 ± 0.05, Cpk ≥ 1.33" });
  const act2 = act("corrective", "immediate", "Replace locator on sister fixture FX-119 and inspect FX-120", "Same design family; FX-119 already below minimum.", [a4.id], "T. Brandt", isoDate(5), "complete", "high");
  const act3 = act("preventive", "structural", "Change fixture PM interval to 6 months and add locator measurement to the PM checklist", "Update CMMS PM template for the FX-1xx family; record locator diameter at each PM.", [a4.id], "L. Ferreira", isoDate(19), "in_progress", "high", { verificationMethod: "CMMS template review + first PM record", expectedResult: "Locators replaced before reaching minimum diameter" });
  const act4 = act("preventive", "structural", "Add locator wear check to setup standard SW-0312 and replace go/no-go with a variable gauge", "Revise SW-0312 to rev C with a locator gauge check at setup; issue bore gauge for hourly checks.", [b3.id, b2.id], "M. Okafor", isoDate(26), "ready_for_verification", "normal", { verificationMethod: "Audit three setups against rev C", expectedResult: "Setup cannot be signed off without locator check; hourly checks record actual size" });
  base.actions = [act1, act2, act3, act4];

  const ver = (actionId: string, expected: string, observed: string, result: Verification["result"], checkAt: string, evidenceIds: string[]): Verification => ({ ...s(checkAt), actionId, expected, observed, result, checkAt, verifier: "M. Okafor", evidenceIds });
  base.verifications = [
    ver(act1.id, "Hole diameter within 10.00 ± 0.05 mm on first piece and a 30-piece study", "First piece 10.01 mm; 30-piece study mean 10.005, Cpk 1.61. No oversize parts over 5 shifts.", "effective", day(8, 9), [e1.id]),
    ver(act2.id, "No oversize holes from FX-119/FX-120 after replacement", `Two shifts run so far; all in tolerance. Continue monitoring through ${shortLabel(15)}.`, "monitoring", day(9, 9), []),
  ];

  const lesson: LessonLearned = { ...s(day(9, 14)), lesson: "PM intervals set years ago do not track volume. Any fixture with a wear-limited locator needs a wear check at setup, not just at PM.", relatedProcess: "Fixture PM and setup standards, FX-1xx family", standardWorkUpdate: true, trainingUpdate: true, documentUpdate: true, similarProcessesToReview: "Cells 1, 2, and 5 use the same locator design (FX-104, FX-109, FX-131)." };
  base.lessons = [lesson];

  base.status = deriveStatus(base);
  return base;
}
