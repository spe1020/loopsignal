import { formatDays } from "./engine";
import type {
  BriefAction,
  BriefResult,
  ProductionView,
  QualityView,
  SupplyView,
} from "./types";

function numberWord(value: number): string {
  const words = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ];
  return words[value] ?? String(value);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildExecutiveSummary(input: {
  production: ProductionView[];
  quality: QualityView[];
  supply: SupplyView[];
  leadershipCount: number;
}): string {
  const { production, quality, supply, leadershipCount } = input;
  const countWord = capitalize(numberWord(Math.min(leadershipCount, 10)));
  const itemNoun = leadershipCount === 1 ? "item requires" : "items require";

  const line2 = production.find((row) => row.record.id === "prod-asm2");
  const fastener = supply.find((row) => row.record.id === "sup-fastener");
  const housing = quality[0];
  const onPlan = production
    .filter((row) => row.status === "on_plan")
    .map((row) => row.record.workCenter);

  const parts: string[] = [
    `${countWord} ${itemNoun} leadership attention today.`,
  ];

  if (line2) {
    const miss = 100 - line2.attainmentPct;
    parts.push(
      `${line2.record.workCenter} finished ${miss}% below plan after ${line2.record.downtimeMinutes} minutes of unplanned downtime.`,
    );
  }

  if (fastener && housing) {
    parts.push(
      `A fastener supply issue may affect tomorrow's schedule, and scrap on the ${housing.record.productFamily} family increased above the demo threshold during the day shift.`,
    );
  }

  if (onPlan.length === 2) {
    parts.push(`${onPlan[0]} and ${onPlan[1]} are currently on plan.`);
  } else if (onPlan.length === 1) {
    parts.push(`${onPlan[0]} is currently on plan.`);
  } else if (onPlan.length > 2) {
    const last = onPlan[onPlan.length - 1];
    parts.push(
      `${onPlan.slice(0, -1).join(", ")}, and ${last} are currently on plan.`,
    );
  }

  return parts.join(" ");
}

export function buildExportText(
  brief: BriefResult,
  actionStatuses: Record<string, BriefAction["status"]>,
): string {
  const line2 = brief.production.find((row) => row.record.id === "prod-asm2");
  const housing = brief.quality[0];
  const fastener = brief.supply.find((row) => row.record.id === "sup-fastener");
  const openActions = brief.actions
    .filter((action) => action.horizon === "immediate")
    .filter((action) => (actionStatuses[action.id] ?? action.status) !== "complete")
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  const lines = [
    `Daily Operations Brief — ${brief.plantName}`,
    `${brief.shift} shift · ${brief.briefDateLabel}`,
    "",
    `Plant status: ${brief.plantStatus.label.toUpperCase()}`,
    brief.plantStatus.reason,
    "",
    brief.summary,
    "",
    "Production:",
    line2
      ? `${line2.record.workCenter} finished ${100 - line2.attainmentPct}% below plan due to ${line2.record.downtimeMinutes} minutes of conveyor downtime.`
      : "No production miss in this snapshot.",
    "",
    "Quality:",
    housing
      ? `${housing.record.productFamily} surface-finish issue remains under containment.`
      : "No active quality issues.",
    "",
    "Supply:",
    fastener
      ? `Stainless fastener inventory is at ${formatDays(fastener.record.daysOfSupply)} of supply with replenishment expected in ${fastener.record.replenishmentDays} days.`
      : "No material risks in this snapshot.",
    "",
    "Top Actions:",
  ];

  openActions.forEach((action, index) => {
    lines.push(
      `${index + 1}. ${action.owner} — ${action.action.replace(/\.$/, "")}.`,
    );
  });

  if (openActions.length === 0) {
    lines.push("No open immediate actions.");
  }

  return lines.join("\n");
}

export function recommendIssueCopy(brief: BriefResult): string {
  return brief.summary;
}
