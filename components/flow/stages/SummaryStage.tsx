"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { IconCopy, IconDownload, IconPrint, LoopGlyph } from "@/components/loop/icons";
import { useToast } from "@/components/loop/Toast";
import { Chip, LoopButton, SectionTitle } from "@/components/loop/ui";
import { trackFlow } from "@/lib/flow/analytics";
import { stepsCsv } from "@/lib/flow/csv";
import { diffVersions } from "@/lib/flow/diff";
import { exportFilename, serialize } from "@/lib/flow/io";
import { computeMetrics, metricsDelta, orderedSteps } from "@/lib/flow/metrics";
import { formatChange, formatDeltaValue, reportMarkdown, reportSections } from "@/lib/flow/report";
import { statusLabels } from "@/lib/flow/status";
import { downloadSvg, mapSvg, mapSvgPages } from "@/lib/flow/svg";
import { formatMinutes } from "@/lib/flow/time";
import { laneKindMeta, painCategoryMeta, severityMeta, valueClassMeta } from "@/lib/flow/visual";
import { downloadCsv, downloadText } from "@/lib/loop/download";
import { formatDate, formatDateTime } from "@/lib/loop/format";
import { statusLabels as solveStatusLabels } from "@/lib/solve/status";
import { usePrimaryAction } from "../FlowWorkspace";
import { InvestigationStatusChip, useLinkedInvestigations } from "../LinkedInvestigations";
import { useMap } from "../MapProvider";

function Section({ id, title, children, breakBefore = false }: { id: string; title: string; children: React.ReactNode; breakBefore?: boolean }) {
  return (
    <section id={`report-${id}`} aria-labelledby={`report-${id}-h`} className={`loop-print-section mt-8 first:mt-0 ${breakBefore ? "loop-print-break" : ""}`}>
      <h3 id={`report-${id}-h`} className="border-b border-ink/20 pb-1.5 text-[15px] font-medium uppercase tracking-[0.08em] text-ink">{title}</h3>
      <div className="mt-3 text-[14px] leading-6 text-ink">{children}</div>
    </section>
  );
}

function MapPages({ pages }: { pages: ReturnType<typeof mapSvgPages> }) {
  return (
    <>
      {pages.map((p, i) => (
        <div key={i} className={`loop-print-map ${i > 0 ? "loop-print-break" : ""}`}>
          {p.continued ? <p className="loop-print-continued mb-1 text-[11px] uppercase tracking-[0.12em] text-stone">Continued · steps {p.from}–{p.to} of the sequence · page {i + 1} of {p.total}</p> : null}
          <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: p.svg.replace("<svg ", '<svg style="max-width:100%;height:auto" ') }} />
        </div>
      ))}
    </>
  );
}

export function SummaryStage() {
  const { map } = useMap();
  const toast = useToast();
  const params = useSearchParams();
  const linked = useLinkedInvestigations();
  const cur = map.versions.current;
  const fut = map.versions.future;
  const lanes = useMemo(() => [...map.lanes].sort((a, b) => a.order - b.order), [map.lanes]);
  const laneName = (id: string) => map.lanes.find((l) => l.id === id)?.name ?? "";
  const m = useMemo(() => computeMetrics(cur, map.lanes), [cur, map.lanes]);
  const fm = useMemo(() => (fut ? computeMetrics(fut, map.lanes) : null), [fut, map.lanes]);
  const diff = useMemo(() => (fut ? diffVersions(cur, fut) : null), [cur, fut]);
  const curPages = useMemo(() => mapSvgPages(map, "current"), [map]);
  const futPages = useMemo(() => (fut ? mapSvgPages(map, "future") : []), [map, fut]);
  const label = (key: string) => reportSections.find((s) => s.key === key)!.title;
  const stepName = (id: string) => cur.steps.find((s) => s.id === id)?.name ?? "";
  const waits = orderedSteps(cur).filter((s) => (s.waitBeforeMin ?? 0) > 0).sort((a, b) => (b.waitBeforeMin ?? 0) - (a.waitBeforeMin ?? 0)).slice(0, 5);

  useEffect(() => {
    if (params.get("print") === "1") {
      const h = window.setTimeout(() => window.print(), 600);
      return () => window.clearTimeout(h);
    }
  }, [params]);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(reportMarkdown(map, { investigationStatus: (id) => { const i = linked.get(id); return i ? solveStatusLabels[i.status] : undefined; } }));
      toast.show("Summary copied as Markdown.", { tone: "green" });
    } catch {
      toast.show("Could not access the clipboard.", { tone: "red" });
    }
  }
  function print() {
    trackFlow("loopflow_print", { stage: "summary" });
    window.print();
  }
  usePrimaryAction({ label: "Print report", onClick: print, icon: <IconPrint size={16} /> }, []);

  return (
    <div>
      <div className="loop-no-print">
        <SectionTitle eyebrow="Summary" title="The report: what the process does, and what changes.">
          Print it, copy it as Markdown, or export the JSON, SVG, and CSV. Linked investigations show their LoopSolve status.
        </SectionTitle>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <LoopButton variant="primary" onClick={print} icon={<IconPrint size={15} />}>Print</LoopButton>
          <LoopButton onClick={copySummary} icon={<IconCopy size={15} />}>Copy summary</LoopButton>
          <LoopButton onClick={() => { downloadText(exportFilename(map), serialize(map)); trackFlow("loopflow_export", { stage: "summary", kind: 0 }); }} icon={<IconDownload size={15} />}>Export JSON</LoopButton>
          <LoopButton onClick={() => { downloadSvg(`${map.mapNumber}-current-state.svg`, mapSvg(map, "current", { title: true })); trackFlow("loopflow_export", { stage: "summary", kind: 2 }); }} icon={<IconDownload size={15} />}>SVG · current</LoopButton>
          {fut ? <LoopButton onClick={() => { downloadSvg(`${map.mapNumber}-future-state.svg`, mapSvg(map, "future", { title: true })); trackFlow("loopflow_export", { stage: "summary", kind: 2 }); }} icon={<IconDownload size={15} />}>SVG · future</LoopButton> : null}
          <LoopButton onClick={() => { downloadCsv(exportFilename(map, "steps.csv"), stepsCsv(map, "current")); trackFlow("loopflow_export", { stage: "summary", kind: 3 }); }} icon={<IconDownload size={15} />}>Export CSV</LoopButton>
        </div>
      </div>

      <div className="loop-print-header hidden">
        <span>{map.mapNumber} · {map.title || "Untitled map"}</span>
        <span>Status: {statusLabels[map.status]} · LoopFlow</span>
      </div>

      <article className="loop-report loop-print-body mt-6 rounded-[3px] border border-line bg-white p-5 md:p-8 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink pb-4">
          <div>
            <p className="font-mono text-[12px] tracking-[0.1em] text-copper">{map.mapNumber}</p>
            <h2 className="mt-1 text-[24px] font-medium tracking-[-0.02em] text-ink">{map.title || "Untitled map"}</h2>
            <p className="mt-1 text-[13px] text-graphite">
              {map.process ? `${map.process} · ` : ""}{map.owner ? `Owner ${map.owner} · ` : ""}{map.department ? `${map.department} · ` : ""}{map.site ? `${map.site} · ` : ""}Created {formatDate(map.createdAt)} · Updated {formatDate(map.updatedAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] uppercase tracking-[0.12em] text-stone">Status</p>
            <p className="text-[15px] font-medium text-ink">{statusLabels[map.status]}</p>
          </div>
        </header>

        <div className="mt-6">
          <Section id="scope" title={label("scope")}>
            <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[140px_1fr]">
              <dt className="text-graphite">Starts with</dt><dd>{map.scope.startsWith || "—"}</dd>
              <dt className="text-graphite">Ends with</dt><dd>{map.scope.endsWith || "—"}</dd>
              <dt className="text-graphite">Display unit</dt><dd>{map.unit}</dd>
            </dl>
          </Section>
          <Section id="lanes" title={label("lanes")}>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">{lanes.map((l) => <li key={l.id}>{l.name} <span className="text-graphite">({laneKindMeta[l.kind].label.toLowerCase()})</span></li>)}</ul>
          </Section>
          <Section id="current" title={label("current")} breakBefore>
            {cur.steps.length ? <MapPages pages={curPages} /> : <p className="text-stone">No steps mapped.</p>}
          </Section>
          <Section id="metrics" title={label("metrics")}>
            <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[220px_1fr]">
              <dt className="text-graphite">Lead time</dt><dd className="font-mono">{formatMinutes(m.leadTimeMin)}</dd>
              <dt className="text-graphite">Touch time</dt><dd className="font-mono">{formatMinutes(m.touchTimeMin)}</dd>
              <dt className="text-graphite">Waiting</dt><dd className="font-mono">{formatMinutes(m.waitTimeMin)}</dd>
              <dt className="text-graphite">Process cycle efficiency</dt><dd className="font-mono">{m.pce === null ? "—" : `${(m.pce * 100).toFixed(1)}%`}</dd>
              <dt className="text-graphite">Value split</dt><dd>{(["va", "nnva", "nva"] as const).map((k) => `${valueClassMeta[k].short} ${formatMinutes(m.value[k].min)}`).join(" · ")}</dd>
              <dt className="text-graphite">Handoffs · rework loops</dt><dd className="font-mono">{m.handoffCount} · {m.reworkLoops.length}</dd>
              <dt className="text-graphite">Steps with unknown time</dt><dd className="font-mono">{m.unknownTimeStepIds.length} of {m.stepCount}</dd>
            </dl>
          </Section>
          <Section id="waits" title={label("waits")}>
            {waits.length ? <ul className="flex flex-col gap-0.5">{waits.map((s) => <li key={s.id}><span className="font-mono">{formatMinutes(s.waitBeforeMin)}</span> before {s.name} <span className="text-graphite">({laneName(s.laneId)})</span></li>)}</ul> : <p className="text-stone">No waits recorded.</p>}
            {m.handoffs.length ? (
              <ul className="mt-2 flex flex-col gap-0.5 text-[13px]">
                {m.handoffs.map((h) => <li key={`${h.fromStepId}-${h.toStepId}`}>Handoff {laneName(h.fromLaneId)} → {laneName(h.toLaneId)} at &ldquo;{stepName(h.toStepId)}&rdquo; — trigger: <span className={h.trigger ? "" : "text-graphite"}>{h.trigger ?? "no trigger recorded"}</span>{h.waitAfterMin ? `, then ${formatMinutes(h.waitAfterMin)} wait` : ""}</li>)}
              </ul>
            ) : null}
          </Section>
          <Section id="pain" title={label("pain")}>
            {cur.painPoints.length ? (
              <ul className="flex flex-col gap-1.5">
                {cur.painPoints.map((p) => {
                  const inv = p.investigationId ? linked.get(p.investigationId) : undefined;
                  return (
                    <li key={p.id} className="flex flex-wrap items-center gap-2">
                      <Chip tone={p.severity === "high" ? "red" : p.severity === "medium" ? "amber" : "neutral"}>{severityMeta[p.severity].label}</Chip>
                      <Chip tone="neutral">{painCategoryMeta[p.category].label}</Chip>
                      <span>{p.text} <span className="text-graphite">— at &ldquo;{stepName(p.stepId)}&rdquo;</span></span>
                      {inv ? <Link href={`/solve/${inv.id}`} className="inline-flex items-center gap-1.5 text-[13px] focus-visible:outline-2 focus-visible:outline-copper"><LoopGlyph className="h-3 w-6" /><span className="font-mono text-copper">{inv.rcaNumber}</span><InvestigationStatusChip status={inv.status} /></Link> : p.investigationId ? <span className="text-[12.5px] text-stone">investigation not in this browser</span> : null}
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-stone">{map.noPainPoints ? "Reviewed: no pain points recorded." : "None recorded."}</p>}
          </Section>
          {fut && fm && diff ? (
            <>
              <Section id="future" title={label("future")} breakBefore>
                <MapPages pages={futPages} />
              </Section>
              <Section id="delta" title={label("delta")}>
                <table className="w-full text-left text-[13px]">
                  <thead className="text-[10.5px] uppercase tracking-[0.12em] text-stone"><tr><th className="py-1 pr-3">Metric</th><th className="py-1 pr-3">Current</th><th className="py-1 pr-3">Future</th><th className="py-1">Change</th></tr></thead>
                  <tbody>{metricsDelta(m, fm).map((d) => <tr key={d.key} className="border-t border-line"><td className="py-1 pr-3">{d.label}</td><td className="py-1 pr-3 font-mono">{formatDeltaValue(d.current, d.format)}</td><td className="py-1 pr-3 font-mono">{formatDeltaValue(d.future, d.format)}</td><td className="py-1 font-mono">{formatChange(d.change, d.format)}</td></tr>)}</tbody>
                </table>
              </Section>
              <Section id="rationale" title={label("rationale")}>
                {diff.changeCount ? (
                  <ol className="flex flex-col gap-2">
                    {diff.entries.filter((e) => e.kind !== "unchanged").map((e) => {
                      const r = fut.rationale[e.key];
                      const name = e.kind === "removed" ? e.currentStep.name : e.futureStep.name;
                      const what = e.kind === "removed" ? "Removed" : e.kind === "added" ? "Added" : `Changed (${e.changes.map((c) => c.field).join(", ")})`;
                      const inv = r?.linkedAction ? linked.get(r.linkedAction.investigationId) : undefined;
                      const action = inv?.actions.find((a) => a.id === r?.linkedAction?.actionId);
                      return (
                        <li key={e.key} className={`border-l-[3px] pl-3 ${e.kind === "removed" ? "border-risk-critical" : e.kind === "added" ? "border-risk-track" : "border-risk-amber"}`}>
                          <p><span className="font-medium">{what}:</span> {name || "Untitled"}</p>
                          <p className={`text-[13.5px] ${r?.text?.trim() ? "text-graphite" : "text-risk-amber"}`}>{r?.text?.trim() || "No rationale yet."}</p>
                          {action ? <p className="text-[12.5px] text-graphite">Action: {inv?.rcaNumber} · {action.title} ({action.status.replace(/_/g, " ")})</p> : null}
                        </li>
                      );
                    })}
                  </ol>
                ) : <p className="text-stone">No changes yet.</p>}
              </Section>
            </>
          ) : (
            <Section id="future" title={label("future")}><p className="text-stone">No future state yet.</p></Section>
          )}
          <Section id="history" title={label("history")}>
            <ul className="flex flex-col gap-1 text-[13px]">
              {map.history.map((h) => <li key={h.id} className="flex flex-wrap gap-2"><span className="font-mono text-graphite">{formatDateTime(h.at)}</span><Chip tone={h.type === "future_forked" ? "copper" : h.type === "investigation_opened" ? "amber" : "neutral"}>{h.type.replace(/_/g, " ")}</Chip>{h.note ? <span className="text-graphite">{h.note}</span> : null}</li>)}
            </ul>
          </Section>
        </div>
        <footer className="mt-8 flex items-center gap-2 border-t border-line pt-3 text-[11.5px] text-stone">
          <LoopGlyph className="h-3 w-6" /> Generated with LoopFlow by LoopSignal.
        </footer>
      </article>

      {map.status === "complete" ? (
        <div className="loop-no-print mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[3px] border border-line bg-cream px-5 py-4">
          <p className="text-[14px] text-graphite">Have a recurring or cross-functional problem?</p>
          <Link href="/loopscan#intake" className="inline-flex min-h-[44px] items-center rounded-[3px] border border-ink/25 px-4 text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream focus-visible:outline-2 focus-visible:outline-copper">Start with LoopScan</Link>
        </div>
      ) : null}
    </div>
  );
}
