import { formatDayCount, formatIsoDate } from "@/lib/signal/dates";
import type {
  ActionOwner,
  AnalyzedOrder,
  EngineOrder,
  FollowUpDraft,
  PrimaryAction,
  RiskSummary,
} from "@/lib/signal/types";

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
    "eleven",
    "twelve",
  ];
  return words[value] ?? String(value);
}

function sentenceCount(value: number, singular: string, plural: string): string {
  const word = value <= 12 ? numberWord(value) : String(value);
  const noun = value === 1 ? singular : plural;
  return `${word} ${noun}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatQuantity(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString("en-US");
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

export function formatMoney(value: number, decimals?: number): string {
  const fraction =
    decimals ?? (Math.round(value * 100) % 100 === 0 ? 0 : 2);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fraction,
    maximumFractionDigits: 2,
  }).format(value);
}

function explain(order: EngineOrder): string[] {
  const reasons: string[] = [];
  const codes = new Set(order.reasonCodes);

  if (codes.has("past_due")) {
    reasons.push(
      `${formatDayCount(order.daysPastDue)} past ${
        order.expectedDateSource === "promised" ? "promised" : "due"
      } date`,
    );
  }
  if (codes.has("substantial_open")) {
    reasons.push(
      `${Math.round(order.openPct * 100)}% of order remains open`,
    );
  }
  if (order.inventory) {
    reasons.push(
      `${formatDayCount(Math.round(order.inventory.daysOfSupply))} of inventory coverage remain`,
    );
  }
  if (codes.has("coverage_gap")) {
    reasons.push(
      "Expected replenishment timing exceeds available coverage",
    );
  }
  if (codes.has("tight_coverage") && !order.inventory) {
    reasons.push("inventory coverage is becoming tight");
  }
  if (codes.has("no_promised_date")) {
    reasons.push("no supplier-confirmed date");
  }
  if (codes.has("due_soon")) {
    reasons.push(`due within ${formatDayCount(order.daysUntilDue)}`);
  }
  if (codes.has("due_approaching")) {
    reasons.push(`due in ${formatDayCount(order.daysUntilDue)}`);
  }

  return reasons;
}

function whyItMatters(order: EngineOrder): string {
  const codes = new Set(order.reasonCodes);

  if (codes.has("coverage_gap")) {
    return "Available inventory may be depleted before the open order is expected to replenish supply.";
  }
  if (codes.has("past_due") && order.riskLevel === "critical") {
    return "This order is materially past its expected date, with quantity still open.";
  }
  if (codes.has("past_due")) {
    return "The expected date has passed and the remaining quantity may need follow-up.";
  }
  if (codes.has("tight_coverage")) {
    return "Available inventory coverage is becoming tight relative to the open order.";
  }
  if (codes.has("due_soon")) {
    return "The expected date is close and open quantity still remains.";
  }
  if (codes.has("no_promised_date")) {
    return "There is no supplier-confirmed date, so confirmation appears necessary.";
  }
  if (codes.has("substantial_open")) {
    return "Most of the ordered quantity is still open as the expected date approaches.";
  }
  if (codes.has("due_approaching")) {
    return "The due date is approaching and the order is still open.";
  }
  return "This open order did not trigger a current risk rule.";
}

function shortReason(order: EngineOrder): string {
  const codes = new Set(order.reasonCodes);
  if (codes.has("coverage_gap")) {
    return "Coverage may expire before replenishment";
  }
  if (codes.has("past_due") && order.riskLevel === "critical") {
    return "Materially past expected date";
  }
  if (codes.has("past_due")) {
    return "Expected date has passed";
  }
  if (codes.has("tight_coverage")) {
    return "Inventory coverage is tight";
  }
  if (codes.has("no_promised_date")) {
    return "No supplier-confirmed date";
  }
  if (codes.has("due_soon")) {
    return "Due within 3 days";
  }
  if (codes.has("substantial_open")) {
    return "Most of the order remains open";
  }
  if (codes.has("due_approaching")) {
    return "Due date approaching";
  }
  return "Currently on track";
}

function addUnique(list: string[], action: string) {
  if (!list.includes(action)) list.push(action);
}

function immediateActions(order: EngineOrder): string[] {
  const codes = order.reasonCodes;
  const actions: string[] = [];
  if (
    codes.includes("no_promised_date") ||
    codes.includes("past_due") ||
    codes.includes("due_soon")
  ) {
    addUnique(actions, "Contact supplier for updated commitment");
  }
  if (codes.includes("past_due") || codes.includes("no_promised_date")) {
    addUnique(actions, "Confirm shipment status");
  }
  if (codes.includes("coverage_gap") || codes.includes("tight_coverage")) {
    addUnique(actions, "Review available inventory");
  }
  if (
    codes.includes("due_soon") ||
    codes.includes("due_approaching") ||
    codes.includes("substantial_open")
  ) {
    addUnique(actions, "Confirm near-term production requirement");
  }
  if (codes.includes("past_due") && order.riskLevel === "critical") {
    addUnique(actions, "Evaluate expedite options");
  }
  if (actions.length === 0 && order.riskLevel !== "on_track") {
    addUnique(actions, "Confirm shipment status");
  }
  return actions;
}

function longerTermActions(order: EngineOrder): string[] {
  if (order.riskLevel === "on_track") return [];
  const codes = order.reasonCodes;
  const actions: string[] = [];
  if (codes.includes("past_due") || order.riskLevel === "critical") {
    addUnique(actions, "Review supplier reliability");
  }
  if (
    codes.includes("coverage_gap") ||
    codes.includes("tight_coverage") ||
    (codes.includes("past_due") && order.riskLevel === "critical")
  ) {
    addUnique(actions, "Evaluate alternate source");
  }
  if (codes.includes("coverage_gap") || codes.includes("tight_coverage")) {
    addUnique(actions, "Review safety stock");
  }
  if (codes.includes("no_promised_date") || codes.includes("due_approaching")) {
    addUnique(actions, "Revisit planning lead time");
  }
  if (codes.includes("substantial_open") || codes.includes("coverage_gap")) {
    addUnique(actions, "Review reorder assumptions");
  }
  if (codes.includes("past_due") || codes.includes("no_promised_date")) {
    addUnique(actions, "Identify recurring supplier/date issues");
  }
  return actions;
}

function suggestedOwner(order: EngineOrder): ActionOwner | null {
  if (order.riskLevel === "on_track") return null;
  const codes = new Set(order.reasonCodes);
  if (codes.has("coverage_gap")) return "Supply Chain";
  if (codes.has("tight_coverage") || codes.has("due_approaching")) {
    return "Planner";
  }
  if (codes.has("past_due") && order.riskLevel === "critical") {
    return "Procurement";
  }
  return "Buyer";
}

function primaryAction(order: EngineOrder): PrimaryAction | null {
  if (order.riskLevel === "on_track") return null;
  const codes = new Set(order.reasonCodes);
  if (codes.has("coverage_gap") || codes.has("tight_coverage")) {
    return { label: "Review Inventory", kind: "inventory" };
  }
  if (codes.has("no_promised_date")) {
    return { label: "Confirm Delivery Date", kind: "confirm" };
  }
  return { label: "Contact Supplier", kind: "contact" };
}

function draftFollowUp(order: EngineOrder): FollowUpDraft {
  const itemLabel = order.description || order.item;
  const datePhrase = order.hasPromisedDate
    ? `a promised date of ${formatIsoDate(order.expectedDate)}`
    : `a due date of ${formatIsoDate(order.dueDate)} and no supplier-confirmed date`;

  return {
    subject: `PO ${order.poNumber} — Delivery Status Confirmation`,
    body: `Hi ${order.supplier},\n\nWe're reviewing PO ${order.poNumber} for the ${itemLabel}. Our records currently show ${formatQuantity(order.openQuantity)} still open with ${datePhrase}.\n\nCan you confirm the current shipment status, quantity available, and expected delivery date?\n\nThank you.`,
  };
}

/**
 * Interpretation layer: turns deterministic engine output into readable
 * explanations, suggested actions, and a management brief.
 *
 * Future AI capabilities can accept AnalyzedOrder[] / SignalDashboard JSON
 * rather than the raw CSV, keeping calculations auditable.
 */
export function interpretOrder(order: EngineOrder): AnalyzedOrder {
  return {
    ...order,
    reasons: explain(order),
    whyItMatters: whyItMatters(order),
    shortReason: shortReason(order),
    immediateActions: immediateActions(order),
    longerTermActions: longerTermActions(order),
    suggestedOwner: suggestedOwner(order),
    primaryAction: primaryAction(order),
    followUp: draftFollowUp(order),
  };
}

export function buildBrief(orders: AnalyzedOrder[], summary: RiskSummary): string {
  const flagged =
    summary.critical + summary.atRisk + summary.needsConfirmation;
  const pastDue = orders.filter((order) => order.daysPastDue > 0).length;
  const unconfirmed = orders.filter((order) => !order.hasPromisedDate).length;
  const coverageGaps = orders.filter((order) =>
    order.reasonCodes.includes("coverage_gap"),
  ).length;

  if (orders.length === 0) {
    return "No open purchase orders were found in this report. Fully received lines were set aside.";
  }

  if (flagged === 0) {
    return `${capitalize(sentenceCount(summary.onTrack, "open order appears", "open orders appear"))} on track based on the available dates and quantities. No current risk rules were triggered.`;
  }

  const opening = `${capitalize(sentenceCount(flagged, "open order needs", "open orders need"))} review.`;
  const criticalLine =
    summary.critical === 0
      ? "None are currently categorized as critical"
      : `${capitalize(sentenceCount(summary.critical, "is", "are"))} currently categorized as critical${
          coverageGaps > 0
            ? `, including ${sentenceCount(coverageGaps, "order", "orders")} where available inventory may not cover the expected replenishment timing`
            : ""
        }`;
  const overdue =
    pastDue > 0
      ? `${capitalize(sentenceCount(pastDue, "order is", "orders are"))} past ${pastDue === 1 ? "its" : "their"} promised or due date`
      : "No open orders are currently past their expected date";
  const confirm =
    unconfirmed > 0
      ? `${sentenceCount(unconfirmed, "open order does", "open orders do")} not have a confirmed supplier date`
      : "all open orders include a confirmed date";

  return `${opening} ${criticalLine}. ${overdue}, and ${confirm}.`;
}
