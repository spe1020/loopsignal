"use client";

import type { CauseNode, Investigation } from "@/lib/solve/schema";
import { supportCount } from "@/lib/solve/reducer";
import { classificationMeta, evidenceStateMeta } from "../causeMeta";
import { IconAlert, IconChevronDown, IconChevronRight, IconLink, IconMore, IconPlus, IconBranch } from "../icons";
import { Chip } from "../ui";

export function CauseBadges({ inv, cause, compact = false }: { inv: Investigation; cause: CauseNode; compact?: boolean }) {
  const { supports, contradicts } = supportCount(inv, cause.id);
  const es = evidenceStateMeta[cause.evidenceState];
  const cl = classificationMeta[cause.classification];
  return (
    <div className={`flex items-center gap-1 ${compact ? "flex-nowrap" : "flex-wrap"}`}>
      <Chip tone={es.tone} icon={es.icon}>{compact ? es.short : es.label}</Chip>
      {supports + contradicts > 0 ? (
        <span className="inline-flex items-center gap-1 text-[11.5px] text-graphite" title={`${supports} supporting, ${contradicts} contradicting`}>
          <IconLink size={11} />
          <span className="text-risk-track">{supports}</span>
          <span aria-hidden>/</span>
          <span className={contradicts ? "text-risk-critical" : ""}>{contradicts}</span>
          <span className="sr-only">{supports} supporting, {contradicts} contradicting</span>
        </span>
      ) : null}
      {cause.classification !== "unclassified" ? <Chip tone={cl.tone} icon={cl.icon}>{cl.label}</Chip> : null}
      {cause.challenged ? (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-risk-amber" title="Challenged assumption">
          <IconAlert size={11} /> {compact ? "" : "Challenged"}
          <span className="sr-only">Challenged</span>
        </span>
      ) : null}
    </div>
  );
}

const btn =
  "inline-flex min-h-[32px] items-center gap-1 rounded-[2px] px-1.5 text-[12px] font-medium text-graphite hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-copper";

/** Node card used by the Five Whys diagram overlay and the list view. */
export function CauseCard({
  inv,
  cause,
  depth,
  selected,
  hasChildren,
  onSelect,
  onAddWhy,
  onBranch,
  onToggleCollapse,
  style,
  className = "",
  compact = false,
}: {
  inv: Investigation;
  cause: CauseNode;
  depth: number;
  selected: boolean;
  hasChildren: boolean;
  onSelect: () => void;
  onAddWhy: () => void;
  onBranch: () => void;
  onToggleCollapse: () => void;
  style?: React.CSSProperties;
  className?: string;
  compact?: boolean;
}) {
  const isRoot = cause.classification === "root";
  return (
    <div
      data-cause-id={cause.id}
      style={style}
      className={`solve-node flex flex-col rounded-[3px] border bg-cream text-left shadow-sm transition-colors ${
        selected ? "border-copper ring-2 ring-copper/30" : isRoot ? "border-copper" : "border-line hover:border-ink/40"
      } ${className}`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="block min-h-[44px] w-full rounded-t-[3px] px-2.5 pt-1.5 text-left focus-visible:outline-2 focus-visible:outline-copper"
      >
        <span className="block font-mono text-[9.5px] tracking-[0.12em] text-stone">WHY {depth}</span>
        <span className={`mt-0.5 block overflow-hidden text-[12.5px] leading-[17px] text-ink ${compact ? "" : "h-[34px]"}`}>
          <span className="line-clamp-2">{cause.text || <span className="text-stone">Untitled cause</span>}</span>
        </span>
      </button>
      <div className="h-[24px] overflow-hidden px-2 whitespace-nowrap">
        <CauseBadges inv={inv} cause={cause} compact />
      </div>
      <div className="mt-auto flex items-center gap-0.5 border-t border-line px-1 py-0.5">
        <button type="button" className={btn} onClick={onAddWhy} title="Add why (child)">
          <IconPlus size={12} /> Why
        </button>
        <button type="button" className={btn} onClick={onBranch} title="Branch (sibling)">
          <IconBranch size={12} /> Branch
        </button>
        {hasChildren ? (
          <button type="button" className={btn} onClick={onToggleCollapse} aria-label={cause.collapsed ? "Expand" : "Collapse"} title={cause.collapsed ? "Expand" : "Collapse"}>
            {cause.collapsed ? <IconChevronRight size={13} /> : <IconChevronDown size={13} />}
          </button>
        ) : null}
        <button type="button" className={`${btn} ml-auto`} onClick={onSelect} aria-label="More actions">
          <IconMore size={13} />
        </button>
      </div>
    </div>
  );
}
