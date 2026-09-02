"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { trackSolve } from "@/lib/solve/analytics";
import { formatDate, formatDateTime } from "@/lib/solve/format";
import { exportFilename, serialize } from "@/lib/solve/io";
import { stamp } from "@/lib/solve/reducer";
import { reportMarkdown, reportSections } from "@/lib/solve/report";
import type { LessonLearned } from "@/lib/solve/schema";
import { statusLabels } from "@/lib/solve/status";
import { downloadSvg, fishboneSvg, whysSvg } from "@/lib/solve/svg";
import { truncate } from "@/lib/solve/text";
import { evidenceStateMeta } from "../causeMeta";
import { usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { IconCopy, IconDownload, IconPlus, IconPrint, IconTrash, LoopGlyph } from "@/components/loop/icons";
import { downloadText } from "@/lib/loop/download";
import { containmentStatusMeta } from "./ContainStage";
import { actionStatusMeta } from "./ActionsStage";
import { resultMeta } from "./VerifyStage";
import { useToast } from "@/components/loop/Toast";
import { Card, Chip, EmptyState, IconButton, SectionTitle, SolveButton, Toggle } from "@/components/loop/ui";
import { usePrimaryAction } from "../Workspace";

function Section({ id, title, children, breakBefore = false }: { id: string; title: string; children: React.ReactNode; breakBefore?: boolean }) {
  return (
    <section id={`report-${id}`} aria-labelledby={`report-${id}-h`} className={`loop-print-section mt-8 first:mt-0 ${breakBefore ? "loop-print-break" : ""}`}>
      <h3 id={`report-${id}-h`} className="border-b border-ink/20 pb-1.5 text-[15px] font-medium uppercase tracking-[0.08em] text-ink">{title}</h3>
      <div className="mt-3 text-[14px] leading-6 text-ink">{children}</div>
    </section>
  );
}

export function SummaryStage() {
  const { investigation: inv, dispatch, restore } = useInvestigation();
  const { open, state } = usePanel();
  const toast = useToast();
  const params = useSearchParams();
  const [eightD, setEightD] = useState(false);
  const label = (key: string) => {
    const s = reportSections.find((x) => x.key === key)!;
    return eightD ? s.eightD : s.standard;
  };
  const byId = useMemo(() => new Map(inv.causes.map((c) => [c.id, c])), [inv.causes]);
  const evById = useMemo(() => new Map(inv.evidence.map((e) => [e.id, e])), [inv.evidence]);
  const whys = useMemo(() => whysSvg(inv), [inv]);
  const fishbone = useMemo(() => fishboneSvg(inv), [inv]);
  const roots = inv.causes.filter((c) => c.classification === "root");
  const contributing = inv.causes.filter((c) => c.classification === "contributing");
  const flags = Object.entries(inv.problem.impactFlags).filter(([, v]) => v).map(([k]) => k);

  useEffect(() => {
    if (params.get("print") === "1") {
      const h = window.setTimeout(() => window.print(), 600);
      return () => window.clearTimeout(h);
    }
  }, [params]);

  function addLesson() {
    const item: LessonLearned = { ...stamp(), lesson: "", relatedProcess: "", standardWorkUpdate: false, trainingUpdate: false, documentUpdate: false };
    dispatch({ type: "add_lesson", item });
    open({ kind: "lesson", lessonId: item.id });
  }
  function removeLesson(l: LessonLearned) {
    const snapshot = inv;
    dispatch({ type: "remove_lesson", id: l.id });
    toast.show("Lesson deleted.", { undo: () => restore(snapshot) });
  }
  async function copySummary() {
    try {
      await navigator.clipboard.writeText(reportMarkdown(inv, eightD));
      toast.show("Summary copied as Markdown.", { tone: "green" });
    } catch {
      toast.show("Could not access the clipboard.", { tone: "red" });
    }
  }
  function print() {
    trackSolve("loopsolve_print", { stage: "summary" });
    window.print();
  }

  usePrimaryAction({ label: "Print report", onClick: print, icon: <IconPrint size={16} /> }, []);

  return (
    <div>
      <div className="loop-no-print">
        <SectionTitle eyebrow="Summary" title="The report, and what we learned.">
          Print it, copy it as Markdown, or export the JSON. Switch to 8D labels for a customer or supplier that expects them.
        </SectionTitle>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <SolveButton variant="primary" onClick={print} icon={<IconPrint size={15} />}>Print</SolveButton>
          <SolveButton onClick={copySummary} icon={<IconCopy size={15} />}>Copy summary</SolveButton>
          <SolveButton onClick={() => { downloadText(exportFilename(inv), serialize(inv)); trackSolve("loopsolve_export", { stage: "summary" }); }} icon={<IconDownload size={15} />}>Export JSON</SolveButton>
          <SolveButton onClick={() => { downloadSvg(`${inv.rcaNumber}-five-whys.svg`, whysSvg(inv, { title: true })); downloadSvg(`${inv.rcaNumber}-fishbone.svg`, fishboneSvg(inv, { title: true })); }} icon={<IconDownload size={15} />}>Download SVG diagrams</SolveButton>
          <div className="ml-auto w-full max-w-[260px] rounded-[3px] border border-line bg-cream">
            <Toggle label="8D labels" description="D0–D8 section headings" checked={eightD} onChange={setEightD} />
          </div>
        </div>
      </div>

      {/* Print header: repeated on every page via position:fixed in print CSS */}
      <div className="loop-print-header hidden">
        <span>{inv.rcaNumber} · {inv.title || "Untitled investigation"}</span>
        <span>Status: {statusLabels[inv.status]} · LoopSolve</span>
      </div>

      <article className="loop-report loop-print-body mt-6 rounded-[3px] border border-line bg-white p-5 md:p-8 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink pb-4">
          <div>
            <p className="font-mono text-[12px] tracking-[0.1em] text-copper">{inv.rcaNumber}</p>
            <h2 className="mt-1 text-[24px] font-medium tracking-[-0.02em] text-ink">{inv.title || "Untitled investigation"}</h2>
            <p className="mt-1 text-[13px] text-graphite">
              {inv.owner ? `Owner ${inv.owner} · ` : ""}{inv.department ? `${inv.department} · ` : ""}Created {formatDate(inv.createdAt)} · Updated {formatDate(inv.updatedAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] uppercase tracking-[0.12em] text-stone">Status</p>
            <p className="text-[15px] font-medium text-ink">{statusLabels[inv.status]}</p>
            {inv.reopenedCount ? <p className="text-[12px] text-graphite">Reopened {inv.reopenedCount}×</p> : null}
          </div>
        </header>

        <div className="mt-6">
          <Section id="problem" title={label("problem")}>
            <p>{inv.problem.generatedStatement || <span className="text-stone">Not yet defined.</span>}</p>
            {inv.problem.whenIso ? <p className="mt-1 text-[13px] text-graphite">Occurred {formatDateTime(inv.problem.whenIso)}</p> : null}
          </Section>
          <Section id="impact" title={label("impact")}>
            <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[140px_1fr]">
              <dt className="text-graphite">Impact</dt><dd>{inv.problem.impact || "—"}</dd>
              <dt className="text-graphite">Affected</dt><dd>{inv.problem.affected || "—"}</dd>
              <dt className="text-graphite">Impact areas</dt><dd>{flags.length ? flags.join(", ") : "—"}</dd>
              {inv.problem.financialImpactNote ? <><dt className="text-graphite">Financial</dt><dd>{inv.problem.financialImpactNote}</dd></> : null}
              {inv.problem.process || inv.problem.equipment || inv.problem.product ? <><dt className="text-graphite">Process</dt><dd>{[inv.problem.process, inv.problem.equipment, inv.problem.product].filter(Boolean).join(" · ")}</dd></> : null}
            </dl>
          </Section>
          <Section id="containment" title={label("containment")}>
            {inv.containment.length ? (
              <ul className="flex flex-col gap-1.5">
                {inv.containment.map((c) => (
                  <li key={c.id}><span className="font-medium">[{containmentStatusMeta[c.status].label}]</span> {c.action}{c.owner ? ` — ${c.owner}` : ""}{c.scope ? <span className="text-graphite"> · scope: {c.scope}</span> : null}{c.verificationNote ? <span className="block text-[13px] text-graphite">Containment check: {c.verificationNote}</span> : null}</li>
                ))}
              </ul>
            ) : <p className="text-stone">None recorded.</p>}
          </Section>
          <Section id="investigation" title={label("investigation")}>
            <p>{inv.causes.length} causes examined · {inv.evidence.length} evidence items · {inv.evidenceLinks.length} evidence links · {inv.timeline.length} timeline events.</p>
            {inv.timeline.length ? (
              <ol className="mt-2 flex flex-col gap-1 text-[13px]">
                {[...inv.timeline].sort((a, b) => a.at.localeCompare(b.at)).map((t) => <li key={t.id}><span className="font-mono text-graphite">{formatDateTime(t.at)}</span> — {t.text}</li>)}
              </ol>
            ) : null}
            {inv.evidence.length ? (
              <ul className="mt-3 grid gap-1 text-[13px] sm:grid-cols-2">
                {inv.evidence.map((e) => <li key={e.id}><span className="font-medium">{e.title || "Untitled evidence"}</span>{e.source ? <span className="text-graphite"> · {e.source}</span> : null}</li>)}
              </ul>
            ) : null}
          </Section>
          <Section id="whys" title={label("whys")} breakBefore>
            {inv.causes.some((c) => !(c.origin === "fishbone" && c.parentId === null)) ? (
              <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: whys.replace("<svg ", '<svg style="max-width:100%;height:auto" ') }} />
            ) : <p className="text-stone">No Five Whys recorded.</p>}
          </Section>
          <Section id="fishbone" title={label("fishbone")} breakBefore>
            {inv.causes.some((c) => c.parentId === null && c.categoryId) ? (
              <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: fishbone.replace("<svg ", '<svg style="max-width:100%;height:auto" ') }} />
            ) : <p className="text-stone">No fishbone causes recorded.</p>}
          </Section>
          <Section id="roots" title={label("roots")} breakBefore>
            {roots.length ? (
              <ol className="flex flex-col gap-3">
                {roots.map((r) => {
                  const ev = inv.evidenceLinks.filter((l) => l.causeId === r.id && l.relation === "supports").map((l) => evById.get(l.evidenceId)?.title).filter(Boolean);
                  return (
                    <li key={r.id} className="border-l-[3px] border-copper pl-3">
                      <p className="font-medium">{r.text}</p>
                      {r.rootCauseRationale ? <p className="text-[13.5px] text-graphite">{r.rootCauseRationale}</p> : null}
                      <p className="mt-1 text-[12.5px] text-graphite">Evidence state: {evidenceStateMeta[r.evidenceState].label}{ev.length ? ` · supported by ${ev.join("; ")}` : ""}{r.removalTest ? ` · removal test: ${r.removalTest.replace("_", " ")}` : ""}</p>
                    </li>
                  );
                })}
              </ol>
            ) : <p className="text-stone">No root cause classified yet.</p>}
            {contributing.length ? <p className="mt-3 text-[13.5px]"><span className="font-medium">Contributing:</span> {contributing.map((c) => c.text).join("; ")}</p> : null}
          </Section>
          {(["corrective", "preventive"] as const).map((kind) => (
            <Section key={kind} id={kind} title={label(kind)}>
              {inv.actions.filter((a) => a.kind === kind).length ? (
                <ul className="flex flex-col gap-1.5">
                  {inv.actions.filter((a) => a.kind === kind).map((a) => (
                    <li key={a.id}><span className="font-medium">[{actionStatusMeta[a.status].label}]</span> {a.title}{a.owner ? ` — ${a.owner}` : ""}{a.dueDate ? `, due ${formatDate(a.dueDate)}` : ""}<span className="block text-[13px] text-graphite">Addresses: {a.linkedCauseIds.map((id) => truncate(byId.get(id)?.text ?? "", 80)).join("; ") || "—"}</span></li>
                  ))}
                </ul>
              ) : <p className="text-stone">None.</p>}
            </Section>
          ))}
          <Section id="verification" title={label("verification")}>
            {inv.verifications.length ? (
              <ul className="flex flex-col gap-1.5">
                {inv.verifications.map((v) => {
                  const a = inv.actions.find((x) => x.id === v.actionId);
                  return <li key={v.id}><span className="font-medium">{a?.title ?? "Action"}:</span> {resultMeta[v.result].label}{v.checkAt ? ` (${formatDate(v.checkAt)}${v.verifier ? `, ${v.verifier}` : ""})` : ""}{v.observed ? <span className="block text-[13px] text-graphite">{v.observed}</span> : null}</li>;
                })}
              </ul>
            ) : <p className="text-stone">No verification recorded.</p>}
          </Section>
          <Section id="lessons" title={label("lessons")}>
            <div className="loop-no-print mb-3 flex flex-wrap items-center gap-2">
              <SolveButton size="sm" onClick={addLesson} icon={<IconPlus size={13} />}>Add lesson</SolveButton>
              <span className="text-[12.5px] text-stone">Handoff to LoopKnow, later.</span>
            </div>
            {inv.lessons.length ? (
              <ul className="flex flex-col gap-2">
                {inv.lessons.map((l) => {
                  const updates = [l.standardWorkUpdate && "standard work", l.trainingUpdate && "training", l.documentUpdate && "documents"].filter(Boolean).join(", ");
                  const sel = state?.kind === "lesson" && state.lessonId === l.id;
                  return (
                    <Card as="li" key={l.id} className={`flex items-start gap-2 p-3 print:border-0 print:p-0 ${sel ? "ring-2 ring-copper/30" : ""}`}>
                      <button type="button" onClick={() => open({ kind: "lesson", lessonId: l.id })} className="min-h-[44px] flex-1 rounded-[2px] text-left focus-visible:outline-2 focus-visible:outline-copper print:min-h-0">
                        <span className="block">{l.lesson || <span className="text-stone">Untitled lesson — tap to edit</span>}</span>
                        <span className="block text-[13px] text-graphite">{l.relatedProcess ? `Process: ${l.relatedProcess}. ` : ""}{updates ? `Update: ${updates}. ` : ""}{l.similarProcessesToReview ? `Review: ${l.similarProcessesToReview}` : ""}</span>
                      </button>
                      <IconButton label="Delete lesson" onClick={() => removeLesson(l)} className="loop-no-print hover:text-risk-critical"><IconTrash size={14} /></IconButton>
                    </Card>
                  );
                })}
              </ul>
            ) : <EmptyState className="loop-no-print" title="What should the organization keep from this? One or two lessons are enough." action={<SolveButton size="sm" onClick={addLesson} icon={<IconPlus size={13} />}>Add lesson</SolveButton>} />}
          </Section>
          <Section id="history" title={label("history")}>
            <ul className="flex flex-col gap-1 text-[13px]">
              {inv.history.filter((h) => h.type !== "status_changed").map((h) => (
                <li key={h.id} className="flex flex-wrap gap-2"><span className="font-mono text-graphite">{formatDateTime(h.at)}</span><Chip tone={h.type === "reopened" ? "red" : h.type === "closed" ? "green" : "neutral"}>{h.type}</Chip>{h.note ? <span className="text-graphite">{h.note}</span> : null}</li>
              ))}
            </ul>
          </Section>
        </div>
        <footer className="mt-8 flex items-center gap-2 border-t border-line pt-3 text-[11.5px] text-stone">
          <LoopGlyph className="h-3 w-6" /> Generated with LoopSolve by LoopSignal.
        </footer>
      </article>

      {inv.status === "closed" ? (
        <div className="loop-no-print mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[3px] border border-line bg-cream px-5 py-4">
          <p className="text-[14px] text-graphite">Need help with a recurring or cross-functional problem?</p>
          <Link href="/loopscan?intent=talk#intake" className="inline-flex min-h-[44px] items-center rounded-[3px] border border-ink/25 px-4 text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream focus-visible:outline-2 focus-visible:outline-copper">Talk to LoopSignal</Link>
        </div>
      ) : null}
    </div>
  );
}
