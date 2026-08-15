import type {
  ActionSource,
  ActionTiming,
  BotControl,
  BotTaskStatus,
  BotType,
  BriefAction,
  BriefIssue,
  BriefResult,
  Category,
  CategoryStripItem,
  ChangeItem,
  HumanRole,
  MaintenanceView,
  Owner,
  OwnerType,
  PlantStatusView,
  PriorityItem,
  ProductionStatus,
  ProductionView,
  QualityView,
  SampleSnapshot,
  ScheduleView,
  Severity,
  SupplyView,
} from "./types";
import {
  plantStatusLabels,
  priorityTierFor,
  productionStatusLabels,
  severityShort,
} from "./types";

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function roundPct(actual: number, plan: number): number {
  if (plan <= 0) return 0;
  return Math.round((actual / plan) * 100);
}

export function formatQty(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatPct(value: number): string {
  return `${value}%`;
}

export function formatDays(value: number): string {
  return `${value.toFixed(1)} days`;
}

export function todayStamp(timeZone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatBriefDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

export function productionStatusFor(
  attainmentPct: number,
  downtimeMinutes: number,
): ProductionStatus {
  if (attainmentPct < 90 || downtimeMinutes >= 60) return "action_required";
  if (attainmentPct < 100 || downtimeMinutes >= 20) return "watch";
  return "on_plan";
}

function productionSeverity(status: ProductionStatus): Severity {
  if (status === "action_required") return "red";
  if (status === "watch") return "amber";
  return "green";
}

function qualitySeverity(record: SampleSnapshot["quality"][number]): Severity {
  if (record.alertStatus !== "active") return "green";
  const scrapPct = round1((record.scrapQty / record.inspectedQty) * 100);
  if (record.containmentStatus === "active" && scrapPct >= 3) return "red";
  if (record.containmentStatus === "active") return "amber";
  return "blue";
}

function supplySeverity(daysOfSupply: number): Severity {
  if (daysOfSupply < 2) return "red";
  if (daysOfSupply < 3) return "amber";
  if (daysOfSupply < 5) return "amber";
  return "green";
}

function supplyLabel(daysOfSupply: number): string {
  if (daysOfSupply < 2) return "Critical";
  if (daysOfSupply < 3) return "At Risk";
  if (daysOfSupply < 5) return "Watch";
  return "On Track";
}

function maintenanceSeverity(
  record: SampleSnapshot["maintenance"][number],
): Severity {
  if (record.downtimeMinutes >= 60) return "amber";
  if (record.permanentActionStatus.toLowerCase().includes("scheduled")) {
    return "amber";
  }
  return "blue";
}

function scheduleView(record: SampleSnapshot["schedule"][number]): ScheduleView {
  const coverageGap = record.finishedGoodsDays < record.shipmentInDays;
  const nearTerm = record.shipmentInDays <= 1;
  if (coverageGap && nearTerm) {
    return {
      record,
      status: "potential_risk",
      severity: "amber",
      statusLabel: "Potential schedule risk",
    };
  }
  if (coverageGap) {
    return {
      record,
      status: "potential_risk",
      severity: "blue",
      statusLabel: "Potential schedule risk",
    };
  }
  return {
    record,
    status: "on_track",
    severity: "green",
    statusLabel: "On Track",
  };
}

function buildProduction(snapshot: SampleSnapshot): ProductionView[] {
  return snapshot.production.map((record) => {
    const attainmentPct = roundPct(record.actualQty, record.scheduledQty);
    const varianceQty = record.actualQty - record.scheduledQty;
    const recoveryRequired = Math.max(0, record.scheduledQty - record.actualQty);
    const status = productionStatusFor(attainmentPct, record.downtimeMinutes);
    return {
      record,
      attainmentPct,
      varianceQty,
      recoveryRequired,
      status,
      severity: productionSeverity(status),
      statusLabel: productionStatusLabels[status],
    };
  });
}

function buildQuality(snapshot: SampleSnapshot): QualityView[] {
  return snapshot.quality.map((record) => {
    const scrapPct = round1((record.scrapQty / record.inspectedQty) * 100);
    const severity = qualitySeverity(record);
    return {
      record,
      scrapPct,
      severity,
      statusLabel:
        record.containmentStatus === "active"
          ? "Containment Active"
          : severity === "green"
            ? "Cleared"
            : "Monitor",
    };
  });
}

function buildSupply(snapshot: SampleSnapshot): SupplyView[] {
  return snapshot.supply.map((record) => ({
    record,
    riskLevel: supplySeverity(record.daysOfSupply),
    statusLabel: supplyLabel(record.daysOfSupply),
  }));
}

function buildMaintenance(snapshot: SampleSnapshot): MaintenanceView[] {
  return snapshot.maintenance.map((record) => {
    const severity = maintenanceSeverity(record);
    return {
      record,
      severity,
      statusLabel:
        severity === "green" ? "Stable" : "Active Constraint",
    };
  });
}

function productionIssue(row: ProductionView): BriefIssue | null {
  if (row.severity === "green") return null;
  const rec = row.record;
  const below = rec.scheduledQty - rec.actualQty;
  return {
    id: rec.id,
    category: "production",
    severity: row.severity,
    title: `${rec.workCenter} below plan`,
    problem: `${rec.workCenter} finished ${formatPct(row.attainmentPct)} to plan after ${rec.downtimeMinutes} minutes of downtime.`,
    area: rec.workCenter,
    workCenter: rec.workCenter,
    productFamily: rec.productFamily,
    owner: rec.workCenter === "Assembly Line 1" ? "Operations" : "Operations",
    impact:
      rec.id === "prod-asm2"
        ? "Tomorrow morning's build begins with reduced buffer inventory."
        : rec.id === "prod-asm1"
          ? "Fastener Kit output is 30 units short and may tighten if material waits continue."
          : "Housing output is below plan while the quality hold remains in place.",
    immediateAction: rec.recommendedAction,
    structuralAction:
      rec.id === "prod-asm2"
        ? "Replace the worn drive component and review the PM interval."
        : rec.id === "prod-asm1"
          ? "Remove material-wait from the standard sequence once fastener coverage is restored."
          : "Release 100% inspection only after the surface-finish cause is confirmed.",
    metrics: [
      { label: "Actual", value: formatQty(rec.actualQty) },
      { label: "Plan", value: formatQty(rec.scheduledQty) },
      { label: "Attainment", value: formatPct(row.attainmentPct) },
      { label: "Downtime", value: `${rec.downtimeMinutes} minutes` },
      { label: "Primary cause", value: rec.primaryDowntimeReason },
      ...(row.recoveryRequired > 0
        ? [{ label: "Recovery required", value: `${formatQty(below)} units` }]
        : []),
    ],
  };
}

function qualityIssue(row: QualityView): BriefIssue {
  const rec = row.record;
  return {
    id: rec.id,
    category: "quality",
    severity: row.severity,
    title: rec.issue,
    problem: `${rec.defectCategory} on ${rec.productFamily} affected ${formatQty(rec.quantityAffected)} pieces, with ${formatQty(rec.scrapQty)} scrap and ${formatQty(rec.reworkQty)} rework.`,
    area: rec.workCenter,
    workCenter: rec.workCenter,
    productFamily: rec.productFamily,
    owner: rec.owner,
    impact:
      "Scrap moved above the demo threshold on the day shift. Containment is holding the process, but the cause is not yet confirmed.",
    immediateAction: rec.immediateAction,
    structuralAction: rec.structuralAction,
    related: [{ product: "know", label: "Search in LoopKnow", href: "/know" }],
    metrics: [
      { label: "Affected", value: `${formatQty(rec.quantityAffected)} pieces` },
      { label: "Scrap", value: formatQty(rec.scrapQty) },
      { label: "Rework", value: formatQty(rec.reworkQty) },
      { label: "Scrap rate", value: `${row.scrapPct.toFixed(1)}%` },
      { label: "Status", value: row.statusLabel },
      { label: "Severity", value: severityShort[row.severity] },
    ],
  };
}

function supplyIssue(row: SupplyView): BriefIssue | null {
  if (row.riskLevel === "green") return null;
  const rec = row.record;
  return {
    id: rec.id,
    category: "supply",
    severity: row.riskLevel,
    title: rec.item,
    problem: `${rec.item} is at ${formatDays(rec.daysOfSupply)} of supply, with replenishment expected in ${rec.replenishmentDays} days.`,
    area: rec.affectedWorkCenter,
    workCenter: rec.affectedWorkCenter,
    owner: rec.owner,
    impact:
      rec.daysOfSupply < 3
        ? "A fastener shortage may affect tomorrow's Assembly Line 1 sequence if the inbound shipment is late."
        : "Coverage is still inside the week, but the resin position should be confirmed before it becomes a constraint.",
    immediateAction: rec.immediateAction,
    structuralAction: rec.structuralAction,
    related: [
      { product: "supply", label: "View in LoopSupply", href: "/supply" },
      ...(rec.id === "sup-fastener"
        ? [{ product: "source" as const, label: "Review in LoopSource", href: "/source" }]
        : []),
    ],
    metrics: [
      { label: "Supplier", value: rec.supplier },
      { label: "Days of supply", value: formatDays(rec.daysOfSupply) },
      { label: "Expected replenishment", value: `${rec.replenishmentDays} days` },
      { label: "Affected area", value: rec.affectedWorkCenter },
      { label: "Status", value: row.statusLabel },
      { label: "Owner", value: rec.owner },
    ],
  };
}

function maintenanceIssue(row: MaintenanceView): BriefIssue | null {
  if (row.severity === "green") return null;
  const rec = row.record;
  return {
    id: rec.id,
    category: "maintenance",
    severity: row.severity,
    title: rec.asset,
    problem: `${rec.issue} caused ${rec.downtimeMinutes} minutes of unplanned downtime on ${rec.workCenter}.`,
    area: rec.workCenter,
    workCenter: rec.workCenter,
    owner: rec.owner,
    impact:
      "The line is running on a temporary repair. A second failure would extend today's production miss into the next shift.",
    immediateAction: rec.immediateAction,
    structuralAction: rec.structuralAction,
    related: [{ product: "know", label: "Search in LoopKnow", href: "/know" }],
    metrics: [
      { label: "Unplanned downtime", value: `${rec.downtimeMinutes} minutes` },
      { label: "Current state", value: rec.temporaryCountermeasure },
      { label: "Permanent action", value: rec.permanentActionStatus },
      { label: "Severity", value: severityShort[row.severity] },
      { label: "Owner", value: rec.owner },
    ],
  };
}

function scheduleIssue(row: ScheduleView): BriefIssue | null {
  if (row.status === "on_track") return null;
  const rec = row.record;
  return {
    id: rec.id,
    category: "schedule",
    severity: row.severity,
    title: rec.productFamily,
    problem: `${rec.productFamily} has ${formatDays(rec.finishedGoodsDays)} of finished coverage against a shipment ${rec.nextShipment.toLowerCase()}.`,
    area: rec.productFamily,
    productFamily: rec.productFamily,
    owner: "Planning",
    impact:
      "No customer miss is demonstrated in the current snapshot. Treat this as coverage to watch, not a failed shipment.",
    immediateAction: "Recheck finished-goods coverage after today's recovery decisions.",
    structuralAction: "Align safety-stock policy with the current demand mix.",
    metrics: [
      { label: "Next shipment", value: rec.nextShipment },
      { label: "Finished goods", value: `${formatDays(rec.finishedGoodsDays)} coverage` },
      { label: "Open demand", value: formatQty(rec.openDemand) },
      { label: "Status", value: row.statusLabel },
    ],
  };
}

function severityRank(severity: Severity): number {
  if (severity === "red") return 0;
  if (severity === "amber") return 1;
  if (severity === "blue") return 2;
  return 3;
}

function categoryRank(category: Category): number {
  const order: Category[] = [
    "quality",
    "production",
    "maintenance",
    "supply",
    "schedule",
  ];
  return order.indexOf(category);
}

function issueScore(issue: BriefIssue): number {
  let score = 0;
  if (issue.severity === "red") score += 100;
  if (issue.severity === "amber") score += 50;
  if (issue.severity === "blue") score += 10;
  if (issue.category === "quality" && issue.severity === "red") score += 20;
  if (issue.category === "production" && issue.severity === "red") score += 18;
  if (issue.id === "prod-asm2") score += 8;
  if (issue.id === "sup-fastener") score += 6;
  if (issue.category === "maintenance") score += 4;
  return score;
}

function buildPriorities(issues: BriefIssue[]): PriorityItem[] {
  const ranked = [...issues]
    .filter((issue) => issue.severity === "red" || issue.severity === "amber")
    .sort((a, b) => {
      if (issueScore(b) !== issueScore(a)) return issueScore(b) - issueScore(a);
      const sev = severityRank(a.severity) - severityRank(b.severity);
      if (sev !== 0) return sev;
      return categoryRank(a.category) - categoryRank(b.category);
    })
    .slice(0, 3);

  return ranked.map((issue, index) => ({ rank: index + 1, issue }));
}

function isSupplyConstraint(row: SupplyView): boolean {
  return row.record.daysOfSupply < 3;
}

function plantStatusView(
  production: ProductionView[],
  quality: QualityView[],
  supply: SupplyView[],
  maintenance: MaintenanceView[],
): PlantStatusView {
  const criticalQuality = quality.filter((row) => row.severity === "red").length;
  const productionActions = production.filter(
    (row) => row.status === "action_required",
  );
  const supplyConstraints = supply.filter(isSupplyConstraint);
  const maintenanceConstraints = maintenance.filter(
    (row) => row.severity === "red" || row.severity === "amber",
  );

  const productionAreas = new Set(productionActions.map((row) => row.record.workCenter));
  for (const row of maintenanceConstraints) {
    productionAreas.add(row.record.workCenter);
  }

  const constraintCount = productionAreas.size + supplyConstraints.length;
  const criticalCount = criticalQuality;

  let status: PlantStatusView["status"] = "stable";
  if (criticalCount > 0 || productionActions.length > 0) {
    status = "action_required";
  } else if (
    production.some((row) => row.status === "watch") ||
    supply.some((row) => row.riskLevel === "amber" || row.riskLevel === "red") ||
    maintenanceConstraints.length > 0 ||
    quality.some((row) => row.severity === "amber")
  ) {
    status = "watch";
  }

  const qualityPhrase =
    criticalCount === 1
      ? "1 critical quality signal"
      : `${criticalCount} critical quality signals`;
  const constraintPhrase =
    constraintCount === 1
      ? "1 operational constraint"
      : `${constraintCount} operational constraints`;

  const reason =
    status === "action_required"
      ? `${qualityPhrase} and ${constraintPhrase} require action today.`
      : status === "watch"
        ? "No critical alerts, but one or more areas need attention before the next shift."
        : "No exceptions require leadership action in this snapshot.";

  return {
    status,
    label: plantStatusLabels[status],
    reason,
    criticalCount,
    constraintCount,
  };
}

function stripItems(
  production: ProductionView[],
  quality: QualityView[],
  supply: SupplyView[],
  maintenance: MaintenanceView[],
  schedule: ScheduleView[],
  overallAttainmentPct: number,
): CategoryStripItem[] {
  const qualityActive = quality.filter((row) => row.severity === "red" || row.severity === "amber");
  const supplyRisks = supply.filter((row) => row.riskLevel !== "green");
  const maintenanceActive = maintenance.filter(
    (row) => row.severity === "red" || row.severity === "amber",
  );
  const scheduleImmediate = schedule.filter(
    (row) => row.record.shipmentInDays <= 1 && row.status !== "on_track",
  );
  const productionTone = production.some((row) => row.status === "action_required")
    ? "amber"
    : production.some((row) => row.status === "watch")
      ? "amber"
      : "green";

  return [
    {
      category: "production",
      severity: productionTone,
      headline: `${overallAttainmentPct}% to plan`,
      detail: "Production",
    },
    {
      category: "quality",
      severity: qualityActive.some((row) => row.severity === "red")
        ? "red"
        : qualityActive.length > 0
          ? "amber"
          : "green",
      headline:
        qualityActive.length === 1
          ? "1 active issue"
          : qualityActive.length === 0
            ? "No active issues"
            : `${qualityActive.length} active issues`,
      detail: "Quality",
    },
    {
      category: "supply",
      severity: supplyRisks.some((row) => row.riskLevel === "red")
        ? "red"
        : supplyRisks.length > 0
          ? "amber"
          : "green",
      headline:
        supplyRisks.length === 1
          ? "1 material risk"
          : supplyRisks.length === 0
            ? "No material risks"
            : `${supplyRisks.length} material risks`,
      detail: "Supply",
    },
    {
      category: "maintenance",
      severity: maintenanceActive.some((row) => row.severity === "red")
        ? "red"
        : maintenanceActive.length > 0
          ? "amber"
          : "green",
      headline:
        maintenanceActive.length === 1
          ? "1 active constraint"
          : maintenanceActive.length === 0
            ? "No active constraints"
            : `${maintenanceActive.length} active constraints`,
      detail: "Maintenance",
    },
    {
      category: "schedule",
      severity: scheduleImmediate.length > 0 ? "amber" : "green",
      headline:
        scheduleImmediate.length > 0
          ? "Potential shipment risk"
          : "No immediate shipment risk",
      detail: "Customer / Schedule",
    },
  ];
}

function buildChanges(
  production: ProductionView[],
  quality: QualityView[],
  supply: SupplyView[],
): ChangeItem[] {
  const changes: ChangeItem[] = [];

  for (const row of production) {
    const rec = row.record;
    const delta = row.attainmentPct - rec.previousAttainmentPct;
    if (rec.workCenter === "Assembly Line 2" && delta < 0) {
      changes.push({
        id: "chg-asm2",
        category: "production",
        label: rec.workCenter,
        detail: `Attainment declined from ${formatPct(rec.previousAttainmentPct)} to ${formatPct(row.attainmentPct)}`,
        direction: "declined",
        tone: "red",
      });
    } else if (rec.workCenter === "Packaging Line") {
      const improved = rec.previousDowntimeMinutes - rec.downtimeMinutes;
      if (improved > 0) {
        changes.push({
          id: "chg-pack",
          category: "production",
          label: rec.workCenter,
          detail: `Downtime improved by ${improved} minutes`,
          direction: "improved",
          tone: "green",
        });
      }
    } else if (rec.workCenter === "CNC Machining" && row.status === "on_plan") {
      changes.push({
        id: "chg-cnc",
        category: "production",
        label: rec.workCenter,
        detail: "Output returned to plan",
        direction: "returned",
        tone: "green",
      });
    }
  }

  for (const row of quality) {
    if (row.scrapPct > row.record.previousScrapPct) {
      changes.push({
        id: "chg-scrap",
        category: "quality",
        label: row.record.productFamily,
        detail: `Scrap increased from ${row.record.previousScrapPct.toFixed(1)}% to ${row.scrapPct.toFixed(1)}%`,
        direction: "declined",
        tone: "red",
      });
    }
  }

  for (const row of supply) {
    if (row.record.daysOfSupply < row.record.previousDaysOfSupply) {
      const declined = row.record.daysOfSupply < 3;
      changes.push({
        id: `chg-${row.record.id}`,
        category: "supply",
        label: row.record.item,
        detail: `Inventory dropped from ${row.record.previousDaysOfSupply.toFixed(1)} days to ${row.record.daysOfSupply.toFixed(1)} days`,
        direction: "declined",
        tone: declined ? "amber" : "blue",
      });
    }
  }

  const order = ["chg-asm2", "chg-scrap", "chg-sup-fastener", "chg-pack", "chg-cnc"];
  changes.sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return changes;
}

function makeAction(input: {
  id: string;
  issueId: string;
  action: string;
  title: string;
  owner: Owner;
  department: Owner;
  category: Category;
  priority: number;
  timing: ActionTiming;
  horizon: BriefAction["horizon"];
  status: BriefAction["status"];
  severity: Severity;
  ownerType?: OwnerType;
  assignedRole: HumanRole | "Demo Bot";
  botType?: BotType;
  botTask?: string;
  botControl?: BotControl;
  botStatus?: BotTaskStatus;
  source: ActionSource;
  sourceLabel: string;
  notes: string;
  overdue?: boolean;
  dueAgeLabel?: string;
  related?: BriefAction["related"];
  eligibleForBot?: boolean;
}): BriefAction {
  return {
    ownerType: "human",
    overdue: false,
    eligibleForBot: false,
    priorityTier: priorityTierFor(input.priority),
    ...input,
  };
}

function buildActions(
  issues: BriefIssue[],
  production: ProductionView[],
  quality: QualityView[],
  supply: SupplyView[],
  maintenance: MaintenanceView[],
): BriefAction[] {
  const byId = new Map(issues.map((issue) => [issue.id, issue]));
  const actions: BriefAction[] = [];

  const line2 = production.find((row) => row.record.id === "prod-asm2");
  const conveyor = maintenance.find((row) => row.record.id === "mnt-conveyor");
  const housing = quality.find((row) => row.record.id === "qty-housing-finish");
  const fastener = supply.find((row) => row.record.id === "sup-fastener");
  const resin = supply.find((row) => row.record.id === "sup-resin");

  if (conveyor && byId.has("mnt-conveyor")) {
    actions.push(
      makeAction({
        id: "act-conveyor-verify",
        issueId: "mnt-conveyor",
        title: "Verify Line 2 conveyor repair",
        action: conveyor.record.immediateAction,
        owner: "Maintenance",
        department: "Maintenance",
        assignedRole: "Maintenance Technician",
        category: "maintenance",
        priority: 1,
        timing: "now",
        horizon: "immediate",
        status: "in_progress",
        severity: conveyor.severity,
        source: "loopbrief_maintenance",
        sourceLabel: "LoopBrief — Production Exception",
        notes: "Temporary repair is in place. Confirm it holds through the current run.",
        eligibleForBot: true,
        botControl: "read_only_analysis",
      }),
    );
  }

  if (line2 && byId.has("prod-asm2")) {
    actions.push(
      makeAction({
        id: "act-asm2-recovery",
        issueId: "prod-asm2",
        title: "Confirm Line 2 recovery plan",
        action: line2.record.recommendedAction,
        owner: "Operations",
        department: "Operations",
        assignedRole: "Operations Supervisor",
        category: "production",
        priority: 1,
        timing: "before_next_shift",
        horizon: "immediate",
        status: "open",
        severity: line2.severity,
        source: "loopbrief_production",
        sourceLabel: "LoopBrief — Production Exception",
        notes: "140 units below plan. Do not claim recovery unless a plan is agreed.",
      }),
    );
  }

  if (housing && byId.has("qty-housing-finish")) {
    actions.push(
      makeAction({
        id: "act-housing-contain",
        issueId: "qty-housing-finish",
        title: "Maintain housing containment",
        action: housing.record.immediateAction,
        owner: "Quality",
        department: "Quality",
        assignedRole: "Quality Engineer",
        category: "quality",
        priority: 2,
        timing: "now",
        horizon: "immediate",
        status: "in_progress",
        severity: housing.severity,
        source: "loopbrief_quality",
        sourceLabel: "LoopBrief — Quality Exception",
        notes: "100% visual inspection remains in place until root cause is confirmed.",
      }),
      makeAction({
        id: "act-housing-verify",
        issueId: "qty-housing-finish",
        title: "Containment verification",
        action: "Verify containment held through the previous shift and document the result.",
        owner: "Quality",
        department: "Quality",
        assignedRole: "Quality Engineer",
        category: "quality",
        priority: 2,
        timing: "now",
        horizon: "immediate",
        status: "open",
        severity: "red",
        overdue: true,
        dueAgeLabel: "Yesterday",
        source: "loopbrief_quality",
        sourceLabel: "LoopBrief — Quality Exception",
        notes: "Verification was due on the prior shift and remains open.",
      }),
      makeAction({
        id: "act-housing-root-cause",
        issueId: "qty-housing-finish",
        title: "Review mold and process parameters",
        action: housing.record.structuralAction,
        owner: "Engineering",
        department: "Engineering",
        assignedRole: "Manufacturing Engineer",
        category: "quality",
        priority: 2,
        timing: "this_week",
        horizon: "structural",
        status: "open",
        severity: "blue",
        source: "loopbrief_quality",
        sourceLabel: "LoopBrief — Quality Exception",
        notes: "Structural follow-up after containment is stable.",
        eligibleForBot: true,
        botControl: "read_only_analysis",
        related: { product: "know", label: "Ask LoopKnow", href: "/know" },
      }),
      makeAction({
        id: "act-housing-history",
        issueId: "qty-housing-finish",
        title: "Find previous corrective action",
        action: "Search prior Molded Housing surface-finish corrective actions and return cited history.",
        owner: "Quality",
        department: "Quality",
        assignedRole: "Demo Bot",
        ownerType: "bot",
        botType: "knowledge",
        botTask:
          "Search LoopKnow for previous surface-finish corrective actions and return cited results to Quality.",
        botControl: "read_only_analysis",
        botStatus: "queued",
        category: "quality",
        priority: 2,
        timing: "today",
        horizon: "immediate",
        status: "open",
        severity: "blue",
        source: "loopknow",
        sourceLabel: "LoopKnow — Quality History",
        notes: "Demo Bot. No document system is queried until a person runs the simulation.",
        eligibleForBot: true,
        related: { product: "know", label: "Ask LoopKnow", href: "/know" },
      }),
    );
  }

  if (fastener && byId.has("sup-fastener")) {
    actions.push(
      makeAction({
        id: "act-fastener-confirm",
        issueId: "sup-fastener",
        title: "Confirm fastener shipment",
        action: fastener.record.immediateAction,
        owner: "Buyer",
        department: "Buyer",
        assignedRole: "Buyer",
        category: "supply",
        priority: 3,
        timing: "today",
        horizon: "immediate",
        status: "open",
        severity: fastener.riskLevel,
        source: "loopsupply",
        sourceLabel: "LoopSupply — Supply Risk",
        notes: "Coverage is 2.8 days with replenishment expected in 4 days.",
        eligibleForBot: true,
        botControl: "draft_only",
        related: { product: "supply", label: "Open in LoopSupply", href: "/supply" },
      }),
      makeAction({
        id: "act-fastener-source",
        issueId: "sup-fastener",
        title: "Evaluate alternate fastener source",
        action: fastener.record.structuralAction,
        owner: "Supply Chain",
        department: "Supply Chain",
        assignedRole: "Supply Chain Manager",
        category: "supply",
        priority: 3,
        timing: "longer_term",
        horizon: "structural",
        status: "open",
        severity: "blue",
        source: "loopsource",
        sourceLabel: "LoopSource — Sourcing Decision",
        notes: "Second-source review only. No award or RFQ is issued from this demo.",
        eligibleForBot: true,
        botControl: "read_only_analysis",
        related: { product: "source", label: "Open LoopSource", href: "/source" },
      }),
    );
  }

  if (conveyor && byId.has("mnt-conveyor")) {
    actions.push(
      makeAction({
        id: "act-conveyor-replace",
        issueId: "mnt-conveyor",
        title: "Replace worn conveyor drive",
        action: conveyor.record.structuralAction,
        owner: "Maintenance",
        department: "Maintenance",
        assignedRole: "Maintenance Technician",
        category: "maintenance",
        priority: 4,
        timing: "this_week",
        horizon: "structural",
        status: "open",
        severity: "blue",
        source: "loopbrief_maintenance",
        sourceLabel: "LoopBrief — Production Exception",
        notes: "Permanent repair is scheduled after second shift.",
      }),
    );
  }

  if (resin && byId.has("sup-resin")) {
    actions.push(
      makeAction({
        id: "act-resin-confirm",
        issueId: "sup-resin",
        title: "Watch housing resin coverage",
        action: resin.record.immediateAction,
        owner: "Supply Chain",
        department: "Supply Chain",
        assignedRole: "Demo Bot",
        ownerType: "bot",
        botType: "monitoring",
        botTask: "Watch resin days of supply and flag if coverage falls below 3.0 days.",
        botControl: "read_only_analysis",
        botStatus: "queued",
        category: "supply",
        priority: 5,
        timing: "today",
        horizon: "immediate",
        status: "monitoring",
        severity: resin.riskLevel,
        source: "loopbrief_supply",
        sourceLabel: "LoopBrief — Supply Exception",
        notes: "Demo Bot. Monitoring is simulated locally and does not change inventory systems.",
        eligibleForBot: true,
      }),
    );
  }

  const pack = production.find((row) => row.record.id === "prod-pack");
  if (pack) {
    actions.push(
      makeAction({
        id: "act-pack-hold",
        issueId: "prod-pack",
        title: "Hold packaging sequence",
        action: pack.record.recommendedAction,
        owner: "Operations",
        department: "Operations",
        assignedRole: "Operations Supervisor",
        category: "production",
        priority: 5,
        timing: "today",
        horizon: "immediate",
        status: "complete",
        severity: "green",
        source: "loopbrief_production",
        sourceLabel: "LoopBrief — Production Exception",
        notes: "Packaging is on plan. No further action required today.",
      }),
    );
  }

  return actions;
}

export function analyzeBrief(
  snapshot: SampleSnapshot,
  briefDate = todayStamp(),
): BriefResult {
  const production = buildProduction(snapshot);
  const quality = buildQuality(snapshot);
  const supply = buildSupply(snapshot);
  const maintenance = buildMaintenance(snapshot);
  const schedule = snapshot.schedule.map(scheduleView);

  const planned = production.reduce((sum, row) => sum + row.record.scheduledQty, 0);
  const actual = production.reduce((sum, row) => sum + row.record.actualQty, 0);
  const overallAttainmentPct = roundPct(actual, planned);

  const issues = [
    ...production.map(productionIssue),
    ...quality.map(qualityIssue),
    ...supply.map(supplyIssue),
    ...maintenance.map(maintenanceIssue),
    ...schedule.map(scheduleIssue),
  ].filter((issue): issue is BriefIssue => issue != null);

  const priorities = buildPriorities(issues);
  const plantStatus = plantStatusView(production, quality, supply, maintenance);
  const strip = stripItems(
    production,
    quality,
    supply,
    maintenance,
    schedule,
    overallAttainmentPct,
  );
  const changes = buildChanges(production, quality, supply);
  const actions = buildActions(issues, production, quality, supply, maintenance);

  return {
    scenarioId: snapshot.plant.scenarioId,
    plantName: snapshot.plant.name,
    shift: snapshot.plant.shift,
    briefDate,
    briefDateLabel: formatBriefDate(briefDate),
    summary: "",
    plantStatus,
    strip,
    production,
    quality,
    supply,
    maintenance,
    schedule,
    issues,
    priorities,
    changes,
    actions,
    overallAttainmentPct,
  };
}

export function filterIssues(
  brief: BriefResult,
  category: Category | "all",
  owner: Owner | "all",
): BriefIssue[] {
  return brief.issues.filter((issue) => {
    if (category !== "all" && issue.category !== category) return false;
    if (owner !== "all" && issue.owner !== owner) return false;
    return true;
  });
}

export function filterActions(
  actions: BriefAction[],
  category: Category | "all",
  owner: Owner | "all",
): BriefAction[] {
  return actions.filter((action) => {
    if (category !== "all" && action.category !== category) return false;
    if (owner !== "all" && action.owner !== owner) return false;
    return true;
  });
}
