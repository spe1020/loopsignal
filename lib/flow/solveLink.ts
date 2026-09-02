import { newId, nowIso } from "@/lib/loop/ids";
import { createInvestigation } from "@/lib/solve/reducer";
import type { Investigation } from "@/lib/solve/schema";
import { generateStatement } from "@/lib/solve/text";
import type { LinkedInvestigation, PainPoint, ProcessMap, Step } from "./schema";

/**
 * Start a LoopSolve investigation from a step or pain point. Pre-fills the
 * problem from the map and records the source so both tools link each other.
 * Pure: the caller saves the investigation and dispatches `link_investigation`.
 */
export function investigationFromMap(input: {
  map: ProcessMap;
  step: Step;
  pain?: PainPoint;
  rcaNumber: string;
}): { investigation: Investigation; link: LinkedInvestigation; note: string } {
  const { map, step, pain, rcaNumber } = input;
  const lane = map.lanes.find((l) => l.id === step.laneId);
  const at = nowIso();
  const note = `Opened from LoopFlow ${map.mapNumber} · step ${step.order + 1}${step.name ? ` (${step.name})` : ""}.`;
  const inv = createInvestigation({ rcaNumber, title: pain?.text ? pain.text : step.name ? `${step.name}: ${lane?.name ?? "process"} issue` : "" });
  inv.department = lane?.kind === "department" ? lane.name : map.department;
  inv.problem = {
    ...inv.problem,
    whatHappened: pain?.text ?? "",
    where: [lane?.name, step.name].filter(Boolean).join(" · "),
    process: map.process || map.title || undefined,
    department: lane?.kind === "department" ? lane.name : map.department,
  };
  inv.problem.generatedStatement = generateStatement(inv.problem);
  inv.source = { tool: "flow", mapId: map.id, mapNumber: map.mapNumber, stepId: step.id, painPointId: pain?.id, label: `${map.mapNumber} · step ${step.order + 1}` };
  inv.history = [...inv.history, { id: newId(), at, type: "created", note }];
  const link: LinkedInvestigation = { id: newId(), investigationId: inv.id, stepId: step.id, painPointId: pain?.id, openedAt: at, lastKnownStatus: inv.status };
  return { investigation: inv, link, note };
}

export function flowStepHref(mapId: string, stepId?: string, version: "current" | "future" = "current"): string {
  const q = new URLSearchParams();
  if (stepId) q.set("step", stepId);
  if (version === "future") q.set("version", "future");
  const qs = q.toString();
  return `/flow/${mapId}/map${qs ? `?${qs}` : ""}`;
}
