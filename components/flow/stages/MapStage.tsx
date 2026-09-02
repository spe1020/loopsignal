"use client";

import { useEffect, useRef, useState } from "react";
import { IconBranch, IconExpand, IconList, IconPlus, IconPresent, LoopGlyph } from "@/components/loop/icons";
import { Chip, Coaching, EmptyState, LoopButton, SectionTitle, Segmented } from "@/components/loop/ui";
import { useMediaQuery } from "@/components/loop/useMediaQuery";
import { softFindings } from "@/lib/flow/rules";
import { formatMinutes } from "@/lib/flow/time";
import { useFlowShell, usePrimaryAction } from "../FlowWorkspace";
import { useMap } from "../MapProvider";
import { StepList } from "../map/StepList";
import { SwimlaneMap } from "../map/SwimlaneMap";
import { useStepActions } from "../map/useStepActions";
import { useVersion } from "../map/useVersion";
import { useFlowPanel } from "../panel";
import { WalkMode } from "../WalkMode";

export function MapStage() {
  const { map, dispatch } = useMap();
  const shell = useFlowShell();
  const { kind, version, lanes, steps, metrics, layout, laneById } = useVersion();
  const { open, state } = useFlowPanel();
  const { addAfter } = useStepActions(kind);
  const wide = useMediaQuery("(min-width: 768px)", true);
  const [view, setView] = useState<"diagram" | "list">(map.shopFloorMode ? "list" : "diagram");
  const rootRef = useRef<HTMLDivElement>(null);
  const focused = useRef<string | null>(null);

  const selectedId = state?.kind === "step" ? state.stepId : state?.kind === "pain" ? version.painPoints.find((p) => p.id === state.painId)?.stepId ?? null : null;
  const findings = softFindings(map).filter((f) => f.stage === "map" && f.version === kind && !f.stepId);
  const hasStart = steps.some((s) => s.type === "start");
  const hasEnd = steps.some((s) => s.type === "end");
  const last = steps[steps.length - 1] ?? null;
  const selectedStep = selectedId ? steps.find((s) => s.id === selectedId) ?? null : null;

  // Arrive with ?step= selected once.
  useEffect(() => {
    if (shell.focusStepId && focused.current !== shell.focusStepId && steps.some((s) => s.id === shell.focusStepId)) {
      focused.current = shell.focusStepId;
      open({ kind: "step", stepId: shell.focusStepId, version: kind });
    }
  }, [shell.focusStepId, steps, open, kind]);

  // Keyboard: Alt+←/→ reorder the selected step; Delete removes; Enter adds after.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedStep) return;
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        dispatch({ type: "move_step", version: kind, id: selectedStep.id, direction: e.key === "ArrowLeft" ? -1 : 1 });
        return;
      }
      if (typing) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        addAfter(selectedStep, "process", selectedStep.laneId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedStep, dispatch, kind, addAfter]);

  usePrimaryAction(
    { label: selectedStep ? "Add step after" : "Add step", onClick: () => addAfter(selectedStep ?? last, "process", selectedStep?.laneId ?? last?.laneId), icon: <IconPlus size={16} /> },
    [selectedStep?.id, last?.id, kind],
  );

  if (shell.walking) return <WalkMode />;

  const showList = !wide || view === "list";

  function startMapping() {
    const step = addAfter(null, "start", lanes[0]?.id, { name: map.scope.startsWith.trim() ? map.scope.startsWith.trim().slice(0, 40) : "Start" });
    if (step) dispatch({ type: "update_step", version: kind, id: step.id, patch: { valueClass: "nnva", cycleTimeMin: 0, timeSource: "system_record" } });
  }

  return (
    <div ref={rootRef}>
      <SectionTitle
        eyebrow={kind === "future" ? "Map · Future state" : "Map · Current state"}
        title={kind === "future" ? "Draw the process as it should run." : "Map what actually happens, not what the SOP says."}
        actions={
          <>
            {map.versions.future ? (
              <div className="inline-flex items-center gap-2">
                <LoopGlyph className="h-4 w-8" tone="copper" />
                <Segmented label="Version" value={kind} onChange={(v) => shell.setVersion(v)} options={[{ value: "current", label: "Current" }, { value: "future", label: "Future" }]} />
              </div>
            ) : null}
            {wide ? (
              <Segmented label="View" value={view} onChange={setView} options={[{ value: "diagram", label: "Diagram", icon: <IconExpand size={14} /> }, { value: "list", label: "List", icon: <IconList size={14} /> }]} />
            ) : (
              <LoopButton size="sm" onClick={() => open({ kind: "diagram", version: kind })} icon={<IconExpand size={14} />}>View diagram</LoopButton>
            )}
            {kind === "current" && lanes.length ? <LoopButton size="sm" onClick={shell.enterWalk} icon={<IconPresent size={14} />}>Walk</LoopButton> : null}
          </>
        }
      >
        Every step gets a lane, a time, and a value class — or an honest unknown. Waits are hatched. Handoffs are marked.
      </SectionTitle>

      {kind === "future" ? <div className="mt-3"><Chip tone="copper" icon={<IconBranch size={12} />}>Future state · edits here never touch the current map</Chip></div> : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-graphite" aria-label="Totals">
        <span>Lead <span className="font-mono text-ink">{formatMinutes(metrics.leadTimeMin)}</span></span>
        <span>Touch <span className="font-mono text-ink">{formatMinutes(metrics.touchTimeMin)}</span></span>
        <span>Handoffs <span className="font-mono text-ink">{metrics.handoffCount}</span></span>
        <span>Unknown times <span className={`font-mono ${metrics.unknownTimeStepIds.length ? "text-risk-amber" : "text-ink"}`}>{metrics.unknownTimeStepIds.length}</span></span>
        <span>{steps.length} steps</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <LoopButton variant="primary" size="sm" onClick={() => addAfter(selectedStep ?? last, "process", selectedStep?.laneId ?? last?.laneId)} icon={<IconPlus size={14} />} disabled={lanes.length === 0}>{selectedStep ? "Add step after" : "Add step"}</LoopButton>
        <LoopButton size="sm" onClick={() => addAfter(selectedStep ?? last, "decision", selectedStep?.laneId ?? last?.laneId)} icon={<IconBranch size={14} />} disabled={lanes.length === 0}>Add decision</LoopButton>
        <LoopButton size="sm" onClick={() => addAfter(selectedStep ?? last, "wait", selectedStep?.laneId ?? last?.laneId, { name: "Waiting" })} disabled={lanes.length === 0}>Insert wait</LoopButton>
        {!hasStart && steps.length ? <LoopButton size="sm" variant="ghost" onClick={() => addAfter(null, "start", steps[0]?.laneId, { name: "Start", valueClass: "nnva", cycleTimeMin: 0 })}>Add start</LoopButton> : null}
        {!hasEnd && steps.length ? <LoopButton size="sm" variant="ghost" onClick={() => addAfter(last, "end", last?.laneId, { name: map.scope.endsWith.trim().slice(0, 40) || "End", valueClass: "nnva", cycleTimeMin: 0 })}>Add end</LoopButton> : null}
      </div>

      <div className="mt-4">
        {lanes.length === 0 ? (
          <EmptyState title="No lanes yet. Add the roles that touch this process in Scope, then come back and map." />
        ) : steps.length === 0 ? (
          <EmptyState title={`Start at the beginning: ${map.scope.startsWith.trim() || "what arrives, or who asks?"}`} action={<LoopButton variant="primary" onClick={startMapping} icon={<IconPlus size={15} />}>Start mapping</LoopButton>} />
        ) : showList ? (
          <StepList version={version} kind={kind} steps={steps} laneById={laneById} selectedId={selectedId} onOpen={(id) => open({ kind: "step", stepId: id, version: kind })} bigStopwatch={map.shopFloorMode} />
        ) : (
          <SwimlaneMap version={version} lanes={lanes} layout={layout} selectedId={selectedId} onSelect={(id) => open({ kind: "step", stepId: id, version: kind })} onSelectLane={kind === "current" ? (laneId) => open({ kind: "lane", laneId }) : undefined} label={`${kind === "future" ? "Future" : "Current"} state process map`} />
        )}
      </div>

      {findings.length ? <div className="mt-4"><Coaching items={findings.map((f) => f.message)} /></div> : null}

      <p className="loop-secondary mt-6 text-[12px] leading-5 text-stone">
        Hatched gaps are waiting. The circle on a vertical connector is a handoff. Dashed arcs skip ahead; red arcs are rework. Time is stored in minutes and typed in {map.unit}.
      </p>
    </div>
  );
}
