import { formatDays } from "./engine";
import { executiveGroup, type ExecutiveEmail } from "./delivery";
import type {
  BriefAction,
  BriefResult,
  Owner,
  ReportKind,
} from "./types";
import {
  actionHorizonLabels,
  actionStatusLabels,
  actionTimingLabels,
  categoryLabels,
  plantStatusLabels,
  reportKindLabels,
} from "./types";

export type ReportSection = {
  heading: string;
  body?: string;
  bullets?: string[];
};

export type BuiltReport = {
  kind: ReportKind;
  title: string;
  subtitle: string;
  statusLine: string;
  sections: ReportSection[];
  copyText: string;
};

export function resolveAction(
  action: BriefAction,
  overrides: Record<string, Partial<BriefAction> & { outcome?: string }>,
): BriefAction {
  const extra = overrides[action.id];
  if (!extra) return action;
  return { ...action, ...extra };
}

export function resolveActions(
  actions: BriefAction[],
  overrides: Record<string, Partial<BriefAction>>,
): BriefAction[] {
  return actions.map((action) => resolveAction(action, overrides));
}

function openLeadership(actions: BriefAction[]) {
  return actions.filter(
    (action) =>
      action.horizon === "immediate" &&
      action.status !== "complete" &&
      action.priority <= 3,
  );
}

function departmentActions(actions: BriefAction[], departments: Owner[]) {
  return actions.filter((action) => departments.includes(action.department));
}

function bulletsForActions(actions: BriefAction[]) {
  return actions.map(
    (action) =>
      `${action.title} — ${action.assignedRole} · ${actionTimingLabels[action.timing]} · ${actionStatusLabels[action.status]}`,
  );
}

export function buildReport(
  kind: ReportKind,
  brief: BriefResult,
  actions: BriefAction[],
): BuiltReport {
  if (kind === "executive") return executiveReport(brief, actions);
  if (kind === "operations") {
    return departmentReport(kind, brief, actions, ["Operations"], {
      intro: "Production exceptions and recovery actions for the operations team.",
      extra: operationsExtras(brief),
    });
  }
  if (kind === "supply_chain") {
    return departmentReport(kind, brief, actions, ["Supply Chain", "Buyer"], {
      intro: "Material constraints, supplier status, and purchasing follow-up.",
      extra: supplyExtras(brief),
    });
  }
  if (kind === "procurement") {
    return departmentReport(kind, brief, actions, ["Buyer"], {
      intro: "Open buying actions and supplier confirmation work.",
      extra: supplyExtras(brief),
    });
  }
  if (kind === "quality") {
    return departmentReport(kind, brief, actions, ["Quality"], {
      intro: "Active defects, containment, and quality follow-up.",
      extra: qualityExtras(brief),
    });
  }
  if (kind === "maintenance") {
    return departmentReport(kind, brief, actions, ["Maintenance"], {
      intro: "Equipment constraints, temporary repairs, and permanent work.",
      extra: maintenanceExtras(brief),
    });
  }
  if (kind === "planning") {
    return departmentReport(kind, brief, actions, ["Planning"], {
      intro: "Schedule coverage and planning follow-up.",
      extra: scheduleExtras(brief),
    });
  }
  if (kind === "engineering") {
    return departmentReport(kind, brief, actions, ["Engineering"], {
      intro: "Structural process and tooling follow-up.",
      extra: qualityExtras(brief),
    });
  }
  return openActionsReport(brief, actions);
}

function executiveReport(brief: BriefResult, actions: BriefAction[]): BuiltReport {
  const leadership = brief.priorities.slice(0, 5);
  const open = openLeadership(actions);
  const risks: string[] = [];
  const housing = brief.quality[0];
  const fastener = brief.supply.find((row) => row.record.id === "sup-fastener");
  const line2 = brief.production.find((row) => row.record.id === "prod-asm2");
  if (line2) {
    risks.push(
      `Major equipment constraint: ${line2.record.workCenter} lost ${line2.record.downtimeMinutes} minutes to a conveyor drive fault.`,
    );
  }
  if (fastener) {
    risks.push(
      `Critical material constraint: stainless fastener coverage is ${formatDays(fastener.record.daysOfSupply)} with replenishment in ${fastener.record.replenishmentDays} days.`,
    );
  }
  if (housing) {
    risks.push(
      `Unresolved quality containment: ${housing.record.productFamily} surface finish remains under 100% inspection.`,
    );
  }
  const onTrackShipments = brief.schedule.filter((row) => row.status === "on_track");
  const positives = [
    ...brief.production
      .filter((row) => row.status === "on_plan")
      .map((row) => `${row.record.workCenter} is on plan.`),
    ...brief.changes
      .filter((change) => change.direction === "improved" || change.direction === "returned")
      .map((change) => change.detail),
    onTrackShipments.length === brief.schedule.length
      ? "No immediate customer shipment risk is currently identified."
      : "Near-term shipments remain on track where coverage supports the next required date.",
  ];

  const sections: ReportSection[] = [
    {
      heading: "Overall Status",
      body: `Plant Status: ${brief.plantStatus.label.toUpperCase()}`,
      bullets: [brief.plantStatus.reason],
    },
    {
      heading: "Top Priorities",
      bullets: leadership.map((item) => {
        const action = actions.find((row) => row.issueId === item.issue.id);
        return `${item.issue.area} — ${categoryLabels[item.issue.category]}. ${item.issue.problem} Owner: ${item.issue.owner}. Action: ${action?.action ?? item.issue.immediateAction}`;
      }),
    },
    {
      heading: "What Changed",
      bullets: brief.changes.map((change) => change.detail),
    },
    {
      heading: "Risks Requiring Leadership Awareness",
      bullets: risks,
    },
    {
      heading: "Positive Signals",
      bullets: positives,
    },
    {
      heading: "Open Leadership Actions",
      body: `${open.length} open leadership actions.`,
      bullets: bulletsForActions(open.slice(0, 5)),
    },
  ];

  return {
    kind: "executive",
    title: "Executive Operations Summary",
    subtitle: `${brief.plantName} · ${brief.shift} shift · ${brief.briefDateLabel}`,
    statusLine: `Plant Status: ${brief.plantStatus.label.toUpperCase()}`,
    sections,
    copyText: reportToText(
      "Executive Operations Summary",
      brief,
      sections,
    ),
  };
}

function departmentReport(
  kind: ReportKind,
  brief: BriefResult,
  actions: BriefAction[],
  departments: Owner[],
  copy: { intro: string; extra: ReportSection[] },
): BuiltReport {
  const scoped = departmentActions(actions, departments).filter(
    (action) => action.status !== "complete",
  );
  const dueToday = scoped.filter(
    (action) =>
      action.timing === "now" ||
      action.timing === "today" ||
      action.timing === "before_next_shift",
  );
  const longer = scoped.filter(
    (action) => action.timing === "this_week" || action.timing === "longer_term",
  );
  const sections: ReportSection[] = [
    { heading: "Focus", body: copy.intro },
    ...copy.extra,
    {
      heading: "Actions due today",
      bullets:
        dueToday.length > 0
          ? bulletsForActions(dueToday)
          : ["No actions due today in this brief."],
    },
    {
      heading: "Longer-term actions",
      bullets:
        longer.length > 0 ? bulletsForActions(longer) : ["No structural actions in this brief."],
    },
  ];
  return {
    kind,
    title: reportKindLabels[kind],
    subtitle: `${brief.plantName} · ${brief.briefDateLabel}`,
    statusLine: `${scoped.length} open items for this team.`,
    sections,
    copyText: reportToText(reportKindLabels[kind], brief, sections),
  };
}

function openActionsReport(brief: BriefResult, actions: BriefAction[]): BuiltReport {
  const open = actions.filter((action) => action.status !== "complete");
  const overdue = open.filter((action) => action.overdue);
  const sections: ReportSection[] = [
    {
      heading: "Open actions",
      bullets: bulletsForActions(open),
    },
    {
      heading: "Overdue",
      bullets:
        overdue.length > 0
          ? overdue.map(
              (action) =>
                `${action.title} — ${action.assignedRole} · ${action.dueAgeLabel ?? "Overdue"}`,
            )
          : ["No overdue actions in this snapshot."],
    },
  ];
  return {
    kind: "open_actions",
    title: "Open Actions Report",
    subtitle: `${brief.plantName} · ${brief.briefDateLabel}`,
    statusLine: `${open.length} open · ${overdue.length} overdue`,
    sections,
    copyText: reportToText("Open Actions Report", brief, sections),
  };
}

function operationsExtras(brief: BriefResult): ReportSection[] {
  return [
    {
      heading: "Work center status",
      bullets: brief.production.map(
        (row) =>
          `${row.record.workCenter}: ${row.attainmentPct}% to plan · ${row.statusLabel} · ${row.record.downtimeMinutes} min downtime`,
      ),
    },
  ];
}

function supplyExtras(brief: BriefResult): ReportSection[] {
  return [
    {
      heading: "Active supply risks",
      bullets: brief.supply.map(
        (row) =>
          `${row.record.item}: ${formatDays(row.record.daysOfSupply)} · ${row.statusLabel} · ${row.record.affectedWorkCenter} · ${row.record.owner}`,
      ),
    },
  ];
}

function qualityExtras(brief: BriefResult): ReportSection[] {
  return [
    {
      heading: "Active defects",
      bullets: brief.quality.map(
        (row) =>
          `${row.record.issue}: ${row.record.quantityAffected} affected · scrap ${row.record.scrapQty} · rework ${row.record.reworkQty} · ${row.statusLabel}`,
      ),
    },
  ];
}

function maintenanceExtras(brief: BriefResult): ReportSection[] {
  return [
    {
      heading: "Open equipment issues",
      bullets: brief.maintenance.map(
        (row) =>
          `${row.record.asset}: ${row.record.downtimeMinutes} min downtime · ${row.record.temporaryCountermeasure} · ${row.record.permanentActionStatus}`,
      ),
    },
  ];
}

function scheduleExtras(brief: BriefResult): ReportSection[] {
  return [
    {
      heading: "Next shipments",
      bullets: brief.schedule.map(
        (row) =>
          `${row.record.productFamily}: ${row.record.nextShipment} · ${row.record.finishedGoodsDays.toFixed(1)} days FG · ${row.statusLabel}`,
      ),
    },
  ];
}

function reportToText(
  title: string,
  brief: BriefResult,
  sections: ReportSection[],
): string {
  const lines = [
    title,
    `${brief.plantName} · ${brief.shift} shift · ${brief.briefDateLabel}`,
    `Plant status: ${brief.plantStatus.label.toUpperCase()}`,
    "",
  ];
  for (const section of sections) {
    lines.push(section.heading);
    if (section.body) lines.push(section.body);
    for (const bullet of section.bullets ?? []) {
      lines.push(`• ${bullet}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function buildExecutiveEmail(
  brief: BriefResult,
  actions: BriefAction[],
): ExecutiveEmail {
  const line2 = brief.production.find((row) => row.record.id === "prod-asm2");
  const fastener = brief.supply.find((row) => row.record.id === "sup-fastener");
  const housing = brief.quality[0];
  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${brief.briefDate}T12:00:00Z`));
  const open = openLeadership(actions);
  const positives: string[] = [];
  const cnc = brief.production.find((row) => row.record.id === "prod-cnc");
  const pack = brief.production.find((row) => row.record.id === "prod-pack");
  if (cnc && cnc.attainmentPct >= 100) {
    positives.push("CNC Machining exceeded plan.");
  }
  if (pack) positives.push("Packaging returned to schedule.");
  positives.push("No immediate customer shipment risk is currently identified.");

  const items: string[] = [];
  if (line2) {
    items.push(
      `Assembly Line 2 finished ${100 - line2.attainmentPct}% below plan following ${line2.record.downtimeMinutes} minutes of conveyor downtime. Operations owns the recovery plan before next shift.`,
    );
  }
  if (fastener) {
    items.push(
      `Stainless fastener inventory has ${fastener.record.daysOfSupply.toFixed(1)} days of supply with replenishment expected in ${fastener.record.replenishmentDays} days. Procurement is confirming supplier status and alternate coverage.`,
    );
  }
  if (housing) {
    items.push(
      `Molded Housing scrap increased to ${housing.scrapPct.toFixed(1)}%. Quality containment remains active while root cause is reviewed.`,
    );
  }

  const body = [
    `Plant Status: ${plantStatusLabels[brief.plantStatus.status]}`,
    "",
    `${items.length} issues require leadership attention today:`,
    "",
    ...items.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Positive signals:",
    ...positives.map((item) => `• ${item}`),
    "",
    `Open leadership actions: ${open.length}`,
    "",
    "View Full LoopBrief",
    "",
    "Distribution: " + executiveGroup.roles.map((role) => role.role).join(", "),
    "",
    "Demo only. This email was not sent.",
  ].join("\n");

  return {
    subject: `LoopBrief | Daily Operations Summary | ${brief.plantName} | ${date}`,
    body,
  };
}

export function buildMyActionsText(
  personaLabel: string,
  actions: BriefAction[],
): string {
  const lines = [`My Actions — ${personaLabel}`, ""];
  if (actions.length === 0) {
    lines.push("No actions in this view.");
    return lines.join("\n");
  }
  for (const action of actions) {
    lines.push(
      `• ${action.title} — ${actionTimingLabels[action.timing]} · ${actionStatusLabels[action.status]} · ${actionHorizonLabels[action.horizon]}`,
    );
  }
  return lines.join("\n");
}
