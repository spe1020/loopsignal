"use client";

import { useMemo, useState } from "react";
import { trackSolve } from "@/lib/solve/analytics";
import { layoutFishbone } from "@/lib/solve/layout/fishbone";
import { stamp } from "@/lib/solve/reducer";
import type { CauseNode, FishboneCategory } from "@/lib/solve/schema";
import { downloadSvg, fishboneSvg } from "@/lib/solve/svg";
import { usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { IconDownload, IconEdit, IconExpand, IconGrid, IconList, IconMinus, IconPlus } from "../icons";
import { EmptyState, IconButton, Segmented, SolveButton, TextInput } from "../ui";
import { CauseBadges } from "./CauseCard";
import { useMediaQuery } from "../useMediaQuery";

export function useFishboneActions() {
  const { investigation: inv, dispatch } = useInvestigation();
  const { open } = usePanel();
  function addCause(categoryId: string, text: string) {
    const cause: CauseNode = {
      ...stamp(),
      text: text.trim(),
      parentId: null,
      origin: "fishbone",
      categoryId,
      evidenceState: "assumption",
      classification: "unclassified",
      challenged: false,
      candidate: false,
      collapsed: false,
      order: inv.causes.filter((c) => c.parentId === null).length,
    };
    dispatch({ type: "add_cause", cause });
    trackSolve("loopsolve_fishbone_cause_added", { stage: "investigate", causes: inv.causes.length + 1 });
    return cause;
  }
  return { addCause, select: (id: string) => open({ kind: "cause", causeId: id }), editCategory: (id: string | null) => open({ kind: "category", categoryId: id }) };
}

function CategoryComposer({ category, onAdd }: { category: FishboneCategory; onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onAdd(text);
        setText("");
      }}
    >
      <TextInput aria-label={`Add cause under ${category.name}`} placeholder={`Possible cause under ${category.name}…`} value={text} onChange={(e) => setText(e.target.value)} />
      <SolveButton type="submit" variant="dark" disabled={!text.trim()} icon={<IconPlus size={14} />}>Add</SolveButton>
    </form>
  );
}

export function FishboneView() {
  const { investigation: inv } = useInvestigation();
  const { state: panelState } = usePanel();
  const { addCause, select, editCategory } = useFishboneActions();
  const [view, setView] = useState<"diagram" | "list">("diagram");
  const [sheet, setSheet] = useState(false);
  const [zoom, setZoom] = useState(1);
  const wide = useMediaQuery("(min-width: 768px)");
  const showDiagram = wide && view === "diagram";
  const selectedId = panelState?.kind === "cause" ? panelState.causeId : null;
  const categories = useMemo(() => [...inv.fishboneCategories].sort((a, b) => a.order - b.order), [inv.fishboneCategories]);
  const ribCauses = inv.causes.filter((c) => c.parentId === null && c.categoryId);

  const list = (
    <div className="grid gap-3 md:grid-cols-2">
      {categories.map((cat) => {
        const items = inv.causes.filter((c) => c.parentId === null && c.categoryId === cat.id).sort((a, b) => a.order - b.order);
        return (
          <section key={cat.id} className="rounded-[3px] border border-line bg-cream p-3" aria-labelledby={`cat-${cat.id}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 id={`cat-${cat.id}`} className="text-[14px] font-medium text-ink">{cat.name}</h3>
              <IconButton label={`Edit category ${cat.name}`} onClick={() => editCategory(cat.id)} className="min-h-[36px] min-w-[36px]"><IconEdit size={14} /></IconButton>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {items.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => select(c.id)}
                    aria-pressed={selectedId === c.id}
                    className={`block w-full min-h-[44px] rounded-[3px] border px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-copper ${
                      selectedId === c.id ? "border-copper ring-2 ring-copper/30" : c.classification === "root" ? "border-copper" : "border-line hover:border-ink/40"
                    }`}
                  >
                    <span className="block text-[14px] leading-5 text-ink">{c.text || <span className="text-stone">Untitled cause</span>}</span>
                    <span className="mt-1 block"><CauseBadges inv={inv} cause={c} compact /></span>
                  </button>
                </li>
              ))}
              {items.length === 0 ? <li className="text-[13px] text-stone">Nothing here yet.</li> : null}
            </ul>
            <div className="mt-2"><CategoryComposer category={cat} onAdd={(t) => select(addCause(cat.id, t).id)} /></div>
          </section>
        );
      })}
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <SolveButton variant="primary" onClick={() => editCategory(null)} icon={<IconPlus size={15} />}>Add category</SolveButton>
        <SolveButton className="md:hidden" onClick={() => setSheet(true)} icon={<IconExpand size={15} />}>View diagram</SolveButton>
        <div className="ml-auto flex items-center gap-1">
          <div className="hidden md:block">
            <Segmented label="View" value={view} onChange={setView} options={[{ value: "diagram", label: "Diagram", icon: <IconGrid size={14} /> }, { value: "list", label: "List", icon: <IconList size={14} /> }]} />
          </div>
          {view === "diagram" ? (
            <div className="hidden items-center md:flex" role="group" aria-label="Zoom">
              <IconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}><IconMinus size={15} /></IconButton>
              <span className="w-10 text-center font-mono text-[11px] text-graphite">{Math.round(zoom * 100)}%</span>
              <IconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))}><IconPlus size={15} /></IconButton>
            </div>
          ) : null}
          <IconButton label="Download SVG" onClick={() => downloadSvg(`${inv.rcaNumber}-fishbone.svg`, fishboneSvg(inv, { title: true }))}><IconDownload size={16} /></IconButton>
        </div>
      </div>
      {ribCauses.length === 0 ? (
        <EmptyState className="mt-4" title="Brainstorm possible causes by category. Anything goes at this point — evidence sorts them out later." />
      ) : null}
      <div className="mt-4">
        {showDiagram ? <FishboneDiagram zoom={zoom} selectedId={selectedId} onSelect={select} onEditCategory={editCategory} /> : list}
      </div>
      {sheet ? (
        <div className="fixed inset-0 z-[60] flex flex-col bg-paper md:hidden" role="dialog" aria-label="Fishbone diagram">
          <div className="flex items-center justify-between border-b border-line bg-cream px-3 py-2">
            <span className="text-[14px] font-medium">Fishbone diagram</span>
            <div className="flex items-center">
              <IconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))}><IconMinus size={16} /></IconButton>
              <IconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)))}><IconPlus size={16} /></IconButton>
              <SolveButton size="sm" variant="dark" onClick={() => setSheet(false)}>Close</SolveButton>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3 [touch-action:pinch-zoom]">
            <FishboneDiagram zoom={zoom} selectedId={selectedId} onSelect={(id) => { setSheet(false); select(id); }} onEditCategory={(id) => { setSheet(false); editCategory(id); }} fill />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FishboneDiagram({ zoom, selectedId, onSelect, onEditCategory, fill = false }: { zoom: number; selectedId: string | null; onSelect: (id: string) => void; onEditCategory: (id: string) => void; fill?: boolean }) {
  const { investigation: inv } = useInvestigation();
  const layout = useMemo(() => layoutFishbone(inv.fishboneCategories, inv.causes, inv.problem.generatedStatement), [inv.fishboneCategories, inv.causes, inv.problem.generatedStatement]);
  const byId = useMemo(() => new Map(inv.causes.map((c) => [c.id, c])), [inv.causes]);
  return (
    <div className={`solve-grid-bg overflow-auto rounded-[3px] border border-line bg-paper ${fill ? "" : "max-h-[72vh]"}`}>
      <div style={{ width: layout.width * zoom, height: layout.height * zoom }}>
        <div className="relative origin-top-left" style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})` }}>
          <svg className="absolute inset-0" width={layout.width} height={layout.height} role="img" aria-label={`Fishbone diagram with ${layout.ribs.length} categories. A category list view is available.`}>
            <line x1={layout.spineX1} y1={layout.spineY} x2={layout.spineX2} y2={layout.spineY} stroke="var(--ink)" strokeWidth={2.5} />
            <path d={`M ${layout.spineX2 - 10} ${layout.spineY - 7} L ${layout.spineX2} ${layout.spineY} L ${layout.spineX2 - 10} ${layout.spineY + 7}`} fill="none" stroke="var(--ink)" strokeWidth={2} />
            {layout.ribs.map((r) => (
              <g key={r.id}>
                <line x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="var(--graphite)" strokeWidth={1.6} />
                {r.causes.map((cb) => (
                  <line key={cb.id} x1={cb.x + cb.width} y1={cb.y + cb.height / 2} x2={cb.anchorX} y2={cb.anchorY} stroke="var(--stone)" strokeWidth={1} />
                ))}
              </g>
            ))}
          </svg>
          <div className="absolute flex flex-col rounded-[3px] bg-ink px-3 py-2 text-cream" style={{ left: layout.head.x, top: layout.head.y, width: layout.head.width, height: layout.head.height }}>
            <span className="font-mono text-[9.5px] tracking-[0.14em] text-copper">PROBLEM</span>
            <span className="mt-1 line-clamp-3 text-[12px] leading-[1.35]">{inv.problem.whatHappened || inv.title || "Describe the problem on the Problem stage."}</span>
          </div>
          {layout.ribs.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onEditCategory(r.id)}
              title={`Edit ${r.name}`}
              className="absolute flex items-center justify-center rounded-[2px] border border-ink bg-paper-2 px-2 text-[12px] font-medium text-ink hover:bg-ink hover:text-cream focus-visible:outline-2 focus-visible:outline-copper"
              style={{ left: r.labelX, top: r.labelY, width: r.labelWidth, height: r.labelHeight }}
            >
              <span className="truncate">{r.name}</span>
            </button>
          ))}
          {layout.ribs.flatMap((r) =>
            r.causes.map((cb) => {
              const c = byId.get(cb.id);
              if (!c) return null;
              const sel = selectedId === c.id;
              return (
                <button
                  key={cb.id}
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-pressed={sel}
                  className={`solve-node absolute block rounded-[2px] border bg-cream px-2 py-1 text-left shadow-sm focus-visible:outline-2 focus-visible:outline-copper ${
                    sel ? "border-copper ring-2 ring-copper/30" : c.classification === "root" ? "border-copper" : "border-line hover:border-ink/40"
                  }`}
                  style={{ left: cb.x, top: cb.y, width: cb.width, height: cb.height }}
                >
                  <span className="block h-[30px] overflow-hidden text-[11.5px] leading-[15px] text-ink"><span className="line-clamp-2">{c.text || "Untitled"}</span></span>
                  <span className="mt-0.5 block h-[20px] overflow-hidden whitespace-nowrap"><CauseBadges inv={inv} cause={c} compact /></span>
                </button>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
