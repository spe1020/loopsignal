"use client";

import { useMemo, useState } from "react";
import { RiskBadge, riskStyles } from "@/components/signal/RiskBadge";
import {
  formatDayCount,
  formatIsoDate,
  formatRelativeDue,
} from "@/lib/signal/dates";
import { formatMoney, formatQuantity } from "@/lib/signal/interpret";
import {
  aggregateSuppliers,
  buildExposure,
  buildPriorities,
  filterOrders,
  sortOrders,
  summarize,
} from "@/lib/signal/view";
import type {
  AnalyzedOrder,
  RiskFilter,
  RiskLevel,
  SignalAnalysisResult,
  SortKey,
} from "@/lib/signal/types";

function orderKey(order: AnalyzedOrder): string {
  return `${order.poNumber}::${order.item}`;
}

function timingLabel(order: AnalyzedOrder): string {
  if (order.daysPastDue > 0) return `${formatDayCount(order.daysPastDue)} late`;
  if (order.daysUntilDue === 0) return "due today";
  return `due in ${formatDayCount(order.daysUntilDue)}`;
}

const summaryCards: Array<{
  filter: RiskFilter;
  label: string;
  hint: string;
  count: (summary: ReturnType<typeof summarize>, total: number) => number;
  level?: RiskLevel;
}> = [
  {
    filter: "all",
    label: "All Open Orders",
    hint: "Full queue",
    count: (_summary, total) => total,
  },
  {
    filter: "critical",
    label: "Critical",
    hint: "Urgent attention",
    level: "critical",
    count: (summary) => summary.critical,
  },
  {
    filter: "at_risk",
    label: "At Risk",
    hint: "Needs follow-up",
    level: "at_risk",
    count: (summary) => summary.atRisk,
  },
  {
    filter: "needs_confirmation",
    label: "Needs Confirmation",
    hint: "Confirm dates",
    level: "needs_confirmation",
    count: (summary) => summary.needsConfirmation,
  },
  {
    filter: "on_track",
    label: "On Track",
    hint: "No current flag",
    level: "on_track",
    count: (summary) => summary.onTrack,
  },
];

function FollowUpDraft({
  order,
  open,
  onToggle,
}: {
  order: AnalyzedOrder;
  open: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = `${order.followUp.subject}\n\n${order.followUp.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 border-t border-[#d9d9d2] pt-4">
      <button
        type="button"
        onClick={onToggle}
        className="text-[13px] font-medium text-ink underline decoration-[#cfcfc8] underline-offset-4 hover:decoration-ink"
      >
        {open ? "Hide draft" : "Generate Draft"}
      </button>
      {open ? (
        <div className="mt-3 border border-[#d9d9d2] bg-white px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Subject
          </p>
          <p className="mt-1 text-sm font-medium text-ink">
            {order.followUp.subject}
          </p>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-graphite">
            {order.followUp.body}
          </pre>
          <button
            type="button"
            onClick={copy}
            className="mt-4 inline-flex min-h-10 items-center border border-ink bg-ink px-3 py-2 text-[12px] font-medium tracking-[0.02em] text-white hover:bg-graphite"
          >
            {copied ? "Copied" : "Copy Draft"}
          </button>
          <p className="mt-2 text-[12px] text-stone">
            This demo does not send email.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function QueueCard({
  order,
  selected,
  onSelect,
}: {
  order: AnalyzedOrder;
  selected: boolean;
  onSelect: () => void;
}) {
  const style = riskStyles[order.riskLevel];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full border-y border-r border-l-4 px-3 py-3 text-left transition-colors ${style.bar} ${
        selected
          ? `${style.bg} ${style.border}`
          : "border-[#d9d9d2] bg-white hover:bg-[#fafaf7]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <RiskBadge level={order.riskLevel} size="sm" />
        <span className="font-mono text-[11px] text-graphite">
          {timingLabel(order)}
        </span>
      </div>
      <p className="mt-2 text-[13px] font-medium tracking-tight text-ink">
        PO {order.poNumber}
      </p>
      <p className="text-[12px] text-graphite">{order.supplier}</p>
      <p className="text-[12px] text-ink">{order.description || order.item}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone">
        {order.buyer ? <span>{order.buyer}</span> : null}
        {order.openValue !== null ? (
          <span className="font-medium text-ink">
            {formatMoney(order.openValue)} open
          </span>
        ) : (
          <span>Open qty {formatQuantity(order.openQuantity)}</span>
        )}
      </div>
      <p className="mt-2 text-[12px] leading-5 text-graphite">
        {order.shortReason}
      </p>
    </button>
  );
}

function OrderDetail({
  order,
  showDraft,
  onToggleDraft,
  onPrimaryAction,
}: {
  order: AnalyzedOrder;
  showDraft: boolean;
  onToggleDraft: () => void;
  onPrimaryAction: () => void;
}) {
  const style = riskStyles[order.riskLevel];

  return (
    <div
      id="order-detail"
      className={`border border-l-4 bg-white ${style.bar} border-[#d9d9d2]`}
    >
      <div className={`border-b border-[#d9d9d2] px-4 py-3 ${style.bg}`}>
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={order.riskLevel} />
          <span className="text-[12px] text-graphite">{timingLabel(order)}</span>
        </div>
        <h3 className="mt-2 text-lg font-medium tracking-tight text-ink">
          PO {order.poNumber}
        </h3>
        <p className="text-sm text-graphite">
          {order.supplier} · {order.description || order.item}
        </p>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
        <section>
          <h4 className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Order
          </h4>
          <dl className="mt-2 space-y-1.5 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-stone">PO</dt>
              <dd className="font-medium text-ink">{order.poNumber}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Supplier</dt>
              <dd className="text-right text-ink">{order.supplier}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Item</dt>
              <dd className="text-right text-ink">{order.item}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Description</dt>
              <dd className="text-right text-ink">
                {order.description || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Buyer</dt>
              <dd className="text-ink">{order.buyer || "—"}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h4 className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Timing
          </h4>
          <dl className="mt-2 space-y-1.5 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Order date</dt>
              <dd className="text-ink">
                {order.orderDate ? formatIsoDate(order.orderDate) : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Due date</dt>
              <dd className="text-ink">{formatIsoDate(order.dueDate)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Promised date</dt>
              <dd className="text-ink">
                {order.promisedDate
                  ? formatIsoDate(order.promisedDate)
                  : "Not confirmed"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Status</dt>
              <dd className="text-ink">
                {formatRelativeDue(order.daysPastDue, order.daysUntilDue)}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h4 className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Quantity
          </h4>
          <dl className="mt-2 space-y-1.5 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Ordered</dt>
              <dd className="text-ink">
                {formatQuantity(order.quantityOrdered)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Received</dt>
              <dd className="text-ink">
                {formatQuantity(order.quantityReceived)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Open</dt>
              <dd className="font-medium text-ink">
                {formatQuantity(order.openQuantity)}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h4 className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Cost
          </h4>
          {order.unitCost !== null ? (
            <dl className="mt-2 space-y-1.5 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-stone">Unit cost</dt>
                <dd className="text-ink">{formatMoney(order.unitCost, 2)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone">Open quantity</dt>
                <dd className="text-ink">
                  {formatQuantity(order.openQuantity)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone">Open value</dt>
                <dd className="font-medium text-ink">
                  {order.openValue !== null ? formatMoney(order.openValue) : "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-[13px] text-stone">
              Unit cost was not included in this report.
            </p>
          )}
        </section>
      </div>

      {order.inventory ? (
        <section className="border-t border-[#d9d9d2] px-4 py-4" id="inventory-detail">
          <h4 className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Inventory
          </h4>
          <dl className="mt-2 grid gap-2 text-[13px] sm:grid-cols-2">
            <div className="flex justify-between gap-3">
              <dt className="text-stone">On hand</dt>
              <dd className="text-ink">
                {order.inventoryOnHand !== null
                  ? formatQuantity(order.inventoryOnHand)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Daily usage</dt>
              <dd className="text-ink">
                {order.dailyUsage !== null
                  ? formatQuantity(order.dailyUsage)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Days of supply</dt>
              <dd className="text-ink">
                {formatDayCount(Math.round(order.inventory.daysOfSupply))}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Replenishment gap</dt>
              <dd className="text-ink">
                {order.inventory.replenishmentOverdue
                  ? "Replenishment overdue"
                  : order.inventory.coverageGapDays
                    ? formatDayCount(
                        Math.round(order.inventory.coverageGapDays),
                      )
                    : "No gap in this report"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {order.riskLevel !== "on_track" ? (
        <section className="border-t border-[#d9d9d2] px-4 py-4">
          <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
            Why was this flagged?
          </h4>
          <ul className="mt-3 space-y-2">
            {order.reasons.map((reason) => (
              <li key={reason} className="flex gap-2 text-sm text-ink">
                <span
                  aria-hidden
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 ${style.bg} ${style.border} border`}
                />
                <span>
                  <strong className="font-medium">{reason}</strong>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border border-[#d9d9d2] bg-[#fafaf7] px-3 py-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
              Why it matters
            </p>
            <p className="mt-1.5 text-sm leading-6 text-ink">
              {order.whyItMatters}
            </p>
          </div>
        </section>
      ) : (
        <section className="border-t border-[#d9d9d2] px-4 py-4">
          <p className="text-sm text-graphite">
            No current risk rule was triggered for this open order.
          </p>
        </section>
      )}

      {order.suggestedOwner ? (
        <section className="border-t border-[#d9d9d2] px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Suggested owner
          </p>
          <p className="mt-1 text-sm font-medium text-ink">
            {order.suggestedOwner}
          </p>
          <p className="mt-1 text-[12px] text-stone">Recommendation only.</p>
        </section>
      ) : null}

      {order.immediateActions.length > 0 || order.longerTermActions.length > 0 ? (
        <section className="grid gap-4 border-t border-[#d9d9d2] px-4 py-4 sm:grid-cols-2">
          <div>
            <h4 className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
              Immediate actions
            </h4>
            <ul className="mt-2 space-y-1.5">
              {order.immediateActions.map((action) => (
                <li key={action} className="text-sm text-ink">
                  {action}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
              Longer-term actions
            </h4>
            {order.longerTermActions.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {order.longerTermActions.map((action) => (
                  <li key={action} className="text-sm text-graphite">
                    {action}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-stone">None suggested for this issue.</p>
            )}
          </div>
        </section>
      ) : null}

      <div className="border-t border-[#d9d9d2] px-4 py-4">
        {order.primaryAction ? (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex min-h-11 w-full items-center justify-center bg-ink px-4 py-2.5 text-[13px] font-medium tracking-[0.02em] text-white hover:bg-graphite sm:w-auto"
          >
            {order.primaryAction.label}
          </button>
        ) : null}
        <FollowUpDraft
          order={order}
          open={showDraft}
          onToggle={onToggleDraft}
        />
      </div>
    </div>
  );
}

export function SignalResults({
  result,
}: {
  result: SignalAnalysisResult;
}) {
  const [buyer, setBuyer] = useState<string>("all");
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showDraft, setShowDraft] = useState(false);

  const buyers = result.dashboard.buyers;
  const buyerOrders = useMemo(
    () => filterOrders(result.orders, buyer, "all"),
    [result.orders, buyer],
  );
  const summary = useMemo(() => summarize(buyerOrders), [buyerOrders]);
  const exposure = useMemo(() => buildExposure(buyerOrders), [buyerOrders]);
  const viewOrders = useMemo(
    () => sortOrders(filterOrders(result.orders, buyer, risk), sortKey),
    [result.orders, buyer, risk, sortKey],
  );
  const priorities = useMemo(
    () => buildPriorities(risk === "all" ? buyerOrders : viewOrders),
    [buyerOrders, viewOrders, risk],
  );
  const suppliers = useMemo(
    () => aggregateSuppliers(viewOrders),
    [viewOrders],
  );

  const selected =
    viewOrders.find((order) => orderKey(order) === selectedKey) ??
    viewOrders[0] ??
    null;
  const activeKey = selected ? orderKey(selected) : null;

  function selectOrder(order: AnalyzedOrder) {
    setSelectedKey(orderKey(order));
    setShowDraft(false);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.setTimeout(() => {
        document
          .getElementById("order-detail")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 40);
    }
  }

  function changeRisk(next: RiskFilter) {
    setRisk(next);
    setShowDraft(false);
  }

  function changeBuyer(next: string) {
    setBuyer(next);
    setShowDraft(false);
  }

  function changeSort(next: SortKey) {
    setSortKey(next);
    setShowDraft(false);
  }

  function onPrimaryAction() {
    if (!selected?.primaryAction) return;
    if (selected.primaryAction.kind === "inventory") {
      document
        .getElementById("inventory-detail")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    setShowDraft(true);
  }

  return (
    <div className="space-y-4 p-4 md:p-5">
      {priorities.length > 0 ? (
        <section className="border border-[#d9d9d2] bg-white px-4 py-3">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Today’s priorities
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {priorities.map((item) => (
              <li key={item} className="text-[13px] font-medium text-ink">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {exposure.hasCost ? (
        <section className="grid gap-px border border-[#d9d9d2] bg-[#d9d9d2] sm:grid-cols-3">
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
              Open PO value
            </p>
            <p className="mt-1 font-mono text-xl text-ink">
              {formatMoney(exposure.openValue ?? 0)}
            </p>
          </div>
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
              Open value at risk
            </p>
            <p className="mt-1 font-mono text-xl text-ink">
              {formatMoney(exposure.flaggedValue ?? 0)}
            </p>
          </div>
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
              Critical exposure
            </p>
            <p className="mt-1 font-mono text-xl text-risk-critical">
              {formatMoney(exposure.criticalValue ?? 0)}
            </p>
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {summaryCards.map((card) => {
          const count = card.count(summary, buyerOrders.length);
          const selectedCard = risk === card.filter;
          const style = card.level ? riskStyles[card.level] : null;
          return (
            <button
              key={card.filter}
              type="button"
              onClick={() => changeRisk(card.filter)}
              className={`border px-3 py-3 text-left ${
                selectedCard
                  ? style
                    ? `${style.bg} ${style.border}`
                    : "border-ink bg-white"
                  : "border-[#d9d9d2] bg-white hover:border-ink/40"
              }`}
            >
              {card.level ? (
                <RiskBadge level={card.level} size="sm" />
              ) : (
                <span className="inline-flex border border-ink/20 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.06em] text-ink">
                  All
                </span>
              )}
              <p className="mt-2 font-mono text-2xl tracking-tight text-ink">
                {count}
              </p>
              <p className="text-[12px] font-medium text-ink">{card.label}</p>
              <p className="mt-0.5 text-[11px] text-stone">{card.hint}</p>
            </button>
          );
        })}
      </section>

      <section className="flex flex-col gap-3 border border-[#d9d9d2] bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        {buyers.length > 0 ? (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
              Buyer
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => changeBuyer("all")}
                className={`min-h-9 border px-2.5 py-1.5 text-[12px] ${
                  buyer === "all"
                    ? "border-ink bg-ink text-white"
                    : "border-[#d9d9d2] bg-white text-graphite hover:border-ink"
                }`}
              >
                All Buyers
              </button>
              {buyers.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => changeBuyer(name)}
                  className={`min-h-9 border px-2.5 py-1.5 text-[12px] ${
                    buyer === name
                      ? "border-ink bg-ink text-white"
                      : "border-[#d9d9d2] bg-white text-graphite hover:border-ink"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Sort
            <select
              value={sortKey}
              onChange={(event) => changeSort(event.target.value as SortKey)}
              className="min-h-9 border border-[#d9d9d2] bg-white px-2 text-[12px] font-medium normal-case tracking-normal text-ink"
            >
              <option value="priority">Risk Priority</option>
              <option value="open_value">Open Value</option>
              <option value="days_late">Days Late</option>
              <option value="supplier">Supplier</option>
              <option value="buyer">Buyer</option>
            </select>
          </label>
          <div className="hidden md:grid gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            View
            <div className="flex">
              <button
                type="button"
                onClick={() => setView("cards")}
                className={`min-h-9 border px-3 text-[12px] font-medium normal-case tracking-normal ${
                  view === "cards"
                    ? "border-ink bg-ink text-white"
                    : "border-[#d9d9d2] bg-white text-graphite"
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                className={`min-h-9 border border-l-0 px-3 text-[12px] font-medium normal-case tracking-normal ${
                  view === "table"
                    ? "border-ink bg-ink text-white"
                    : "border-[#d9d9d2] bg-white text-graphite"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        {view === "table" ? (
          <section className="hidden lg:col-span-12 md:block">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="text-[13px] font-medium text-ink">
                What needs attention
              </h3>
              <p className="text-[11px] text-stone">
                {viewOrders.length}{" "}
                {viewOrders.length === 1 ? "order" : "orders"}
              </p>
            </div>
            {viewOrders.length === 0 ? (
              <p className="border border-[#d9d9d2] bg-white px-4 py-6 text-sm text-graphite">
                No open orders match the current filters.
              </p>
            ) : (
              <div className="overflow-x-auto border border-[#d9d9d2] bg-white">
                <table className="min-w-full text-left text-[12px]">
                  <thead className="bg-[#fafaf7] text-[10px] uppercase tracking-[0.12em] text-stone">
                    <tr>
                      <th className="px-2 py-2 font-medium">Risk</th>
                      <th className="px-2 py-2 font-medium">PO</th>
                      <th className="px-2 py-2 font-medium">Supplier</th>
                      <th className="px-2 py-2 font-medium">Item</th>
                      <th className="px-2 py-2 font-medium">Buyer</th>
                      <th className="px-2 py-2 font-medium">Open Qty</th>
                      <th className="px-2 py-2 font-medium">Expected</th>
                      <th className="px-2 py-2 font-medium">Days Late</th>
                      <th className="px-2 py-2 font-medium">Open Value</th>
                      <th className="px-2 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrders.map((order) => {
                      return (
                        <tr
                          key={orderKey(order)}
                          onClick={() => selectOrder(order)}
                          className={`cursor-pointer border-t border-[#ecece6] ${
                            orderKey(order) === activeKey
                              ? riskStyles[order.riskLevel].bg
                              : "bg-white"
                          }`}
                        >
                          <td className="px-2 py-2">
                            <RiskBadge level={order.riskLevel} size="sm" />
                          </td>
                          <td className="px-2 py-2 font-medium">
                            {order.poNumber}
                          </td>
                          <td className="px-2 py-2">{order.supplier}</td>
                          <td className="px-2 py-2">
                            {order.description || order.item}
                          </td>
                          <td className="px-2 py-2">{order.buyer || "—"}</td>
                          <td className="px-2 py-2">
                            {formatQuantity(order.openQuantity)}
                          </td>
                          <td className="px-2 py-2">
                            {formatIsoDate(order.expectedDate)}
                          </td>
                          <td className="px-2 py-2">
                            {order.daysPastDue > 0 ? order.daysPastDue : "—"}
                          </td>
                          <td className="px-2 py-2">
                            {order.openValue !== null
                              ? formatMoney(order.openValue)
                              : "—"}
                          </td>
                          <td className="px-2 py-2">
                            {order.primaryAction?.label ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        <section className={view === "table" ? "md:hidden" : "lg:col-span-5"}>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="text-[13px] font-medium text-ink">
              What needs attention
            </h3>
            <p className="text-[11px] text-stone">
              {viewOrders.length} {viewOrders.length === 1 ? "order" : "orders"}
            </p>
          </div>
          {viewOrders.length === 0 ? (
            <p className="border border-[#d9d9d2] bg-white px-4 py-6 text-sm text-graphite">
              No open orders match the current filters.
            </p>
          ) : (
            <div className="space-y-2">
              {viewOrders.map((order) => (
                <QueueCard
                  key={orderKey(order)}
                  order={order}
                  selected={orderKey(order) === activeKey}
                  onSelect={() => selectOrder(order)}
                />
              ))}
            </div>
          )}
        </section>

        <section className={view === "table" ? "lg:col-span-12" : "lg:col-span-7"}>
          <h3 className="mb-2 text-[13px] font-medium text-ink">
            Selected order
          </h3>
          {selected ? (
            <OrderDetail
              order={selected}
              showDraft={showDraft}
              onToggleDraft={() => setShowDraft((value) => !value)}
              onPrimaryAction={onPrimaryAction}
            />
          ) : (
            <p className="border border-[#d9d9d2] bg-white px-4 py-6 text-sm text-graphite">
              Select an order to see why it was flagged and what to do next.
            </p>
          )}
        </section>
      </div>

      <section className="border border-[#d9d9d2] bg-white px-4 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="text-[13px] font-medium text-ink">Supplier signals</h3>
          <p className="text-[11px] text-stone">
            Signals from this report only
          </p>
        </div>
        {suppliers.length === 0 ? (
          <p className="mt-3 text-sm text-graphite">
            No supplier attention items in the current view.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {suppliers.map((signal) => {
              const style = riskStyles[signal.highestRisk];
              return (
                <li
                  key={signal.supplier}
                  className={`border border-l-4 bg-[#fafaf7] px-3 py-3 ${style.bar} border-[#d9d9d2]`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-medium text-ink">
                      {signal.supplier}
                    </p>
                    <RiskBadge level={signal.highestRisk} size="sm" />
                  </div>
                  <p className="mt-1 text-[12px] text-graphite">
                    {signal.attentionCount} flagged{" "}
                    {signal.attentionCount === 1 ? "order" : "orders"}
                    {signal.criticalCount > 0
                      ? ` · ${signal.criticalCount} Critical`
                      : ""}
                    {signal.atRiskCount > 0
                      ? ` · ${signal.atRiskCount} At Risk`
                      : ""}
                    {signal.needsConfirmationCount > 0
                      ? ` · ${signal.needsConfirmationCount} Needs Confirmation`
                      : ""}
                  </p>
                  {signal.flaggedValue !== null ? (
                    <p className="mt-1 font-mono text-[13px] text-ink">
                      {formatMoney(signal.flaggedValue)} flagged open value
                    </p>
                  ) : null}
                  <p className="mt-2 text-[12px] leading-5 text-graphite">
                    <span className="text-stone">Primary signal: </span>
                    {signal.primaryIssue}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        {result.meta.skippedRowCount > 0 ? (
          <p className="mt-3 text-[11px] text-stone">
            {result.meta.skippedRowCount}{" "}
            {result.meta.skippedRowCount === 1 ? "row" : "rows"} could not be
            read and were skipped.
          </p>
        ) : null}
        {result.meta.receivedCount > 0 ? (
          <p className="mt-1 text-[11px] text-stone">
            {result.meta.receivedCount} fully received{" "}
            {result.meta.receivedCount === 1 ? "line was" : "lines were"} set
            aside.
          </p>
        ) : null}
      </section>
    </div>
  );
}
