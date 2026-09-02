"use client";

import { useEffect, useRef, useState } from "react";
import { IconPause, IconPlay } from "@/components/loop/icons";
import { trackFlow } from "@/lib/flow/analytics";
import type { VersionKind } from "@/lib/flow/schema";
import { newId, nowIso } from "@/lib/loop/ids";
import { useMap } from "../MapProvider";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m % 60)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

/**
 * Tap start, tap stop. Stop appends a TimeObservation; the reducer sets the
 * step's cycle time to the median of its observations and marks it observed.
 * Durations round to the nearest minute with a floor of one, so a fast step
 * is never recorded as "0".
 */
export function Stopwatch({ stepId, version, size = "md", label = "Start timing this step" }: { stepId: string; version: VersionKind; size?: "md" | "lg"; label?: string }) {
  const { map, dispatch } = useMap();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const raf = useRef<number | null>(null);
  const big = size === "lg" || map.shopFloorMode;

  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => {
      setElapsed(Date.now() - startedAt);
      raf.current = window.requestAnimationFrame(tick);
    };
    raf.current = window.requestAnimationFrame(tick);
    return () => {
      if (raf.current) window.cancelAnimationFrame(raf.current);
    };
  }, [startedAt]);

  function toggle() {
    if (startedAt === null) {
      setElapsed(0);
      setStartedAt(Date.now());
      return;
    }
    const ms = Date.now() - startedAt;
    setStartedAt(null);
    const durationMin = Math.max(1, Math.round(ms / 60000));
    dispatch({ type: "add_observation", version, stepId, observation: { id: newId(), at: nowIso(), durationMin, note: ms < 60000 ? `${Math.round(ms / 1000)} s, rounded up` : undefined } });
    trackFlow("loopflow_observation_recorded", { stage: "map", minutes: durationMin });
  }

  const running = startedAt !== null;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={running}
      aria-label={running ? `Stop timing at ${fmt(elapsed)}` : label}
      className={`inline-flex items-center justify-center gap-2 rounded-[3px] border font-mono font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-copper ${
        running ? "border-copper bg-copper text-white" : "border-ink/25 bg-cream text-ink hover:border-ink"
      } ${big ? "min-h-[64px] min-w-[160px] px-5 text-[22px]" : "min-h-(--loop-control) min-w-[120px] px-3 text-[14px]"}`}
    >
      {running ? <IconPause size={big ? 20 : 15} /> : <IconPlay size={big ? 20 : 15} />}
      {running ? <>Stop {fmt(elapsed)}</> : "Start"}
    </button>
  );
}
