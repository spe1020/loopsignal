"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { IconExpand, IconMinus, IconPlus } from "@/components/loop/icons";
import { IconButton } from "@/components/loop/ui";
import { wrapText, truncate } from "@/lib/loop/svg";
import type { MapLayout, StepBox } from "@/lib/flow/layout";
import { FLOW_LAYOUT } from "@/lib/flow/layout";
import type { Lane, MapVersion, Step } from "@/lib/flow/schema";
import { formatMinutes } from "@/lib/flow/time";
import { COLORS, laneColor, valueClassMeta } from "@/lib/flow/visual";

/**
 * Interactive swimlane. Same layout and visual language as the SVG export;
 * every step is a focusable button, arrows walk the sequence, Enter opens.
 */
export function SwimlaneMap({
  version,
  lanes,
  layout,
  selectedId,
  onSelect,
  onOpen,
  onSelectLane,
  readOnly = false,
  fit = "auto",
  label,
}: {
  version: MapVersion;
  lanes: Lane[];
  layout: MapLayout;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen?: (id: string) => void;
  onSelectLane?: (laneId: string) => void;
  readOnly?: boolean;
  fit?: "auto" | "width" | "none";
  label: string;
}) {
  const stepById = useMemo(() => new Map(version.steps.map((s) => [s.id, s])), [version.steps]);
  const painBy = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of version.painPoints) m.set(p.stepId, (m.get(p.stepId) ?? 0) + 1);
    return m;
  }, [version.painPoints]);
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<"fit" | "manual">(fit === "none" ? "manual" : "fit");

  const fitScale = useCallback(() => {
    const el = container.current;
    if (!el) return 1;
    const avail = el.clientWidth - 2;
    // Readable first: never shrink below 70% by default; scroll instead.
    const s = Math.min(1, avail / layout.width);
    return Math.max(0.7, s);
  }, [layout.width]);

  useEffect(() => {
    if (mode !== "fit") return;
    const apply = () => setScale(fit === "width" ? Math.max(0.3, (container.current?.clientWidth ?? layout.width) / layout.width) : fitScale());
    apply();
    const ro = new ResizeObserver(apply);
    if (container.current) ro.observe(container.current);
    return () => ro.disconnect();
  }, [mode, fit, fitScale, layout.width]);

  const ordered = layout.steps;
  const onKey = (e: KeyboardEvent<SVGGElement>, box: StepBox) => {
    const i = ordered.findIndex((b) => b.id === box.id);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      const n = ordered[i + 1];
      if (n) {
        e.preventDefault();
        onSelect(n.id);
        focusStep(n.id);
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      const p = ordered[i - 1];
      if (p) {
        e.preventDefault();
        onSelect(p.id);
        focusStep(p.id);
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(box.id);
      onOpen?.(box.id);
    }
  };
  const focusStep = (id: string) => {
    container.current?.querySelector<SVGGElement>(`[data-step="${id}"]`)?.focus();
  };

  // Keep the selected step in view.
  useEffect(() => {
    if (!selectedId) return;
    const el = container.current?.querySelector<SVGGElement>(`[data-step="${selectedId}"]`);
    el?.scrollIntoView?.({ inline: "nearest", block: "nearest", behavior: "auto" });
  }, [selectedId]);

  const w = layout.width * scale;
  const h = layout.height * scale;

  return (
    <div className="relative">
      <div className="loop-no-print absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-[3px] border border-line bg-cream/95 p-0.5 shadow-sm">
        <IconButton label="Zoom out" className="min-h-[32px] min-w-[32px]" onClick={() => { setMode("manual"); setScale((s) => Math.max(0.3, s - 0.15)); }}><IconMinus size={14} /></IconButton>
        <span className="w-10 text-center font-mono text-[11px] text-graphite">{Math.round(scale * 100)}%</span>
        <IconButton label="Zoom in" className="min-h-[32px] min-w-[32px]" onClick={() => { setMode("manual"); setScale((s) => Math.min(2, s + 0.15)); }}><IconPlus size={14} /></IconButton>
        <IconButton label="Fit to width" className="min-h-[32px] min-w-[32px]" onClick={() => setMode("fit")}><IconExpand size={14} /></IconButton>
      </div>
      <div ref={container} className="loop-map-scroll overflow-auto rounded-[3px] border border-line bg-white" style={{ touchAction: "pan-x pan-y pinch-zoom" }}>
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={w}
          height={h}
          role="group"
          aria-label={label}
          fontFamily="IBM Plex Sans, system-ui, sans-serif"
          className="block"
        >
          <defs>
            <pattern id="lf-hatch-ui" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke={COLORS.stone} strokeWidth="1.2" opacity="0.55" />
            </pattern>
            <marker id="lf-arrow-ui" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.graphite} />
            </marker>
            <marker id="lf-arrow-red-ui" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.red} />
            </marker>
          </defs>

          {layout.lanes.map((lane) => (
            <g key={lane.id}>
              <rect x={16} y={lane.y} width={layout.width - 32} height={lane.height} fill={lane.index % 2 ? COLORS.paper : "#ffffff"} stroke={COLORS.line} />
              <g
                role={onSelectLane && !readOnly ? "button" : undefined}
                tabIndex={onSelectLane && !readOnly ? 0 : undefined}
                aria-label={onSelectLane ? `Lane ${lane.name || "Untitled"}` : undefined}
                onClick={() => onSelectLane?.(lane.id)}
                onKeyDown={(e) => { if (onSelectLane && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelectLane(lane.id); } }}
                className={onSelectLane && !readOnly ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-copper" : undefined}
              >
                <rect x={16} y={lane.y} width={FLOW_LAYOUT.laneHeaderW} height={lane.height} fill={COLORS.ink} />
                <rect x={16} y={lane.y} width={4} height={lane.height} fill={laneColor(lane.index)} />
                {wrapText(lane.name || "Lane", 16, 3).map((ln, i) => (
                  <text key={i} x={30} y={lane.y + 24 + i * 15} fontSize={12} fontWeight={600} fill={COLORS.cream}>{ln}</text>
                ))}
                <text x={30} y={lane.y + lane.height - 10} fontSize={9} letterSpacing={1} fill="#c9c9c4">{lane.kind.toUpperCase()}</text>
              </g>
            </g>
          ))}

          {layout.waits.map((g) => (
            <g key={`w-${g.stepId}`} aria-hidden>
              <rect x={g.x} y={g.y} width={g.width} height={g.height} fill="url(#lf-hatch-ui)" stroke={COLORS.stone} strokeDasharray="3 3" />
              <text x={g.x + g.width / 2} y={g.y + g.height / 2 + 4} fontSize={10} textAnchor="middle" fill={COLORS.graphite} fontWeight={600}>{g.label}{g.capped ? " ›" : ""}</text>
            </g>
          ))}

          {layout.edges.map((e) => {
            const red = e.kind === "rework";
            return (
              <g key={e.id} aria-hidden>
                <path d={e.path} fill="none" stroke={red ? COLORS.red : COLORS.graphite} strokeWidth={e.kind === "branch" || red ? 1.4 : 1.6} strokeDasharray={e.kind === "branch" ? "5 4" : undefined} markerEnd={`url(#${red ? "lf-arrow-red-ui" : "lf-arrow-ui"})`} />
                {e.kind === "handoff" && e.markerX !== undefined && e.markerY !== undefined ? (
                  <g>
                    <circle cx={e.markerX} cy={e.markerY} r={6} fill="#ffffff" stroke={COLORS.ink} strokeWidth={1.4} />
                    <path d={`M ${e.markerX - 3} ${e.markerY} h 6 M ${e.markerX + 1} ${e.markerY - 2} l 2 2 -2 2`} fill="none" stroke={COLORS.ink} strokeWidth={1.2} />
                  </g>
                ) : null}
                {e.label && e.labelX !== undefined && e.labelY !== undefined ? (
                  <text x={e.labelX} y={e.labelY} fontSize={10} fontStyle="italic" fill={red ? COLORS.red : COLORS.graphite}>{truncate(e.label, 18)}</text>
                ) : null}
              </g>
            );
          })}

          {layout.steps.map((b) => {
            const s = stepById.get(b.id);
            if (!s) return null;
            const selected = b.id === selectedId;
            return (
              <g
                key={b.id}
                data-step={b.id}
                role="button"
                tabIndex={0}
                aria-label={stepAria(s, b, painBy.get(s.id) ?? 0)}
                aria-pressed={selected}
                onClick={() => { onSelect(b.id); if (readOnly) return; onOpen?.(b.id); }}
                onKeyDown={(e) => onKey(e, b)}
                className="cursor-pointer outline-none"
              >
                {selected ? <rect x={b.x - 4} y={b.y - 4} width={b.width + 8} height={b.height + 8} rx={5} fill="none" stroke={COLORS.copper} strokeWidth={2} /> : null}
                <StepShape step={s} box={b} pain={painBy.get(s.id) ?? 0} laneIndex={b.laneIndex} />
              </g>
            );
          })}
        </svg>
      </div>
      {lanes.length === 0 ? <p className="mt-2 text-[13px] text-stone">Add lanes in Scope to see the map.</p> : null}
    </div>
  );
}

function stepAria(s: Step, b: StepBox, pain: number): string {
  const time = s.type === "start" || s.type === "end" ? "" : s.cycleTimeMin === undefined ? ", time unknown" : `, ${formatMinutes(s.cycleTimeMin)}`;
  return `Step ${b.col + 1}: ${s.name || "Untitled"}${s.type !== "process" ? ` (${s.type})` : ""}${time}${s.waitBeforeMin ? `, waits ${formatMinutes(s.waitBeforeMin)} before` : ""}${pain ? `, ${pain} pain point${pain > 1 ? "s" : ""}` : ""}`;
}

export function StepShape({ step: s, box: b, pain, laneIndex }: { step: Step; box: { x: number; y: number; width: number; height: number }; pain: number; laneIndex: number }) {
  const vc = valueClassMeta[s.type === "wait" ? "nva" : s.valueClass];
  const time = s.type === "start" || s.type === "end" ? "" : s.cycleTimeMin === undefined ? "? time" : formatMinutes(s.cycleTimeMin, { compact: true });
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  let body: React.ReactNode;
  if (s.type === "decision") {
    const lines = wrapText(s.name || "Decision?", 16, 2);
    body = (
      <>
        <path d={`M ${cx} ${b.y} L ${b.x + b.width} ${cy} L ${cx} ${b.y + b.height} L ${b.x} ${cy} Z`} fill="#ffffff" stroke={COLORS.ink} strokeWidth={1.4} />
        {lines.map((ln, i) => (
          <text key={i} x={cx} y={cy + 4 + (i - (lines.length - 1) / 2) * 13} fontSize={10.5} textAnchor="middle" fill={COLORS.ink}>{ln}</text>
        ))}
      </>
    );
  } else if (s.type === "start" || s.type === "end") {
    body = (
      <>
        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx={b.height / 2} fill={COLORS.ink} stroke={COLORS.ink} />
        <text x={cx} y={cy + 4} fontSize={10.5} fontWeight={600} textAnchor="middle" fill={COLORS.cream}>{truncate(s.name || (s.type === "start" ? "Start" : "End"), 16)}</text>
      </>
    );
  } else if (s.type === "wait") {
    body = (
      <>
        <rect x={b.x} y={b.y} width={b.width} height={b.height} fill="url(#lf-hatch-ui)" stroke={COLORS.stone} strokeDasharray="3 3" />
        <rect x={b.x + 6} y={cy - 14} width={b.width - 12} height={28} fill="#ffffff" opacity={0.92} />
        <text x={cx} y={cy - 2} fontSize={10.5} textAnchor="middle" fill={COLORS.ink}>{truncate(s.name || "Wait", 22)}</text>
        <text x={cx} y={cy + 10} fontSize={10} textAnchor="middle" fontWeight={600} fill={COLORS.graphite}>{time}</text>
      </>
    );
  } else {
    body = (
      <>
        <rect x={b.x} y={b.y} width={b.width} height={b.height} rx={3} fill="#ffffff" stroke={s.type === "inspection" ? COLORS.graphite : "#c9c9c4"} strokeWidth={1.2} />
        <rect x={b.x} y={b.y} width={3} height={b.height} fill={laneColor(laneIndex)} />
        <rect x={b.x} y={b.y + b.height - 3} width={b.width} height={3} fill={vc.color} />
        {s.type === "inspection" ? <rect x={b.x + 3} y={b.y + 3} width={b.width - 6} height={b.height - 9} fill="none" stroke={COLORS.line} strokeWidth={1} /> : null}
        {wrapText(s.name || "Untitled step", 22, 2).map((ln, i) => (
          <text key={i} x={b.x + 10} y={b.y + 19 + i * 14} fontSize={11} fill={COLORS.ink}>{ln}</text>
        ))}
        <text x={b.x + 10} y={b.y + b.height - 10} fontSize={10} fontWeight={600} fill={s.cycleTimeMin === undefined ? COLORS.amber : COLORS.graphite}>{time}</text>
        <text x={b.x + b.width - 8} y={b.y + b.height - 10} fontSize={9} textAnchor="end" letterSpacing={0.6} fill={vc.color}>{vc.short}</text>
      </>
    );
  }
  return (
    <>
      {body}
      {pain > 0 ? (
        <>
          <circle cx={b.x + b.width - 2} cy={b.y + 2} r={7} fill={COLORS.copper} stroke="#ffffff" strokeWidth={1.5} />
          <text x={b.x + b.width - 2} y={b.y + 5.5} fontSize={9} fontWeight={700} textAnchor="middle" fill="#ffffff">!</text>
        </>
      ) : null}
    </>
  );
}
