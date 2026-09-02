"use client";

import { StageRail as LoopStageRail, StageStrip as LoopStageStrip } from "@/components/loop/StageNav";
import type { StageNavItem } from "@/lib/loop/stages";
import type { Investigation, Stage } from "@/lib/solve/schema";
import { stageMeta, stageOrder, stageState } from "@/lib/solve/stages";

export { StageStateChip } from "@/components/loop/StageNav";

function items(inv: Investigation): StageNavItem[] {
  return stageOrder.map((stage) => {
    const meta = stageMeta[stage];
    return { key: stage, href: `/solve/${inv.id}/${stage}`, label: meta.label, short: meta.short, index: meta.index, state: stageState(inv, stage) };
  });
}

/** Desktop rail (≥1024) and tablet icon rail (768–1023). */
export function StageRail({ inv, current, shopFloor }: { inv: Investigation; current: Stage; shopFloor: boolean }) {
  return <LoopStageRail items={items(inv)} current={current} shopFloor={shopFloor} />;
}

/** Mobile (<768) horizontal navigator, current stage scrolled to center. */
export function StageStrip({ inv, current, shopFloor }: { inv: Investigation; current: Stage; shopFloor: boolean }) {
  return <LoopStageStrip items={items(inv)} current={current} shopFloor={shopFloor} />;
}
