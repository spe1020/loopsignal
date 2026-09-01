"use client";

import { useMemo, useState } from "react";
import { trackSolve } from "@/lib/solve/analytics";
import { depthOf } from "@/lib/solve/layout/whys";
import { supportCount } from "@/lib/solve/reducer";
import { BLAME_COACHING, BLAME_TERMS } from "@/lib/solve/rules";
import type { CauseClassification, CauseNode, EvidenceRelation, EvidenceState, RemovalTest } from "@/lib/solve/schema";
import { causeClassifications, evidenceStates, removalTests } from "@/lib/solve/schema";
import { jaccard, truncate } from "@/lib/solve/text";
import { classificationMeta, evidenceStateMeta, evidenceTypeMeta, removalTestMeta } from "../causeMeta";
import { ContextPanel, usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { useWhyActions } from "../investigate/FiveWhys";
import { useCreateEvidence } from "../investigate/useCreateEvidence";
import { IconAlert, IconBranch, IconLink, IconPlus, IconTrash } from "../icons";
import { Chip, Coaching, Field, Select, SolveButton, TextArea, TextInput } from "../ui";

function OptionRow<T extends string>({ label, value, options, onChange, disabledKeys = {}, name }: { label: string; value: T | undefined; options: { value: T; label: string; icon?: React.ReactNode; tone?: string }[]; onChange: (v: T) => void; disabledKeys?: Partial<Record<T, string>>; name: string }) {
  return (
    <fieldset>
      <legend className="text-[13px] font-medium text-ink">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const disabled = disabledKeys[o.value];
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              name={name}
              aria-checked={active}
              disabled={Boolean(disabled)}
              title={disabled || undefined}
              onClick={() => onChange(o.value)}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-[3px] border px-3 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-copper disabled:cursor-not-allowed disabled:opacity-40 ${
                active ? "border-ink bg-ink text-cream" : "border-line bg-paper text-graphite hover:border-ink/40"
              }`}
            >
              {o.icon} {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CausePanel({ causeId }: { causeId: string }) {
  const { investigation: inv, dispatch } = useInvestigation();
  const { open, close } = usePanel();
  const { deleteBranch } = useWhyActions();
  const createEvidence = useCreateEvidence();
  const cause = inv.causes.find((c) => c.id === causeId);
  const [linking, setLinking] = useState(false);
  const [q, setQ] = useState("");
  const [showNote, setShowNote] = useState(Boolean(cause?.note));
  const counts = cause ? supportCount(inv, cause.id) : { supports: 0, contradicts: 0 };
  const links = useMemo(() => inv.evidenceLinks.filter((l) => l.causeId === causeId), [inv.evidenceLinks, causeId]);
  const evidenceById = useMemo(() => new Map(inv.evidence.map((e) => [e.id, e])), [inv.evidence]);
  const categories = useMemo(() => [...inv.fishboneCategories].sort((a, b) => a.order - b.order), [inv.fishboneCategories]);
  if (!cause) return null;

  const set = (patch: Partial<CauseNode>) => dispatch({ type: "update_cause", id: cause.id, patch });
  const depth = depthOf(inv.causes, cause.id);
  const parent = cause.parentId ? inv.causes.find((c) => c.id === cause.parentId) : null;
  const isWhy = !(cause.origin === "fishbone" && cause.parentId === null);
  const coaching: string[] = [];
  const lower = cause.text.toLowerCase();
  if (BLAME_TERMS.some((t) => lower.includes(t))) coaching.push(BLAME_COACHING);
  if (inv.problem.whatHappened && jaccard(cause.text, inv.problem.whatHappened) >= 0.7) coaching.push("This appears to restate the problem rather than explain why it occurred.");
  if (cause.classification === "root" && cause.evidenceState !== "verified" && cause.evidenceState !== "data_supported") coaching.push("This root cause has not yet been supported by verified evidence.");
  if (cause.removalTest === "not_sure") coaching.push("Needs further investigation.");

  const unlinked = inv.evidence.filter((e) => !links.some((l) => l.evidenceId === e.id) && (!q.trim() || `${e.title} ${e.source}`.toLowerCase().includes(q.toLowerCase())));

  function classify(c: CauseClassification) {
    set({ classification: c, candidate: c !== "unclassified" ? true : cause!.candidate });
    if (c === "root") trackSolve("loopsolve_root_cause_selected", { stage: "investigate", roots: inv.causes.filter((x) => x.classification === "root").length + 1 });
  }

  function promote() {
    dispatch({ type: "move_cause", id: cause!.id, patch: { parentId: null, origin: "promoted", categoryId: cause!.categoryId } });
  }

  return (
    <ContextPanel title={isWhy ? `Why ${depth}` : "Fishbone cause"} fullScreen={inv.shopFloorMode}>
      <div className="flex flex-col gap-5">
        {parent ? <p className="text-[12.5px] leading-5 text-stone">Why <span className="text-graphite">{truncate(parent.text, 80)}</span>?</p> : null}
        <Field label="Cause" htmlFor="cause-text">
          <TextArea id="cause-text" rows={3} value={cause.text} onChange={(e) => set({ text: e.target.value })} onSubmitKey={close} autoFocus={!cause.text} />
          <Coaching items={coaching.filter((m) => m !== "Needs further investigation.")} />
        </Field>

        <OptionRow<EvidenceState>
          name="evidence-state"
          label="Evidence state"
          value={cause.evidenceState}
          onChange={(v) => set({ evidenceState: v })}
          options={evidenceStates.map((s) => ({ value: s, label: evidenceStateMeta[s].label, icon: evidenceStateMeta[s].icon }))}
          disabledKeys={counts.supports === 0 ? { verified: "Link at least one supporting evidence item before marking this cause verified." } : {}}
        />
        {counts.supports === 0 && cause.evidenceState !== "verified" ? (
          <p className="-mt-3 text-[12px] leading-5 text-stone">“Verified” needs at least one supporting evidence link. {evidenceStateMeta[cause.evidenceState].hint}</p>
        ) : (
          <p className="-mt-3 text-[12px] leading-5 text-stone">{evidenceStateMeta[cause.evidenceState].hint}</p>
        )}

        <section aria-labelledby="cause-evidence">
          <div className="flex items-center justify-between">
            <h3 id="cause-evidence" className="text-[13px] font-medium text-ink">
              Evidence <span className="font-normal text-stone">· {counts.supports} supporting / {counts.contradicts} contradicting</span>
            </h3>
            <SolveButton size="sm" variant="ghost" onClick={() => setLinking((v) => !v)} icon={<IconLink size={13} />}>{linking ? "Close" : "Link"}</SolveButton>
          </div>
          {links.length ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {links.map((l) => {
                const e = evidenceById.get(l.evidenceId);
                if (!e) return null;
                return (
                  <li key={l.id} className="flex items-center gap-2 rounded-[3px] border border-line bg-paper px-2.5 py-1.5">
                    <span className="text-copper">{evidenceTypeMeta[e.type].icon}</span>
                    <button type="button" onClick={() => open({ kind: "evidence", evidenceId: e.id })} className="min-w-0 flex-1 truncate text-left text-[13px] text-ink hover:underline focus-visible:outline-2 focus-visible:outline-copper">{e.title || "Untitled evidence"}</button>
                    <RelationToggle value={l.relation} onChange={(r) => dispatch({ type: "link_evidence", evidenceId: e.id, causeId: cause.id, relation: r })} />
                    <button type="button" aria-label="Unlink" onClick={() => dispatch({ type: "unlink_evidence", evidenceId: e.id, causeId: cause.id })} className="inline-flex h-8 w-8 items-center justify-center rounded-[2px] text-stone hover:text-risk-critical focus-visible:outline-2 focus-visible:outline-copper"><IconTrash size={13} /></button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1.5 text-[12.5px] text-stone">No evidence linked. This cause is an assumption until something supports it.</p>
          )}
          {linking ? (
            <div className="mt-2 rounded-[3px] border border-copper/30 bg-copper-soft/30 p-2.5">
              <TextInput aria-label="Search evidence to link" placeholder="Search evidence…" value={q} onChange={(e) => setQ(e.target.value)} />
              <ul className="mt-2 max-h-56 overflow-y-auto">
                {unlinked.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 border-b border-line/70 py-1.5 last:border-0">
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{e.title || "Untitled evidence"}</span>
                    <SolveButton size="sm" onClick={() => dispatch({ type: "link_evidence", evidenceId: e.id, causeId: cause.id, relation: "supports" })}>Supports</SolveButton>
                    <SolveButton size="sm" onClick={() => dispatch({ type: "link_evidence", evidenceId: e.id, causeId: cause.id, relation: "contradicts" })}>Contradicts</SolveButton>
                  </li>
                ))}
                {unlinked.length === 0 ? <li className="py-1.5 text-[12.5px] text-stone">No other evidence to link.</li> : null}
              </ul>
              <SolveButton size="sm" variant="dark" className="mt-2" onClick={() => createEvidence(cause.id)} icon={<IconPlus size={13} />}>New evidence for this cause</SolveButton>
            </div>
          ) : null}
        </section>

        <OptionRow<CauseClassification>
          name="classification"
          label="Classification"
          value={cause.classification}
          onChange={classify}
          options={causeClassifications.map((c) => ({ value: c, label: classificationMeta[c].label, icon: classificationMeta[c].icon }))}
        />
        {cause.classification === "root" ? (
          <Field label="Root cause rationale" htmlFor="cause-rationale" required helper="Why is this the root and not another symptom? What would change if it were removed?">
            <TextArea id="cause-rationale" rows={3} value={cause.rootCauseRationale ?? ""} onChange={(e) => set({ rootCauseRationale: e.target.value })} />
          </Field>
        ) : null}
        <OptionRow<RemovalTest>
          name="removal"
          label="If this cause were removed, would recurrence be prevented?"
          value={cause.removalTest}
          onChange={(v) => set({ removalTest: v })}
          options={removalTests.map((r) => ({ value: r, label: removalTestMeta[r].label, icon: removalTestMeta[r].icon }))}
        />
        {cause.removalTest === "not_sure" ? <p className="-mt-3 flex items-center gap-1.5 text-[12.5px] text-risk-amber"><IconAlert size={13} /> Needs further investigation</p> : null}

        <div className="flex flex-wrap gap-1.5">
          <SolveButton size="sm" variant={cause.challenged ? "dark" : "secondary"} onClick={() => set({ challenged: !cause.challenged })} icon={<IconAlert size={13} />} aria-pressed={cause.challenged}>
            {cause.challenged ? "Challenged" : "Challenge assumption"}
          </SolveButton>
          <SolveButton size="sm" variant={cause.candidate ? "dark" : "secondary"} onClick={() => set({ candidate: !cause.candidate })} aria-pressed={cause.candidate}>
            {cause.candidate ? "Root cause candidate" : "Mark as candidate"}
          </SolveButton>
          <SolveButton size="sm" variant="secondary" onClick={() => setShowNote((v) => !v)}>{showNote ? "Hide note" : "Add note"}</SolveButton>
        </div>
        {showNote ? (
          <Field label="Note" htmlFor="cause-note">
            <TextArea id="cause-note" rows={2} value={cause.note ?? ""} onChange={(e) => set({ note: e.target.value })} />
          </Field>
        ) : null}

        <Field label="Fishbone category" htmlFor="cause-category" helper={isWhy ? "Optional. Places this why on the fishbone as well." : "Move this cause to a different rib."}>
          <Select id="cause-category" value={cause.categoryId ?? ""} onChange={(e) => set({ categoryId: e.target.value || undefined })}>
            <option value="">None</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>

        {!isWhy ? (
          <SolveButton onClick={promote} icon={<IconBranch size={14} />}>Promote to Five Whys branch</SolveButton>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Chip tone="neutral">{cause.origin === "fishbone" ? "From fishbone" : cause.origin === "promoted" ? "Promoted from fishbone" : "From Five Whys"}</Chip>
          <SolveButton size="sm" variant="danger" className="ml-auto" onClick={() => deleteBranch(cause)} icon={<IconTrash size={13} />}>Delete {isWhy ? "branch" : "cause"}</SolveButton>
        </div>
      </div>
    </ContextPanel>
  );
}

export function RelationToggle({ value, onChange }: { value: EvidenceRelation; onChange: (r: EvidenceRelation) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value === "supports" ? "contradicts" : "supports")}
      className={`inline-flex min-h-[30px] items-center rounded-[3px] border px-2 text-[11.5px] font-medium focus-visible:outline-2 focus-visible:outline-copper ${
        value === "supports" ? "border-risk-track/40 bg-risk-track-bg text-risk-track" : "border-risk-critical/40 bg-risk-critical-bg text-risk-critical"
      }`}
      title="Toggle supports / contradicts"
    >
      {value === "supports" ? "Supports" : "Contradicts"}
    </button>
  );
}
