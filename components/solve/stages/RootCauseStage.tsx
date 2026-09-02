"use client";

import { useMemo } from "react";
import { trackSolve } from "@/lib/solve/analytics";
import { depthOf } from "@/lib/solve/layout/whys";
import { supportCount } from "@/lib/solve/reducer";
import { findingsFor, softFindings } from "@/lib/solve/rules";
import type { CauseClassification, CauseNode, Investigation, RemovalTest } from "@/lib/solve/schema";
import { truncate } from "@/lib/solve/text";
import { classificationMeta, evidenceStateMeta, removalTestMeta } from "../causeMeta";
import { usePanel } from "../ContextPanel";
import { Facilitation } from "../Facilitation";
import { useInvestigation } from "../InvestigationProvider";
import { IconAlert, IconLink, IconPresent, IconTarget } from "@/components/loop/icons";
import { Card, Chip, Coaching, EmptyState, Note, SectionTitle, Select, SolveButton, TextArea } from "@/components/loop/ui";
import { useShell } from "../Workspace";

/** Causes under review: classified, evidence-stated, flagged, or with any linked evidence. */
export function candidateCauses(inv: Pick<Investigation, "causes" | "evidenceLinks">): CauseNode[] {
  const linked = new Set(inv.evidenceLinks.map((l) => l.causeId));
  return inv.causes.filter(
    (c) => c.classification !== "unclassified" || c.evidenceState !== "assumption" || c.candidate || linked.has(c.id),
  );
}

export function RootCauseStage() {
  const { investigation: inv, dispatch } = useInvestigation();
  const { open, state } = usePanel();
  const { enterFacilitation, facilitating } = useShell();
  const candidates = useMemo(() => candidateCauses(inv), [inv]);
  const others = useMemo(() => inv.causes.filter((c) => !candidates.includes(c)), [inv.causes, candidates]);
  const findings = useMemo(() => softFindings(inv), [inv]);
  const categoryById = useMemo(() => new Map(inv.fishboneCategories.map((c) => [c.id, c.name])), [inv.fishboneCategories]);
  const byId = useMemo(() => new Map(inv.causes.map((c) => [c.id, c])), [inv.causes]);
  const roots = candidates.filter((c) => c.classification === "root");

  if (facilitating) return <Facilitation stage="root-cause" />;

  function branchLabel(c: CauseNode): string {
    if (c.parentId === null && c.origin === "fishbone") return `Fishbone · ${categoryById.get(c.categoryId ?? "") ?? "Uncategorized"}`;
    let top: CauseNode = c;
    while (top.parentId && byId.get(top.parentId)) top = byId.get(top.parentId)!;
    return `Why ${depthOf(inv.causes, c.id)} · branch “${truncate(top.text, 28)}”`;
  }

  function classify(c: CauseNode, cl: CauseClassification) {
    dispatch({ type: "update_cause", id: c.id, patch: { classification: cl } });
    if (cl === "root") trackSolve("loopsolve_root_cause_selected", { stage: "root-cause", roots: roots.length + 1 });
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Root cause"
        title="Decide which causes are root, and say why."
        actions={<SolveButton onClick={enterFacilitation} icon={<IconPresent size={15} />}>Walk candidates</SolveButton>}
      >
        A root cause is one that, if removed, prevents recurrence. There can be more than one. A symptom is not a root, and neither is a person.
      </SectionTitle>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Chip tone={roots.length ? "copper" : "neutral"} icon={<IconTarget size={12} />}>{roots.length} root cause{roots.length === 1 ? "" : "s"}</Chip>
        <span className="text-[13px] text-graphite">{candidates.length} candidate{candidates.length === 1 ? "" : "s"} under review</span>
        {others.length ? (
          <label className="ml-auto flex items-center gap-2 text-[13px] text-graphite">
            <span className="whitespace-nowrap">Review another cause</span>
            <Select
              aria-label="Add a cause to review"
              value=""
              onChange={(e) => {
                if (e.target.value) dispatch({ type: "update_cause", id: e.target.value, patch: { candidate: true } });
              }}
              className="w-auto max-w-[260px]"
            >
              <option value="">Choose…</option>
              {others.map((c) => <option key={c.id} value={c.id}>{truncate(c.text || "Untitled cause", 60)}</option>)}
            </Select>
          </label>
        ) : null}
      </div>

      {candidates.length === 0 ? (
        <EmptyState className="mt-5" title="No candidates yet. On Investigate, mark a cause as a candidate, set its evidence state, or classify it — it will show up here for review." />
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {candidates.map((c) => {
            const counts = supportCount(inv, c.id);
            const es = evidenceStateMeta[c.evidenceState];
            const cf = findingsFor(findings, "cause", c.id).map((f) => f.message);
            const selected = state?.kind === "cause" && state.causeId === c.id;
            return (
              <Card as="li" key={c.id} rule={c.classification === "root" ? "copper" : c.classification === "contributing" ? "amber" : undefined} className={`p-4 ${selected ? "ring-2 ring-copper/30" : ""}`}>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <div>
                    <p className="text-[11.5px] text-stone">{branchLabel(c)}</p>
                    <button type="button" onClick={() => open({ kind: "cause", causeId: c.id })} className="mt-0.5 block min-h-[44px] w-full rounded-[2px] text-left text-[15.5px] leading-6 text-ink hover:text-copper focus-visible:outline-2 focus-visible:outline-copper">
                      {c.text || <span className="text-stone">Untitled cause</span>}
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Chip tone={es.tone} icon={es.icon}>{es.label}</Chip>
                      <span className="inline-flex items-center gap-1 text-[12.5px] text-graphite">
                        <IconLink size={12} /> <span className="text-risk-track">{counts.supports} supporting</span> / <span className={counts.contradicts ? "text-risk-critical" : ""}>{counts.contradicts} contradicting</span>
                      </span>
                      {c.challenged ? <span className="inline-flex items-center gap-1 text-[12px] text-risk-amber"><IconAlert size={12} /> Challenged</span> : null}
                    </div>
                    <Coaching items={cf} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <fieldset>
                      <legend className="text-[12px] font-medium uppercase tracking-[0.12em] text-stone">Classification</legend>
                      <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Classification for ${truncate(c.text, 30)}`}>
                        {(["symptom", "contributing", "root"] as CauseClassification[]).map((cl) => (
                          <button key={cl} type="button" role="radio" aria-checked={c.classification === cl} onClick={() => classify(c, cl)} className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-[3px] border px-3 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-copper ${c.classification === cl ? (cl === "root" ? "border-copper bg-copper text-white" : "border-ink bg-ink text-cream") : "border-line bg-paper text-graphite hover:border-ink/40"}`}>
                            {classificationMeta[cl].icon} {classificationMeta[cl].label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    {c.classification === "root" ? (
                      <div>
                        <label htmlFor={`rat-${c.id}`} className="text-[12px] font-medium uppercase tracking-[0.12em] text-stone">Rationale <span className="text-copper">*</span></label>
                        <TextArea id={`rat-${c.id}`} rows={2} value={c.rootCauseRationale ?? ""} placeholder="Why is this the root, and what changes if it is removed?" onChange={(e) => dispatch({ type: "update_cause", id: c.id, patch: { rootCauseRationale: e.target.value } })} className="mt-1" />
                      </div>
                    ) : null}
                    <fieldset>
                      <legend className="text-[12px] font-medium uppercase tracking-[0.12em] text-stone">If removed, would recurrence be prevented?</legend>
                      <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Removal test for ${truncate(c.text, 30)}`}>
                        {(["yes", "no", "not_sure"] as RemovalTest[]).map((r) => (
                          <button key={r} type="button" role="radio" aria-checked={c.removalTest === r} onClick={() => dispatch({ type: "update_cause", id: c.id, patch: { removalTest: r } })} className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-[3px] border px-3 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-copper ${c.removalTest === r ? "border-ink bg-ink text-cream" : "border-line bg-paper text-graphite hover:border-ink/40"}`}>
                            {removalTestMeta[r].icon} {removalTestMeta[r].label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      {roots.length > 0 && !inv.actions.some((a) => a.kind === "preventive") ? (
        <div className="mt-5"><Note tone="neutral">Consider a systemic action so this doesn&rsquo;t recur elsewhere. Add it on the Actions stage as Preventive.</Note></div>
      ) : null}
    </div>
  );
}
