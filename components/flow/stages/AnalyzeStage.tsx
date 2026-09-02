"use client";

import Link from "next/link";
import { useMemo } from "react";
import { IconAlert, IconArrowRight, IconClock, LoopGlyph } from "@/components/loop/icons";
import { Card, Checkbox, Chip, Coaching, LoopButton, SectionTitle, type Tone } from "@/components/loop/ui";
import { softFindings } from "@/lib/flow/rules";
import { flowStepHref } from "@/lib/flow/solveLink";
import { formatMinutes } from "@/lib/flow/time";
import { isTimed, stepTouchMin } from "@/lib/flow/metrics";
import { laneColor, painCategoryMeta, severityMeta, valueClassMeta } from "@/lib/flow/visual";
import { InvestigationStatusChip, useLinkedInvestigations } from "../LinkedInvestigations";
import { useMap } from "../MapProvider";
import { useVersion } from "../map/useVersion";
import { useFlowPanel } from "../panel";

const sevTone: Record<string, Tone> = { high: "red", medium: "amber", low: "neutral" };

/** One horizontal bar of lead time: waiting hatched, touch solid and colored by value class. */
export function TimeLadder({ segments, total }: { segments: { key: string; min: number; color?: string; hatched?: boolean; label: string }[]; total: number }) {
  if (total <= 0) return <p className="text-[13px] text-stone">No times yet. Add cycle times and waits on the map.</p>;
  return (
    <div>
      <div className="flex h-8 w-full overflow-hidden rounded-[3px] border border-line bg-white" role="img" aria-label={`Lead time ${formatMinutes(total)}: ${segments.map((s) => `${s.label} ${formatMinutes(s.min)}`).join(", ")}`}>
        {segments.map((s) =>
          s.min > 0 ? (
            <span key={s.key} title={`${s.label} · ${formatMinutes(s.min)}`} className={`block h-full ${s.hatched ? "loop-hatch bg-paper" : ""}`} style={{ width: `${(s.min / total) * 100}%`, background: s.hatched ? undefined : s.color, minWidth: 2 }} />
          ) : null,
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-graphite">
        {segments.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-[2px] border border-line ${s.hatched ? "loop-hatch bg-paper" : ""}`} style={{ background: s.hatched ? undefined : s.color }} aria-hidden />
            {s.label} <span className="font-mono text-ink">{formatMinutes(s.min)}</span>
            <span className="text-stone">{total ? `${Math.round((s.min / total) * 100)}%` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnalyzeStage() {
  const { map, dispatch } = useMap();
  const { kind, version, steps, metrics, laneById } = useVersion("current");
  const { open } = useFlowPanel();
  const linked = useLinkedInvestigations();
  const findings = useMemo(() => softFindings(map).filter((f) => f.stage === "analyze"), [map]);
  const byId = useMemo(() => new Map(steps.map((s) => [s.id, s])), [steps]);
  const laneName = (id: string) => laneById.get(id)?.lane.name || "No lane";
  const laneIdx = (id: string) => laneById.get(id)?.index ?? 0;
  const stepHref = (id: string) => flowStepHref(map.id, id, kind);

  const waits = steps.filter((s) => (s.waitBeforeMin ?? 0) > 0 || (s.type === "wait" && (s.cycleTimeMin ?? 0) > 0)).map((s) => ({ step: s, min: (s.waitBeforeMin ?? 0) + (s.type === "wait" ? s.cycleTimeMin ?? 0 : 0) })).sort((a, b) => b.min - a.min);
  const unknowns = steps.filter((s) => isTimed(s) && (s.cycleTimeMin === undefined || (s.valueClass === "unclassified" && s.type !== "wait")));
  const longest = steps.filter((s) => stepTouchMin(s) > 0).sort((a, b) => stepTouchMin(b) - stepTouchMin(a)).slice(0, 3);
  const pains = [...version.painPoints].sort((a, b) => severityMeta[b.severity].rank - severityMeta[a.severity].rank || a.category.localeCompare(b.category));
  const segments = [
    { key: "wait", min: metrics.waitTimeMin, hatched: true, label: "Waiting" },
    { key: "va", min: metrics.value.va.min, color: valueClassMeta.va.color, label: "Value-adding" },
    { key: "nnva", min: metrics.value.nnva.min, color: valueClassMeta.nnva.color, label: "Necessary non-value" },
    { key: "nva", min: Math.max(0, metrics.value.nva.min - metrics.waitTimeMin), color: valueClassMeta.nva.color, label: "Non-value work" },
    { key: "unc", min: metrics.value.unclassified.min, color: valueClassMeta.unclassified.color, label: "Unclassified" },
  ];

  return (
    <div>
      <SectionTitle eyebrow="Analyze" title="Where the time and the handoffs are.">
        No math on your side. Lead time is what the customer waits; touch time is what people actually do. Every row jumps to its step.
      </SectionTitle>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Big label="Lead time" value={formatMinutes(metrics.leadTimeMin)} hint="start to end" />
        <Big label="Touch time" value={formatMinutes(metrics.touchTimeMin)} hint="hands-on work" />
        <Big label="Process cycle efficiency" value={metrics.pce === null ? "—" : `${(metrics.pce * 100).toFixed(1)}%`} hint="touch ÷ lead" tone={metrics.pce !== null && metrics.pce < 0.05 ? "amber" : undefined} />
      </div>
      <Card className="mt-3 p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-graphite">Time ladder</p>
        <div className="mt-3"><TimeLadder segments={segments} total={metrics.leadTimeMin} /></div>
      </Card>
      {findings.filter((f) => !f.stepId).length ? <div className="mt-3"><Coaching items={findings.filter((f) => !f.stepId).map((f) => f.message)} /></div> : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Section title="Waits" hint="Longest first. Waiting is where lead time hides." count={waits.length}>
          {waits.length ? (
            <Table head={["Wait", "Before step", "Lane", "Trigger"]}>
              {waits.map(({ step, min }) => (
                <Row key={step.id} href={stepHref(step.id)} cells={[<span key="w" className="font-mono text-ink">{formatMinutes(min)}</span>, <StepCell key="s" name={step.name} order={step.order} laneIndex={laneIdx(step.laneId)} />, laneName(step.laneId), <span key="t" className={step.trigger ? "" : "text-stone"}>{step.trigger || "no trigger recorded"}</span>]} />
              ))}
            </Table>
          ) : <Empty>No waits recorded. {steps.length ? "That is unusual — check the queue before each step." : ""}</Empty>}
        </Section>

        <Section title="Handoffs" hint="Each lane change on the main path. Handoffs are where things break." count={metrics.handoffCount}>
          {metrics.handoffs.length ? (
            <Table head={["From → to", "At step", "Trigger", "Wait after"]}>
              {metrics.handoffs.map((h) => {
                const to = byId.get(h.toStepId);
                return (
                  <Row key={`${h.fromStepId}-${h.toStepId}`} href={stepHref(h.toStepId)} cells={[<span key="l" className="inline-flex items-center gap-1"><LaneDot index={laneIdx(h.fromLaneId)} />{laneName(h.fromLaneId)} <IconArrowRight size={12} /> <LaneDot index={laneIdx(h.toLaneId)} />{laneName(h.toLaneId)}</span>, <StepCell key="s" name={to?.name ?? ""} order={to?.order ?? 0} laneIndex={laneIdx(h.toLaneId)} />, <span key="t" className={h.trigger ? "" : "text-risk-amber"}>{h.trigger || "no trigger recorded"}</span>, <span key="w" className="font-mono">{h.waitAfterMin ? formatMinutes(h.waitAfterMin) : "—"}</span>]} />
                );
              })}
            </Table>
          ) : <Empty>No handoffs. Everything happens in one lane.</Empty>}
        </Section>

        <Section title="Unknowns" hint="Steps missing a time or a value class. One tap to fix." count={unknowns.length}>
          {unknowns.length ? (
            <Table head={["Step", "Lane", "Missing", ""]}>
              {unknowns.map((s) => (
                <Row key={s.id} href={stepHref(s.id)} cells={[<StepCell key="s" name={s.name} order={s.order} laneIndex={laneIdx(s.laneId)} />, laneName(s.laneId), [s.cycleTimeMin === undefined ? "time" : null, s.valueClass === "unclassified" && s.type !== "wait" ? "value class" : null].filter(Boolean).join(", "), <span key="f" className="text-copper">Fix →</span>]} />
              ))}
            </Table>
          ) : <Empty>Every step has a time and a value class.</Empty>}
          {longest.length >= 2 && longest.every((s) => s.timeSource === "estimated") ? <p className="mt-2 flex items-start gap-2 text-[13px] text-risk-amber"><IconAlert size={13} className="mt-1 shrink-0" /> The biggest steps ({longest.map((s) => s.name || "untitled").join(", ")}) are estimates. Observe them if you can.</p> : null}
        </Section>

        <Section title="Lane load" hint="Touch time and steps per lane." count={metrics.lanes.length}>
          <Table head={["Lane", "Touch", "Waiting", "Steps"]}>
            {metrics.lanes.map((l) => (
              <Row key={l.laneId} cells={[<span key="l" className="inline-flex items-center gap-1.5"><LaneDot index={laneIdx(l.laneId)} />{laneName(l.laneId)}</span>, <span key="t" className="font-mono">{formatMinutes(l.touchMin)}</span>, <span key="w" className="font-mono">{formatMinutes(l.waitMin)}</span>, String(l.stepCount)]} />
            ))}
          </Table>
        </Section>
      </div>

      <Section className="mt-8" title="Pain points" hint="Grouped by severity. Each one can open a LoopSolve investigation." count={pains.length}>
        {pains.length ? (
          <ul className="flex flex-col gap-2">
            {pains.map((p) => {
              const s = byId.get(p.stepId);
              const inv = p.investigationId ? linked.get(p.investigationId) : undefined;
              return (
                <Card as="li" key={p.id} rule={p.severity === "high" ? "red" : p.severity === "medium" ? "amber" : undefined} className="flex flex-wrap items-center gap-3 p-3">
                  <button type="button" onClick={() => open({ kind: "pain", painId: p.id, version: "current" })} className="min-h-[40px] min-w-0 flex-1 rounded-[2px] text-left focus-visible:outline-2 focus-visible:outline-copper">
                    <span className="block text-[14px] text-ink">{p.text || <span className="text-stone">Untitled pain point</span>}</span>
                    <span className="block text-[12.5px] text-stone">Step {s ? s.order + 1 : "?"}: {s?.name || "—"} · {laneName(s?.laneId ?? "")}</span>
                  </button>
                  <Chip tone={sevTone[p.severity]}>{severityMeta[p.severity].label}</Chip>
                  <Chip tone="neutral">{painCategoryMeta[p.category].label}</Chip>
                  {inv ? (
                    <Link href={`/solve/${inv.id}`} className="inline-flex items-center gap-2 text-[12.5px] focus-visible:outline-2 focus-visible:outline-copper">
                      <LoopGlyph className="h-3 w-6" /> <span className="font-mono text-copper">{inv.rcaNumber}</span> <InvestigationStatusChip status={inv.status} />
                    </Link>
                  ) : p.investigationId ? (
                    <span className="text-[12.5px] text-stone">investigation not in this browser</span>
                  ) : (
                    <LoopButton size="sm" onClick={() => open({ kind: "pain", painId: p.id, version: "current" })} icon={<LoopGlyph className="h-3 w-6" tone="current" />}>Start investigation</LoopButton>
                  )}
                  {s ? <Link href={stepHref(s.id)} aria-label={`Go to step ${s.order + 1}`} className="inline-flex min-h-[36px] items-center gap-1 rounded-[3px] px-2 text-[12.5px] text-graphite hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-copper">Map <IconArrowRight size={12} /></Link> : null}
                </Card>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-[3px] border border-dashed border-ink/20 bg-cream/60 p-4">
            <p className="text-[14px] text-graphite">No pain points yet. Mark them on the map from any step, or confirm there are none.</p>
            <div className="mt-2"><Checkbox label="We looked; there are no pain points in this process." checked={map.noPainPoints} onChange={(e) => dispatch({ type: "set_meta", patch: { noPainPoints: e.target.checked } })} /></div>
          </div>
        )}
        {findings.filter((f) => f.stepId).length ? <div className="mt-3"><Coaching items={findings.filter((f) => f.stepId).map((f) => f.message)} /></div> : null}
      </Section>

      <p className="loop-secondary mt-8 flex items-center gap-2 text-[12px] text-stone"><IconClock size={12} /> Waiting includes queue time before each step and any wait steps. Rework loops are not added to lead time; they are listed on the map.</p>
    </div>
  );
}

function Big({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "amber" }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-graphite">{label}</p>
      <p className={`mt-1 font-mono text-[28px] font-medium tracking-[-0.02em] ${tone === "amber" ? "text-risk-amber" : "text-ink"}`}>{value}</p>
      <p className="text-[12px] text-stone">{hint}</p>
    </Card>
  );
}

export function Section({ title, hint, count, children, className = "" }: { title: string; hint: string; count?: number; children: React.ReactNode; className?: string }) {
  return (
    <section className={className} aria-label={title}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[16px] font-medium text-ink">{title}{count !== undefined ? <span className="ml-2 font-mono text-[12px] text-stone">{count}</span> : null}</h3>
      </div>
      <p className="mt-0.5 text-[12.5px] text-stone">{hint}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[3px] border border-line bg-cream">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-line bg-paper text-[10.5px] font-medium uppercase tracking-[0.14em] text-stone">
          <tr>{head.map((h, i) => <th key={i} className="px-3 py-2">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({ cells, href }: { cells: React.ReactNode[]; href?: string }) {
  return (
    <tr className="border-b border-line last:border-0 hover:bg-paper/70">
      {cells.map((c, i) => (
        <td key={i} className="px-3 py-2 align-top text-graphite">
          {i === 0 && href ? <Link href={href} className="block rounded-[2px] focus-visible:outline-2 focus-visible:outline-copper">{c}</Link> : c}
        </td>
      ))}
    </tr>
  );
}

export function StepCell({ name, order, laneIndex }: { name: string; order: number; laneIndex: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink">
      <LaneDot index={laneIndex} />
      <span className="font-mono text-[11px] text-stone">{order + 1}</span>
      {name || <span className="text-stone">Untitled</span>}
    </span>
  );
}

export function LaneDot({ index }: { index: number }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: laneColor(index) }} aria-hidden />;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[3px] border border-dashed border-ink/20 bg-cream/60 p-3 text-[13px] text-graphite">{children}</p>;
}
