import { diffDays } from "@/lib/signal/dates";
import {
  RISK_RANK,
  RISK_THRESHOLDS,
  type EngineOrder,
  type InventoryCoverage,
  type RawPoRow,
  type ReasonCode,
  type RiskLevel,
} from "@/lib/signal/types";

function uniqueCodes(codes: ReasonCode[]): ReasonCode[] {
  return [...new Set(codes)];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function coverage(
  row: RawPoRow,
  daysUntilDue: number,
  daysPastDue: number,
): InventoryCoverage | null {
  if (
    row.inventoryOnHand === null ||
    row.dailyUsage === null ||
    row.dailyUsage <= 0 ||
    row.inventoryOnHand < 0
  ) {
    return null;
  }

  const daysOfSupply = round1(row.inventoryOnHand / row.dailyUsage);
  const replenishmentOverdue = daysPastDue > 0;
  const expectedReplenishmentDays = replenishmentOverdue ? null : daysUntilDue;
  let coverageGapDays: number | null = null;

  if (!replenishmentOverdue && daysOfSupply < daysUntilDue) {
    coverageGapDays = round1(daysUntilDue - daysOfSupply);
  }

  return {
    daysOfSupply,
    expectedReplenishmentDays,
    coverageGapDays,
    replenishmentOverdue,
  };
}

function classify(input: {
  daysPastDue: number;
  daysUntilDue: number;
  openPct: number;
  hasPromisedDate: boolean;
  inventory: InventoryCoverage | null;
}): { riskLevel: RiskLevel; reasonCodes: ReasonCode[] } {
  const codes: ReasonCode[] = [];
  let riskLevel: RiskLevel = "on_track";

  function raise(next: RiskLevel) {
    if (RISK_RANK[next] > RISK_RANK[riskLevel]) {
      riskLevel = next;
    }
  }

  const { daysPastDue, daysUntilDue, openPct, hasPromisedDate, inventory } =
    input;

  if (inventory) {
    if (inventory.coverageGapDays !== null && inventory.coverageGapDays > 0) {
      codes.push("coverage_gap");
      raise("critical");
    } else if (
      inventory.replenishmentOverdue &&
      inventory.daysOfSupply <= RISK_THRESHOLDS.lateCoverageDays
    ) {
      codes.push("coverage_gap");
      raise("critical");
    } else if (inventory.daysOfSupply <= RISK_THRESHOLDS.tightCoverageDays) {
      codes.push("tight_coverage");
      raise("at_risk");
    }
  }

  if (daysPastDue >= RISK_THRESHOLDS.criticalPastDueDays) {
    codes.push("past_due");
    raise("critical");
  } else if (daysPastDue >= RISK_THRESHOLDS.atRiskPastDueDays) {
    codes.push("past_due");
    raise("at_risk");
  }

  if (daysUntilDue > 0 && daysUntilDue <= RISK_THRESHOLDS.dueSoonDays) {
    codes.push("due_soon");
    raise("at_risk");
  } else if (
    daysUntilDue > RISK_THRESHOLDS.dueSoonDays &&
    daysUntilDue <= RISK_THRESHOLDS.dueApproachingDays
  ) {
    codes.push("due_approaching");
    raise("needs_confirmation");
  }

  if (openPct >= RISK_THRESHOLDS.substantialOpenPct) {
    if (daysPastDue >= 1 || daysUntilDue <= RISK_THRESHOLDS.dueSoonDays) {
      codes.push("substantial_open");
      raise("at_risk");
    } else if (daysUntilDue <= RISK_THRESHOLDS.dueApproachingDays) {
      codes.push("substantial_open");
      raise("needs_confirmation");
    }
  }

  if (!hasPromisedDate) {
    codes.push("no_promised_date");
    raise("needs_confirmation");
  }

  return { riskLevel, reasonCodes: uniqueCodes(codes) };
}

function priorityScore(order: Omit<EngineOrder, "priority">): number {
  const gap = order.inventory?.coverageGapDays ?? 0;
  const valueBoost = Math.min((order.openValue ?? 0) / 500, 80);
  return (
    RISK_RANK[order.riskLevel] * 1000 +
    order.daysPastDue * 12 +
    gap * 18 +
    valueBoost +
    order.openPct * 40 -
    order.daysUntilDue
  );
}

export type EngineResult = {
  orders: EngineOrder[];
  receivedCount: number;
};

export function analyzeOpenOrders(
  rows: RawPoRow[],
  asOfDate: string,
): EngineResult {
  const orders: EngineOrder[] = [];
  let receivedCount = 0;

  for (const row of rows) {
    const openQuantity = round1(row.quantityOrdered - row.quantityReceived);
    if (openQuantity <= 0) {
      receivedCount += 1;
      continue;
    }

    const hasPromisedDate = Boolean(row.promisedDate);
    const expectedDate = row.promisedDate ?? row.dueDate;
    const expectedDateSource = row.promisedDate ? "promised" : "due";
    const delta = diffDays(asOfDate, expectedDate);
    const daysPastDue = Math.max(0, delta);
    const daysUntilDue = Math.max(0, -delta);
    const openPct =
      row.quantityOrdered > 0 ? openQuantity / row.quantityOrdered : 1;
    const unitCost =
      row.unitCost !== null && row.unitCost >= 0 ? row.unitCost : null;
    const openValue =
      unitCost !== null ? round1(openQuantity * unitCost) : null;
    const inventory = coverage(row, daysUntilDue, daysPastDue);
    const { riskLevel, reasonCodes } = classify({
      daysPastDue,
      daysUntilDue,
      openPct,
      hasPromisedDate,
      inventory,
    });

    const order: Omit<EngineOrder, "priority"> = {
      poNumber: row.poNumber,
      supplier: row.supplier,
      item: row.item,
      description: row.description,
      buyer: row.buyer,
      quantityOrdered: row.quantityOrdered,
      quantityReceived: row.quantityReceived,
      openQuantity,
      openPct,
      unitCost,
      openValue,
      orderDate: row.orderDate,
      dueDate: row.dueDate,
      promisedDate: row.promisedDate,
      expectedDate,
      expectedDateSource,
      daysPastDue,
      daysUntilDue,
      hasPromisedDate,
      inventoryOnHand: row.inventoryOnHand,
      dailyUsage: row.dailyUsage,
      inventory,
      riskLevel,
      reasonCodes,
    };

    orders.push({
      ...order,
      priority: priorityScore(order),
    });
  }

  orders.sort((a, b) => b.priority - a.priority || a.poNumber.localeCompare(b.poNumber));
  return { orders, receivedCount };
}
