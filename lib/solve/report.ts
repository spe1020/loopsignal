import { formatDate, formatDateTime } from "./format";
import type { Investigation } from "./schema";
import { statusLabels } from "./status";

export type ReportSection = {
  key: string;
  standard: string;
  eightD: string;
};

export const reportSections: ReportSection[] = [
  { key: "problem", standard: "Problem Statement", eightD: "D2 · Problem Description" },
  { key: "impact", standard: "Impact", eightD: "D2 · Impact" },
  { key: "containment", standard: "Containment", eightD: "D3 · Interim Containment" },
  { key: "investigation", standard: "Investigation Summary", eightD: "D4 · Root Cause Analysis" },
  { key: "whys", standard: "Five Whys", eightD: "D4 · Five Whys" },
  { key: "fishbone", standard: "Fishbone", eightD: "D4 · Cause and Effect" },
  { key: "roots", standard: "Root Causes", eightD: "D4 · Root Causes" },
  { key: "corrective", standard: "Corrective Actions", eightD: "D5/D6 · Permanent Corrective Actions" },
  { key: "preventive", standard: "Preventive Actions", eightD: "D7 · Prevent Recurrence" },
  { key: "verification", standard: "Verification", eightD: "D6 · Validation of Effectiveness" },
  { key: "lessons", standard: "Lessons Learned", eightD: "D8 · Recognize the Team / Lessons" },
  { key: "history", standard: "History", eightD: "D0/D8 · Timeline of the Investigation" },
];

const stateLabel: Record<string, string> = { assumption: "Assumption", observed: "Observed", data_supported: "Data-supported", verified: "Verified", disproved: "Disproved" };
const resultLabel: Record<string, string> = { effective: "Effective", partially_effective: "Partially effective", not_effective: "Not effective", monitoring: "Monitoring" };
const contLabel: Record<string, string> = { open: "Open", in_progress: "In progress", verified: "Verified", released: "Released" };
const actLabel: Record<string, string> = { open: "Open", in_progress: "In progress", ready_for_verification: "Ready to verify", complete: "Complete" };

/** Markdown summary for the clipboard. Deterministic, text only. */
export function reportMarkdown(inv: Investigation, eightD = false): string {
  const h = (key: string) => {
    const s = reportSections.find((x) => x.key === key)!;
    return `## ${eightD ? s.eightD : s.standard}`;
  };
  const byId = new Map(inv.causes.map((c) => [c.id, c]));
  const evById = new Map(inv.evidence.map((e) => [e.id, e]));
  const lines: string[] = [];
  lines.push(`# ${inv.rcaNumber} — ${inv.title || "Untitled investigation"}`);
  lines.push("");
  lines.push(`Status: ${statusLabels[inv.status]}${inv.owner ? ` · Owner: ${inv.owner}` : ""}${inv.department ? ` · ${inv.department}` : ""}`);
  lines.push(`Created ${formatDate(inv.createdAt)} · Updated ${formatDate(inv.updatedAt)}${inv.closedAt ? ` · Closed ${formatDate(inv.closedAt)}` : ""}`);
  lines.push("");
  lines.push(h("problem"));
  lines.push(inv.problem.generatedStatement || "_Not yet defined._");
  lines.push("");
  lines.push(h("impact"));
  const flags = Object.entries(inv.problem.impactFlags).filter(([, v]) => v).map(([k]) => k);
  lines.push(`- Impact: ${inv.problem.impact || "—"}`);
  lines.push(`- Affected: ${inv.problem.affected || "—"}`);
  lines.push(`- Impact areas: ${flags.length ? flags.join(", ") : "—"}`);
  if (inv.problem.financialImpactNote) lines.push(`- Financial: ${inv.problem.financialImpactNote}`);
  lines.push("");
  lines.push(h("containment"));
  if (inv.containment.length === 0) lines.push("_None recorded._");
  for (const c of inv.containment) lines.push(`- [${contLabel[c.status]}] ${c.action}${c.owner ? ` — ${c.owner}` : ""}${c.scope ? ` (scope: ${c.scope})` : ""}${c.verificationNote ? ` — check: ${c.verificationNote}` : ""}`);
  lines.push("");
  lines.push(h("investigation"));
  lines.push(`${inv.causes.length} causes examined · ${inv.evidence.length} evidence items · ${inv.evidenceLinks.length} links · ${inv.timeline.length} timeline events`);
  if (inv.timeline.length) {
    lines.push("");
    for (const t of [...inv.timeline].sort((a, b) => a.at.localeCompare(b.at))) lines.push(`- ${formatDateTime(t.at)} — ${t.text}`);
  }
  lines.push("");
  lines.push(h("whys"));
  const render = (parentId: string | null, depth: number) => {
    for (const c of inv.causes.filter((x) => x.parentId === parentId && !(x.origin === "fishbone" && x.parentId === null)).sort((a, b) => a.order - b.order)) {
      lines.push(`${"  ".repeat(depth)}- Why ${depth + 1}: ${c.text} _(${stateLabel[c.evidenceState]}${c.classification !== "unclassified" ? `, ${c.classification}` : ""})_`);
      render(c.id, depth + 1);
    }
  };
  render(null, 0);
  lines.push("");
  lines.push(h("fishbone"));
  for (const cat of [...inv.fishboneCategories].sort((a, b) => a.order - b.order)) {
    const items = inv.causes.filter((c) => c.parentId === null && c.categoryId === cat.id);
    if (!items.length) continue;
    lines.push(`- **${cat.name}**: ${items.map((c) => `${c.text} (${stateLabel[c.evidenceState]})`).join("; ")}`);
  }
  lines.push("");
  lines.push(h("roots"));
  const roots = inv.causes.filter((c) => c.classification === "root");
  if (!roots.length) lines.push("_No root cause classified yet._");
  for (const r of roots) {
    const ev = inv.evidenceLinks.filter((l) => l.causeId === r.id && l.relation === "supports").map((l) => evById.get(l.evidenceId)?.title).filter(Boolean);
    lines.push(`- **${r.text}**`);
    if (r.rootCauseRationale) lines.push(`  - Rationale: ${r.rootCauseRationale}`);
    lines.push(`  - Evidence state: ${stateLabel[r.evidenceState]}${ev.length ? ` — supported by ${ev.join("; ")}` : ""}`);
  }
  const contributing = inv.causes.filter((c) => c.classification === "contributing");
  if (contributing.length) lines.push(`- Contributing: ${contributing.map((c) => c.text).join("; ")}`);
  lines.push("");
  for (const kind of ["corrective", "preventive"] as const) {
    lines.push(h(kind));
    const items = inv.actions.filter((a) => a.kind === kind);
    if (!items.length) lines.push("_None._");
    for (const a of items) lines.push(`- [${actLabel[a.status]}] ${a.title}${a.owner ? ` — ${a.owner}` : ""}${a.dueDate ? `, due ${formatDate(a.dueDate)}` : ""} — addresses: ${a.linkedCauseIds.map((id) => byId.get(id)?.text).filter(Boolean).join("; ") || "—"}`);
    lines.push("");
  }
  lines.push(h("verification"));
  if (!inv.verifications.length) lines.push("_No verification recorded._");
  for (const v of inv.verifications) {
    const a = inv.actions.find((x) => x.id === v.actionId);
    lines.push(`- ${a?.title ?? "Action"}: **${resultLabel[v.result]}**${v.checkAt ? ` (${formatDate(v.checkAt)})` : ""}${v.observed ? ` — ${v.observed}` : ""}`);
  }
  lines.push("");
  lines.push(h("lessons"));
  if (!inv.lessons.length) lines.push("_None recorded._");
  for (const l of inv.lessons) {
    const updates = [l.standardWorkUpdate && "standard work", l.trainingUpdate && "training", l.documentUpdate && "documents"].filter(Boolean).join(", ");
    lines.push(`- ${l.lesson}${l.relatedProcess ? ` _(process: ${l.relatedProcess})_` : ""}${updates ? ` — update: ${updates}` : ""}${l.similarProcessesToReview ? ` — review: ${l.similarProcessesToReview}` : ""}`);
  }
  lines.push("");
  lines.push(h("history"));
  for (const e of inv.history.filter((x) => x.type !== "status_changed")) lines.push(`- ${formatDateTime(e.at)} — ${e.type}${e.note ? `: ${e.note}` : ""}`);
  lines.push("");
  lines.push("_Generated with LoopSolve by LoopSignal._");
  return lines.join("\n");
}
