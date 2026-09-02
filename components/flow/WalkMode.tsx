"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconAlert, IconArrowLeft, IconArrowRight, IconClose, IconPlus, LoopGlyph } from "@/components/loop/icons";
import { useToast } from "@/components/loop/Toast";
import { Kbd, LoopButton, TextArea, TextInput } from "@/components/loop/ui";
import { trackFlow } from "@/lib/flow/analytics";
import { orderedSteps } from "@/lib/flow/metrics";
import { makeStep } from "@/lib/flow/reducer";
import type { Step, ValueClass } from "@/lib/flow/schema";
import { formatMinutes } from "@/lib/flow/time";
import { laneColor, valueClassMeta } from "@/lib/flow/visual";
import { stamp } from "@/lib/loop/ids";
import { useFlowShell } from "./FlowWorkspace";
import { useMap } from "./MapProvider";
import { Stopwatch } from "./map/Stopwatch";
import { TimeInput } from "./map/TimeInput";

type Draft = { name: string; laneId: string; cycleTimeMin?: number; valueClass: ValueClass; pain: string };

/**
 * Walk Mode: mapping while physically walking the process. One step at a
 * time, thumb-reachable, keyboard-friendly. Existing steps are edited in
 * place; the last screen is always "What happens next?".
 */
export function WalkMode() {
  const { map, dispatch } = useMap();
  const { exitWalk, version } = useFlowShell();
  const toast = useToast();
  const v = version === "future" && map.versions.future ? map.versions.future : map.versions.current;
  const steps = useMemo(() => orderedSteps(v), [v]);
  const lanes = useMemo(() => [...map.lanes].sort((a, b) => a.order - b.order), [map.lanes]);
  // index into steps, or steps.length for "new step after the end"
  const [index, setIndex] = useState(steps.length);
  const [draft, setDraft] = useState<Draft>(() => ({ name: "", laneId: steps[steps.length - 1]?.laneId ?? lanes[0]?.id ?? "", valueClass: "unclassified", pain: "" }));
  const nameRef = useRef<HTMLInputElement>(null);
  const existing: Step | null = index < steps.length ? steps[index] : null;

  useEffect(() => {
    nameRef.current?.focus();
  }, [index]);

  const commitNew = useCallback((): Step | null => {
    if (!draft.name.trim() || !draft.laneId) return null;
    const step = makeStep({ laneId: draft.laneId, name: draft.name.trim(), cycleTimeMin: draft.cycleTimeMin, valueClass: draft.valueClass, timeSource: draft.cycleTimeMin === undefined ? "unknown" : "estimated" });
    dispatch({ type: "add_step", version, step, afterStepId: steps[steps.length - 1]?.id });
    trackFlow("loopflow_step_added", { stage: "map", steps: steps.length + 1, walk: 1 });
    if (draft.pain.trim()) {
      dispatch({ type: "add_pain", version, pain: { ...stamp(), stepId: step.id, text: draft.pain.trim(), category: "other", severity: "medium" } });
      trackFlow("loopflow_pain_added", { stage: "map", walk: 1 });
    }
    return step;
  }, [draft, dispatch, version, steps]);

  const next = useCallback(() => {
    if (existing) {
      setIndex((i) => i + 1);
      return;
    }
    const step = commitNew();
    if (!step) {
      toast.show("Give the step a name first.");
      return;
    }
    setDraft({ name: "", laneId: step.laneId, valueClass: "unclassified", pain: "" });
    setIndex(steps.length + 1);
  }, [existing, commitNew, toast, steps.length]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
      if (e.key === "Escape") {
        e.preventDefault();
        exitWalk();
        return;
      }
      if (typing) return;
      if (e.key === "ArrowLeft") back();
      if (e.key === "ArrowRight") next();
      if (e.key === "1" || e.key === "2" || e.key === "3") {
        const cls: ValueClass = e.key === "1" ? "va" : e.key === "2" ? "nnva" : "nva";
        if (existing) dispatch({ type: "update_step", version, id: existing.id, patch: { valueClass: cls } });
        else setDraft((d) => ({ ...d, valueClass: cls }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exitWalk, back, next, existing, dispatch, version]);

  const setExisting = (patch: Partial<Step>) => existing && dispatch({ type: "update_step", version, id: existing.id, patch });
  const name = existing ? existing.name : draft.name;
  const laneId = existing ? existing.laneId : draft.laneId;
  const cycle = existing ? existing.cycleTimeMin : draft.cycleTimeMin;
  const valueClass = existing ? existing.valueClass : draft.valueClass;
  const pains = existing ? v.painPoints.filter((p) => p.stepId === existing.id) : [];
  const prev = index > 0 ? steps[index - 1] : null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-ink text-cream" role="dialog" aria-modal="true" aria-label="Walk mode">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-8">
        <LoopGlyph className="h-5 w-10" tone="current" />
        <span className="font-mono text-[11px] tracking-[0.18em] text-copper">WALK{version === "future" ? " · FUTURE" : ""}</span>
        <span className="hidden text-[13px] text-white/50 md:inline">{map.mapNumber} · {map.title}</span>
        <span className="ml-auto text-[13px] text-white/60">{existing ? `Step ${index + 1} of ${steps.length}` : `New step ${steps.length + 1}`}</span>
        <button type="button" onClick={exitWalk} className="inline-flex min-h-[44px] items-center gap-2 rounded-[3px] border border-white/20 px-3 text-[13px] text-white/80 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-copper">
          <IconClose size={14} /> Exit <span className="hidden md:inline">· Esc</span>
        </button>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto px-4 py-5 md:px-16 md:py-8">
        <div className="mx-auto w-full max-w-2xl">
          {prev ? (
            <p className="mb-3 truncate text-[13px] text-white/50">
              After <span className="text-white/80">{prev.order + 1}. {prev.name || "Untitled"}</span>{prev.cycleTimeMin ? ` · ${formatMinutes(prev.cycleTimeMin)}` : ""}
            </p>
          ) : null}
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-copper">{existing ? "This step" : "What happens next?"}</p>
          <TextInput
            ref={nameRef}
            aria-label="Step name"
            value={name}
            placeholder="Say what happens, in a few words"
            onChange={(e) => (existing ? setExisting({ name: e.target.value }) : setDraft((d) => ({ ...d, name: e.target.value })))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                next();
              }
            }}
            className="mt-3 border-white/25 bg-white/5 text-[22px] text-cream placeholder:text-white/35 md:text-[26px]"
          />

          <p className="mt-6 text-[12px] uppercase tracking-[0.14em] text-white/50">Who does it</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Lane">
            {lanes.map((l, i) => {
              const active = l.id === laneId;
              return (
                <button key={l.id} type="button" role="radio" aria-checked={active} onClick={() => (existing ? setExisting({ laneId: l.id }) : setDraft((d) => ({ ...d, laneId: l.id })))} className={`inline-flex min-h-[48px] items-center gap-2 rounded-[3px] border px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-copper ${active ? "border-cream bg-cream text-ink" : "border-white/25 text-white/85 hover:bg-white/10"}`}>
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: laneColor(i) }} aria-hidden />
                  {l.name || "Untitled lane"}
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-[12px] uppercase tracking-[0.14em] text-white/50">How long</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {existing ? <Stopwatch stepId={existing.id} version={version} size="lg" /> : <span className="text-[13px] text-white/50">Save the step to use the stopwatch, or type a time:</span>}
            <TimeInput aria-label="Cycle time" value={cycle} unit={map.unit} onCommit={(min) => (existing ? setExisting({ cycleTimeMin: min, timeSource: min === undefined ? "unknown" : existing.timeSource === "observed" ? "observed" : "estimated" }) : setDraft((d) => ({ ...d, cycleTimeMin: min })))} onEnter={next} className="min-w-[180px] [&_input]:border-white/25 [&_input]:bg-white/5 [&_input]:text-[18px] [&_input]:text-cream" />
          </div>

          <p className="mt-6 text-[12px] uppercase tracking-[0.14em] text-white/50">Value</p>
          <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Value class">
            {(["va", "nnva", "nva"] as ValueClass[]).map((c, i) => {
              const m = valueClassMeta[c];
              const active = valueClass === c;
              return (
                <button key={c} type="button" role="radio" aria-checked={active} onClick={() => (existing ? setExisting({ valueClass: c }) : setDraft((d) => ({ ...d, valueClass: c })))} className={`flex min-h-[64px] flex-col items-center justify-center rounded-[3px] border px-2 text-[16px] font-medium focus-visible:outline-2 focus-visible:outline-copper ${active ? "border-copper bg-copper text-white" : "border-white/25 text-white/85 hover:bg-white/10"}`}>
                  <span>{m.short} <Kbd>{i + 1}</Kbd></span>
                  <span className="text-[11px] font-normal opacity-80">{c === "va" ? "customer pays" : c === "nnva" ? "required" : "waste"}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-[12px] uppercase tracking-[0.14em] text-white/50">Anything wrong here?</p>
          {existing ? (
            <div className="mt-2 flex flex-col gap-2">
              {pains.map((p) => <p key={p.id} className="flex items-start gap-2 rounded-[3px] border border-copper/50 bg-copper/10 px-3 py-2 text-[14px]"><IconAlert size={14} className="mt-1 shrink-0 text-copper" /> {p.text}</p>)}
              <LoopButton variant="ghost" className="self-start text-white/80 hover:bg-white/10 hover:text-white" icon={<IconPlus size={14} />} onClick={() => { const text = window.prompt("What's wrong here?"); if (text?.trim()) { dispatch({ type: "add_pain", version, pain: { ...stamp(), stepId: existing.id, text: text.trim(), category: "other", severity: "medium" } }); trackFlow("loopflow_pain_added", { stage: "map", walk: 1 }); } }}>Add pain point</LoopButton>
            </div>
          ) : (
            <TextArea aria-label="Pain point" rows={2} value={draft.pain} placeholder="Leave blank if nothing. Otherwise: what goes wrong, how often." onChange={(e) => setDraft((d) => ({ ...d, pain: e.target.value }))} className="mt-2 border-white/25 bg-white/5 text-[15px] text-cream placeholder:text-white/35" />
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] md:px-8">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
          <LoopButton variant="ghost" size="lg" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={back} disabled={index === 0} icon={<IconArrowLeft size={16} />}>Back</LoopButton>
          <LoopButton variant="primary" size="lg" className="flex-1" onClick={next} icon={<IconArrowRight size={16} />}>{existing ? (index === steps.length - 1 ? "Add next step" : "Next step") : "Save · next"}</LoopButton>
        </div>
        <p className="mx-auto mt-2 hidden w-full max-w-2xl text-[12px] text-white/45 md:block"><Kbd>Enter</Kbd> next · <Kbd>←</Kbd> <Kbd>→</Kbd> move · <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> value class · <Kbd>Esc</Kbd> exit</p>
      </footer>
    </div>
  );
}
