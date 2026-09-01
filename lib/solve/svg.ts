import { layoutFishbone } from "./layout/fishbone";
import { layoutWhys, WHY_ROOT_ID } from "./layout/whys";
import type { Investigation } from "./schema";
import { truncate } from "./text";

const FONT = "IBM Plex Sans, system-ui, sans-serif";

export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines) break;
    } else {
      cur = next;
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = truncate(lines[maxLines - 1], Math.max(4, maxChars - 1));
  }
  return lines.length ? lines : [""];
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const stateLabel: Record<string, string> = {
  assumption: "Assumption",
  observed: "Observed",
  data_supported: "Data-supported",
  verified: "Verified",
  disproved: "Disproved",
};
const classLabel: Record<string, string> = {
  unclassified: "",
  symptom: "Symptom",
  contributing: "Contributing",
  root: "ROOT CAUSE",
};

/** Standalone Five Whys SVG (text only, prints and exports cleanly). */
export function whysSvg(inv: Investigation, opts: { title?: boolean } = {}): string {
  const layout = layoutWhys(inv.causes, { respectCollapse: false });
  const byId = new Map(inv.causes.map((c) => [c.id, c]));
  const pad = 24;
  const titleH = opts.title ? 40 : 0;
  const w = layout.width + pad * 2;
  const h = layout.height + pad * 2 + titleH;
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT}" role="img" aria-label="Five Whys diagram for ${esc(inv.rcaNumber)}">`);
  parts.push(`<rect width="${w}" height="${h}" fill="#ffffff"/>`);
  if (opts.title) parts.push(`<text x="${pad}" y="26" font-size="14" font-weight="600" fill="#1f1f1f">Five Whys — ${esc(inv.rcaNumber)} ${esc(inv.title)}</text>`);
  parts.push(`<g transform="translate(${pad},${pad + titleH})">`);
  for (const e of layout.edges) parts.push(`<path d="${e.path}" fill="none" stroke="#7a7a7a" stroke-width="1.4"/>`);
  for (const b of layout.boxes) {
    const isRoot = b.id === WHY_ROOT_ID;
    const c = byId.get(b.id);
    const text = isRoot ? inv.problem.whatHappened || inv.title || "Problem" : c?.text ?? "";
    const stroke = isRoot ? "#1f1f1f" : c?.classification === "root" ? "#e4571e" : "#c9c9c4";
    const fill = isRoot ? "#1f1f1f" : "#ffffff";
    parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${c?.classification === "root" ? 2 : 1.2}"/>`);
    const lines = wrapText(text, 34, 3);
    const label = isRoot ? "PROBLEM" : `WHY ${b.depth}`;
    parts.push(`<text x="${b.x + 12}" y="${b.y + 18}" font-size="9.5" letter-spacing="1.2" fill="${isRoot ? "#e4571e" : "#7a7a7a"}">${esc(label)}</text>`);
    lines.forEach((ln, i) => {
      parts.push(`<text x="${b.x + 12}" y="${b.y + 36 + i * 15}" font-size="12" fill="${isRoot ? "#fafaf8" : "#1f1f1f"}">${esc(ln)}</text>`);
    });
    if (c) {
      const meta = [stateLabel[c.evidenceState], classLabel[c.classification]].filter(Boolean).join(" · ");
      parts.push(`<text x="${b.x + 12}" y="${b.y + b.height - 12}" font-size="10" fill="${c.classification === "root" ? "#c44a18" : "#4a4a4a"}">${esc(meta)}</text>`);
    }
  }
  parts.push("</g></svg>");
  return parts.join("");
}

/** Standalone Fishbone SVG. */
export function fishboneSvg(inv: Investigation, opts: { title?: boolean } = {}): string {
  const layout = layoutFishbone(inv.fishboneCategories, inv.causes, inv.problem.generatedStatement);
  const byId = new Map(inv.causes.map((c) => [c.id, c]));
  const titleH = opts.title ? 40 : 0;
  const w = layout.width;
  const h = layout.height + titleH;
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT}" role="img" aria-label="Fishbone diagram for ${esc(inv.rcaNumber)}">`);
  parts.push(`<rect width="${w}" height="${h}" fill="#ffffff"/>`);
  if (opts.title) parts.push(`<text x="24" y="26" font-size="14" font-weight="600" fill="#1f1f1f">Fishbone — ${esc(inv.rcaNumber)} ${esc(inv.title)}</text>`);
  parts.push(`<g transform="translate(0,${titleH})">`);
  parts.push(`<line x1="${layout.spineX1}" y1="${layout.spineY}" x2="${layout.spineX2}" y2="${layout.spineY}" stroke="#1f1f1f" stroke-width="2.5"/>`);
  parts.push(`<path d="M ${layout.spineX2 - 10} ${layout.spineY - 7} L ${layout.spineX2} ${layout.spineY} L ${layout.spineX2 - 10} ${layout.spineY + 7}" fill="none" stroke="#1f1f1f" stroke-width="2"/>`);
  const hd = layout.head;
  parts.push(`<rect x="${hd.x}" y="${hd.y}" width="${hd.width}" height="${hd.height}" rx="3" fill="#1f1f1f"/>`);
  parts.push(`<text x="${hd.x + 12}" y="${hd.y + 18}" font-size="9.5" letter-spacing="1.2" fill="#e4571e">PROBLEM</text>`);
  wrapText(inv.problem.whatHappened || inv.title || "Problem", 30, 4).forEach((ln, i) => {
    parts.push(`<text x="${hd.x + 12}" y="${hd.y + 36 + i * 15}" font-size="12" fill="#fafaf8">${esc(ln)}</text>`);
  });
  for (const rib of layout.ribs) {
    parts.push(`<line x1="${rib.x1}" y1="${rib.y1}" x2="${rib.x2}" y2="${rib.y2}" stroke="#4a4a4a" stroke-width="1.6"/>`);
    parts.push(`<rect x="${rib.labelX}" y="${rib.labelY}" width="${rib.labelWidth}" height="${rib.labelHeight}" rx="2" fill="#f3f3f1" stroke="#1f1f1f" stroke-width="1"/>`);
    parts.push(`<text x="${rib.labelX + rib.labelWidth / 2}" y="${rib.labelY + 22}" font-size="12" font-weight="600" text-anchor="middle" fill="#1f1f1f">${esc(truncate(rib.name, 18))}</text>`);
    for (const cb of rib.causes) {
      const c = byId.get(cb.id);
      parts.push(`<line x1="${cb.x + cb.width}" y1="${cb.y + cb.height / 2}" x2="${cb.anchorX}" y2="${cb.anchorY}" stroke="#7a7a7a" stroke-width="1"/>`);
      const stroke = c?.classification === "root" ? "#e4571e" : "#c9c9c4";
      parts.push(`<rect x="${cb.x}" y="${cb.y}" width="${cb.width}" height="${cb.height}" rx="2" fill="#ffffff" stroke="${stroke}" stroke-width="${c?.classification === "root" ? 2 : 1}"/>`);
      wrapText(c?.text ?? "", 28, 2).forEach((ln, i) => {
        parts.push(`<text x="${cb.x + 8}" y="${cb.y + 18 + i * 14}" font-size="11" fill="#1f1f1f">${esc(ln)}</text>`);
      });
      if (c) parts.push(`<text x="${cb.x + 8}" y="${cb.y + cb.height - 7}" font-size="9" fill="#7a7a7a">${esc(stateLabel[c.evidenceState] ?? "")}</text>`);
    }
  }
  parts.push("</g></svg>");
  return parts.join("");
}

export function downloadSvg(filename: string, svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
