"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { IconAlert, IconArrowRight, IconBranch, IconCheck, IconEdit, IconFork, IconTrash, LoopGlyph } from "@/components/loop/icons";
import { useToast } from "@/components/loop/Toast";
import { Card, Chip, Coaching, EmptyState, LoopButton, SectionTitle, Segmented } from "@/components/loop/ui";
import { useMediaQuery } from "@/components/loop/useMediaQuery";
import { trackFlow } from "@/lib/flow/analytics";
import { diffVersions, type DiffEntry } from "@/lib/flow/diff";
import { computeMetrics, metricsDelta } from "@/lib/flow/metrics";
import { formatChange, formatDeltaValue } from "@/lib/flow/report";
import { softFindings } from "@/lib/flow/rules";
import type { Step } from "@/lib/flow/schema";
import { formatMinutes } from "@/lib/flow/time";
import { laneColor, valueClassMeta } from "@/lib/flow/visual";
import { usePrimaryAction } from "../FlowWorkspace";
import { useLinkedInvestigations } from "../LinkedInvestigations";
import { useMap } from "../MapProvider";
import { useFlowPanel } from "../panel";

export function FutureStage() {
  const { map, dispatch, restore } = useMap();
  const { open } = useFlowPanel();
  const toast = useToast();
  const router = useRouter();
  const linked = useLinkedInvestigations();
  const desktop = useMediaQuery("(min-width: 1024px)", true);
  const [tab, setTab] = useState<"current" | "future">("future");
  const cur = map.versions.current;
  const fut = map.versions.future;
  const diff = useMemo(() => (fut ? diffVersions(cur, fut) : null), [cur, fut]);
  const delta = useMemo(() => (fut ? metricsDelta(computeMetrics(cur, map.lanes), computeMetrics(fut, map.lanes)) : []), [cur, fut, map.lanes]);
  const findings = useMemo(() => softFindings(map).filter((f) => f.stage === "future" && !f.stepId), [map]);
  const laneIdx = useMemo(() => new Map([...map.lanes].sort((a, b) => a.order - b.order).map((l, i) => [l.id, i])), [map.lanes]);
  const laneName = (id: string) => map.lanes.find((l) => l.id === id)?.name || "No lane";
  const canFork = cur.steps.length >= 3;

  function fork() {
    dispatch({ type: "fork_future" });
    trackFlow("loopflow_future_forked", { stage: "future", steps: cur.steps.length });
    toast.show("Future state forked from current. Edit it on the Map stage.");
  }
  function discard() {
    const snapshot = map;
    dispatch({ type: "discard_future" });
    toast.show("Future state discarded.", { undo: () => restore(snapshot) });
  }
  function editFuture() {
    router.push(`/flow/${map.id}/map?version=future`);
  }

  usePrimaryAction(fut ? { label: "Edit future map", onClick: editFuture, icon: <IconEdit size={16} /> } : canFork ? { label: "Fork current state", onClick: fork, icon: <IconFork size={16} /> } : null, [Boolean(fut), canFork]);

  if (!fut || !diff) {
    return (
      <div>
        <SectionTitle eyebrow="Future" title="Don't redesign what you haven't measured.">
          The future state is a fork of the current one, so every change is traceable step by step. Fork when the current map has real times on it.
        </SectionTitle>
        <EmptyState
          className="mt-6"
          icon={<LoopGlyph className="h-8 w-16" animated />}
          title={canFork ? "Fork the current state to start drawing the future. You will remove waits, merge steps, and explain each change." : "Map at least three steps of the current state before forking a future state."}
          action={<LoopButton variant="primary" onClick={fork} disabled={!canFork} icon={<IconFork size={15} />}>Fork current state</LoopButton>}
        />
      </div>
    );
  }

  const rows = diff.entries.filter((e) => e.kind !== "unchanged");
  const missing = new Set(diff.missingRationale);

  return (
    <div>
      <SectionTitle
        eyebrow="Future"
        title="Explain every change against the current state."
        actions={
          <>
            <LoopButton variant="primary" onClick={editFuture} icon={<IconEdit size={15} />}>Edit future map</LoopButton>
            <LoopButton variant="ghost" onClick={discard} icon={<IconTrash size={14} />}>Discard</LoopButton>
          </>
        }
      >
        Removed steps are struck through, added steps are green, changed time or lane is amber. Each change needs a rationale, ideally tied to a LoopSolve action.
      </SectionTitle>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Changes" value={String(diff.changeCount)} hint={`${diff.removed.length} removed · ${diff.added.length} added · ${diff.changed.length} changed`} />
        <Stat label="Need rationale" value={String(diff.missingRationale.length)} hint={diff.missingRationale.length ? "tap a row to explain" : "every change is explained"} tone={diff.missingRationale.length ? "amber" : "green"} />
        <Stat label="Lead time" value={`${formatMinutes(delta.find((d) => d.key === "lead")?.future ?? 0)}`} hint={`was ${formatMinutes(delta.find((d) => d.key === "lead")?.current ?? 0)}`} />
      </div>
      {findings.length ? <div className="mt-3"><Coaching items={findings.map((f) => f.message)} /></div> : null}

      <Card className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-line bg-paper text-[10.5px] font-medium uppercase tracking-[0.14em] text-stone">
            <tr><th className="px-3 py-2">Metric</th><th className="px-3 py-2">Current</th><th className="px-3 py-2">Future</th><th className="px-3 py-2">Change</th></tr>
          </thead>
          <tbody>
            {delta.map((d) => {
              const better = d.change === null ? null : d.key === "pce" ? d.change > 0 : d.change < 0;
              return (
                <tr key={d.key} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 text-ink">{d.label}</td>
                  <td className="px-3 py-2 font-mono text-graphite">{formatDeltaValue(d.current, d.format)}</td>
                  <td className="px-3 py-2 font-mono text-ink">{formatDeltaValue(d.future, d.format)}</td>
                  <td className={`px-3 py-2 font-mono ${better === null || d.change === 0 ? "text-stone" : better ? "text-risk-track" : "text-risk-critical"}`}>{formatChange(d.change, d.format)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[16px] font-medium text-ink">Step by step</h3>
          {!desktop ? <Segmented label="Version" value={tab} onChange={setTab} options={[{ value: "current", label: "Current" }, { value: "future", label: "Future" }]} /> : null}
        </div>
        <div className={`mt-3 grid gap-3 ${desktop ? "lg:grid-cols-2" : ""}`}>
          {(desktop || tab === "current") ? <Column title="Current state" steps={[...cur.steps].sort((a, b) => a.order - b.order)} render={(s) => <StepRow step={s} laneIndex={laneIdx.get(s.laneId) ?? 0} laneName={laneName(s.laneId)} mark={diff.removed.some((r) => r.currentStep.id === s.id) ? "removed" : diff.changed.some((c) => c.currentStep.id === s.id) ? "changed" : undefined} onClick={diff.removed.some((r) => r.currentStep.id === s.id) ? () => open({ kind: "rationale", changeKey: s.id }) : undefined} missing={missing.has(s.id)} />} /> : null}
          {(desktop || tab === "future") ? <Column title="Future state" steps={[...fut.steps].sort((a, b) => a.order - b.order)} render={(s) => { const e = diff.entries.find((x) => x.kind !== "removed" && x.futureStep.id === s.id); const kind = e?.kind === "added" ? "added" : e?.kind === "changed" ? "changed" : undefined; return <StepRow step={s} laneIndex={laneIdx.get(s.laneId) ?? 0} laneName={laneName(s.laneId)} mark={kind} onClick={kind ? () => open({ kind: "rationale", changeKey: s.id }) : undefined} missing={missing.has(s.id)} changes={e?.kind === "changed" ? e.changes.map((c) => c.field) : undefined} />; }} /> : null}
        </div>
      </div>

      <section className="mt-8" aria-label="Change rationale">
        <h3 className="text-[16px] font-medium text-ink">Change rationale <span className="ml-2 font-mono text-[12px] text-stone">{rows.length}</span></h3>
        <p className="mt-0.5 text-[12.5px] text-stone">Every removed, added, or changed step, and why. Link the LoopSolve action that makes it real.</p>
        {rows.length ? (
          <ul className="mt-3 flex flex-col gap-2">
            {rows.map((e) => <RationaleRow key={e.key} entry={e} rationale={fut.rationale[e.key]} linked={linked} onOpen={() => open({ kind: "rationale", changeKey: e.key })} />)}
          </ul>
        ) : (
          <EmptyState className="mt-3" title="The future state is identical to the current one so far. Edit the future map: remove a wait, merge two steps, move work to the lane that should own it." action={<LoopButton onClick={editFuture} icon={<IconEdit size={14} />}>Edit future map</LoopButton>} />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "amber" | "green" }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-graphite">{label}</p>
      <p className={`mt-1 font-mono text-[26px] font-medium ${tone === "amber" ? "text-risk-amber" : tone === "green" ? "text-risk-track" : "text-ink"}`}>{value}</p>
      <p className="text-[12px] text-stone">{hint}</p>
    </Card>
  );
}

function Column({ title, steps, render }: { title: string; steps: Step[]; render: (s: Step) => React.ReactNode }) {
  return (
    <Card className="p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-copper">{title}</p>
      <ol className="mt-2 flex flex-col gap-1.5">{steps.map((s) => <li key={s.id}>{render(s)}</li>)}</ol>
    </Card>
  );
}

function StepRow({ step: s, laneIndex, laneName, mark, onClick, missing, changes }: { step: Step; laneIndex: number; laneName: string; mark?: "removed" | "added" | "changed"; onClick?: () => void; missing?: boolean; changes?: string[] }) {
  const cls = mark === "removed" ? "border-risk-critical/40 bg-risk-critical-bg/60" : mark === "added" ? "border-risk-track/40 bg-risk-track-bg/60" : mark === "changed" ? "border-risk-amber/40 bg-risk-amber-bg/60" : "border-line bg-cream";
  const body = (
    <>
      <span className="h-8 w-1 shrink-0 rounded" style={{ background: laneColor(laneIndex) }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[13.5px] ${mark === "removed" ? "line-through text-risk-critical" : "text-ink"}`}><span className="mr-1.5 font-mono text-[11px] text-stone">{s.order + 1}</span>{s.name || "Untitled"}</span>
        <span className="block truncate text-[11.5px] text-stone">{laneName} · {s.type === "start" || s.type === "end" ? s.type : `${formatMinutes(s.cycleTimeMin, { unknown: "? time" })}${s.waitBeforeMin ? ` after ${formatMinutes(s.waitBeforeMin, { compact: true })} wait` : ""} · ${valueClassMeta[s.valueClass].short}`}{changes?.length ? ` · changed ${changes.join(", ")}` : ""}</span>
      </span>
      {mark ? <Chip tone={mark === "removed" ? "red" : mark === "added" ? "green" : "amber"}>{mark}</Chip> : null}
      {missing ? <IconAlert size={13} className="shrink-0 text-risk-amber" aria-label="Needs rationale" /> : mark ? <IconCheck size={13} className="shrink-0 text-risk-track" aria-label="Rationale recorded" /> : null}
    </>
  );
  if (onClick) return <button type="button" onClick={onClick} className={`flex w-full min-h-[44px] items-center gap-2.5 rounded-[3px] border px-2 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-copper ${cls}`}>{body}</button>;
  return <div className={`flex min-h-[44px] items-center gap-2.5 rounded-[3px] border px-2 py-1.5 ${cls}`}>{body}</div>;
}

function RationaleRow({ entry: e, rationale, linked, onOpen }: { entry: DiffEntry; rationale?: { text: string; linkedAction?: { investigationId: string; actionId: string } }; linked: ReturnType<typeof useLinkedInvestigations>; onOpen: () => void }) {
  if (e.kind === "unchanged") return null;
  const name = e.kind === "removed" ? e.currentStep.name : e.futureStep.name;
  const what = e.kind === "removed" ? "Removed" : e.kind === "added" ? "Added" : `Changed ${e.changes.map((c) => c.field).join(", ")}`;
  const text = rationale?.text?.trim();
  const inv = rationale?.linkedAction ? linked.get(rationale.linkedAction.investigationId) : undefined;
  const action = inv?.actions.find((a) => a.id === rationale?.linkedAction?.actionId);
  return (
    <Card as="li" rule={text ? (e.kind === "removed" ? "red" : e.kind === "added" ? "green" : "amber") : undefined} className={`p-3 ${text ? "" : "border-dashed"}`}>
      <button type="button" onClick={onOpen} className="flex w-full min-h-[40px] flex-wrap items-center gap-2 rounded-[2px] text-left focus-visible:outline-2 focus-visible:outline-copper">
        <Chip tone={e.kind === "removed" ? "red" : e.kind === "added" ? "green" : "amber"} icon={<IconBranch size={11} />}>{what}</Chip>
        <span className="text-[14px] font-medium text-ink">{name || "Untitled step"}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[12.5px] text-graphite">{text ? "Edit" : "Add rationale"} <IconArrowRight size={12} /></span>
        <span className={`block w-full text-[13.5px] leading-6 ${text ? "text-graphite" : "text-risk-amber"}`}>{text || (e.kind === "removed" ? "What change makes this step unnecessary?" : "What corrective action makes this real?")}</span>
      </button>
      {action ? (
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-graphite"><LoopGlyph className="h-3 w-6" /> {inv?.rcaNumber} · {action.title || "Untitled action"} <Chip tone={action.status === "complete" ? "green" : action.status === "in_progress" ? "blue" : "neutral"}>{action.status.replace(/_/g, " ")}</Chip></p>
      ) : null}
    </Card>
  );
}
