import {
  ComplianceBadge,
  Pill,
  QualificationBadge,
} from "@/components/source/SourceBadges";
import {
  formatMoney,
  formatUnits,
  interpretSupplier,
  recommendCopy,
} from "@/lib/source";
import { qualificationLabels } from "@/lib/source/types";
import type {
  ComparisonResult,
  DualSplit,
  RankedSupplier,
} from "@/lib/source/types";

const consoleBtn =
  "inline-flex min-h-9 items-center justify-center border border-[#c8c8c0] bg-white px-3 py-1.5 text-[12px] font-medium text-ink hover:border-ink";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
      {children}
    </p>
  );
}

export function Recommendation({
  result,
  selected,
  onSelectRecommended,
}: {
  result: ComparisonResult;
  selected: RankedSupplier;
  onSelectRecommended: () => void;
}) {
  const recommended = result.recommended;
  const copy = recommendCopy(result, recommended);
  const dual = result.dual;
  const showing = recommended;

  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3 md:px-5">
        <SectionLabel>Sourcing Recommendation</SectionLabel>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-[11px] font-medium tracking-[0.08em] text-copper uppercase">
            Recommended
          </p>
          <h2 className="text-[20px] font-medium tracking-tight text-ink">
            {copy.headline}
          </h2>
        </div>
        <p className="mt-2 max-w-3xl text-[13px] leading-6 text-graphite">
          {copy.explanation}
        </p>
      </div>
      {dual && result.settings.sourceMode === "dual" ? (
        <div className="grid gap-px border-t border-[#d9d9d2] bg-[#ecece6] sm:grid-cols-4">
          <Metric
            label="Split"
            value={`${Math.round(dual.primaryShare * 100)} / ${Math.round(dual.secondaryShare * 100)}`}
          />
          <Metric label="Blended Quoted Unit" value={formatMoney(dual.blendedQuotedUnit)} />
          <Metric
            label="Blended Effective Unit"
            value={formatMoney(dual.blendedEffectiveUnit)}
          />
          <Metric
            label="First-Year Blend"
            value={formatMoney(dual.blendedFirstYearCost, 0)}
          />
        </div>
      ) : (
        <div className="grid gap-px border-t border-[#d9d9d2] bg-[#ecece6] sm:grid-cols-4">
          <Metric label="Quoted Unit" value={formatMoney(showing.cost.unitPrice)} />
          <Metric
            label="Effective First-Year Unit"
            value={formatMoney(showing.cost.effectiveUnitCost)}
          />
          <Metric label="Lead Time" value={`${showing.quote.leadWeeks} weeks`} />
          <Metric
            label="MOQ"
            value={formatUnits(showing.quote.moq)}
          />
        </div>
      )}
      {selected.quote.id !== recommended.quote.id ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#d9d9d2] px-4 py-2 md:px-5">
          <p className="text-[12px] text-graphite">
            Viewing {selected.quote.name} (rank #{selected.rank}).
          </p>
          <button type="button" onClick={onSelectRecommended} className={consoleBtn}>
            Show recommended
          </button>
        </div>
      ) : (
        <div className="px-4 py-2 md:px-5">
          <p className="text-[12px] text-stone">
            Status: {qualificationLabels[showing.quote.qualification]}
          </p>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[10px] tracking-[0.04em] text-stone uppercase">{label}</p>
      <p className="mt-1 text-[16px] font-medium tracking-tight text-ink">{value}</p>
    </div>
  );
}

export function SupplierCards({
  result,
  selectedId,
  onSelect,
}: {
  result: ComparisonResult;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {result.ranked.map((supplier) => {
        const selected = supplier.quote.id === selectedId;
        return (
          <button
            key={supplier.quote.id}
            type="button"
            onClick={() => onSelect(supplier.quote.id)}
            className={`border px-4 py-4 text-left transition-colors ${
              selected
                ? "border-ink bg-white"
                : "border-[#d9d9d2] bg-white hover:border-ink"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] text-stone">Rank #{supplier.rank}</p>
                <h3 className="mt-0.5 text-[15px] font-medium tracking-tight text-ink">
                  {supplier.quote.name}
                </h3>
              </div>
              <QualificationBadge status={supplier.quote.qualification} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
              <Row label="Quoted unit" value={formatMoney(supplier.cost.unitPrice)} />
              <Row
                label="Effective"
                value={formatMoney(supplier.cost.effectiveUnitCost)}
                warn={!supplier.cost.freightComplete}
              />
              <Row label="Tooling" value={formatMoney(supplier.quote.tooling, 0)} />
              <Row label="Lead time" value={`${supplier.quote.leadWeeks} wk`} />
              <Row label="MOQ" value={formatUnits(supplier.quote.moq)} />
              <Row label="Capacity" value={formatUnits(supplier.quote.annualCapacity)} />
              <Row label="Terms" value={supplier.quote.paymentTerms} />
              <Row
                label="Freight"
                value={supplier.cost.freightComplete ? supplier.cost.freightLabel : "Not provided"}
                warn={!supplier.cost.freightComplete}
              />
            </dl>
            <div className="mt-3 flex flex-wrap gap-1">
              {supplier.highlights
                .filter((item) => item.label !== "Qualified" && item.label !== "Conditional" && item.label !== "New Supplier")
                .map((item) => (
                  <Pill key={item.label} tone={item.tone}>
                    {item.label}
                  </Pill>
                ))}
            </div>
            <p className="mt-3 text-[12px] leading-5 text-graphite">
              <span className="font-medium text-ink">Strength. </span>
              {supplier.quote.strength}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-graphite">
              <span className="font-medium text-ink">Concern. </span>
              {supplier.keyConcern}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function Row({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-stone">{label}</dt>
      <dd className={warn ? "text-risk-amber" : "text-ink"}>{value}</dd>
    </div>
  );
}

export function ComparisonTable({
  result,
  selectedId,
  onSelect,
}: {
  result: ComparisonResult;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const hi = result.columnHighlights;
  return (
    <section className="hidden border border-[#d9d9d2] bg-white lg:block">
      <div className="border-b border-[#d9d9d2] px-4 py-3 md:px-5">
        <h2 className="text-[15px] font-medium tracking-tight text-ink">
          Comparison
        </h2>
        <p className="mt-1 text-[12px] text-stone">
          Highlighted cells mark the best value in that column. They are not equally important.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-[12px]">
          <thead className="border-b border-[#d9d9d2] bg-[#fafaf7] text-[10px] tracking-[0.08em] text-stone uppercase">
            <tr>
              {[
                "Supplier",
                "Rank",
                "Unit Price",
                "Effective Cost",
                "Tooling",
                "MOQ",
                "Lead Time",
                "Capacity",
                "Terms",
                "Qualification",
                "Risk",
              ].map((header) => (
                <th key={header} className="px-3 py-2 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.ranked.map((supplier) => {
              const selected = supplier.quote.id === selectedId;
              const risk = supplier.flags.find((flag) => flag.severity === "red")
                ?? supplier.flags[0];
              return (
                <tr
                  key={supplier.quote.id}
                  onClick={() => onSelect(supplier.quote.id)}
                  className={`cursor-pointer border-b border-[#ecece6] last:border-b-0 ${
                    selected ? "bg-[#f3f3ee]" : "hover:bg-[#fafaf7]"
                  }`}
                >
                  <td className="px-3 py-2.5 font-medium text-ink">
                    {supplier.quote.name}
                  </td>
                  <td className="px-3 py-2.5">#{supplier.rank}</td>
                  <td className="px-3 py-2.5">{formatMoney(supplier.cost.unitPrice)}</td>
                  <Cell highlight={supplier.quote.id === hi.effectiveCostId}>
                    {formatMoney(supplier.cost.effectiveUnitCost)}
                    {!supplier.cost.freightComplete ? "*" : ""}
                  </Cell>
                  <Cell highlight={supplier.quote.id === hi.toolingId}>
                    {formatMoney(supplier.quote.tooling, 0)}
                  </Cell>
                  <td className="px-3 py-2.5">{formatUnits(supplier.quote.moq)}</td>
                  <Cell highlight={supplier.quote.id === hi.leadTimeId}>
                    {supplier.quote.leadWeeks} wk
                  </Cell>
                  <td className="px-3 py-2.5">
                    {formatUnits(supplier.quote.annualCapacity)}
                  </td>
                  <Cell highlight={supplier.quote.id === hi.paymentId}>
                    {supplier.quote.paymentTerms}
                  </Cell>
                  <td className="px-3 py-2.5">
                    <QualificationBadge status={supplier.quote.qualification} />
                  </td>
                  <td className="px-3 py-2.5 text-graphite">
                    {risk ? risk.label : "None flagged"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {result.ranked.some((item) => !item.cost.freightComplete) ? (
        <p className="border-t border-[#d9d9d2] px-4 py-2 text-[11px] text-stone">
          * Effective cost excludes freight when freight was not provided.
        </p>
      ) : null}
    </section>
  );
}

function Cell({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight: boolean;
}) {
  return (
    <td className={`px-3 py-2.5 ${highlight ? "bg-risk-confirm-bg font-medium text-ink" : ""}`}>
      {children}
    </td>
  );
}

export function RequirementPanel({
  result,
  selected,
}: {
  result: ComparisonResult;
  selected: RankedSupplier;
}) {
  const rfq = result.rfq;
  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3">
        <SectionLabel>RFQ Requirement</SectionLabel>
        <h2 className="mt-1 text-[15px] font-medium tracking-tight text-ink">
          {rfq.title}
        </h2>
      </div>
      <dl className="space-y-2 px-4 py-3 text-[12px]">
        <div className="flex justify-between gap-3">
          <dt className="text-stone">Required lead time</dt>
          <dd className="text-ink">{rfq.requiredLeadWeeks} weeks</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone">Annual volume</dt>
          <dd className="text-ink">{formatUnits(result.settings.demand)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone">Initial release</dt>
          <dd className="text-ink">{formatUnits(rfq.initialRelease)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone">Minimum required capacity</dt>
          <dd className="text-ink">{formatUnits(result.settings.demand)}/year</dd>
        </div>
      </dl>
      <div className="border-t border-[#d9d9d2] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-medium text-ink">{selected.quote.name}</p>
          <ComplianceBadge meets={selected.meetsAllRequirements} />
        </div>
        <ul className="mt-2 space-y-2">
          {selected.requirements.map((item) => (
            <li key={item.code} className="text-[12px] leading-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-graphite">{item.label}</span>
                {item.meets ? (
                  <Pill tone="green">Meets Requirement</Pill>
                ) : (
                  <Pill tone="red">Exception</Pill>
                )}
              </div>
              {!item.meets && item.detail ? (
                <p className="mt-1 text-risk-amber">{item.detail}</p>
              ) : (
                <p className="mt-1 text-stone">
                  {item.quoted}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SupplierDetail({
  selected,
  result,
}: {
  selected: RankedSupplier;
  result: ComparisonResult;
}) {
  const quote = selected.quote;
  const narrative = interpretSupplier(selected, result);
  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3">
        <SectionLabel>Selected supplier</SectionLabel>
        <h2 className="mt-1 text-[16px] font-medium tracking-tight text-ink">
          {quote.name}
        </h2>
        <p className="mt-1 text-[12px] leading-5 text-graphite">
          {selected.rankReason}
        </p>
      </div>

      <div className="border-b border-[#d9d9d2] px-4 py-3">
        <SectionLabel>Why this supplier ranks here</SectionLabel>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
          <ScoreMeter label="Cost" value={selected.scores.cost} />
          <ScoreMeter label="Delivery" value={selected.scores.delivery} />
          <ScoreMeter label="Risk" value={selected.scores.risk} />
          <ScoreMeter label="Flexibility" value={selected.scores.flexibility} />
        </dl>
        <p className="mt-2 text-[11px] text-stone">
          Overall {selected.scores.overall} / 100 using {result.settings.priority.replace("_", " ")} weights.
        </p>
      </div>

      <div className="grid gap-px border-b border-[#d9d9d2] bg-[#ecece6] md:grid-cols-2">
        <div className="bg-white px-4 py-3">
          <SectionLabel>Commercial details</SectionLabel>
          <dl className="mt-2 space-y-1.5 text-[12px]">
            <Row label="Unit price" value={formatMoney(selected.cost.unitPrice)} />
            <div>
              <dt className="text-stone">Volume breaks</dt>
              <dd className="mt-1 space-y-0.5 text-ink">
                {quote.priceBreaks.map((item) => (
                  <p key={item.minQty}>
                    {formatUnits(item.minQty)}+: {formatMoney(item.unitPrice)}
                  </p>
                ))}
              </dd>
            </div>
            <Row label="Tooling" value={formatMoney(quote.tooling, 0)} />
            <Row label="MOQ" value={formatUnits(quote.moq)} />
            <Row label="Payment" value={quote.paymentTerms} />
            <Row
              label="Freight"
              value={selected.cost.freightComplete ? selected.cost.freightLabel : "Not provided"}
              warn={!selected.cost.freightComplete}
            />
            <Row label="Origin" value={quote.origin} />
            <Row label="Quote valid" value={quote.quoteValidThrough} />
          </dl>
        </div>
        <div className="bg-white px-4 py-3">
          <SectionLabel>Operational details</SectionLabel>
          <dl className="mt-2 space-y-1.5 text-[12px]">
            <Row label="Lead time" value={`${quote.leadWeeks} weeks`} />
            <Row label="Capacity" value={`${formatUnits(quote.annualCapacity)} / year`} />
            <Row label="Sample timing" value={`${quote.sampleLeadWeeks} weeks`} />
            <Row
              label="Qualification"
              value={qualificationLabels[quote.qualification]}
            />
            <p className="pt-1 text-[12px] leading-5 text-graphite">{quote.notes}</p>
          </dl>
        </div>
      </div>

      <div className="grid gap-px bg-[#ecece6] md:grid-cols-2">
        <div className="bg-white px-4 py-3">
          <SectionLabel>Strengths</SectionLabel>
          <ul className="mt-2 space-y-1.5">
            {narrative.strengths.map((item) => (
              <li key={item} className="text-[12px] leading-5 text-graphite">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white px-4 py-3">
          <SectionLabel>Concerns</SectionLabel>
          <ul className="mt-2 space-y-1.5">
            {narrative.concerns.map((item) => (
              <li key={item} className="text-[12px] leading-5 text-graphite">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[#d9d9d2] px-4 py-3">
        <SectionLabel>Recommended actions</SectionLabel>
        <ul className="mt-2 space-y-1.5">
          {narrative.recommendedActions.map((item) => (
            <li key={item} className="text-[12px] leading-5 text-ink">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ScoreMeter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px]">
        <span className="text-stone">{label}</span>
        <span className="font-medium text-ink">{value}</span>
      </div>
      <div className="mt-1 h-1.5 bg-[#ecece6]">
        <div className="h-1.5 bg-ink" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function CostBreakdown({ selected }: { selected: RankedSupplier }) {
  const cost = selected.cost;
  const pieceShare = cost.firstYearCost > 0 ? (cost.annualPieceCost / cost.firstYearCost) * 100 : 0;
  const toolingShare = cost.firstYearCost > 0 ? (cost.tooling / cost.firstYearCost) * 100 : 0;
  const freightShare =
    cost.freightAmount && cost.firstYearCost > 0
      ? (cost.freightAmount / cost.firstYearCost) * 100
      : 0;

  return (
    <section className="border border-[#d9d9d2] bg-white px-4 py-3">
      <SectionLabel>First-year cost</SectionLabel>
      <div className="mt-3 flex h-3 w-full overflow-hidden bg-[#ecece6]">
        <span className="bg-ink" style={{ width: `${pieceShare}%` }} />
        <span className="bg-copper" style={{ width: `${toolingShare}%` }} />
        {freightShare > 0 ? (
          <span className="bg-risk-confirm" style={{ width: `${freightShare}%` }} />
        ) : null}
      </div>
      <dl className="mt-3 space-y-1.5 text-[12px]">
        <Row label="Piece cost" value={formatMoney(cost.annualPieceCost, 0)} />
        <Row label="Tooling" value={formatMoney(cost.tooling, 0)} />
        <Row
          label="Freight"
          value={cost.freightComplete ? cost.freightLabel : "Not provided"}
          warn={!cost.freightComplete}
        />
        <div className="flex justify-between gap-2 border-t border-[#ecece6] pt-2">
          <dt className="font-medium text-ink">Total</dt>
          <dd className="font-medium text-ink">{formatMoney(cost.firstYearCost, 0)}</dd>
        </div>
        <Row label="Effective unit cost" value={formatMoney(cost.effectiveUnitCost)} />
        <Row label="Quoted unit price" value={formatMoney(cost.unitPrice)} />
      </dl>
      {!cost.freightComplete ? (
        <p className="mt-3 border border-risk-amber bg-risk-amber-bg px-3 py-2 text-[12px] leading-5 text-ink">
          Freight not included — landed cost incomplete.
        </p>
      ) : null}
    </section>
  );
}

export function TradeoffPanel({
  selected,
  result,
}: {
  selected: RankedSupplier;
  result: ComparisonResult;
}) {
  const narrative = interpretSupplier(selected, result);
  return (
    <section className="border border-[#d9d9d2] bg-white px-4 py-4">
      <SectionLabel>What are you trading?</SectionLabel>
      <h2 className="mt-1 text-[16px] font-medium tracking-tight text-ink">
        {selected.quote.name}
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[12px] font-medium text-ink">You gain</p>
          <ul className="mt-2 space-y-1.5">
            {narrative.tradeoff.gains.map((item) => (
              <li key={item} className="text-[13px] leading-5 text-graphite">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[12px] font-medium text-ink">You give up</p>
          <ul className="mt-2 space-y-1.5">
            {narrative.tradeoff.giveUps.map((item) => (
              <li key={item} className="text-[13px] leading-5 text-graphite">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function ActionPanels({
  selected,
  result,
}: {
  selected: RankedSupplier;
  result: ComparisonResult;
}) {
  const narrative = interpretSupplier(selected, result);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <section className="border border-[#d9d9d2] bg-white px-4 py-4">
        <SectionLabel>Immediate sourcing actions</SectionLabel>
        <ul className="mt-3 space-y-3">
          {narrative.immediateActions.map((item) => (
            <li key={item.id}>
              <p className="text-[13px] font-medium text-ink">{item.label}</p>
              <p className="mt-0.5 text-[12px] leading-5 text-graphite">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="border border-[#d9d9d2] bg-white px-4 py-4">
        <SectionLabel>Longer-term actions</SectionLabel>
        <ul className="mt-3 space-y-3">
          {narrative.longerTermActions.map((item) => (
            <li key={item.id}>
              <p className="text-[13px] font-medium text-ink">{item.label}</p>
              <p className="mt-0.5 text-[12px] leading-5 text-graphite">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function DualSourcePanel({
  result,
  onSplit,
  onSecondary,
}: {
  result: ComparisonResult;
  onSplit: (split: DualSplit) => void;
  onSecondary: (id: string) => void;
}) {
  const dual = result.dual;
  if (!dual) return null;
  const primary = result.ranked.find((item) => item.quote.id === dual.primaryId);
  const secondary = result.ranked.find((item) => item.quote.id === dual.secondaryId);
  if (!primary || !secondary) return null;

  return (
    <section className="border border-[#d9d9d2] bg-white px-4 py-4">
      <SectionLabel>Dual-source scenario</SectionLabel>
      <h2 className="mt-1 text-[16px] font-medium tracking-tight text-ink">
        {Math.round(dual.primaryShare * 100)}% {primary.quote.name} /{" "}
        {Math.round(dual.secondaryShare * 100)}% {secondary.quote.name}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["80/20", "70/30", "50/50"] as DualSplit[]).map((split) => (
          <button
            key={split}
            type="button"
            onClick={() => onSplit(split)}
            className={`${consoleBtn} ${result.settings.dualSplit === split ? "border-ink" : ""}`}
          >
            {split}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-[12px] text-stone">
        Backup supplier
        <select
          value={dual.secondaryId}
          onChange={(event) => onSecondary(event.target.value)}
          className="mt-1 block w-full border border-[#c8c8c0] bg-white px-2 py-2 text-[13px] text-ink"
        >
          {result.ranked
            .filter((item) => item.quote.id !== dual.primaryId)
            .map((item) => (
              <option key={item.quote.id} value={item.quote.id}>
                {item.quote.name}
              </option>
            ))}
        </select>
      </label>
      <dl className="mt-3 space-y-1.5 text-[13px]">
        <Row label="Blended estimated unit cost" value={formatMoney(dual.blendedQuotedUnit)} />
        <Row label="Blended effective unit" value={formatMoney(dual.blendedEffectiveUnit)} />
      </dl>
      <p className="mt-3 text-[12px] font-medium text-ink">Benefits</p>
      <ul className="mt-1 space-y-1">
        {dual.benefits.map((item) => (
          <li key={item} className="text-[12px] leading-5 text-graphite">
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] font-medium text-ink">Tradeoff</p>
      <p className="mt-1 text-[12px] leading-5 text-graphite">{dual.tradeoff}</p>
    </section>
  );
}

export function FlagList({ selected }: { selected: RankedSupplier }) {
  if (selected.flags.length === 0) {
    return (
      <section className="border border-[#d9d9d2] bg-white px-4 py-3">
        <SectionLabel>Risk flags</SectionLabel>
        <p className="mt-2 text-[12px] text-graphite">
          No sourcing flags on the quoted terms for this scenario.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-[#d9d9d2] bg-white px-4 py-3">
      <SectionLabel>Risk flags</SectionLabel>
      <ul className="mt-2 space-y-2">
        {selected.flags.map((flag) => (
          <li key={flag.code} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium text-ink">{flag.label}</p>
              <p className="text-[11px] leading-5 text-graphite">{flag.detail}</p>
            </div>
            <Pill tone={flag.severity}>{flag.category}</Pill>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NormalizationNote({ result }: { result: ComparisonResult }) {
  return (
    <section className="border border-[#d9d9d2] bg-[#fafaf7] px-4 py-4 md:px-5">
      <SectionLabel>Compare like with like.</SectionLabel>
      <p className="mt-2 max-w-3xl text-[13px] leading-6 text-graphite">
        LoopSource separates quoted price from actual commercial structure so
        teams can see where assumptions differ before making a sourcing
        decision.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {result.ranked.map((supplier) => (
          <li key={supplier.quote.id} className="border border-[#d9d9d2] bg-white px-3 py-3">
            <p className="text-[12px] font-medium text-ink">{supplier.quote.name}</p>
            <p className="mt-1 text-[12px] leading-5 text-graphite">
              {supplier.quote.freight.kind === "included"
                ? "Freight included"
                : "Freight excluded"}
            </p>
            <p className="text-[12px] leading-5 text-graphite">
              {supplier.quote.tooling === 0 ? "No tooling" : "Tooling required"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
