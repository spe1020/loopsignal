"use client";

import { useMemo, useState } from "react";
import type { Evidence, EvidenceType } from "@/lib/solve/schema";
import { evidenceTypes } from "@/lib/solve/schema";
import { truncate } from "@/lib/solve/text";
import { evidenceTypeMeta } from "../causeMeta";
import { ContextPanel, usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { IconTrash } from "@/components/loop/icons";
import { Field, Select, SolveButton, TextArea, TextInput } from "@/components/loop/ui";
import { RelationToggle } from "./CausePanel";

export function EvidencePanel({ evidenceId, forCauseId }: { evidenceId: string | null; forCauseId?: string }) {
  const { investigation: inv, dispatch } = useInvestigation();
  const { open, close } = usePanel();
  const [q, setQ] = useState("");
  void forCauseId;
  const id = evidenceId;
  const item = inv.evidence.find((e) => e.id === id);
  const links = useMemo(() => inv.evidenceLinks.filter((l) => l.evidenceId === id), [inv.evidenceLinks, id]);
  const causeById = useMemo(() => new Map(inv.causes.map((c) => [c.id, c])), [inv.causes]);
  if (!item) return null;
  const set = (patch: Partial<Evidence>) => dispatch({ type: "update_evidence", id: item.id, patch });
  const candidates = inv.causes.filter((c) => !links.some((l) => l.causeId === c.id) && (!q.trim() || c.text.toLowerCase().includes(q.toLowerCase())));

  return (
    <ContextPanel title="Evidence" fullScreen={inv.shopFloorMode}>
      <div className="flex flex-col gap-4">
        <Field label="Title" htmlFor="ev-title"><TextInput id="ev-title" value={item.title} onChange={(e) => set({ title: e.target.value })} autoFocus={!item.title} placeholder="CMM report, gauge log, interview…" /></Field>
        <Field label="Type" htmlFor="ev-type">
          <Select id="ev-type" value={item.type} onChange={(e) => set({ type: e.target.value as EvidenceType })}>
            {evidenceTypes.map((t) => <option key={t} value={t}>{evidenceTypeMeta[t].label}</option>)}
          </Select>
        </Field>
        <Field label="What does it show?" htmlFor="ev-desc" helper={item.type === "photo_ref" ? "Text reference only: filename or where the photo lives." : undefined}>
          <TextArea id="ev-desc" rows={3} value={item.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Source" htmlFor="ev-source"><TextInput id="ev-source" value={item.source} onChange={(e) => set({ source: e.target.value })} /></Field>
          <Field label="Date" htmlFor="ev-date"><input id="ev-date" type="date" value={item.date?.slice(0, 10) ?? ""} onChange={(e) => set({ date: e.target.value || undefined })} className="min-h-(--loop-control) w-full rounded-[3px] border border-line bg-cream px-3 text-ink focus:border-copper focus:outline-none" /></Field>
        </div>

        <section>
          <h3 className="text-[13px] font-medium text-ink">Linked causes</h3>
          {links.length ? (
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {links.map((l) => {
                const c = causeById.get(l.causeId);
                if (!c) return null;
                return (
                  <li key={l.id} className="flex items-center gap-2 rounded-[3px] border border-line bg-paper px-2.5 py-1.5">
                    <button type="button" onClick={() => open({ kind: "cause", causeId: c.id })} className="min-w-0 flex-1 truncate text-left text-[13px] text-ink hover:underline focus-visible:outline-2 focus-visible:outline-copper">{truncate(c.text || "Untitled cause", 60)}</button>
                    <RelationToggle value={l.relation} onChange={(r) => dispatch({ type: "link_evidence", evidenceId: item.id, causeId: c.id, relation: r })} />
                    <button type="button" aria-label="Unlink" onClick={() => dispatch({ type: "unlink_evidence", evidenceId: item.id, causeId: c.id })} className="inline-flex h-8 w-8 items-center justify-center rounded-[2px] text-stone hover:text-risk-critical focus-visible:outline-2 focus-visible:outline-copper"><IconTrash size={13} /></button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-1 text-[12.5px] text-stone">Not linked yet. Link it to the causes it supports or contradicts.</p>
          )}
          <div className="mt-2 rounded-[3px] border border-line bg-paper/60 p-2.5">
            <TextInput aria-label="Search causes" placeholder="Search causes to link…" value={q} onChange={(e) => setQ(e.target.value)} />
            <ul className="mt-2 max-h-56 overflow-y-auto">
              {candidates.slice(0, 30).map((c) => (
                <li key={c.id} className="flex items-center gap-2 border-b border-line/70 py-1.5 last:border-0">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{truncate(c.text || "Untitled cause", 60)}</span>
                  <SolveButton size="sm" onClick={() => dispatch({ type: "link_evidence", evidenceId: item.id, causeId: c.id, relation: "supports" })}>Supports</SolveButton>
                  <SolveButton size="sm" onClick={() => dispatch({ type: "link_evidence", evidenceId: item.id, causeId: c.id, relation: "contradicts" })}>Contradicts</SolveButton>
                </li>
              ))}
              {candidates.length === 0 ? <li className="py-1.5 text-[12.5px] text-stone">{inv.causes.length ? "No other causes match." : "Add causes on Five Whys or Fishbone first."}</li> : null}
            </ul>
          </div>
        </section>
        <SolveButton variant="dark" onClick={close}>Done</SolveButton>
      </div>
    </ContextPanel>
  );
}
