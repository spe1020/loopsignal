"use client";

import { IconAlert, IconClock } from "@/components/loop/icons";
import { Chip } from "@/components/loop/ui";
import type { Lane, MapVersion, Step, VersionKind } from "@/lib/flow/schema";
import { formatMinutes } from "@/lib/flow/time";
import { laneColor, stepTypeMeta, valueClassMeta } from "@/lib/flow/visual";
import { Stopwatch } from "./Stopwatch";

/**
 * Mobile / Shop Floor view: the sequence as a vertical list. Wait time is a
 * line above the row, branches are indented under their decision, and every
 * timed row carries a stopwatch so a step can be timed standing next to it.
 */
export function StepList({
  version,
  kind,
  steps,
  laneById,
  selectedId,
  onOpen,
  bigStopwatch = false,
}: {
  version: MapVersion;
  kind: VersionKind;
  steps: Step[];
  laneById: Map<string, { lane: Lane; index: number }>;
  selectedId: string | null;
  onOpen: (id: string) => void;
  bigStopwatch?: boolean;
}) {
  const painBy = new Map<string, number>();
  for (const p of version.painPoints) painBy.set(p.stepId, (painBy.get(p.stepId) ?? 0) + 1);
  const byId = new Map(steps.map((s) => [s.id, s]));
  const branches = version.edges.filter((e) => !e.isPrimary);
  return (
    <ol className="flex flex-col gap-2" aria-label="Steps in sequence">
      {steps.map((s, i) => {
        const laneInfo = laneById.get(s.laneId);
        const vc = valueClassMeta[s.type === "wait" ? "nva" : s.valueClass];
        const timed = s.type !== "start" && s.type !== "end";
        const pain = painBy.get(s.id) ?? 0;
        const selected = s.id === selectedId;
        const outs = branches.filter((e) => e.fromStepId === s.id);
        return (
          <li key={s.id}>
            {s.waitBeforeMin ? (
              <p className="mb-1 flex items-center gap-1.5 pl-2 text-[12.5px] text-graphite">
                <IconClock size={12} /> waits {formatMinutes(s.waitBeforeMin)}
              </p>
            ) : null}
            <div className={`rounded-[3px] border bg-cream ${selected ? "border-copper ring-2 ring-copper/25" : "border-line"} ${s.type === "wait" ? "loop-hatch" : ""}`}>
              <div className="flex items-stretch">
                <span className="w-1.5 shrink-0 rounded-l" style={{ background: laneColor(laneInfo?.index ?? 0) }} aria-hidden />
                <button type="button" onClick={() => onOpen(s.id)} className="min-h-(--loop-control) min-w-0 flex-1 px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-copper">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-stone">
                    <span className="font-mono">{i + 1}</span>
                    <span className="font-medium text-graphite">{laneInfo?.lane.name || "No lane"}</span>
                    {s.type !== "process" ? <span>· {stepTypeMeta[s.type].label}</span> : null}
                    {pain ? <span className="inline-flex items-center gap-1 text-copper"><IconAlert size={11} /> {pain}</span> : null}
                  </span>
                  <span className={`mt-0.5 block text-[15px] leading-6 ${s.type === "start" || s.type === "end" ? "font-medium" : ""} text-ink`}>
                    {s.name || <span className="text-stone">Untitled step — tap to edit</span>}
                  </span>
                  {timed ? (
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`font-mono text-[12.5px] ${s.cycleTimeMin === undefined ? "text-risk-amber" : "text-graphite"}`}>{s.cycleTimeMin === undefined ? "time unknown" : formatMinutes(s.cycleTimeMin)}</span>
                      <Chip tone={vc.short === "VA" ? "green" : vc.short === "NNVA" ? "amber" : vc.short === "NVA" ? "red" : "neutral"}>{vc.short}</Chip>
                    </span>
                  ) : null}
                </button>
                {timed ? (
                  <div className="flex shrink-0 items-center pr-2">
                    <Stopwatch stepId={s.id} version={kind} size={bigStopwatch ? "lg" : "md"} label={`Time ${s.name || "this step"}`} />
                  </div>
                ) : null}
              </div>
              {outs.length ? (
                <ul className="border-t border-line/70 px-3 py-1.5 pl-6 text-[12.5px] text-graphite">
                  {outs.map((e) => {
                    const t = byId.get(e.toStepId);
                    const back = t ? t.order <= s.order : false;
                    return (
                      <li key={e.id} className={back ? "text-risk-critical" : ""}>
                        {e.label || "Branch"} → {back ? "back to" : "skip to"} step {t ? t.order + 1 : "?"}{t?.name ? `: ${t.name}` : ""}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
