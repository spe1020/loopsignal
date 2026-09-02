"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ContextPanel } from "@/components/loop/ContextPanel";
import { IconAlert, IconArrowLeft, IconArrowRight, IconBranch, IconPlus, IconTrash, LoopGlyph } from "@/components/loop/icons";
import { useToast } from "@/components/loop/Toast";
import { Chip, Coaching, Field, Kbd, LoopButton, Select, TextArea, TextInput } from "@/components/loop/ui";
import { trackFlow } from "@/lib/flow/analytics";
import { findingsFor, softFindings } from "@/lib/flow/rules";
import type { Step, StepType, TimeSource, ValueClass, VersionKind } from "@/lib/flow/schema";
import { stepTypes, timeSources } from "@/lib/flow/schema";
import { investigationFromMap } from "@/lib/flow/solveLink";
import { formatMinutes } from "@/lib/flow/time";
import { painCategoryMeta, severityMeta, stepTypeMeta, timeSourceMeta, valueClassMeta } from "@/lib/flow/visual";
import { formatDateTime } from "@/lib/loop/format";
import { stamp } from "@/lib/loop/ids";
import { nextRcaNumber, saveInvestigation } from "@/lib/solve/storage";
import { useMap } from "../MapProvider";
import { useFlowPanel } from "../panel";
import { Stopwatch } from "../map/Stopwatch";
import { TimeInput } from "../map/TimeInput";
import { useStepActions } from "../map/useStepActions";

export function StepPanel({ stepId, version, focus }: { stepId: string; version: VersionKind; focus?: "name" | "time" }) {
  const { map, dispatch } = useMap();
  const { open, close } = useFlowPanel();
  const { addAfter, remove, addPain } = useStepActions(version);
  const router = useRouter();
  const toast = useToast();
  const v = version === "future" && map.versions.future ? map.versions.future : map.versions.current;
  const step = v.steps.find((s) => s.id === stepId);
  const nameRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const [more, setMore] = useState(false);
  const [branchLabel, setBranchLabel] = useState("");
  const [branchTarget, setBranchTarget] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (focus === "time") timeRef.current?.focus();
      else if (focus === "name") nameRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(t);
  }, [stepId, focus]);

  if (!step) return null;
  const lanes = [...map.lanes].sort((a, b) => a.order - b.order);
  const steps = [...v.steps].sort((a, b) => a.order - b.order);
  const idx = steps.findIndex((s) => s.id === step.id);
  const lane = lanes.find((l) => l.id === step.laneId);
  const set = (patch: Partial<Step>) => dispatch({ type: "update_step", version, id: step.id, patch });
  const timed = step.type !== "start" && step.type !== "end";
  const pains = v.painPoints.filter((p) => p.stepId === step.id);
  const branches = v.edges.filter((e) => !e.isPrimary && e.fromStepId === step.id);
  const primaryOut = v.edges.find((e) => e.isPrimary && e.fromStepId === step.id);
  const coaching = findingsFor(softFindings(map), step.id).filter((f) => f.version === version).map((f) => f.message);
  const observed = [...step.observations].sort((a, b) => b.at.localeCompare(a.at));

  function next() {
    addAfter(step!, "process", step!.laneId);
  }

  async function startInvestigation() {
    const { investigation, link, note } = investigationFromMap({ map, step: step!, rcaNumber: nextRcaNumber() });
    await saveInvestigation(investigation);
    dispatch({ type: "link_investigation", link, note });
    trackFlow("loopflow_investigation_started", { stage: "map" });
    toast.show(`Opened ${investigation.rcaNumber} in LoopSolve.`);
    router.push(`/solve/${investigation.id}/problem`);
  }

  function addBranch() {
    if (!branchTarget) return;
    dispatch({ type: "add_edge", version, edge: { ...stamp(), fromStepId: step!.id, toStepId: branchTarget, label: branchLabel.trim() || undefined, isPrimary: false } });
    setBranchLabel("");
    setBranchTarget("");
  }

  return (
    <ContextPanel title={`Step ${idx + 1}${version === "future" ? " · Future" : ""}`} fullScreen={map.shopFloorMode}>
      <div className="flex flex-col gap-4">
        <Field label="Name" htmlFor="step-name" helper={step.type === "decision" ? "Phrase it as a question." : undefined}>
          <TextInput
            ref={nameRef}
            id="step-name"
            value={step.name}
            placeholder={step.type === "decision" ? "Needs review?" : step.type === "wait" ? "Waiting for…" : "What happens?"}
            onChange={(e) => set({ name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                next();
              }
            }}
          />
        </Field>
        {timed ? (
          <Field label={step.type === "wait" ? "Wait time" : "Cycle time"} htmlFor="step-time" helper={step.type === "wait" ? "How long the work sits here." : "Touch time for one item or batch."}>
            <div className="flex flex-wrap items-center gap-2">
              <TimeInput ref={timeRef} id="step-time" value={step.cycleTimeMin} unit={map.unit} onCommit={(min) => set({ cycleTimeMin: min, timeSource: min === undefined ? "unknown" : step.timeSource === "unknown" || step.timeSource === "observed" ? "estimated" : step.timeSource })} onEnter={next} className="min-w-[160px] flex-1" />
              <Stopwatch stepId={step.id} version={version} />
            </div>
            {step.cycleTimeMin === undefined ? <p className="flex items-center gap-1.5 text-[12.5px] text-risk-amber"><IconAlert size={12} /> Unknown. Type a number in {map.unit}, or time it.</p> : null}
          </Field>
        ) : null}
        {step.type !== "start" ? (
          <Field label="Wait before this step" htmlFor="step-wait" helper="Queue time before it starts. Waiting is a step, not white space.">
            <TimeInput id="step-wait" value={step.waitBeforeMin} unit={map.unit} onCommit={(min) => set({ waitBeforeMin: min })} placeholder="0" />
          </Field>
        ) : null}
        {timed && step.type !== "wait" ? (
          <fieldset>
            <legend className="text-[13px] font-medium text-ink">Value class</legend>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Value class">
              {(["va", "nnva", "nva"] as ValueClass[]).map((c) => {
                const m = valueClassMeta[c];
                const active = step.valueClass === c;
                return (
                  <button key={c} type="button" role="radio" aria-checked={active} title={m.hint} onClick={() => set({ valueClass: c })} className={`flex min-h-(--loop-control) flex-col items-center justify-center rounded-[3px] border px-2 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-copper ${active ? "border-ink bg-ink text-cream" : "border-line bg-paper text-graphite hover:border-ink/40"}`}>
                    <span>{m.short}</span>
                    <span className="text-[10.5px] font-normal opacity-80">{c === "va" ? "value" : c === "nnva" ? "required" : "waste"}</span>
                  </button>
                );
              })}
            </div>
            <p className="loop-secondary mt-1.5 text-[12px] text-stone">{valueClassMeta[step.valueClass].hint}</p>
          </fieldset>
        ) : null}
        <Coaching items={coaching} />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Lane" htmlFor="step-lane">
            <Select id="step-lane" value={step.laneId} onChange={(e) => set({ laneId: e.target.value })}>
              {lanes.map((l) => <option key={l.id} value={l.id}>{l.name || "Untitled lane"}</option>)}
            </Select>
          </Field>
          <Field label="Type" htmlFor="step-type">
            <Select id="step-type" value={step.type} onChange={(e) => set({ type: e.target.value as StepType, ...(e.target.value === "wait" ? { valueClass: "nva" as const } : {}) })}>
              {stepTypes.map((t) => <option key={t} value={t}>{stepTypeMeta[t].label}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Trigger" htmlFor="step-trigger" helper={lane && idx > 0 && steps[idx - 1].laneId !== step.laneId ? `Handoff into ${lane.name}. How do they know to start?` : "What starts this step?"}>
          <TextInput id="step-trigger" value={step.trigger ?? ""} onChange={(e) => set({ trigger: e.target.value })} placeholder="Email, ERP status, verbal, the previous step…" />
        </Field>

        <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className="flex min-h-[36px] items-center gap-2 rounded-[2px] text-left text-[13px] font-medium text-graphite hover:text-ink focus-visible:outline-2 focus-visible:outline-copper">
          {more ? "Hide" : "More"} <span className="font-normal text-stone">system, batch, yield, source, description</span>
        </button>
        {more ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="System" htmlFor="step-system"><TextInput id="step-system" value={step.system ?? ""} placeholder="ERP, spreadsheet, email, paper" onChange={(e) => set({ system: e.target.value })} /></Field>
            <Field label="Time source" htmlFor="step-source">
              <Select id="step-source" value={step.timeSource} onChange={(e) => set({ timeSource: e.target.value as TimeSource })}>
                {timeSources.map((t) => <option key={t} value={t}>{timeSourceMeta[t].label}</option>)}
              </Select>
            </Field>
            <Field label="Batch size" htmlFor="step-batch"><TextInput id="step-batch" inputMode="numeric" value={step.batchSize ?? ""} onChange={(e) => set({ batchSize: e.target.value ? Number(e.target.value) || undefined : undefined })} /></Field>
            <Field label="First-pass yield %" htmlFor="step-fpy"><TextInput id="step-fpy" inputMode="decimal" value={step.firstPassYield === undefined ? "" : Math.round(step.firstPassYield * 100)} onChange={(e) => set({ firstPassYield: e.target.value ? Math.min(1, Math.max(0, Number(e.target.value) / 100)) : undefined })} /></Field>
            <Field label="Description" htmlFor="step-desc" className="sm:col-span-2"><TextArea id="step-desc" rows={2} value={step.description ?? ""} onChange={(e) => set({ description: e.target.value })} /></Field>
          </div>
        ) : null}

        {timed ? (
          <section aria-labelledby="step-obs">
            <h3 id="step-obs" className="text-[13px] font-medium text-ink">Observations <span className="font-normal text-stone">· {observed.length}{observed.length ? ` · median ${formatMinutes(step.cycleTimeMin)}` : ""}</span></h3>
            {observed.length ? (
              <ul className="mt-1.5 flex flex-col gap-1">
                {observed.slice(0, 6).map((o) => (
                  <li key={o.id} className="flex items-center gap-2 rounded-[3px] border border-line bg-paper px-2.5 py-1 text-[12.5px]">
                    <span className="font-mono text-ink">{formatMinutes(o.durationMin)}</span>
                    <span className="min-w-0 flex-1 truncate text-stone">{formatDateTime(o.at)}{o.note ? ` · ${o.note}` : ""}</span>
                    <button type="button" aria-label="Remove observation" onClick={() => dispatch({ type: "remove_observation", version, stepId: step.id, observationId: o.id })} className="inline-flex h-8 w-8 items-center justify-center rounded-[2px] text-stone hover:text-risk-critical focus-visible:outline-2 focus-visible:outline-copper"><IconTrash size={13} /></button>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-1 text-[12.5px] text-stone">None yet. Use the stopwatch while someone does the step.</p>}
          </section>
        ) : null}

        <section aria-labelledby="step-pain">
          <div className="flex items-center justify-between">
            <h3 id="step-pain" className="text-[13px] font-medium text-ink">Pain points <span className="font-normal text-stone">· {pains.length}</span></h3>
            <LoopButton size="sm" variant="ghost" onClick={() => addPain(step)} icon={<IconAlert size={13} />}>Mark pain point</LoopButton>
          </div>
          {pains.length ? (
            <ul className="mt-1.5 flex flex-col gap-1">
              {pains.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => open({ kind: "pain", painId: p.id, version })} className="flex w-full min-h-[40px] items-center gap-2 rounded-[3px] border border-copper/40 bg-copper-soft/40 px-2.5 py-1.5 text-left text-[13px] text-ink hover:border-copper focus-visible:outline-2 focus-visible:outline-copper">
                    <span className="min-w-0 flex-1 truncate">{p.text || "Untitled pain point"}</span>
                    <Chip tone={p.severity === "high" ? "red" : p.severity === "medium" ? "amber" : "neutral"}>{severityMeta[p.severity].label}</Chip>
                    <span className="text-[11px] text-stone">{painCategoryMeta[p.category].label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {step.type === "decision" ? (
          <section aria-labelledby="step-branches">
            <h3 id="step-branches" className="text-[13px] font-medium text-ink">Branches</h3>
            <p className="text-[12px] text-stone">The main path continues to the next step{primaryOut ? "" : ""}. Add a branch that skips ahead or loops back (rework).</p>
            {primaryOut ? (
              <div className="mt-1.5 flex items-center gap-2 text-[12.5px]">
                <span className="text-stone">Main path label</span>
                <TextInput aria-label="Main path label" value={primaryOut.label ?? ""} placeholder="Yes" onChange={(e) => dispatch({ type: "update_edge", version, id: primaryOut.id, patch: { label: e.target.value } })} className="max-w-[140px]" />
              </div>
            ) : null}
            {branches.length ? (
              <ul className="mt-1.5 flex flex-col gap-1">
                {branches.map((e) => {
                  const t = steps.find((s) => s.id === e.toStepId);
                  const back = t ? t.order <= step.order : false;
                  return (
                    <li key={e.id} className="flex items-center gap-2 rounded-[3px] border border-line bg-paper px-2.5 py-1 text-[12.5px]">
                      <IconBranch size={12} className={back ? "text-risk-critical" : "text-graphite"} />
                      <span className="min-w-0 flex-1 truncate"><span className="italic">{e.label || "Branch"}</span> → {back ? "back to" : "skip to"} step {t ? t.order + 1 : "?"}{t?.name ? `: ${t.name}` : ""}</span>
                      <button type="button" aria-label="Remove branch" onClick={() => dispatch({ type: "remove_edge", version, id: e.id })} className="inline-flex h-8 w-8 items-center justify-center rounded-[2px] text-stone hover:text-risk-critical focus-visible:outline-2 focus-visible:outline-copper"><IconTrash size={13} /></button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <TextInput aria-label="Branch label" placeholder="No / Rework" value={branchLabel} onChange={(e) => setBranchLabel(e.target.value)} className="max-w-[120px]" />
              <Select aria-label="Branch goes to" value={branchTarget} onChange={(e) => setBranchTarget(e.target.value)} className="min-w-[160px] flex-1">
                <option value="">Goes to…</option>
                {steps.filter((s) => s.id !== step.id).map((s) => <option key={s.id} value={s.id}>{s.order + 1}. {s.name || "Untitled"}{s.order < step.order ? " (rework)" : ""}</option>)}
              </Select>
              <LoopButton size="sm" onClick={addBranch} disabled={!branchTarget} icon={<IconPlus size={13} />}>Add branch</LoopButton>
            </div>
          </section>
        ) : null}

        <section className="rounded-[3px] border border-line bg-paper p-3" aria-label="Step actions">
          <div className="flex flex-wrap gap-1.5">
            <LoopButton size="sm" variant="dark" onClick={next} icon={<IconPlus size={13} />}>Add step after</LoopButton>
            <LoopButton size="sm" onClick={() => addAfter(step, "decision", step.laneId)} icon={<IconBranch size={13} />}>Add decision after</LoopButton>
            <LoopButton size="sm" onClick={() => addAfter(step, "wait", step.laneId, { name: "Waiting" })}>Insert wait</LoopButton>
            <LoopButton size="sm" onClick={() => dispatch({ type: "move_step", version, id: step.id, direction: -1 })} disabled={idx === 0} icon={<IconArrowLeft size={13} />}>Earlier</LoopButton>
            <LoopButton size="sm" onClick={() => dispatch({ type: "move_step", version, id: step.id, direction: 1 })} disabled={idx === steps.length - 1} icon={<IconArrowRight size={13} />}>Later</LoopButton>
          </div>
          <p className="loop-secondary mt-2 text-[11.5px] text-stone"><Kbd>Enter</Kbd> next step · <Kbd>Tab</Kbd> to time · <Kbd>Alt+←/→</Kbd> reorder · <Kbd>Esc</Kbd> close</p>
        </section>

        {version === "current" ? (
          <LoopButton onClick={startInvestigation} icon={<LoopGlyph className="h-3.5 w-7" tone="current" />}>Start LoopSolve investigation</LoopButton>
        ) : null}

        <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
          <LoopButton size="sm" variant="danger" onClick={() => remove(step)} icon={<IconTrash size={13} />}>Delete step</LoopButton>
          <LoopButton variant="dark" onClick={close}>Done</LoopButton>
        </div>
      </div>
    </ContextPanel>
  );
}
