"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Investigation, Stage } from "@/lib/solve/schema";
import { stageMeta, stageOrder, stageState, stageStateLabels, type StageState } from "@/lib/solve/stages";
import { IconAlert, IconCheck, IconCircle, IconDot, IconShield } from "./icons";

const stateTone: Record<StageState, { className: string; icon: React.ReactNode }> = {
  empty: { className: "text-stone", icon: <IconCircle size={12} /> },
  in_progress: { className: "text-risk-confirm", icon: <IconDot size={12} /> },
  needs_attention: { className: "text-risk-amber", icon: <IconAlert size={12} /> },
  complete: { className: "text-risk-track", icon: <IconCheck size={12} /> },
  verified: { className: "text-risk-track", icon: <IconShield size={12} /> },
};

export function StageStateChip({ state, short = false }: { state: StageState; short?: boolean }) {
  const t = stateTone[state];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium tracking-[0.02em] ${t.className}`}>
      {t.icon}
      <span className={short ? "sr-only md:not-sr-only" : ""}>{stageStateLabels[state]}</span>
    </span>
  );
}

/** Desktop rail (≥1024) and tablet icon rail (768–1023). */
export function StageRail({ inv, current, shopFloor }: { inv: Investigation; current: Stage; shopFloor: boolean }) {
  return (
    <nav aria-label="Stages" className="solve-chrome hidden md:block">
      <ol className="flex flex-col gap-1">
        {stageOrder.map((stage) => {
          const meta = stageMeta[stage];
          const state = stageState(inv, stage);
          const active = stage === current;
          return (
            <li key={stage}>
              <Link
                href={`/solve/${inv.id}/${stage}`}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-(--solve-control) items-center gap-3 rounded-[3px] border px-2.5 py-2 transition-colors lg:px-3 ${
                  active
                    ? "border-ink bg-ink text-cream"
                    : "border-transparent text-graphite hover:border-line hover:bg-cream hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] ${
                    active ? "border-cream/40 text-cream" : "border-ink/20 text-graphite group-hover:border-ink/50"
                  }`}
                >
                  {meta.index}
                </span>
                <span className="hidden min-w-0 flex-1 lg:block">
                  <span className="block truncate text-[13.5px] font-medium">{meta.label}</span>
                  {!shopFloor ? (
                    <span className={active ? "[&_*]:text-cream/80" : ""}>
                      <StageStateChip state={state} />
                    </span>
                  ) : null}
                </span>
                <span className="lg:hidden">
                  <span className="sr-only">{meta.label}</span>
                  <span className={active ? "[&_*]:text-cream/80" : ""}>
                    <StageStateChip state={state} short />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Mobile (<768) horizontal navigator, current stage scrolled to center. */
export function StageStrip({ inv, current, shopFloor }: { inv: Investigation; current: Stage; shopFloor: boolean }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-stage="${current}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
  }, [current]);
  return (
    <nav aria-label="Stages" className="solve-chrome -mx-4 min-w-0 border-b border-line bg-cream md:hidden">
      <ol ref={ref} className="flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
        {stageOrder.map((stage) => {
          const meta = stageMeta[stage];
          const state = stageState(inv, stage);
          const active = stage === current;
          return (
            <li key={stage} data-stage={stage} className="shrink-0">
              <Link
                href={`/solve/${inv.id}/${stage}`}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-(--solve-control) flex-col justify-center rounded-[3px] border px-3 py-1.5 ${
                  active ? "border-ink bg-ink text-cream" : "border-line bg-paper text-graphite"
                }`}
              >
                <span className="text-[13px] font-medium whitespace-nowrap">
                  <span className="mr-1.5 font-mono text-[11px] opacity-70">{meta.index}</span>
                  {shopFloor ? meta.short : meta.label}
                </span>
                {!shopFloor ? (
                  <span className={active ? "[&_*]:text-cream/80" : ""}>
                    <StageStateChip state={state} />
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
