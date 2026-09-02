import { formatDate, formatDateTime } from "@/lib/loop/format";
import { diffVersions } from "./diff";
import { computeMetrics, metricsDelta, orderedSteps } from "./metrics";
import type { ProcessMap } from "./schema";
import { statusLabels } from "./status";
import { formatMinutes } from "./time";
import { painCategoryMeta, severityMeta, valueClassMeta } from "./visual";

export type ReportSection = { key: string; title: string };

export const reportSections: ReportSection[] = [
  { key: "scope", title: "Scope" },
  { key: "lanes", title: "Lanes" },
  { key: "current", title: "Current-state map" },
  { key: "metrics", title: "Metrics" },
  { key: "waits", title: "Waits and handoffs" },
  { key: "pain", title: "Pain points and investigations" },
  { key: "future", title: "Future-state map" },
  { key: "delta", title: "Delta" },
  { key: "rationale", title: "Change rationale" },
  { key: "history", title: "History" },
];

export function formatDeltaValue(v: number | null, format: "time" | "count" | "percent"): string {
  if (v === null) return "—";
  if (format === "time") return formatMinutes(v);
  if (format === "percent") return `${(v * 100).toFixed(1)}%`;
  return String(v);
}

export function formatChange(v: number | null, format: "time" | "count" | "percent"): string {
  if (v === null) return "—";
  if (v === 0) return "no change";
  const sign = v > 0 ? "+" : "−";
  const abs = Math.abs(v);
  if (format === "time") return `${sign}${formatMinutes(abs)}`;
  if (format === "percent") return `${sign}${(abs * 100).toFixed(1)} pts`;
  return `${sign}${abs}`;
}

/** Markdown summary for the clipboard. Deterministic, text only. */
export function reportMarkdown(map: ProcessMap, opts: { investigationStatus?: (id: string) => string | undefined } = {}): string {
  const lanes = new Map(map.lanes.map((l) => [l.id, l.name]));
  const cur = map.versions.current;
  const fut = map.versions.future;
  const m = computeMetrics(cur, map.lanes);
  const h = (key: string) => `## ${reportSections.find((s) => s.key === key)!.title}`;
  const L: string[] = [];
  L.push(`# ${map.mapNumber} — ${map.title || "Untitled map"}`);
  L.push("");
  L.push(`Status: ${statusLabels[map.status]}${map.process ? ` · Process: ${map.process}` : ""}${map.owner ? ` · Owner: ${map.owner}` : ""}${map.department ? ` · ${map.department}` : ""}${map.site ? ` · ${map.site}` : ""}`);
  L.push(`Created ${formatDate(map.createdAt)} · Updated ${formatDate(map.updatedAt)}`);
  L.push("");
  L.push(h("scope"));
  L.push(`- Starts with: ${map.scope.startsWith || "—"}`);
  L.push(`- Ends with: ${map.scope.endsWith || "—"}`);
  L.push("");
  L.push(h("lanes"));
  for (const l of [...map.lanes].sort((a, b) => a.order - b.order)) L.push(`- ${l.name} _(${l.kind})_`);
  L.push("");
  L.push(h("current"));
  L.push("| # | Step | Lane | Wait before | Cycle time | Class |");
  L.push("| --- | --- | --- | --- | --- | --- |");
  for (const s of orderedSteps(cur)) L.push(`| ${s.order + 1} | ${s.name || "Untitled"}${s.type === "decision" ? " (decision)" : s.type === "wait" ? " (wait)" : ""} | ${lanes.get(s.laneId) ?? ""} | ${s.waitBeforeMin ? formatMinutes(s.waitBeforeMin) : "—"} | ${s.type === "start" || s.type === "end" ? "—" : formatMinutes(s.cycleTimeMin, { unknown: "unknown" })} | ${valueClassMeta[s.valueClass].short} |`);
  L.push("");
  L.push(h("metrics"));
  L.push(`- Lead time: ${formatMinutes(m.leadTimeMin)}`);
  L.push(`- Touch time: ${formatMinutes(m.touchTimeMin)}`);
  L.push(`- Waiting: ${formatMinutes(m.waitTimeMin)}`);
  L.push(`- Process cycle efficiency: ${m.pce === null ? "—" : `${(m.pce * 100).toFixed(1)}%`}`);
  L.push(`- Value-adding ${formatMinutes(m.value.va.min)} · Necessary non-value ${formatMinutes(m.value.nnva.min)} · Non-value ${formatMinutes(m.value.nva.min)}`);
  L.push(`- Handoffs: ${m.handoffCount} · Rework loops: ${m.reworkLoops.length} · Steps with unknown time: ${m.unknownTimeStepIds.length}`);
  L.push("");
  L.push(h("waits"));
  const waits = orderedSteps(cur).filter((s) => (s.waitBeforeMin ?? 0) > 0).sort((a, b) => (b.waitBeforeMin ?? 0) - (a.waitBeforeMin ?? 0)).slice(0, 5);
  if (!waits.length) L.push("_No waits recorded._");
  for (const s of waits) L.push(`- ${formatMinutes(s.waitBeforeMin)} before "${s.name}" (${lanes.get(s.laneId) ?? ""})`);
  const stepName = (id: string) => cur.steps.find((s) => s.id === id)?.name ?? "";
  for (const hd of m.handoffs) L.push(`- Handoff ${lanes.get(hd.fromLaneId)} → ${lanes.get(hd.toLaneId)} at "${stepName(hd.toStepId)}" — trigger: ${hd.trigger ?? "no trigger recorded"}${hd.waitAfterMin ? `, then ${formatMinutes(hd.waitAfterMin)} wait` : ""}`);
  L.push("");
  L.push(h("pain"));
  if (!cur.painPoints.length) L.push(map.noPainPoints ? "_Reviewed: no pain points recorded._" : "_None recorded._");
  for (const p of cur.painPoints) {
    const st = p.investigationId ? opts.investigationStatus?.(p.investigationId) : undefined;
    L.push(`- [${severityMeta[p.severity].label} · ${painCategoryMeta[p.category].label}] ${p.text} — at "${stepName(p.stepId)}"${p.investigationId ? ` — LoopSolve investigation${st ? ` (${st})` : ""}` : ""}`);
  }
  L.push("");
  if (fut) {
    const fm = computeMetrics(fut, map.lanes);
    const diff = diffVersions(cur, fut);
    L.push(h("future"));
    L.push("| # | Step | Lane | Wait before | Cycle time | Class |");
    L.push("| --- | --- | --- | --- | --- | --- |");
    for (const s of orderedSteps(fut)) L.push(`| ${s.order + 1} | ${s.name || "Untitled"} | ${lanes.get(s.laneId) ?? ""} | ${s.waitBeforeMin ? formatMinutes(s.waitBeforeMin) : "—"} | ${s.type === "start" || s.type === "end" ? "—" : formatMinutes(s.cycleTimeMin, { unknown: "unknown" })} | ${valueClassMeta[s.valueClass].short} |`);
    L.push("");
    L.push(h("delta"));
    L.push("| Metric | Current | Future | Change |");
    L.push("| --- | --- | --- | --- |");
    for (const d of metricsDelta(m, fm)) L.push(`| ${d.label} | ${formatDeltaValue(d.current, d.format)} | ${formatDeltaValue(d.future, d.format)} | ${formatChange(d.change, d.format)} |`);
    L.push("");
    L.push(h("rationale"));
    if (!diff.changeCount) L.push("_No changes yet._");
    for (const e of diff.entries) {
      if (e.kind === "unchanged") continue;
      const r = fut.rationale[e.key]?.text?.trim();
      const name = e.kind === "removed" ? e.currentStep.name : e.futureStep.name;
      const what = e.kind === "removed" ? "Removed" : e.kind === "added" ? "Added" : `Changed (${e.changes.map((c) => c.field).join(", ")})`;
      L.push(`- **${what}:** ${name || "Untitled"} — ${r || "_no rationale yet_"}`);
    }
    L.push("");
  }
  L.push(h("history"));
  for (const e of map.history) L.push(`- ${formatDateTime(e.at)} — ${e.type.replace(/_/g, " ")}${e.note ? `: ${e.note}` : ""}`);
  L.push("");
  L.push("_Generated with LoopFlow by LoopSignal._");
  return L.join("\n");
}
