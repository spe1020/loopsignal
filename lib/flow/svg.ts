import { escSvg as esc, SVG_FONT as FONT, truncate, wrapText } from "@/lib/loop/svg";
import { layoutMap, type MapLayout } from "./layout";
import type { ProcessMap, Step, VersionKind } from "./schema";
import { formatMinutes } from "./time";
import { COLORS, laneColor, valueClassMeta } from "./visual";

export { downloadSvg } from "@/lib/loop/download";

/** Standalone swimlane SVG (text only, prints and exports cleanly). */
export function mapSvg(map: ProcessMap, kind: VersionKind = "current", opts: { title?: boolean } = {}): string {
  const version = kind === "current" ? map.versions.current : map.versions.future;
  if (!version) return "";
  const layout = layoutMap(version, map.lanes, map.unit);
  return renderMapSvg(map, kind, layout, opts);
}

export function renderMapSvg(map: ProcessMap, kind: VersionKind, layout: MapLayout, opts: { title?: boolean } = {}): string {
  const version = kind === "current" ? map.versions.current : map.versions.future!;
  const stepById = new Map(version.steps.map((s) => [s.id, s]));
  const painBy = new Map<string, number>();
  for (const p of version.painPoints) painBy.set(p.stepId, (painBy.get(p.stepId) ?? 0) + 1);
  const titleH = opts.title ? 40 : 0;
  const w = layout.width;
  const h = layout.height + titleH;
  const parts: string[] = [];
  const label = kind === "current" ? "Current state" : "Future state";
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT}" role="img" aria-label="${esc(label)} process map for ${esc(map.mapNumber)}">`);
  parts.push(`<defs><pattern id="lf-hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${COLORS.stone}" stroke-width="1.2" opacity="0.55"/></pattern><marker id="lf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${COLORS.graphite}"/></marker><marker id="lf-arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${COLORS.red}"/></marker></defs>`);
  parts.push(`<rect width="${w}" height="${h}" fill="#ffffff"/>`);
  if (opts.title) parts.push(`<text x="16" y="26" font-size="14" font-weight="600" fill="${COLORS.ink}">${esc(label)} — ${esc(map.mapNumber)} ${esc(map.title)}</text>`);
  parts.push(`<g transform="translate(0,${titleH})">`);

  // Lanes
  for (const lane of layout.lanes) {
    const c = laneColor(lane.index);
    parts.push(`<rect x="16" y="${lane.y}" width="${w - 32}" height="${lane.height}" fill="${lane.index % 2 ? COLORS.paper : "#ffffff"}" stroke="${COLORS.line}"/>`);
    parts.push(`<rect x="16" y="${lane.y}" width="128" height="${lane.height}" fill="${COLORS.ink}"/>`);
    parts.push(`<rect x="16" y="${lane.y}" width="4" height="${lane.height}" fill="${c}"/>`);
    wrapText(lane.name || "Lane", 16, 3).forEach((ln, i) => {
      parts.push(`<text x="30" y="${lane.y + 24 + i * 15}" font-size="12" font-weight="600" fill="${COLORS.cream}">${esc(ln)}</text>`);
    });
    parts.push(`<text x="30" y="${lane.y + lane.height - 10}" font-size="9" letter-spacing="1" fill="#c9c9c4">${esc(lane.kind.toUpperCase())}</text>`);
  }

  // Waits
  for (const g of layout.waits) {
    parts.push(`<rect x="${g.x}" y="${g.y}" width="${g.width}" height="${g.height}" fill="url(#lf-hatch)" stroke="${COLORS.stone}" stroke-dasharray="3 3"/>`);
    parts.push(`<text x="${g.x + g.width / 2}" y="${g.y + g.height / 2 + 4}" font-size="10" text-anchor="middle" fill="${COLORS.graphite}" font-weight="600">${esc(g.label)}${g.capped ? " ›" : ""}</text>`);
  }

  // Edges
  for (const e of layout.edges) {
    const red = e.kind === "rework";
    const stroke = red ? COLORS.red : COLORS.graphite;
    parts.push(`<path d="${e.path}" fill="none" stroke="${stroke}" stroke-width="${e.kind === "branch" || red ? 1.4 : 1.6}" ${e.kind === "branch" ? 'stroke-dasharray="5 4"' : ""} marker-end="url(#${red ? "lf-arrow-red" : "lf-arrow"})"/>`);
    if (e.kind === "handoff" && e.markerX !== undefined && e.markerY !== undefined) {
      parts.push(`<circle cx="${e.markerX}" cy="${e.markerY}" r="6" fill="#ffffff" stroke="${COLORS.ink}" stroke-width="1.4"/>`);
      parts.push(`<path d="M ${e.markerX - 3} ${e.markerY} h 6 M ${e.markerX + 1} ${e.markerY - 2} l 2 2 -2 2" fill="none" stroke="${COLORS.ink}" stroke-width="1.2"/>`);
    }
    if (e.label && e.labelX !== undefined && e.labelY !== undefined) {
      parts.push(`<text x="${e.labelX}" y="${e.labelY}" font-size="10" font-style="italic" fill="${red ? COLORS.red : COLORS.graphite}">${esc(truncate(e.label, 18))}</text>`);
    }
  }

  // Steps
  for (const b of layout.steps) {
    const s = stepById.get(b.id);
    if (!s) continue;
    parts.push(stepShapeSvg(s, b, painBy.get(s.id) ?? 0, layout.lanes[b.laneIndex]?.index ?? 0));
  }
  parts.push("</g></svg>");
  return parts.join("");
}

function stepShapeSvg(s: Step, b: { x: number; y: number; width: number; height: number }, pain: number, laneIdx: number): string {
  const out: string[] = [];
  const vc = valueClassMeta[s.type === "wait" ? "nva" : s.valueClass];
  const time = s.type === "start" || s.type === "end" ? "" : s.cycleTimeMin === undefined ? "? time" : formatMinutes(s.cycleTimeMin, { compact: true });
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  if (s.type === "decision") {
    out.push(`<path d="M ${cx} ${b.y} L ${b.x + b.width} ${cy} L ${cx} ${b.y + b.height} L ${b.x} ${cy} Z" fill="#ffffff" stroke="${COLORS.ink}" stroke-width="1.4"/>`);
    wrapText(s.name || "Decision?", 16, 2).forEach((ln, i, arr) => {
      out.push(`<text x="${cx}" y="${cy + 4 + (i - (arr.length - 1) / 2) * 13}" font-size="10.5" text-anchor="middle" fill="${COLORS.ink}">${esc(ln)}</text>`);
    });
  } else if (s.type === "start" || s.type === "end") {
    out.push(`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.height / 2}" fill="${COLORS.ink}" stroke="${COLORS.ink}"/>`);
    out.push(`<text x="${cx}" y="${cy + 4}" font-size="10.5" font-weight="600" text-anchor="middle" fill="${COLORS.cream}">${esc(truncate(s.name || (s.type === "start" ? "Start" : "End"), 16))}</text>`);
  } else if (s.type === "wait") {
    out.push(`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="url(#lf-hatch)" stroke="${COLORS.stone}" stroke-dasharray="3 3"/>`);
    out.push(`<rect x="${b.x + 6}" y="${b.y + b.height / 2 - 14}" width="${b.width - 12}" height="28" fill="#ffffff" opacity="0.92"/>`);
    out.push(`<text x="${cx}" y="${cy - 2}" font-size="10.5" text-anchor="middle" fill="${COLORS.ink}">${esc(truncate(s.name || "Wait", 22))}</text>`);
    out.push(`<text x="${cx}" y="${cy + 10}" font-size="10" text-anchor="middle" font-weight="600" fill="${COLORS.graphite}">${esc(time)}</text>`);
  } else {
    const stroke = s.type === "inspection" ? COLORS.graphite : "#c9c9c4";
    out.push(`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="3" fill="#ffffff" stroke="${stroke}" stroke-width="1.2"/>`);
    out.push(`<rect x="${b.x}" y="${b.y}" width="3" height="${b.height}" fill="${laneColor(laneIdx)}"/>`);
    out.push(`<rect x="${b.x}" y="${b.y + b.height - 3}" width="${b.width}" height="3" fill="${vc.color}"/>`);
    if (s.type === "inspection") out.push(`<rect x="${b.x + 3}" y="${b.y + 3}" width="${b.width - 6}" height="${b.height - 9}" fill="none" stroke="${COLORS.line}" stroke-width="1"/>`);
    wrapText(s.name || "Untitled step", 22, 2).forEach((ln, i) => {
      out.push(`<text x="${b.x + 10}" y="${b.y + 19 + i * 14}" font-size="11" fill="${COLORS.ink}">${esc(ln)}</text>`);
    });
    out.push(`<text x="${b.x + 10}" y="${b.y + b.height - 10}" font-size="10" font-weight="600" fill="${s.cycleTimeMin === undefined ? COLORS.amber : COLORS.graphite}">${esc(time)}</text>`);
    out.push(`<text x="${b.x + b.width - 8}" y="${b.y + b.height - 10}" font-size="9" text-anchor="end" letter-spacing="0.6" fill="${vc.color}">${esc(vc.short)}</text>`);
  }
  if (pain > 0) {
    out.push(`<circle cx="${b.x + b.width - 2}" cy="${b.y + 2}" r="7" fill="${COLORS.copper}" stroke="#ffffff" stroke-width="1.5"/>`);
    out.push(`<text x="${b.x + b.width - 2}" y="${b.y + 5.5}" font-size="9" font-weight="700" text-anchor="middle" fill="#ffffff">!</text>`);
  }
  return out.join("");
}

export type MapPage = { svg: string; from: number; to: number; continued: boolean; total: number };

/**
 * Split a wide map into print pages by step column. Each page repeats the
 * lane headers; pages after the first carry a continuation header.
 */
export function mapSvgPages(map: ProcessMap, kind: VersionKind = "current", maxContentWidth = 1500): MapPage[] {
  const version = kind === "current" ? map.versions.current : map.versions.future;
  if (!version) return [];
  const layout = layoutMap(version, map.lanes, map.unit);
  const headerRight = 16 + 128 + 8;
  const content = layout.width - headerRight;
  if (content <= maxContentWidth || layout.steps.length === 0) {
    return [{ svg: renderMapSvg(map, kind, layout, { title: true }), from: 1, to: layout.steps.length, continued: false, total: 1 }];
  }
  const groups: { from: number; to: number; x0: number; x1: number }[] = [];
  let start = 0;
  let x0 = layout.steps[0].colX - 8;
  for (let i = 0; i < layout.steps.length; i += 1) {
    const b = layout.steps[i];
    const right = b.x + b.width + 8;
    if (right - x0 > maxContentWidth && i > start) {
      groups.push({ from: start, to: i - 1, x0, x1: layout.steps[i].colX - 8 });
      start = i;
      x0 = layout.steps[i].colX - 8;
    }
  }
  groups.push({ from: start, to: layout.steps.length - 1, x0, x1: layout.width });
  const stepById = new Map(version.steps.map((s) => [s.id, s]));
  const painBy = new Map<string, number>();
  for (const p of version.painPoints) painBy.set(p.stepId, (painBy.get(p.stepId) ?? 0) + 1);
  const label = kind === "current" ? "Current state" : "Future state";
  return groups.map((g, gi) => {
    const w = headerRight + (g.x1 - g.x0) + 16;
    const h = layout.height + 40;
    const shift = headerRight - g.x0;
    const parts: string[] = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT}" role="img" aria-label="${esc(label)} process map for ${esc(map.mapNumber)}, page ${gi + 1} of ${groups.length}">`);
    parts.push(`<defs><pattern id="lf-hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${COLORS.stone}" stroke-width="1.2" opacity="0.55"/></pattern><marker id="lf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${COLORS.graphite}"/></marker><marker id="lf-arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${COLORS.red}"/></marker><clipPath id="lf-clip-${gi}"><rect x="${headerRight}" y="0" width="${w - headerRight - 8}" height="${h}"/></clipPath></defs>`);
    parts.push(`<rect width="${w}" height="${h}" fill="#ffffff"/>`);
    parts.push(`<text x="16" y="26" font-size="14" font-weight="600" fill="${COLORS.ink}">${esc(label)} — ${esc(map.mapNumber)} ${esc(map.title)}${gi > 0 ? " (continued)" : ""} · steps ${g.from + 1}–${g.to + 1} of ${layout.steps.length}</text>`);
    parts.push(`<g transform="translate(0,40)">`);
    for (const lane of layout.lanes) {
      parts.push(`<rect x="16" y="${lane.y}" width="${w - 32}" height="${lane.height}" fill="${lane.index % 2 ? COLORS.paper : "#ffffff"}" stroke="${COLORS.line}"/>`);
      parts.push(`<rect x="16" y="${lane.y}" width="128" height="${lane.height}" fill="${COLORS.ink}"/>`);
      parts.push(`<rect x="16" y="${lane.y}" width="4" height="${lane.height}" fill="${laneColor(lane.index)}"/>`);
      wrapText(lane.name || "Lane", 16, 3).forEach((ln, i) => parts.push(`<text x="30" y="${lane.y + 24 + i * 15}" font-size="12" font-weight="600" fill="${COLORS.cream}">${esc(ln)}</text>`));
    }
    // Clip in page space first, then shift the content into the window.
    parts.push(`<g clip-path="url(#lf-clip-${gi})"><g transform="translate(${shift},0)">`);
    for (const gap of layout.waits) {
      if (gap.x + gap.width < g.x0 || gap.x > g.x1) continue;
      parts.push(`<rect x="${gap.x}" y="${gap.y}" width="${gap.width}" height="${gap.height}" fill="url(#lf-hatch)" stroke="${COLORS.stone}" stroke-dasharray="3 3"/>`);
      parts.push(`<text x="${gap.x + gap.width / 2}" y="${gap.y + gap.height / 2 + 4}" font-size="10" text-anchor="middle" fill="${COLORS.graphite}" font-weight="600">${esc(gap.label)}</text>`);
    }
    for (const e of layout.edges) {
      const red = e.kind === "rework";
      parts.push(`<path d="${e.path}" fill="none" stroke="${red ? COLORS.red : COLORS.graphite}" stroke-width="1.5" ${e.kind === "branch" ? 'stroke-dasharray="5 4"' : ""} marker-end="url(#${red ? "lf-arrow-red" : "lf-arrow"})"/>`);
      if (e.kind === "handoff" && e.markerX !== undefined && e.markerY !== undefined) parts.push(`<circle cx="${e.markerX}" cy="${e.markerY}" r="6" fill="#ffffff" stroke="${COLORS.ink}" stroke-width="1.4"/>`);
      if (e.label && e.labelX !== undefined && e.labelY !== undefined) parts.push(`<text x="${e.labelX}" y="${e.labelY}" font-size="10" font-style="italic" fill="${red ? COLORS.red : COLORS.graphite}">${esc(truncate(e.label, 18))}</text>`);
    }
    for (let i = g.from; i <= g.to; i += 1) {
      const b = layout.steps[i];
      const s = stepById.get(b.id);
      if (s) parts.push(stepShapeSvg(s, b, painBy.get(s.id) ?? 0, b.laneIndex));
    }
    parts.push("</g></g></g></svg>");
    return { svg: parts.join(""), from: g.from + 1, to: g.to + 1, continued: gi > 0, total: groups.length };
  });
}
