import type { StageNavItem, StageState } from "@/lib/loop/stages";
import { completionParts } from "./completion";
import { diffVersions } from "./diff";
import { softFindings } from "./rules";
import type { ProcessMap, Stage } from "./schema";
import { stages } from "./schema";

export type StageMeta = { stage: Stage; label: string; short: string; index: number; prompt: string };

export const stageMeta: Record<Stage, StageMeta> = {
  scope: { stage: "scope", label: "Scope", short: "Scope", index: 1, prompt: "Where does the process start and end, and who touches it?" },
  map: { stage: "map", label: "Map", short: "Map", index: 2, prompt: "Map what actually happens, with times." },
  analyze: { stage: "analyze", label: "Analyze", short: "Analyze", index: 3, prompt: "See where the time and the handoffs are." },
  future: { stage: "future", label: "Future", short: "Future", index: 4, prompt: "Draw the future state and explain every change." },
  summary: { stage: "summary", label: "Summary", short: "Report", index: 5, prompt: "Print the report; link the investigations." },
};

export const stageOrder: Stage[] = [...stages];

export function nextStage(stage: Stage): Stage | null {
  const i = stageOrder.indexOf(stage);
  return i >= 0 && i < stageOrder.length - 1 ? stageOrder[i + 1] : null;
}

export function prevStage(stage: Stage): Stage | null {
  const i = stageOrder.indexOf(stage);
  return i > 0 ? stageOrder[i - 1] : null;
}

export function stageState(map: ProcessMap, stage: Stage): StageState {
  const parts = Object.fromEntries(completionParts(map).map((p) => [p.key, p.done]));
  const cur = map.versions.current;
  switch (stage) {
    case "scope": {
      if (parts.scope) return "complete";
      const any = map.scope.startsWith || map.scope.endsWith || map.lanes.length > 0 || map.title;
      return any ? "in_progress" : "empty";
    }
    case "map": {
      if (cur.steps.length === 0) return "empty";
      if (parts.steps && parts.times) return "complete";
      const unknownHeavy = softFindings(map).some((f) => f.code === "unknown_time" || f.code === "unclassified");
      return cur.steps.length >= 5 && unknownHeavy ? "needs_attention" : "in_progress";
    }
    case "analyze": {
      if (cur.steps.length < 2) return "empty";
      if (parts.pain) return "complete";
      return "in_progress";
    }
    case "future": {
      const f = map.versions.future;
      if (!f) return "empty";
      const diff = diffVersions(cur, f);
      if (diff.changeCount === 0) return "in_progress";
      return diff.missingRationale.length ? "needs_attention" : "complete";
    }
    case "summary":
      return map.status === "complete" ? "verified" : map.versions.future ? "in_progress" : "empty";
  }
}

export function stageNavItems(map: ProcessMap): StageNavItem[] {
  return stageOrder.map((stage) => {
    const m = stageMeta[stage];
    return { key: stage, href: `/flow/${map.id}/${stage}`, label: m.label, short: m.short, index: m.index, state: stageState(map, stage) };
  });
}
