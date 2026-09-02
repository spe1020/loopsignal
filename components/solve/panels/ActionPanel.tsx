"use client";

import { useMemo, useState } from "react";
import type { Action, ActionHorizon, ActionKind, ActionPriority, ActionStatus } from "@/lib/solve/schema";
import { actionPriorities, actionStatuses } from "@/lib/solve/schema";
import { truncate } from "@/lib/solve/text";
import { evidenceStateMeta } from "../causeMeta";
import { ContextPanel, usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { actionStatusMeta, horizonMeta, kindMeta, priorityMeta } from "../stages/ActionsStage";
import { Checkbox, Field, Select, SolveButton, TextArea, TextInput } from "@/components/loop/ui";

export function ActionPanel({ actionId }: { actionId: string | null; kindPreset?: ActionKind; horizonPreset?: ActionHorizon }) {
  const { investigation: inv, dispatch } = useInvestigation();
  const { close } = usePanel();
  const [q, setQ] = useState("");
  const a = inv.actions.find((x) => x.id === actionId);
  const causes = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...inv.causes]
      .filter((c) => !needle || c.text.toLowerCase().includes(needle))
      .sort((x, y) => (x.classification === "root" ? -1 : 1) - (y.classification === "root" ? -1 : 1));
  }, [inv.causes, q]);
  if (!a) return null;
  const set = (patch: Partial<Action>) => dispatch({ type: "update_action", id: a.id, patch });
  const toggleCause = (id: string) => set({ linkedCauseIds: a.linkedCauseIds.includes(id) ? a.linkedCauseIds.filter((x) => x !== id) : [...a.linkedCauseIds, id] });

  return (
    <ContextPanel title={`${kindMeta[a.kind].label} action`} fullScreen={inv.shopFloorMode}>
      <div className="flex flex-col gap-4">
        <Field label="Title" htmlFor="act-title"><TextInput id="act-title" value={a.title} onChange={(e) => set({ title: e.target.value })} autoFocus={!a.title} placeholder="Replace worn fixture locator" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kind" htmlFor="act-kind">
            <Select id="act-kind" value={a.kind} onChange={(e) => set({ kind: e.target.value as ActionKind })}>
              <option value="corrective">Corrective</option>
              <option value="preventive">Preventive / systemic</option>
            </Select>
          </Field>
          <Field label="Horizon" htmlFor="act-horizon">
            <Select id="act-horizon" value={a.horizon} onChange={(e) => set({ horizon: e.target.value as ActionHorizon })}>
              <option value="immediate">{horizonMeta.immediate.label}</option>
              <option value="structural">{horizonMeta.structural.label}</option>
            </Select>
          </Field>
        </div>
        <Field label="Description" htmlFor="act-desc"><TextArea id="act-desc" rows={3} value={a.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <section>
          <h3 className="text-[13px] font-medium text-ink">Addresses which causes? <span className="text-copper">*</span></h3>
          <p className="text-[12px] text-stone">Prefer verified or data-supported causes. Root causes are listed first.</p>
          {inv.causes.length > 6 ? <TextInput className="mt-2" aria-label="Search causes" placeholder="Search causes…" value={q} onChange={(e) => setQ(e.target.value)} /> : null}
          <ul className="mt-2 max-h-64 overflow-y-auto rounded-[3px] border border-line bg-paper/60 px-2">
            {causes.map((c) => (
              <li key={c.id} className="border-b border-line/70 last:border-0">
                <Checkbox
                  label={`${truncate(c.text || "Untitled cause", 70)} — ${evidenceStateMeta[c.evidenceState].short}${c.classification === "root" ? " · Root" : c.classification === "contributing" ? " · Contributing" : ""}`}
                  checked={a.linkedCauseIds.includes(c.id)}
                  onChange={() => toggleCause(c.id)}
                  className="w-full py-1 text-[13px]"
                />
              </li>
            ))}
            {causes.length === 0 ? <li className="py-2 text-[12.5px] text-stone">No causes yet.</li> : null}
          </ul>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner" htmlFor="act-owner"><TextInput id="act-owner" value={a.owner ?? ""} onChange={(e) => set({ owner: e.target.value })} /></Field>
          <Field label="Due date" htmlFor="act-due"><input id="act-due" type="date" value={a.dueDate ?? ""} onChange={(e) => set({ dueDate: e.target.value || undefined })} className="min-h-(--loop-control) w-full rounded-[3px] border border-line bg-cream px-3 text-ink focus:border-copper focus:outline-none" /></Field>
          <Field label="Priority" htmlFor="act-priority">
            <Select id="act-priority" value={a.priority} onChange={(e) => set({ priority: e.target.value as ActionPriority })}>
              {actionPriorities.map((p) => <option key={p} value={p}>{priorityMeta[p].label}</option>)}
            </Select>
          </Field>
          <Field label="Status" htmlFor="act-status">
            <Select id="act-status" value={a.status} onChange={(e) => set({ status: e.target.value as ActionStatus })}>
              {actionStatuses.map((s) => <option key={s} value={s}>{actionStatusMeta[s].label}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="How will effectiveness be verified?" htmlFor="act-method" helper="Decide the check before the action is done, not after."><TextInput id="act-method" value={a.verificationMethod ?? ""} onChange={(e) => set({ verificationMethod: e.target.value })} /></Field>
        <Field label="Expected result" htmlFor="act-expected"><TextInput id="act-expected" value={a.expectedResult ?? ""} onChange={(e) => set({ expectedResult: e.target.value })} /></Field>
        <SolveButton variant="dark" onClick={close}>Done</SolveButton>
      </div>
    </ContextPanel>
  );
}
