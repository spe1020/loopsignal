"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackSolve } from "@/lib/solve/analytics";
import { layoutWhys, WHY_NODE, WHY_ROOT_ID, depthOf, maxDepth } from "@/lib/solve/layout/whys";
import { stamp } from "@/lib/solve/reducer";
import type { CauseNode } from "@/lib/solve/schema";
import { downloadSvg, whysSvg } from "@/lib/solve/svg";
import { truncate } from "@/lib/solve/text";
import { usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { IconDownload, IconGrid, IconList, IconMinus, IconPlus } from "../icons";
import { useToast } from "../Toast";
import { EmptyState, IconButton, Note, Segmented, SolveButton, TextArea } from "../ui";
import { CauseBadges, CauseCard } from "./CauseCard";
import { useMediaQuery } from "../useMediaQuery";

export type Composer = { parentId: string | null; mode: "child" | "branch"; anchorId?: string } | null;

export function useWhyActions() {
  const { investigation: inv, dispatch, restore } = useInvestigation();
  const toast = useToast();
  const { open, close, state } = usePanel();

  const addCause = useCallback(
    (text: string, parentId: string | null, mode: "child" | "branch") => {
      const cause: CauseNode = {
        ...stamp(),
        text: text.trim(),
        parentId,
        origin: "why",
        evidenceState: "assumption",
        classification: "unclassified",
        challenged: false,
        candidate: false,
        collapsed: false,
        order: inv.causes.filter((c) => c.parentId === parentId).length,
      };
      dispatch({ type: "add_cause", cause });
      trackSolve(mode === "branch" ? "loopsolve_branch_added" : "loopsolve_why_added", {
        stage: "investigate",
        depth: parentId ? depthOf(inv.causes, parentId) + 1 : 1,
        causes: inv.causes.length + 1,
      });
      return cause;
    },
    [dispatch, inv.causes],
  );

  const deleteBranch = useCallback(
    (cause: CauseNode) => {
      const snapshot = inv;
      dispatch({ type: "remove_cause_branch", id: cause.id });
      if (state?.kind === "cause" && state.causeId === cause.id) close();
      toast.show(`Deleted "${truncate(cause.text || "cause", 40)}" and its branch.`, { undo: () => restore(snapshot) });
    },
    [inv, dispatch, toast, restore, state, close],
  );

  return { addCause, deleteBranch, select: (id: string) => open({ kind: "cause", causeId: id }) };
}

export function WhyComposer({
  composer,
  onDone,
  onCancel,
  autoChain = true,
}: {
  composer: NonNullable<Composer>;
  onDone: (created: CauseNode, next: Composer) => void;
  onCancel: () => void;
  autoChain?: boolean;
}) {
  const { investigation: inv } = useInvestigation();
  const { addCause } = useWhyActions();
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const parent = composer.parentId ? inv.causes.find((c) => c.id === composer.parentId) : null;
  const depth = composer.parentId ? depthOf(inv.causes, composer.parentId) + 1 : 1;
  const prompt = parent ? `Why ${truncate(parent.text, 70) || "did this happen"}?` : "Why did this happen?";

  useEffect(() => {
    ref.current?.focus();
  }, [composer.parentId, composer.mode]);

  function submit() {
    if (!text.trim()) return;
    const created = addCause(text, composer.parentId, composer.mode);
    setText("");
    onDone(created, autoChain ? { parentId: created.id, mode: "child" } : null);
  }

  return (
    <div className="rounded-[3px] border border-copper/40 bg-copper-soft/40 p-3" role="form" aria-label="Add a why">
      <p className="font-mono text-[10.5px] tracking-[0.14em] text-copper">
        WHY #{depth} {composer.mode === "branch" ? "· NEW BRANCH" : ""}
      </p>
      <p className="mt-1 text-[14.5px] font-medium leading-6 text-ink">{prompt}</p>
      <TextArea
        ref={ref}
        rows={2}
        value={text}
        placeholder="Because…"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") onCancel();
        }}
        className="mt-2 bg-cream"
        aria-label={prompt}
      />
      {depth >= 7 ? (
        <p className="mt-2 text-[12.5px] leading-5 text-graphite">Deep chains are fine — check that each step is still supported by evidence.</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <SolveButton variant="primary" size="sm" onClick={submit} disabled={!text.trim()}>
          Add why
        </SolveButton>
        <SolveButton size="sm" variant="ghost" onClick={onCancel}>
          Done
        </SolveButton>
        <span className="solve-secondary ml-auto text-[11.5px] text-stone">Enter adds · Shift+Enter newline · Esc closes</span>
      </div>
    </div>
  );
}

export function FiveWhys() {
  const { investigation: inv, dispatch } = useInvestigation();
  const { state: panelState } = usePanel();
  const { select } = useWhyActions();
  const [view, setView] = useState<"diagram" | "list">("diagram");
  const [composer, setComposer] = useState<Composer>(null);
  const [zoom, setZoom] = useState(1);
  const wide = useMediaQuery("(min-width: 768px)");
  const showDiagram = wide && view === "diagram";
  const selectedId = panelState?.kind === "cause" ? panelState.causeId : null;
  const whyCauses = useMemo(() => inv.causes.filter((c) => !(c.origin === "fishbone" && c.parentId === null)), [inv.causes]);
  const deepest = maxDepth(whyCauses);

  function onDone(created: CauseNode, next: Composer) {
    setComposer(next);
    if (!next) select(created.id);
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <SolveButton variant="primary" onClick={() => setComposer({ parentId: null, mode: "child" })} icon={<IconPlus size={15} />}>
        {whyCauses.length === 0 ? "Start the first why" : "Add a why to the problem"}
      </SolveButton>
      <div className="ml-auto flex items-center gap-1">
        <div className="hidden md:block">
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: "diagram", label: "Diagram", icon: <IconGrid size={14} /> },
              { value: "list", label: "List", icon: <IconList size={14} /> },
            ]}
          />
        </div>
        {view === "diagram" ? (
          <div className="hidden items-center md:flex" role="group" aria-label="Zoom">
            <IconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}><IconMinus size={15} /></IconButton>
            <span className="w-10 text-center font-mono text-[11px] text-graphite">{Math.round(zoom * 100)}%</span>
            <IconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))}><IconPlus size={15} /></IconButton>
          </div>
        ) : null}
        <IconButton label="Download SVG" onClick={() => downloadSvg(`${inv.rcaNumber}-five-whys.svg`, whysSvg(inv, { title: true }))}>
          <IconDownload size={16} />
        </IconButton>
      </div>
    </div>
  );

  return (
    <div>
      {toolbar}
      {composer && composer.parentId === null ? (
        <div className="mt-4">
          <WhyComposer composer={composer} onDone={onDone} onCancel={() => setComposer(null)} />
        </div>
      ) : null}
      {whyCauses.length === 0 && !composer ? (
        <EmptyState
          className="mt-5"
          title="No causes yet. Ask why the problem happened, then keep asking why until the answer points at a system, method, or standard — not a person."
          action={<SolveButton onClick={() => setComposer({ parentId: null, mode: "child" })} icon={<IconPlus size={15} />}>Start the first why</SolveButton>}
        />
      ) : null}
      {whyCauses.length > 0 && inv.evidence.length === 0 ? (
        <div className="mt-4">
          <Note tone="amber">No evidence recorded yet. Every cause is still an assumption.</Note>
        </div>
      ) : null}
      {deepest >= 7 ? (
        <p className="mt-3 text-[12.5px] text-graphite">Deep chains are fine — check that each step is still supported by evidence.</p>
      ) : null}
      {whyCauses.length > 0 ? (
        <div className="mt-5">
          {showDiagram ? (
            <WhyDiagram
              zoom={zoom}
              selectedId={selectedId}
              composer={composer}
              setComposer={setComposer}
              onDone={onDone}
              onSelect={select}
              onToggleCollapse={(c) => dispatch({ type: "update_cause", id: c.id, patch: { collapsed: !c.collapsed } })}
            />
          ) : (
            <WhyList
              selectedId={selectedId}
              composer={composer}
              setComposer={setComposer}
              onDone={onDone}
              onSelect={select}
              onToggleCollapse={(c) => dispatch({ type: "update_cause", id: c.id, patch: { collapsed: !c.collapsed } })}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

type TreeProps = {
  selectedId: string | null;
  composer: Composer;
  setComposer: (c: Composer) => void;
  onDone: (created: CauseNode, next: Composer) => void;
  onSelect: (id: string) => void;
  onToggleCollapse: (c: CauseNode) => void;
};

function WhyDiagram({ zoom, selectedId, composer, setComposer, onDone, onSelect, onToggleCollapse }: TreeProps & { zoom: number }) {
  const { investigation: inv } = useInvestigation();
  const layout = useMemo(() => layoutWhys(inv.causes), [inv.causes]);
  const byId = useMemo(() => new Map(inv.causes.map((c) => [c.id, c])), [inv.causes]);
  const childCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of inv.causes) if (c.parentId) m.set(c.parentId, (m.get(c.parentId) ?? 0) + 1);
    return m;
  }, [inv.causes]);
  const composerBox = composer?.parentId ? layout.boxes.find((b) => b.id === composer.parentId) : null;
  const height = layout.height + (composerBox ? 180 : 0);
  const pad = 16;

  return (
    <div className="solve-grid-bg overflow-auto rounded-[3px] border border-line bg-paper" style={{ maxHeight: "72vh" }}>
      <div style={{ width: (layout.width + pad * 2) * zoom, height: (height + pad * 2) * zoom }}>
        <div className="relative origin-top-left" style={{ width: layout.width + pad * 2, height: height + pad * 2, transform: `scale(${zoom})` }}>
          <svg
            className="absolute inset-0"
            width={layout.width + pad * 2}
            height={height + pad * 2}
            role="img"
            aria-label={`Five Whys tree with ${inv.causes.length} causes. A list view is available.`}
          >
            <g transform={`translate(${pad},${pad})`}>
              {layout.edges.map((e) => (
                <path key={`${e.from}-${e.to}`} d={e.path} fill="none" stroke="var(--stone)" strokeWidth={1.4} />
              ))}
            </g>
          </svg>
          {layout.boxes.map((b) => {
            if (b.id === WHY_ROOT_ID) {
              return (
                <div
                  key={b.id}
                  className="absolute flex flex-col rounded-[3px] border border-ink bg-ink px-3 py-2 text-cream"
                  style={{ left: b.x + pad, top: b.y + pad, width: b.width, height: b.height }}
                >
                  <span className="font-mono text-[9.5px] tracking-[0.14em] text-copper">PROBLEM</span>
                  <span className="mt-1 line-clamp-3 text-[12.5px] leading-[1.35]">{inv.problem.whatHappened || inv.title || "Describe the problem on the Problem stage."}</span>
                  <button
                    type="button"
                    onClick={() => setComposer({ parentId: null, mode: "child" })}
                    className="mt-auto inline-flex min-h-[28px] items-center gap-1 self-start rounded-[2px] text-[12px] font-medium text-copper hover:text-white focus-visible:outline-2 focus-visible:outline-copper"
                  >
                    <IconPlus size={12} /> Why
                  </button>
                </div>
              );
            }
            const c = byId.get(b.id);
            if (!c) return null;
            return (
              <CauseCard
                key={c.id}
                inv={inv}
                cause={c}
                depth={b.depth}
                selected={selectedId === c.id}
                hasChildren={(childCount.get(c.id) ?? 0) > 0}
                onSelect={() => onSelect(c.id)}
                onAddWhy={() => setComposer({ parentId: c.id, mode: "child" })}
                onBranch={() => setComposer({ parentId: c.parentId, mode: "branch", anchorId: c.id })}
                onToggleCollapse={() => onToggleCollapse(c)}
                className="absolute"
                style={{ left: b.x + pad, top: b.y + pad, width: b.width, height: b.height }}
              />
            );
          })}
          {composer && composerBox ? (
            <div className="absolute w-[360px]" style={{ left: Math.max(0, composerBox.x + pad - (360 - WHY_NODE.width) / 2), top: composerBox.y + composerBox.height + pad + 12 }}>
              <WhyComposer composer={composer} onDone={onDone} onCancel={() => setComposer(null)} />
            </div>
          ) : null}
          {composer && !composerBox && composer.parentId ? (
            // parent is collapsed or hidden: show composer at top
            <div className="absolute left-4 top-4 w-[360px]">
              <WhyComposer composer={composer} onDone={onDone} onCancel={() => setComposer(null)} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function WhyList({ selectedId, composer, setComposer, onDone, onSelect, onToggleCollapse, readOnly = false }: TreeProps & { readOnly?: boolean }) {
  const { investigation: inv } = useInvestigation();
  const { deleteBranch } = useWhyActions();
  const children = useMemo(() => {
    const m = new Map<string | null, CauseNode[]>();
    for (const c of inv.causes) {
      if (c.origin === "fishbone" && c.parentId === null) continue;
      const list = m.get(c.parentId) ?? [];
      list.push(c);
      m.set(c.parentId, list);
    }
    for (const l of m.values()) l.sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
    return m;
  }, [inv.causes]);

  const render = (parentId: string | null, depth: number): React.ReactNode => {
    const list = children.get(parentId) ?? [];
    return (
      <ol className={depth > 1 ? "ml-4 border-l border-line pl-3 md:ml-5 md:pl-4" : ""}>
        {list.map((c) => {
          const kids = children.get(c.id) ?? [];
          const selected = selectedId === c.id;
          return (
            <li key={c.id} className="mt-2">
              <div className={`rounded-[3px] border bg-cream p-3 ${selected ? "border-copper ring-2 ring-copper/30" : c.classification === "root" ? "border-copper" : "border-line"}`}>
                <button type="button" onClick={() => onSelect(c.id)} className="block w-full min-h-[44px] rounded-[2px] text-left focus-visible:outline-2 focus-visible:outline-copper">
                  <span className="font-mono text-[10px] tracking-[0.14em] text-stone">WHY {depth}</span>
                  <span className="mt-0.5 block text-[14.5px] leading-6 text-ink">{c.text || <span className="text-stone">Untitled cause</span>}</span>
                </button>
                <div className="mt-2"><CauseBadges inv={inv} cause={c} /></div>
                {!readOnly ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <SolveButton size="sm" variant="ghost" onClick={() => setComposer({ parentId: c.id, mode: "child" })} icon={<IconPlus size={13} />}>Why</SolveButton>
                    <SolveButton size="sm" variant="ghost" onClick={() => setComposer({ parentId: c.parentId, mode: "branch", anchorId: c.id })}>Branch</SolveButton>
                    {kids.length ? <SolveButton size="sm" variant="ghost" onClick={() => onToggleCollapse(c)}>{c.collapsed ? `Expand (${kids.length})` : "Collapse"}</SolveButton> : null}
                    <SolveButton size="sm" variant="ghost" onClick={() => onSelect(c.id)}>Details</SolveButton>
                    <SolveButton size="sm" variant="ghost" className="ml-auto hover:text-risk-critical" onClick={() => deleteBranch(c)}>Delete</SolveButton>
                  </div>
                ) : null}
              </div>
              {composer && composer.parentId === c.id ? (
                <div className="mt-2 ml-4 md:ml-5">
                  <WhyComposer composer={composer} onDone={onDone} onCancel={() => setComposer(null)} />
                </div>
              ) : null}
              {!c.collapsed && kids.length ? render(c.id, depth + 1) : null}
            </li>
          );
        })}
      </ol>
    );
  };

  return (
    <div>
      <div className="rounded-[3px] border border-ink bg-ink px-3 py-2.5 text-cream">
        <span className="font-mono text-[10px] tracking-[0.14em] text-copper">PROBLEM</span>
        <p className="mt-0.5 text-[14px] leading-6">{inv.problem.whatHappened || inv.title || "Describe the problem on the Problem stage."}</p>
      </div>
      {render(null, 1)}
    </div>
  );
}
