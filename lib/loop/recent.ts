import { completionPercent as flowCompletion } from "@/lib/flow/completion";
import { duplicateMap, exportFilename as flowFilename, serialize as serializeMap } from "@/lib/flow/io";
import { computeMetrics } from "@/lib/flow/metrics";
import type { ProcessMap } from "@/lib/flow/schema";
import { statusLabels as flowStatusLabels } from "@/lib/flow/status";
import { deleteMap, listMaps, nextMapNumber, saveMap } from "@/lib/flow/storage";
import { formatMinutes } from "@/lib/flow/time";
import { completionPercent as solveCompletion } from "@/lib/solve/completion";
import { duplicateInvestigation, exportFilename as solveFilename, serialize as serializeInvestigation } from "@/lib/solve/io";
import type { Investigation } from "@/lib/solve/schema";
import { statusLabels as solveStatusLabels } from "@/lib/solve/status";
import { deleteInvestigation, listInvestigations, nextRcaNumber, saveInvestigation } from "@/lib/solve/storage";

/**
 * One list for everything stored in this browser, whichever tool made it.
 * Both homes render it so nobody wonders where a thing lives.
 */

export type RecentTool = "solve" | "flow";
export type RecentTone = "neutral" | "amber" | "red" | "green" | "blue" | "copper" | "ink";

export type RecentItem = {
  tool: RecentTool;
  toolLabel: string;
  id: string;
  number: string;
  title: string;
  untitled: string;
  subtitle?: string;
  status: { label: string; tone: RecentTone };
  owner?: string;
  createdAt: string;
  updatedAt: string;
  completion: number;
  detail: string;
  href: string;
  doc: Investigation | ProcessMap;
};

const solveTone: Record<Investigation["status"], RecentTone> = { draft: "neutral", investigating: "blue", action_open: "amber", verification: "copper", reopened: "red", closed: "green" };
const flowTone: Record<ProcessMap["status"], RecentTone> = { draft: "neutral", current_mapped: "blue", future_drafted: "copper", improving: "amber", complete: "green" };

export function solveItem(inv: Investigation): RecentItem {
  return {
    tool: "solve",
    toolLabel: "Investigation",
    id: inv.id,
    number: inv.rcaNumber,
    title: inv.title,
    untitled: "Untitled investigation",
    status: { label: solveStatusLabels[inv.status], tone: solveTone[inv.status] },
    owner: inv.owner,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
    completion: solveCompletion(inv),
    detail: `${inv.causes.length} causes · ${inv.actions.length} actions`,
    href: `/solve/${inv.id}`,
    doc: inv,
  };
}

export function flowItem(map: ProcessMap): RecentItem {
  const m = computeMetrics(map.versions.current, map.lanes);
  return {
    tool: "flow",
    toolLabel: "Process map",
    id: map.id,
    number: map.mapNumber,
    title: map.title,
    untitled: "Untitled map",
    subtitle: map.process,
    status: { label: flowStatusLabels[map.status], tone: flowTone[map.status] },
    owner: map.owner,
    createdAt: map.createdAt,
    updatedAt: map.updatedAt,
    completion: flowCompletion(map),
    detail: `${map.lanes.length} lanes · ${map.versions.current.steps.length} steps · ${m.leadTimeMin ? `${formatMinutes(m.leadTimeMin, { compact: true })} lead` : "no times yet"}`,
    href: `/flow/${map.id}`,
    doc: map,
  };
}

export async function listRecent(): Promise<RecentItem[]> {
  const [invs, maps] = await Promise.all([listInvestigations(), listMaps()]);
  return [...invs.map(solveItem), ...maps.map(flowItem)].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function duplicateRecent(item: RecentItem): Promise<RecentItem> {
  if (item.tool === "solve") {
    const copy = duplicateInvestigation(item.doc as Investigation, nextRcaNumber());
    await saveInvestigation(copy);
    return solveItem(copy);
  }
  const copy = duplicateMap(item.doc as ProcessMap, nextMapNumber());
  await saveMap(copy);
  return flowItem(copy);
}

export function exportRecent(item: RecentItem): { filename: string; text: string } {
  if (item.tool === "solve") return { filename: solveFilename(item.doc as Investigation), text: serializeInvestigation(item.doc as Investigation) };
  return { filename: flowFilename(item.doc as ProcessMap), text: serializeMap(item.doc as ProcessMap) };
}

export async function deleteRecent(item: RecentItem): Promise<void> {
  if (item.tool === "solve") await deleteInvestigation(item.id);
  else await deleteMap(item.id);
}

export async function restoreRecent(item: RecentItem): Promise<void> {
  if (item.tool === "solve") await saveInvestigation(item.doc as Investigation);
  else await saveMap(item.doc as ProcessMap);
}
