import { buildBrief } from "@/lib/signal/interpret";
import {
  RISK_RANK,
  type AnalyzedOrder,
  type ExposureMetrics,
  type RiskFilter,
  type RiskLevel,
  type RiskSummary,
  type SignalDashboard,
  type SortKey,
  type SupplierSignal,
} from "@/lib/signal/types";

export function summarize(orders: AnalyzedOrder[]): RiskSummary {
  return {
    critical: orders.filter((order) => order.riskLevel === "critical").length,
    atRisk: orders.filter((order) => order.riskLevel === "at_risk").length,
    needsConfirmation: orders.filter(
      (order) => order.riskLevel === "needs_confirmation",
    ).length,
    onTrack: orders.filter((order) => order.riskLevel === "on_track").length,
  };
}

export function filterOrders(
  orders: AnalyzedOrder[],
  buyer: string | "all",
  risk: RiskFilter = "all",
): AnalyzedOrder[] {
  return orders.filter((order) => {
    if (buyer !== "all" && order.buyer !== buyer) return false;
    if (risk !== "all" && order.riskLevel !== risk) return false;
    return true;
  });
}

export function sortOrders(
  orders: AnalyzedOrder[],
  sortKey: SortKey,
): AnalyzedOrder[] {
  const copy = [...orders];
  copy.sort((a, b) => {
    switch (sortKey) {
      case "open_value":
        return (b.openValue ?? -1) - (a.openValue ?? -1);
      case "days_late":
        return (
          b.daysPastDue - a.daysPastDue || a.daysUntilDue - b.daysUntilDue
        );
      case "supplier":
        return (
          a.supplier.localeCompare(b.supplier) ||
          b.priority - a.priority
        );
      case "buyer":
        return (
          (a.buyer ?? "").localeCompare(b.buyer ?? "") ||
          b.priority - a.priority
        );
      case "priority":
      default:
        return (
          RISK_RANK[b.riskLevel] - RISK_RANK[a.riskLevel] ||
          (b.openValue ?? 0) - (a.openValue ?? 0) ||
          b.daysPastDue - a.daysPastDue ||
          a.daysUntilDue - b.daysUntilDue ||
          b.priority - a.priority
        );
    }
  });
  return copy;
}

export function buildExposure(orders: AnalyzedOrder[]): ExposureMetrics {
  const valued = orders.filter((order) => order.openValue !== null);
  if (valued.length === 0) {
    return {
      hasCost: false,
      openValue: null,
      flaggedValue: null,
      criticalValue: null,
    };
  }

  const sum = (list: AnalyzedOrder[]) =>
    list.reduce((total, order) => total + (order.openValue ?? 0), 0);

  return {
    hasCost: true,
    openValue: sum(valued),
    flaggedValue: sum(
      valued.filter((order) => order.riskLevel !== "on_track"),
    ),
    criticalValue: sum(
      valued.filter((order) => order.riskLevel === "critical"),
    ),
  };
}

export function buildPriorities(orders: AnalyzedOrder[]): string[] {
  const items: string[] = [];
  const coverageCritical = orders.filter(
    (order) =>
      order.riskLevel === "critical" &&
      order.reasonCodes.includes("coverage_gap"),
  ).length;
  if (coverageCritical > 0) {
    items.push(
      `${coverageCritical} critical coverage ${coverageCritical === 1 ? "risk" : "risks"}`,
    );
  }

  const costlyOverdue = orders.filter(
    (order) => order.daysPastDue > 0 && (order.openValue ?? 0) >= 10_000,
  ).length;
  if (costlyOverdue > 0) {
    items.push(
      `${costlyOverdue} overdue ${costlyOverdue === 1 ? "order" : "orders"} above $10,000 open value`,
    );
  }

  const unconfirmed = orders.filter(
    (order) => !order.hasPromisedDate && order.riskLevel !== "on_track",
  ).length;
  if (unconfirmed > 0) {
    items.push(
      `${unconfirmed} open ${unconfirmed === 1 ? "order" : "orders"} without supplier confirmation`,
    );
  }

  const flaggedBySupplier = new Map<string, number>();
  for (const order of orders) {
    if (order.riskLevel === "on_track") continue;
    flaggedBySupplier.set(
      order.supplier,
      (flaggedBySupplier.get(order.supplier) ?? 0) + 1,
    );
  }
  const multi = [...flaggedBySupplier.values()].filter((count) => count > 1)
    .length;
  if (multi > 0) {
    items.push(
      `${multi} ${multi === 1 ? "supplier has" : "suppliers have"} multiple flagged orders`,
    );
  }

  const dueSoon = orders.filter((order) =>
    order.reasonCodes.includes("due_soon"),
  ).length;
  if (dueSoon > 0) {
    items.push(
      `${dueSoon} ${dueSoon === 1 ? "order is" : "orders are"} due within 3 days`,
    );
  }

  return items.slice(0, 4);
}

function highestRisk(orders: AnalyzedOrder[]): RiskLevel {
  let best: RiskLevel = "on_track";
  for (const order of orders) {
    if (RISK_RANK[order.riskLevel] > RISK_RANK[best]) {
      best = order.riskLevel;
    }
  }
  return best;
}

function supplierPrimaryIssue(orders: AnalyzedOrder[]): string {
  const coverage = orders.filter((order) =>
    order.reasonCodes.includes("coverage_gap"),
  ).length;
  const overdue = orders.filter((order) => order.daysPastDue > 0).length;
  const unconfirmed = orders.filter((order) => !order.hasPromisedDate).length;

  if (coverage > 0) {
    return "Promised dates exceed available inventory coverage";
  }
  if (unconfirmed === orders.length) {
    return "Open orders without confirmed dates";
  }
  if (overdue === orders.length) {
    return "Orders are past promised or due date";
  }
  if (overdue > 0) {
    return "Timing issues on open orders in this report";
  }
  return "Open orders require confirmation or follow-up";
}

export function aggregateSuppliers(orders: AnalyzedOrder[]): SupplierSignal[] {
  const flagged = orders.filter((order) => order.riskLevel !== "on_track");
  const grouped = new Map<string, AnalyzedOrder[]>();

  for (const order of flagged) {
    const list = grouped.get(order.supplier) ?? [];
    list.push(order);
    grouped.set(order.supplier, list);
  }

  return [...grouped.entries()]
    .map(([supplier, list]) => {
      const criticalCount = list.filter((o) => o.riskLevel === "critical")
        .length;
      const atRiskCount = list.filter((o) => o.riskLevel === "at_risk").length;
      const needsConfirmationCount = list.filter(
        (o) => o.riskLevel === "needs_confirmation",
      ).length;
      const overdueCount = list.filter((o) => o.daysPastDue > 0).length;
      const unconfirmedCount = list.filter((o) => !o.hasPromisedDate).length;
      const valued = list.filter((o) => o.openValue !== null);
      const flaggedValue =
        valued.length > 0
          ? valued.reduce((sum, order) => sum + (order.openValue ?? 0), 0)
          : null;
      const attentionCount = list.length;
      const noun = attentionCount === 1 ? "order" : "orders";
      let summary = `${attentionCount} flagged ${noun}`;
      if (unconfirmedCount === attentionCount) {
        summary = `${unconfirmedCount} ${noun} without confirmed dates`;
      } else if (overdueCount === attentionCount) {
        summary = `${overdueCount} overdue ${noun}`;
      }

      return {
        supplier,
        attentionCount,
        overdueCount,
        unconfirmedCount,
        criticalCount,
        atRiskCount,
        needsConfirmationCount,
        highestRisk: highestRisk(list),
        flaggedValue,
        primaryIssue: supplierPrimaryIssue(list),
        summary,
      };
    })
    .sort(
      (a, b) =>
        RISK_RANK[b.highestRisk] - RISK_RANK[a.highestRisk] ||
        (b.flaggedValue ?? 0) - (a.flaggedValue ?? 0) ||
        b.attentionCount - a.attentionCount ||
        a.supplier.localeCompare(b.supplier),
    );
}

export function buildDashboard(orders: AnalyzedOrder[]): SignalDashboard {
  const summary = summarize(orders);
  const flagged = sortOrders(
    orders.filter((order) => order.riskLevel !== "on_track"),
    "priority",
  );
  const buyers = [
    ...new Set(
      orders
        .map((order) => order.buyer)
        .filter((buyer): buyer is string => Boolean(buyer)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return {
    summary,
    brief: buildBrief(orders, summary),
    attention: flagged,
    suppliers: aggregateSuppliers(orders),
    buyers,
    exposure: buildExposure(orders),
    priorities: buildPriorities(orders),
  };
}
