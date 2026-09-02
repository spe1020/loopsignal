"use client";

import { useMemo, useState } from "react";
import type { Evidence, EvidenceType } from "@/lib/solve/schema";
import { evidenceTypes } from "@/lib/solve/schema";
import { formatDate } from "@/lib/solve/format";
import { truncate } from "@/lib/solve/text";
import { evidenceTypeMeta } from "../causeMeta";
import { usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { IconPlus, IconSearch, IconTrash } from "@/components/loop/icons";
import { useToast } from "@/components/loop/Toast";
import { Card, EmptyState, IconButton, Select, SolveButton, TextInput } from "@/components/loop/ui";
import { useCreateEvidence } from "./useCreateEvidence";

export function EvidenceView() {
  const { investigation: inv, dispatch, restore } = useInvestigation();
  const { open, state } = usePanel();
  const toast = useToast();
  const createEvidence = useCreateEvidence();
  const [q, setQ] = useState("");
  const [type, setType] = useState<EvidenceType | "all">("all");
  const causeById = useMemo(() => new Map(inv.causes.map((c) => [c.id, c])), [inv.causes]);
  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return inv.evidence
      .filter((e) => type === "all" || e.type === type)
      .filter((e) => !needle || `${e.title} ${e.description} ${e.source}`.toLowerCase().includes(needle))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [inv.evidence, q, type]);

  function remove(e: Evidence) {
    const snapshot = inv;
    dispatch({ type: "remove_evidence", id: e.id });
    toast.show(`Deleted evidence "${truncate(e.title || "untitled", 40)}".`, { undo: () => restore(snapshot) });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <SolveButton variant="primary" onClick={() => createEvidence()} icon={<IconPlus size={15} />}>Add evidence</SolveButton>
        <div className="relative ml-auto min-w-[200px] flex-1 md:max-w-xs">
          <IconSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
          <TextInput aria-label="Search evidence" placeholder="Search evidence" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select aria-label="Filter by type" value={type} onChange={(e) => setType(e.target.value as EvidenceType | "all")} className="w-auto">
          <option value="all">All types</option>
          {evidenceTypes.map((t) => <option key={t} value={t}>{evidenceTypeMeta[t].label}</option>)}
        </Select>
      </div>
      {inv.evidence.length === 0 ? (
        <EmptyState className="mt-4" title="No evidence yet. Record what you measured, saw, read, or were told — then link each item to the causes it supports or contradicts." action={<SolveButton onClick={() => createEvidence()} icon={<IconPlus size={15} />}>Add evidence</SolveButton>} />
      ) : items.length === 0 ? (
        <p className="mt-4 text-[14px] text-stone">Nothing matches that filter.</p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((e) => {
            const links = inv.evidenceLinks.filter((l) => l.evidenceId === e.id);
            const supports = links.filter((l) => l.relation === "supports");
            const contradicts = links.filter((l) => l.relation === "contradicts");
            const selected = state?.kind === "evidence" && state.evidenceId === e.id;
            return (
              <Card as="li" key={e.id} className={`p-4 ${selected ? "border-copper ring-2 ring-copper/30" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="mt-1 text-copper" title={evidenceTypeMeta[e.type].label}>{evidenceTypeMeta[e.type].icon}</span>
                  <button type="button" onClick={() => open({ kind: "evidence", evidenceId: e.id })} className="min-h-[44px] flex-1 rounded-[2px] text-left focus-visible:outline-2 focus-visible:outline-copper">
                    <span className="block text-[15px] font-medium leading-6 text-ink">{e.title || <span className="font-normal text-stone">Untitled evidence</span>}</span>
                    <span className="block text-[12.5px] text-stone">{evidenceTypeMeta[e.type].label}{e.source ? ` · ${e.source}` : ""}{e.date ? ` · ${formatDate(e.date)}` : ""}</span>
                  </button>
                  <IconButton label="Delete evidence" onClick={() => remove(e)} className="hover:text-risk-critical"><IconTrash size={15} /></IconButton>
                </div>
                {e.description ? <p className="loop-secondary mt-2 line-clamp-3 text-[13.5px] leading-5 text-graphite">{e.description}</p> : null}
                <div className="mt-2 flex flex-col gap-1 text-[12.5px]">
                  {supports.length ? <p><span className="font-medium text-risk-track">Supports:</span> <span className="text-graphite">{supports.map((l) => truncate(causeById.get(l.causeId)?.text ?? "", 50)).join(" · ")}</span></p> : null}
                  {contradicts.length ? <p><span className="font-medium text-risk-critical">Contradicts:</span> <span className="text-graphite">{contradicts.map((l) => truncate(causeById.get(l.causeId)?.text ?? "", 50)).join(" · ")}</span></p> : null}
                  {!links.length ? <p className="text-stone">Not linked to any cause yet.</p> : null}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
