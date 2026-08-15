import Link from "next/link";
import {
  PlantStatusBadge,
  Pill,
  SeverityBadge,
  plantStatusStyles,
  severityStyles,
} from "@/components/brief/BriefBadges";
import { formatPct, formatQty } from "@/lib/brief";
import {
  actionHorizonLabels,
  actionStatusLabels,
  actionStatuses,
  actionTimingLabels,
  categoryLabels,
  meetingStepLabels,
  meetingSteps,
  owners,
} from "@/lib/brief/types";
import type {
  ActionStatus,
  BriefAction,
  BriefIssue,
  BriefResult,
  Category,
  MeetingStep,
  Owner,
  ProductionView,
} from "@/lib/brief/types";

export const consoleBtn =
  "inline-flex min-h-9 items-center justify-center border border-[#c8c8c0] bg-white px-3 py-1.5 text-[12px] font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-[0.16em] text-stone uppercase">
      {children}
    </p>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-3 py-2.5">
      <dt className="text-[10px] tracking-[0.08em] text-stone uppercase">{label}</dt>
      <dd className="mt-1 text-[13px] font-medium text-ink">{value}</dd>
    </div>
  );
}

function AttainmentBar({ pct }: { pct: number }) {
  const width = Math.min(Math.max(pct, 0), 100);
  const tone =
    pct < 90 ? "bg-risk-critical" : pct < 100 ? "bg-risk-amber" : "bg-risk-track";
  return (
    <div className="h-1.5 w-full bg-[#ecece6]" aria-hidden>
      <div className={`h-full ${tone}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function RelatedLinks({ issue }: { issue: BriefIssue }) {
  if (!issue.related?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {issue.related.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-[11px] font-medium tracking-[0.02em] text-copper hover:text-copper-dark"
        >
          {link.label} →
        </Link>
      ))}
    </div>
  );
}

function HorizonBlock({ issue }: { issue: BriefIssue }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="border border-[#ecece6] bg-[#fafaf7] px-3 py-2.5">
        <p className="text-[10px] font-medium tracking-[0.14em] text-stone uppercase">
          Immediate
        </p>
        <p className="mt-1 text-[12px] leading-5 text-ink">{issue.immediateAction}</p>
      </div>
      <div className="border border-[#ecece6] bg-[#fafaf7] px-3 py-2.5">
        <p className="text-[10px] font-medium tracking-[0.14em] text-stone uppercase">
          Structural
        </p>
        <p className="mt-1 text-[12px] leading-5 text-ink">{issue.structuralAction}</p>
      </div>
    </div>
  );
}

export function EmptyState({ onRun }: { onRun: () => void }) {
  return (
    <div className="border border-[#d9d9d2] bg-white px-5 py-10 text-center md:px-8">
      <SectionLabel>Today&apos;s Operations Brief</SectionLabel>
      <h2 className="mt-3 text-[22px] font-medium tracking-tight text-ink">
        Assemble the day before the meeting does.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-[13px] leading-6 text-graphite">
        Run the brief to turn production, quality, supply, maintenance, and
        schedule signals into exceptions, owners, and actions.
      </p>
      <button type="button" onClick={onRun} className={`${consoleBtn} mt-6 border-ink bg-ink text-white hover:bg-graphite`}>
        Run Brief
      </button>
    </div>
  );
}

export function PlantStatusCard({ brief }: { brief: BriefResult }) {
  const style = plantStatusStyles[brief.plantStatus.status];
  return (
    <section className={`border px-4 py-4 md:px-5 ${style.banner}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionLabel>Plant Status</SectionLabel>
          <h2 className="mt-2 text-[22px] font-medium tracking-tight text-ink md:text-[26px]">
            {brief.plantStatus.label.toUpperCase()}
          </h2>
        </div>
        <PlantStatusBadge status={brief.plantStatus.status} />
      </div>
      <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink">
        {brief.plantStatus.reason}
      </p>
    </section>
  );
}

export function ExecutiveStrip({
  brief,
  active,
  onSelect,
}: {
  brief: BriefResult;
  active: Category | "all";
  onSelect: (category: Category | "all") => void;
}) {
  return (
    <div className="grid gap-px border border-[#d9d9d2] bg-[#d9d9d2] sm:grid-cols-2 lg:grid-cols-5">
      {brief.strip.map((item) => {
        const selected = active === item.category;
        const style = severityStyles[item.severity];
        return (
          <button
            key={item.category}
            type="button"
            onClick={() => onSelect(selected ? "all" : item.category)}
            className={`border-l-4 bg-white px-3 py-3 text-left ${style.bar} ${
              selected ? "bg-[#fafaf7]" : "hover:bg-[#fafaf7]"
            }`}
            aria-pressed={selected}
          >
            <p className="text-[10px] tracking-[0.12em] text-stone uppercase">
              {item.detail}
            </p>
            <p className={`mt-1 text-[15px] font-medium ${style.text}`}>
              {item.headline}
            </p>
            <div className="mt-2">
              <SeverityBadge severity={item.severity} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function BriefSummary({ brief }: { brief: BriefResult }) {
  return (
    <section className="border border-[#d9d9d2] bg-white px-4 py-4 md:px-5">
      <SectionLabel>Today&apos;s Operations Brief</SectionLabel>
      <p className="mt-3 max-w-3xl text-[15px] leading-7 text-ink">{brief.summary}</p>
    </section>
  );
}

export function Priorities({
  brief,
  selectedId,
  onSelect,
}: {
  brief: BriefResult;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3 md:px-5">
        <SectionLabel>Today&apos;s Priorities</SectionLabel>
        <p className="mt-1 text-[12px] text-graphite">
          Highest-priority exceptions for the morning operating review.
        </p>
      </div>
      {brief.priorities.length === 0 ? (
        <p className="px-4 py-4 text-[13px] text-graphite md:px-5">
          No priorities in this view.
        </p>
      ) : (
        <ol>
        {brief.priorities.map(({ rank, issue }) => {
          const selected = selectedId === issue.id;
          const style = severityStyles[issue.severity];
          return (
            <li key={issue.id} className="border-b border-[#ecece6] last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(issue.id)}
                className={`w-full border-l-4 px-4 py-4 text-left md:px-5 ${style.bar} ${
                  selected ? "bg-[#fafaf7]" : "bg-white hover:bg-[#fafaf7]"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12px] text-copper">{rank}</span>
                  <span className="text-[11px] tracking-[0.08em] text-stone uppercase">
                    {categoryLabels[issue.category]}
                  </span>
                  <SeverityBadge severity={issue.severity} />
                  <Pill>{issue.area}</Pill>
                </div>
                <h3 className="mt-2 text-[16px] font-medium tracking-tight text-ink">
                  {issue.title}
                </h3>
                <p className="mt-1 text-[13px] leading-6 text-graphite">{issue.problem}</p>
                <dl className="mt-3 grid gap-px bg-[#ecece6] sm:grid-cols-3">
                  {issue.metrics.slice(0, 3).map((metric) => (
                    <Metric key={metric.label} label={metric.label} value={metric.value} />
                  ))}
                </dl>
                <p className="mt-3 text-[12px] leading-5 text-ink">
                  <span className="font-medium">Impact. </span>
                  {issue.impact}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-graphite">
                  <span className="font-medium text-ink">Owner. </span>
                  {issue.owner}
                  <span className="mx-2 text-stone">·</span>
                  <span className="font-medium text-ink">Immediate action. </span>
                  {issue.immediateAction}
                </p>
              </button>
            </li>
          );
        })}
        </ol>
      )}
    </section>
  );
}

const changeMark: Record<BriefResult["changes"][number]["direction"], string> = {
  declined: "↓",
  improved: "↑",
  returned: "◆",
  unchanged: "→",
};

export function WhatChanged({ brief }: { brief: BriefResult }) {
  return (
    <section className="border border-[#d9d9d2] bg-white px-4 py-4 md:px-5">
      <SectionLabel>What changed since the last brief?</SectionLabel>
      <ul className="mt-3 divide-y divide-[#ecece6] border-y border-[#ecece6]">
        {brief.changes.map((change) => {
          const style = severityStyles[change.tone];
          return (
            <li key={change.id} className="flex items-start gap-3 py-2.5">
              <span
                aria-hidden
                className={`mt-0.5 font-mono text-[14px] ${style.text}`}
              >
                {changeMark[change.direction]}
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink">{change.detail}</p>
                <p className="mt-0.5 text-[11px] tracking-[0.06em] text-stone uppercase">
                  {categoryLabels[change.category]} · {change.label}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ProductionPanel({
  brief,
  selectedId,
  onSelect,
}: {
  brief: BriefResult;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const selected =
    brief.production.find((row) => row.record.id === selectedId) ??
    brief.production.find((row) => row.record.workCenter === brief.issues.find((issue) => issue.id === selectedId)?.workCenter);

  return (
    <section id="brief-signals" className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3 md:px-5">
        <SectionLabel>Production</SectionLabel>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead className="bg-[#fafaf7] text-[10px] tracking-[0.12em] text-stone uppercase">
            <tr>
              <th className="px-4 py-2 font-medium md:px-5">Work center</th>
              <th className="px-3 py-2 font-medium">Plan</th>
              <th className="px-3 py-2 font-medium">Actual</th>
              <th className="px-3 py-2 font-medium">Attainment</th>
              <th className="px-3 py-2 font-medium">Downtime</th>
              <th className="px-4 py-2 font-medium md:px-5">Status</th>
            </tr>
          </thead>
          <tbody>
            {brief.production.map((row) => {
              const active = selected?.record.id === row.record.id;
              return (
                <tr
                  key={row.record.id}
                  className={`cursor-pointer border-t border-[#ecece6] ${
                    active ? "bg-[#fafaf7]" : "hover:bg-[#fafaf7]"
                  }`}
                  onClick={() => onSelect(row.record.id)}
                >
                  <td className="px-4 py-3 font-medium text-ink md:px-5">
                    {row.record.workCenter}
                  </td>
                  <td className="px-3 py-3">{formatQty(row.record.scheduledQty)}</td>
                  <td className="px-3 py-3">{formatQty(row.record.actualQty)}</td>
                  <td className="px-3 py-3">
                    <span className={severityStyles[row.severity].text}>
                      {formatPct(row.attainmentPct)}
                    </span>
                    <div className="mt-1 w-24">
                      <AttainmentBar pct={row.attainmentPct} />
                    </div>
                  </td>
                  <td className="px-3 py-3">{row.record.downtimeMinutes} min</td>
                  <td className="px-4 py-3 md:px-5">
                    <SeverityBadge severity={row.severity} />
                    <span className="ml-2 text-[11px] text-graphite">
                      {row.statusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected ? <ProductionDetail row={selected} /> : null}
    </section>
  );
}

function ProductionDetail({ row }: { row: ProductionView }) {
  const rec = row.record;
  return (
    <div className="border-t border-[#d9d9d2] px-4 py-4 md:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-[16px] font-medium text-ink">{rec.workCenter}</h3>
        <SeverityBadge severity={row.severity} />
      </div>
      <dl className="mt-3 grid gap-px bg-[#ecece6] sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Scheduled qty" value={formatQty(rec.scheduledQty)} />
        <Metric label="Actual qty" value={formatQty(rec.actualQty)} />
        <Metric
          label="Variance"
          value={`${row.varianceQty > 0 ? "+" : ""}${formatQty(row.varianceQty)}`}
        />
        <Metric label="Attainment" value={formatPct(row.attainmentPct)} />
        <Metric label="Scheduled hours" value={`${rec.scheduledHours}`} />
        <Metric label="Downtime" value={`${rec.downtimeMinutes} minutes`} />
        <Metric label="Top downtime reason" value={rec.primaryDowntimeReason} />
        <Metric label="Recovery status" value={rec.recoveryNote} />
      </dl>
      {row.recoveryRequired > 0 ? (
        <p className="mt-3 border border-risk-amber bg-risk-amber-bg px-3 py-2 text-[12px] leading-5 text-ink">
          <span className="font-medium">Recovery required. </span>
          {formatQty(row.recoveryRequired)} units
        </p>
      ) : null}
      <p className="mt-3 text-[13px] leading-6 text-graphite">
        <span className="font-medium text-ink">Recommended action. </span>
        {rec.recommendedAction}
      </p>
    </div>
  );
}

export function QualityPanel({
  brief,
  selectedId,
  onSelect,
}: {
  brief: BriefResult;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3 md:px-5">
        <SectionLabel>Quality Signals</SectionLabel>
      </div>
      {brief.quality.map((row) => {
        const rec = row.record;
        const selected = selectedId === rec.id;
        const issue = brief.issues.find((item) => item.id === rec.id);
        return (
          <article
            key={rec.id}
            className={`border-l-4 px-4 py-4 md:px-5 ${severityStyles[row.severity].bar} ${
              selected ? "bg-[#fafaf7]" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(rec.id)}
              className="w-full text-left"
            >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[16px] font-medium text-ink">{rec.issue}</h3>
              <SeverityBadge severity={row.severity} />
              <Pill>{rec.workCenter}</Pill>
            </div>
            <dl className="mt-3 grid gap-px bg-[#ecece6] sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Affected" value={`${formatQty(rec.quantityAffected)} pieces`} />
              <Metric label="Scrap" value={formatQty(rec.scrapQty)} />
              <Metric label="Rework" value={formatQty(rec.reworkQty)} />
              <Metric label="Containment" value={row.statusLabel} />
            </dl>
            <p className="mt-3 text-[12px] leading-5 text-graphite">
              <span className="font-medium text-ink">Owner. </span>
              {rec.owner}
            </p>
            </button>
            {selected && issue ? (
              <>
                <HorizonBlock issue={issue} />
                <RelatedLinks issue={issue} />
              </>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

export function SupplyPanel({
  brief,
  selectedId,
  onSelect,
}: {
  brief: BriefResult;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3 md:px-5">
        <SectionLabel>Supply Risks</SectionLabel>
      </div>
      {brief.supply.map((row) => {
        const rec = row.record;
        const selected = selectedId === rec.id;
        const issue = brief.issues.find((item) => item.id === rec.id);
        return (
          <article
            key={rec.id}
            className={`border-t border-[#ecece6] border-l-4 px-4 py-4 first:border-t-0 md:px-5 ${severityStyles[row.riskLevel].bar} ${
              selected ? "bg-[#fafaf7]" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(rec.id)}
              className="w-full text-left"
            >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[16px] font-medium text-ink">{rec.item}</h3>
              <SeverityBadge severity={row.riskLevel} />
              <Pill tone={row.riskLevel === "green" ? "green" : "amber"}>
                {row.statusLabel}
              </Pill>
            </div>
            <dl className="mt-3 grid gap-px bg-[#ecece6] sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Supplier" value={rec.supplier} />
              <Metric label="Days of supply" value={rec.daysOfSupply.toFixed(1)} />
              <Metric
                label="Expected replenishment"
                value={`${rec.replenishmentDays} days`}
              />
              <Metric label="Affected area" value={rec.affectedWorkCenter} />
              <Metric label="Status" value={row.statusLabel} />
              <Metric label="Owner" value={rec.owner} />
            </dl>
            </button>
            {selected && issue ? (
              <>
                <HorizonBlock issue={issue} />
                <RelatedLinks issue={issue} />
              </>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

export function MaintenancePanel({
  brief,
  selectedId,
  onSelect,
}: {
  brief: BriefResult;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3 md:px-5">
        <SectionLabel>Maintenance</SectionLabel>
      </div>
      {brief.maintenance.map((row) => {
        const rec = row.record;
        const selected = selectedId === rec.id;
        const issue = brief.issues.find((item) => item.id === rec.id);
        return (
          <article
            key={rec.id}
            className={`border-l-4 px-4 py-4 md:px-5 ${severityStyles[row.severity].bar} ${
              selected ? "bg-[#fafaf7]" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(rec.id)}
              className="w-full text-left"
            >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[16px] font-medium text-ink">{rec.asset}</h3>
              <SeverityBadge severity={row.severity} />
              <Pill>{rec.workCenter}</Pill>
            </div>
            <dl className="mt-3 grid gap-px bg-[#ecece6] sm:grid-cols-2 lg:grid-cols-3">
              <Metric
                label="Unplanned downtime"
                value={`${rec.downtimeMinutes} minutes`}
              />
              <Metric label="Current state" value={rec.temporaryCountermeasure} />
              <Metric label="Permanent action" value={rec.permanentActionStatus} />
              <Metric label="Owner" value={rec.owner} />
            </dl>
            </button>
            {selected && issue ? <HorizonBlock issue={issue} /> : null}
            {selected && issue ? <RelatedLinks issue={issue} /> : null}
          </article>
        );
      })}
    </section>
  );
}

export function SchedulePanel({ brief }: { brief: BriefResult }) {
  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3 md:px-5">
        <SectionLabel>Schedule Impact</SectionLabel>
        <p className="mt-1 text-[12px] text-graphite">
          Coverage against the next required shipment. No customer miss is
          claimed unless the data shows it.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="bg-[#fafaf7] text-[10px] tracking-[0.12em] text-stone uppercase">
            <tr>
              <th className="px-4 py-2 font-medium md:px-5">Product family</th>
              <th className="px-3 py-2 font-medium">Next shipment</th>
              <th className="px-3 py-2 font-medium">Finished inventory</th>
              <th className="px-4 py-2 font-medium md:px-5">Status</th>
            </tr>
          </thead>
          <tbody>
            {brief.schedule.map((row) => (
              <tr key={row.record.id} className="border-t border-[#ecece6]">
                <td className="px-4 py-3 font-medium text-ink md:px-5">
                  {row.record.productFamily}
                </td>
                <td className="px-3 py-3">{row.record.nextShipment}</td>
                <td className="px-3 py-3">
                  {row.record.finishedGoodsDays.toFixed(1)} days coverage
                </td>
                <td className="px-4 py-3 md:px-5">
                  <SeverityBadge severity={row.severity} />
                  <span className="ml-2 text-[11px] text-graphite">
                    {row.statusLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function OwnerFilter({
  value,
  onChange,
}: {
  value: Owner | "all";
  onChange: (owner: Owner | "all") => void;
}) {
  return (
    <section className="border border-[#d9d9d2] bg-white px-4 py-3 md:px-5">
      <SectionLabel>View by Owner</SectionLabel>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={`${consoleBtn} ${value === "all" ? "border-ink" : ""}`}
        >
          All owners
        </button>
        {owners.map((owner) => (
          <button
            key={owner}
            type="button"
            onClick={() => onChange(owner)}
            className={`${consoleBtn} ${value === owner ? "border-ink" : ""}`}
          >
            {owner}
          </button>
        ))}
      </div>
    </section>
  );
}

export function ActionBoard({
  actions,
  statuses,
  onStatus,
}: {
  actions: BriefAction[];
  statuses: Record<string, ActionStatus>;
  onStatus: (id: string, status: ActionStatus, action: BriefAction) => void;
}) {
  const immediate = actions.filter((action) => action.horizon === "immediate");
  const structural = actions.filter((action) => action.horizon === "structural");

  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3 md:px-5">
        <SectionLabel>Action Board</SectionLabel>
        <p className="mt-1 text-[12px] text-graphite">
          Status is local to this demo session. It is not saved.
        </p>
      </div>
      <ActionGroup
        title="Immediate"
        actions={immediate}
        statuses={statuses}
        onStatus={onStatus}
      />
      <ActionGroup
        title="Structural"
        actions={structural}
        statuses={statuses}
        onStatus={onStatus}
      />
    </section>
  );
}

function ActionGroup({
  title,
  actions,
  statuses,
  onStatus,
}: {
  title: string;
  actions: BriefAction[];
  statuses: Record<string, ActionStatus>;
  onStatus: (id: string, status: ActionStatus, action: BriefAction) => void;
}) {
  return (
    <div className="border-t border-[#ecece6] first:border-t-0">
      <p className="bg-[#fafaf7] px-4 py-2 text-[10px] font-medium tracking-[0.14em] text-stone uppercase md:px-5">
        {title}
      </p>
      {actions.length === 0 ? (
        <p className="px-4 py-3 text-[13px] text-graphite md:px-5">
          No {title.toLowerCase()} actions in this view.
        </p>
      ) : (
        <ul>
          {actions.map((action) => {
            const status = statuses[action.id] ?? action.status;
            return (
              <li
                key={action.id}
                className="grid gap-3 border-t border-[#ecece6] px-4 py-3 md:grid-cols-12 md:items-center md:px-5"
              >
                <div className="md:col-span-6">
                  <p className="text-[13px] leading-5 text-ink">{action.action}</p>
                  <p className="mt-1 text-[11px] text-graphite">
                    {action.owner} · {categoryLabels[action.category]} ·{" "}
                    {actionHorizonLabels[action.horizon]}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:col-span-3">
                  <Pill>P{action.priority}</Pill>
                  <Pill>{actionTimingLabels[action.timing]}</Pill>
                </div>
                <div className="md:col-span-3">
                  <label className="sr-only" htmlFor={`action-status-${action.id}`}>
                    Status for {action.action}
                  </label>
                  <select
                    id={`action-status-${action.id}`}
                    value={status}
                    onChange={(event) =>
                      onStatus(action.id, event.target.value as ActionStatus, action)
                    }
                    className="min-h-9 w-full border border-[#c8c8c0] bg-white px-2 text-[12px] text-ink"
                  >
                    {actionStatuses.map((item) => (
                      <option key={item} value={item}>
                        {actionStatusLabels[item]}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Differentiator() {
  return (
    <section className="border border-[#d9d9d2] bg-[#fafaf7] px-4 py-4 md:px-5">
      <SectionLabel>Not another dashboard.</SectionLabel>
      <p className="mt-2 max-w-2xl text-[13px] leading-6 text-graphite">
        LoopBrief is designed around exceptions, ownership, and action. The goal
        is not to show every number. It is to surface what changed and what
        needs attention.
      </p>
    </section>
  );
}

export function MeetingStepper({
  step,
  onStep,
}: {
  step: MeetingStep;
  onStep: (step: MeetingStep) => void;
}) {
  const index = meetingSteps.indexOf(step);
  const previous = index > 0 ? meetingSteps[index - 1] : undefined;
  const next = index < meetingSteps.length - 1 ? meetingSteps[index + 1] : undefined;

  return (
    <div className="border border-[#d9d9d2] bg-white px-4 py-3 md:px-5">
      <SectionLabel>Meeting Mode</SectionLabel>
      <p className="mt-1 text-[12px] text-graphite">
        Daily operating review. One section at a time.
      </p>
      <ol className="mt-3 flex flex-wrap gap-1.5">
        {meetingSteps.map((item, stepIndex) => (
          <li key={item}>
            <button
              type="button"
              onClick={() => onStep(item)}
              className={`${consoleBtn} ${item === step ? "border-ink" : ""}`}
            >
              {stepIndex + 1} · {meetingStepLabels[item]}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!previous}
          onClick={() => previous && onStep(previous)}
          className={consoleBtn}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!next}
          onClick={() => next && onStep(next)}
          className={consoleBtn}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function IssueDetail({ issue }: { issue: BriefIssue }) {
  return (
    <section className="border border-[#d9d9d2] bg-white px-4 py-4 md:px-5">
      <SectionLabel>Selected issue</SectionLabel>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h3 className="text-[16px] font-medium text-ink">{issue.title}</h3>
        <SeverityBadge severity={issue.severity} />
        <Pill>{categoryLabels[issue.category]}</Pill>
      </div>
      <p className="mt-2 text-[13px] leading-6 text-graphite">{issue.problem}</p>
      <dl className="mt-3 grid gap-px bg-[#ecece6] sm:grid-cols-2 lg:grid-cols-3">
        {issue.metrics.map((metric) => (
          <Metric key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </dl>
      <p className="mt-3 text-[12px] leading-5 text-ink">
        <span className="font-medium">Impact. </span>
        {issue.impact}
      </p>
      <p className="mt-1 text-[12px] leading-5 text-graphite">
        <span className="font-medium text-ink">Owner. </span>
        {issue.owner}
      </p>
      <HorizonBlock issue={issue} />
      <RelatedLinks issue={issue} />
    </section>
  );
}
