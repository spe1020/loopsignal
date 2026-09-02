"use client";

import { useState } from "react";
import { IconArrowDown, IconArrowUp, IconPlus } from "@/components/loop/icons";
import { Card, Coaching, EmptyState, Field, LoopButton, SectionTitle, Select, TextArea, TextInput } from "@/components/loop/ui";
import { LANE_PRESETS, makeLane } from "@/lib/flow/reducer";
import { softFindings } from "@/lib/flow/rules";
import type { TimeUnit } from "@/lib/flow/schema";
import { timeUnits } from "@/lib/flow/schema";
import { unitLabels } from "@/lib/flow/time";
import { laneColor, laneKindMeta } from "@/lib/flow/visual";
import { usePrimaryAction } from "../FlowWorkspace";
import { useMap } from "../MapProvider";
import { useFlowPanel } from "../panel";

export function ScopeStage() {
  const { map, dispatch } = useMap();
  const { open, state } = useFlowPanel();
  const [preset, setPreset] = useState("");
  const lanes = [...map.lanes].sort((a, b) => a.order - b.order);
  const findings = softFindings(map).filter((f) => f.stage === "scope");

  function addLane(name = "", kind: "role" | "department" | "system" | "customer" | "supplier" = "role") {
    const lane = makeLane(name, kind, map.lanes.length);
    dispatch({ type: "add_lane", lane });
    open({ kind: "lane", laneId: lane.id });
  }
  function applyPreset(key: string) {
    setPreset(key);
    const p = LANE_PRESETS.find((x) => x.key === key);
    if (!p) return;
    dispatch({ type: "add_lanes", lanes: p.lanes.map((l, i) => makeLane(l.name, l.kind, map.lanes.length + i)) });
    if (!map.title && !map.process) dispatch({ type: "set_meta", patch: { process: p.name } });
    setPreset("");
  }

  usePrimaryAction({ label: "Add lane", onClick: () => addLane(), icon: <IconPlus size={16} /> }, [map.lanes.length]);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <SectionTitle eyebrow="Scope" title="Where does the process start and end, and who touches it?">
          Boundaries first, or the map sprawls. Then the lanes: every role, department, or system that handles the work.
        </SectionTitle>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Map title" htmlFor="scope-title" className="sm:col-span-2">
            <TextInput id="scope-title" value={map.title} placeholder="Quote to order — custom bracket" onChange={(e) => dispatch({ type: "set_meta", patch: { title: e.target.value } })} />
          </Field>
          <Field label="Process" htmlFor="scope-process" helper="Quote to order, bracket machining, maintenance request…">
            <TextInput id="scope-process" value={map.process ?? ""} onChange={(e) => dispatch({ type: "set_meta", patch: { process: e.target.value } })} />
          </Field>
          <Field label="Site" htmlFor="scope-site">
            <TextInput id="scope-site" value={map.site ?? ""} onChange={(e) => dispatch({ type: "set_meta", patch: { site: e.target.value } })} />
          </Field>
          <Field label="Starts with" htmlFor="scope-start" required helper="The trigger. What arrives, or who asks?">
            <TextArea id="scope-start" rows={2} value={map.scope.startsWith} onChange={(e) => dispatch({ type: "set_scope", patch: { startsWith: e.target.value } })} />
          </Field>
          <Field label="Ends with" htmlFor="scope-end" required helper="The last thing that happens inside this map.">
            <TextArea id="scope-end" rows={2} value={map.scope.endsWith} onChange={(e) => dispatch({ type: "set_scope", patch: { endsWith: e.target.value } })} />
          </Field>
          <Field label="Display unit" htmlFor="scope-unit" helper="Times are typed in this unit. Storage is always minutes.">
            <Select id="scope-unit" value={map.unit} onChange={(e) => dispatch({ type: "set_meta", patch: { unit: e.target.value as TimeUnit } })}>
              {timeUnits.map((u) => <option key={u} value={u}>{unitLabels[u].long}</option>)}
            </Select>
          </Field>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-medium text-ink">Lanes</h3>
            <p className="text-[13px] text-graphite">Rows on the map. Order them as the work usually flows.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="lane-preset">Quick-start lane set</label>
            <Select id="lane-preset" value={preset} onChange={(e) => applyPreset(e.target.value)} className="w-auto min-w-[200px]">
              <option value="">Quick start…</option>
              {LANE_PRESETS.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
            </Select>
            <LoopButton variant="primary" onClick={() => addLane()} icon={<IconPlus size={15} />}>Add lane</LoopButton>
          </div>
        </div>

        {lanes.length === 0 ? (
          <EmptyState className="mt-4" title="No lanes yet — add at least the roles that touch this process, or pick a quick-start set." action={<LoopButton onClick={() => addLane()} icon={<IconPlus size={15} />}>Add lane</LoopButton>} />
        ) : (
          <ol className="mt-4 flex flex-col gap-2" aria-label="Lanes">
            {lanes.map((l, i) => {
              const selected = state?.kind === "lane" && state.laneId === l.id;
              return (
                <Card as="li" key={l.id} className={`flex items-center gap-3 p-2 pl-0 ${selected ? "ring-2 ring-copper/30" : ""}`}>
                  <span className="h-10 w-1.5 shrink-0 rounded-r" style={{ background: laneColor(i) }} aria-hidden />
                  <span className="w-6 font-mono text-[11px] text-stone">{i + 1}</span>
                  <button type="button" onClick={() => open({ kind: "lane", laneId: l.id })} className="min-h-(--loop-control) min-w-0 flex-1 rounded-[2px] text-left focus-visible:outline-2 focus-visible:outline-copper">
                    <span className="block truncate text-[15px] font-medium text-ink">{l.name || <span className="font-normal text-stone">Untitled lane — tap to name</span>}</span>
                    <span className="loop-secondary block text-[12px] text-stone">{laneKindMeta[l.kind].label}</span>
                  </button>
                  <div className="flex shrink-0 items-center">
                    <button type="button" aria-label={`Move ${l.name || "lane"} up`} disabled={i === 0} onClick={() => dispatch({ type: "reorder_lane", id: l.id, direction: -1 })} className="inline-flex h-10 w-9 items-center justify-center rounded-[3px] text-graphite hover:bg-ink/5 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-copper"><IconArrowUp size={15} /></button>
                    <button type="button" aria-label={`Move ${l.name || "lane"} down`} disabled={i === lanes.length - 1} onClick={() => dispatch({ type: "reorder_lane", id: l.id, direction: 1 })} className="inline-flex h-10 w-9 items-center justify-center rounded-[3px] text-graphite hover:bg-ink/5 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-copper"><IconArrowDown size={15} /></button>
                  </div>
                </Card>
              );
            })}
          </ol>
        )}
      </div>

      <aside className="flex flex-col gap-5 xl:sticky xl:top-[104px] xl:self-start">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-copper">Boundaries</p>
          <p className="mt-2 text-[14.5px] leading-6 text-ink">
            {map.scope.startsWith.trim() || map.scope.endsWith.trim() ? (
              <>
                From <span className="font-medium">{map.scope.startsWith.trim() || "…"}</span> to <span className="font-medium">{map.scope.endsWith.trim() || "…"}</span>.
              </>
            ) : (
              <span className="text-stone">Set the start and end and the boundaries read back here.</span>
            )}
          </p>
          <p className="mt-2 text-[13px] text-graphite">{lanes.length} lane{lanes.length === 1 ? "" : "s"} · {map.versions.current.steps.length} step{map.versions.current.steps.length === 1 ? "" : "s"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-graphite">Coaching</p>
          {findings.length ? <Coaching items={findings.map((f) => f.message)} /> : <p className="mt-2 text-[13.5px] text-ink">Scope is set. Go map what actually happens.</p>}
          <p className="loop-secondary mt-3 text-[12px] leading-5 text-stone">Guidance only. Nothing here blocks you.</p>
        </Card>
      </aside>
    </div>
  );
}
