"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { depthOf } from "@/lib/solve/layout/whys";
import { supportCount } from "@/lib/solve/reducer";
import type { CauseClassification, CauseNode, RemovalTest } from "@/lib/solve/schema";
import { truncate } from "@/lib/solve/text";
import { classificationMeta, evidenceStateMeta, evidenceTypeMeta, removalTestMeta } from "./causeMeta";
import { IconArrowLeft, IconArrowRight, IconBranch, IconClose, IconPlus, LoopGlyph } from "./icons";
import { useInvestigation } from "./InvestigationProvider";
import { useFishboneActions } from "./investigate/FishboneView";
import { useWhyActions } from "./investigate/FiveWhys";
import { candidateCauses } from "./stages/RootCauseStage";
import { Chip, Kbd, Segmented, SolveButton, TextArea } from "./ui";
import { useShell } from "./Workspace";

type Tool = "whys" | "fishbone";

function EvidenceStrip({ cause }: { cause: CauseNode }) {
  const { investigation: inv } = useInvestigation();
  const links = inv.evidenceLinks.filter((l) => l.causeId === cause.id);
  const byId = new Map(inv.evidence.map((e) => [e.id, e]));
  const { supports, contradicts } = supportCount(inv, cause.id);
  const es = evidenceStateMeta[cause.evidenceState];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-white/70">
      <Chip tone={es.tone} icon={es.icon}>{es.label}</Chip>
      <span>{supports} supporting / {contradicts} contradicting</span>
      {links.slice(0, 4).map((l) => {
        const e = byId.get(l.evidenceId);
        return e ? (
          <span key={l.id} className={`inline-flex items-center gap-1 rounded-[3px] border px-2 py-0.5 text-[12.5px] ${l.relation === "supports" ? "border-risk-track/50 text-risk-track-bg" : "border-risk-critical/50 text-risk-critical-bg"}`}>
            {evidenceTypeMeta[e.type].icon} {truncate(e.title, 36)}
          </span>
        ) : null;
      })}
    </div>
  );
}

export function Facilitation({ stage }: { stage: "investigate" | "root-cause" }) {
  const { investigation: inv, dispatch } = useInvestigation();
  const { exitFacilitation } = useShell();
  const { addCause: addWhy } = useWhyActions();
  const { addCause: addFishbone } = useFishboneActions();
  const [tool, setTool] = useState<Tool>("whys");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [catIndex, setCatIndex] = useState(0);
  const [candIndex, setCandIndex] = useState(0);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const byId = useMemo(() => new Map(inv.causes.map((c) => [c.id, c])), [inv.causes]);
  const categories = useMemo(() => [...inv.fishboneCategories].sort((a, b) => a.order - b.order), [inv.fishboneCategories]);
  const candidates = useMemo(() => candidateCauses(inv), [inv]);
  const current = currentId ? byId.get(currentId) ?? null : null;
  const children = useMemo(
    () => inv.causes.filter((c) => c.parentId === currentId && !(c.origin === "fishbone" && c.parentId === null)).sort((a, b) => a.order - b.order),
    [inv.causes, currentId],
  );
  const chain = useMemo(() => {
    const out: CauseNode[] = [];
    let cur = current;
    while (cur) {
      out.unshift(cur);
      cur = cur.parentId ? byId.get(cur.parentId) ?? null : null;
    }
    return out;
  }, [current, byId]);
  const depth = current ? depthOf(inv.causes, current.id) + 1 : 1;
  const cat = categories[Math.min(catIndex, Math.max(0, categories.length - 1))];
  const cand = candidates[Math.min(candIndex, Math.max(0, candidates.length - 1))];

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentId, catIndex, tool, stage]);

  const submit = useCallback(() => {
    if (!text.trim()) return;
    if (stage === "investigate" && tool === "whys") {
      const created = addWhy(text, currentId, "child");
      setCurrentId(created.id);
    } else if (stage === "investigate" && cat) {
      addFishbone(cat.id, text);
    }
    setText("");
  }, [text, stage, tool, addWhy, addFishbone, currentId, cat]);

  const branch = useCallback(() => {
    if (stage !== "investigate" || tool !== "whys") return;
    const parentId = current ? current.parentId : null;
    const created = addWhy(text.trim() || "", parentId, "branch");
    setCurrentId(created.id);
    setText("");
  }, [stage, tool, current, addWhy, text]);

  const back = useCallback(() => {
    if (stage === "root-cause") setCandIndex((i) => Math.max(0, i - 1));
    else if (tool === "fishbone") setCatIndex((i) => Math.max(0, i - 1));
    else setCurrentId(current?.parentId ?? null);
  }, [stage, tool, current]);

  const forward = useCallback(() => {
    if (stage === "root-cause") setCandIndex((i) => Math.min(candidates.length - 1, i + 1));
    else if (tool === "fishbone") setCatIndex((i) => Math.min(categories.length - 1, i + 1));
    else if (children[0]) setCurrentId(children[0].id);
  }, [stage, tool, candidates.length, categories.length, children]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        exitFacilitation();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        branch();
        return;
      }
      const inInput = (e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT";
      if (e.key === "ArrowLeft" && (!inInput || text === "")) {
        e.preventDefault();
        back();
      }
      if (e.key === "ArrowRight" && (!inInput || text === "")) {
        e.preventDefault();
        forward();
      }
      if (stage === "root-cause" && cand && !inInput) {
        if (e.key === "1") dispatch({ type: "update_cause", id: cand.id, patch: { classification: "symptom" } });
        if (e.key === "2") dispatch({ type: "update_cause", id: cand.id, patch: { classification: "contributing" } });
        if (e.key === "3") dispatch({ type: "update_cause", id: cand.id, patch: { classification: "root" } });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exitFacilitation, branch, back, forward, text, stage, cand, dispatch]);

  const prompt =
    stage === "root-cause"
      ? cand
        ? `CANDIDATE ${candIndex + 1} OF ${candidates.length} — Is this a symptom, a contributing cause, or a root cause?`
        : "No candidates yet."
      : tool === "whys"
        ? `WHY #${depth} — Why ${current ? truncate(current.text, 90) || "did this happen" : "did this happen"}?`
        : cat
          ? `${cat.name.toUpperCase()} — What in ${cat.name.toLowerCase()} could have contributed?`
          : "No categories.";

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-ink text-cream" role="dialog" aria-modal="true" aria-label="Facilitation mode">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-8">
        <LoopGlyph className="h-5 w-10" tone="current" />
        <span className="font-mono text-[11px] tracking-[0.18em] text-copper">{stage === "investigate" ? "INVESTIGATE" : "ROOT CAUSE"}</span>
        <span className="hidden text-[13px] text-white/50 md:inline">{inv.rcaNumber} · {inv.title}</span>
        {stage === "investigate" ? (
          <div className="ml-auto [&_[role=tablist]]:border-white/15 [&_[role=tablist]]:bg-white/5 [&_button[aria-selected=false]]:text-white/70">
            <Segmented label="Tool" value={tool} onChange={setTool} options={[{ value: "whys", label: "Five Whys" }, { value: "fishbone", label: "Fishbone" }]} />
          </div>
        ) : <span className="ml-auto" />}
        <button type="button" onClick={exitFacilitation} className="inline-flex min-h-[44px] items-center gap-2 rounded-[3px] border border-white/20 px-3 text-[13px] text-white/80 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-copper">
          <IconClose size={14} /> Exit <span className="hidden md:inline">· Esc</span>
        </button>
      </header>

      <main className="flex flex-1 flex-col justify-center overflow-y-auto px-5 py-8 md:px-16">
        <div className="mx-auto w-full max-w-3xl">
          {stage === "investigate" && tool === "whys" ? (
            <nav aria-label="Chain" className="mb-4 flex flex-wrap items-center gap-1.5 text-[12.5px] text-white/50">
              <button type="button" onClick={() => setCurrentId(null)} className="rounded-[2px] hover:text-white focus-visible:outline-2 focus-visible:outline-copper">Problem</button>
              {chain.map((c, i) => (
                <span key={c.id} className="inline-flex items-center gap-1.5">
                  <span aria-hidden>›</span>
                  <button type="button" onClick={() => setCurrentId(c.id)} className={`rounded-[2px] hover:text-white focus-visible:outline-2 focus-visible:outline-copper ${i === chain.length - 1 ? "text-white" : ""}`}>Why {i + 1}</button>
                </span>
              ))}
            </nav>
          ) : null}

          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-copper">{prompt.split(" — ")[0]}</p>
          <h1 className="mt-3 text-[26px] font-medium leading-[1.2] tracking-[-0.02em] md:text-[38px]">{prompt.split(" — ")[1] ?? ""}</h1>

          {stage === "investigate" && tool === "whys" ? (
            <div className="mt-6 rounded-[3px] border border-white/15 bg-white/5 p-4">
              <p className="font-mono text-[10.5px] tracking-[0.16em] text-white/50">{current ? `WHY ${depth - 1}` : "PROBLEM"}</p>
              <p className="mt-1 text-[17px] leading-7">{current ? current.text : inv.problem.whatHappened || inv.title || "Describe the problem first."}</p>
              {current ? <EvidenceStrip cause={current} /> : null}
              {children.length ? (
                <p className="mt-3 text-[13px] text-white/60">{children.length} existing answer{children.length > 1 ? "s" : ""}: {children.map((c) => truncate(c.text, 40)).join(" · ")} <span className="text-white/40">(→ to follow)</span></p>
              ) : null}
            </div>
          ) : null}

          {stage === "investigate" && tool === "fishbone" && cat ? (
            <div className="mt-6 rounded-[3px] border border-white/15 bg-white/5 p-4">
              <p className="font-mono text-[10.5px] tracking-[0.16em] text-white/50">CATEGORY {catIndex + 1} OF {categories.length}</p>
              <ul className="mt-2 flex flex-col gap-1 text-[15px]">
                {inv.causes.filter((c) => c.parentId === null && c.categoryId === cat.id).map((c) => <li key={c.id} className="flex items-center gap-2"><span className="text-copper">•</span> {c.text}</li>)}
                {inv.causes.filter((c) => c.parentId === null && c.categoryId === cat.id).length === 0 ? <li className="text-white/50">Nothing yet.</li> : null}
              </ul>
            </div>
          ) : null}

          {stage === "root-cause" && cand ? (
            <div className="mt-6 rounded-[3px] border border-white/15 bg-white/5 p-4">
              <p className="text-[19px] leading-7">{cand.text}</p>
              <EvidenceStrip cause={cand} />
              <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Classification">
                {(["symptom", "contributing", "root"] as CauseClassification[]).map((cl, i) => (
                  <button key={cl} type="button" role="radio" aria-checked={cand.classification === cl} onClick={() => dispatch({ type: "update_cause", id: cand.id, patch: { classification: cl } })} className={`inline-flex min-h-[52px] items-center gap-2 rounded-[3px] border px-4 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-copper ${cand.classification === cl ? (cl === "root" ? "border-copper bg-copper text-white" : "border-cream bg-cream text-ink") : "border-white/25 text-white/80 hover:bg-white/10"}`}>
                    {classificationMeta[cl].icon} {classificationMeta[cl].label} <Kbd>{i + 1}</Kbd>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Removal test">
                <span className="text-[13px] text-white/60">If removed, prevents recurrence?</span>
                {(["yes", "no", "not_sure"] as RemovalTest[]).map((r) => (
                  <button key={r} type="button" role="radio" aria-checked={cand.removalTest === r} onClick={() => dispatch({ type: "update_cause", id: cand.id, patch: { removalTest: r } })} className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-[3px] border px-3 text-[14px] focus-visible:outline-2 focus-visible:outline-copper ${cand.removalTest === r ? "border-cream bg-cream text-ink" : "border-white/25 text-white/80 hover:bg-white/10"}`}>
                    {removalTestMeta[r].icon} {removalTestMeta[r].label}
                  </button>
                ))}
              </div>
              {cand.classification === "root" ? (
                <TextArea rows={3} value={cand.rootCauseRationale ?? ""} placeholder="Rationale — why is this the root?" onChange={(e) => dispatch({ type: "update_cause", id: cand.id, patch: { rootCauseRationale: e.target.value } })} className="mt-4 border-white/20 bg-white/5 text-[16px] text-cream placeholder:text-white/40" aria-label="Rationale" />
              ) : null}
            </div>
          ) : null}

          {stage === "investigate" ? (
            <div className="mt-6">
              <TextArea
                ref={inputRef}
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={tool === "whys" ? "Because…" : `A possible ${cat?.name.toLowerCase() ?? ""} cause…`}
                aria-label={prompt}
                className="border-white/25 bg-white/5 text-[20px] text-cream placeholder:text-white/35 md:text-[24px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
              />
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <SolveButton variant="ghost" size="lg" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={back} icon={<IconArrowLeft size={16} />}>Back</SolveButton>
            {stage === "investigate" ? (
              <>
                <SolveButton variant="primary" size="lg" onClick={submit} disabled={!text.trim()} icon={<IconPlus size={16} />}>{tool === "whys" ? "Next why" : "Add cause"}</SolveButton>
                {tool === "whys" ? <SolveButton variant="ghost" size="lg" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={branch} icon={<IconBranch size={16} />}>Branch</SolveButton> : null}
              </>
            ) : null}
            <SolveButton variant="ghost" size="lg" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={forward} icon={<IconArrowRight size={16} />}>{stage === "root-cause" || tool === "fishbone" ? "Next" : "Follow"}</SolveButton>
          </div>
        </div>
      </main>

      <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/10 px-4 py-2.5 text-[12px] text-white/50 md:px-8">
        <span><Kbd>Enter</Kbd> add</span>
        {stage === "investigate" && tool === "whys" ? <span><Kbd>⌘/Ctrl+B</Kbd> branch</span> : null}
        <span><Kbd>←</Kbd> <Kbd>→</Kbd> navigate</span>
        {stage === "root-cause" ? <span><Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> classify</span> : null}
        <span className="ml-auto">Press <Kbd>Esc</Kbd> to exit</span>
      </footer>
    </div>
  );
}
