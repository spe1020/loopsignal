"use client";

import type { ContainmentStatus } from "@/lib/solve/schema";
import { fromLocalInput, toLocalInput } from "@/lib/solve/format";
import { ContextPanel, usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { containmentStatusMeta } from "../stages/ContainStage";
import { Field, Select, SolveButton, TextArea, TextInput } from "@/components/loop/ui";

export function ContainmentPanel({ id }: { id: string | null }) {
  const { investigation: inv, dispatch } = useInvestigation();
  const { close } = usePanel();
  const item = inv.containment.find((c) => c.id === id);
  if (!item) return null;
  const set = (patch: Partial<typeof item>) => dispatch({ type: "update_containment", id: item.id, patch });
  return (
    <ContextPanel title="Containment action" fullScreen={inv.shopFloorMode}>
      <div className="flex flex-col gap-4">
        <Field label="Action" htmlFor="cont-action" helper="What was done to protect the customer or process?">
          <TextArea id="cont-action" rows={2} value={item.action} onChange={(e) => set({ action: e.target.value })} onSubmitKey={close} autoFocus />
        </Field>
        <Field label="Owner" htmlFor="cont-owner"><TextInput id="cont-owner" value={item.owner} onChange={(e) => set({ owner: e.target.value })} /></Field>
        <Field label="Scope" htmlFor="cont-scope" helper="Which parts, lots, orders, or shifts?"><TextInput id="cont-scope" value={item.scope} onChange={(e) => set({ scope: e.target.value })} /></Field>
        <Field label="Quantity affected" htmlFor="cont-qty"><TextInput id="cont-qty" value={item.quantityAffected ?? ""} onChange={(e) => set({ quantityAffected: e.target.value })} /></Field>
        <Field label="Started" htmlFor="cont-start">
          <input id="cont-start" type="datetime-local" value={toLocalInput(item.startedAt)} onChange={(e) => set({ startedAt: fromLocalInput(e.target.value) })} className="min-h-(--loop-control) w-full rounded-[3px] border border-line bg-cream px-3 text-ink focus:border-copper focus:outline-none" />
        </Field>
        <Field label="Status" htmlFor="cont-status">
          <Select id="cont-status" value={item.status} onChange={(e) => set({ status: e.target.value as ContainmentStatus })}>
            {(Object.keys(containmentStatusMeta) as ContainmentStatus[]).map((s) => (
              <option key={s} value={s}>{containmentStatusMeta[s].label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Containment verification" htmlFor="cont-verify" helper="Did this action actually protect the customer? How do you know?">
          <TextArea id="cont-verify" rows={2} value={item.verificationNote ?? ""} onChange={(e) => set({ verificationNote: e.target.value })} />
        </Field>
        <SolveButton variant="dark" onClick={close}>Done</SolveButton>
      </div>
    </ContextPanel>
  );
}
