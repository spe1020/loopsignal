"use client";

import type { Verification, VerificationResult } from "@/lib/solve/schema";
import { verificationResults } from "@/lib/solve/schema";
import { evidenceTypeMeta } from "../causeMeta";
import { ContextPanel, usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { IconTrash } from "@/components/loop/icons";
import { resultMeta } from "../stages/VerifyStage";
import { Checkbox, Field, SolveButton, TextArea, TextInput } from "@/components/loop/ui";
import { useToast } from "@/components/loop/Toast";

export function VerificationPanel({ actionId, verificationId }: { actionId: string; verificationId: string | null }) {
  const { investigation: inv, dispatch, restore } = useInvestigation();
  const { close } = usePanel();
  const toast = useToast();
  const action = inv.actions.find((a) => a.id === actionId);
  const v = inv.verifications.find((x) => x.id === verificationId);
  if (!action || !v) return null;
  const set = (patch: Partial<Verification>) => dispatch({ type: "update_verification", id: v.id, patch });
  const toggleEvidence = (id: string) => set({ evidenceIds: v.evidenceIds.includes(id) ? v.evidenceIds.filter((x) => x !== id) : [...v.evidenceIds, id] });
  function remove() {
    const snapshot = inv;
    dispatch({ type: "remove_verification", id: v!.id });
    close();
    toast.show("Verification deleted.", { undo: () => restore(snapshot) });
  }
  return (
    <ContextPanel title="Effectiveness verification" fullScreen={inv.shopFloorMode}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] leading-5 text-graphite"><span className="text-stone">Action:</span> {action.title || "Untitled action"}</p>
        <Field label="Expected result" htmlFor="ver-expected"><TextArea id="ver-expected" rows={2} value={v.expected} onChange={(e) => set({ expected: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Check date" htmlFor="ver-date"><input id="ver-date" type="date" value={v.checkAt?.slice(0, 10) ?? ""} onChange={(e) => set({ checkAt: e.target.value ? `${e.target.value}T12:00:00.000Z` : undefined })} className="min-h-(--loop-control) w-full rounded-[3px] border border-line bg-cream px-3 text-ink focus:border-copper focus:outline-none" /></Field>
          <Field label="Verifier" htmlFor="ver-who"><TextInput id="ver-who" value={v.verifier ?? ""} onChange={(e) => set({ verifier: e.target.value })} /></Field>
        </div>
        <Field label="Observed result" htmlFor="ver-observed" helper="What actually happened after the action? Numbers, dates, counts."><TextArea id="ver-observed" rows={3} value={v.observed} onChange={(e) => set({ observed: e.target.value })} autoFocus={!v.observed} /></Field>
        <fieldset>
          <legend className="text-[13px] font-medium text-ink">Result</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Result">
            {verificationResults.map((r) => {
              const m = resultMeta[r];
              const active = v.result === r;
              return (
                <button key={r} type="button" role="radio" aria-checked={active} onClick={() => set({ result: r as VerificationResult })} className={`inline-flex min-h-(--loop-control) items-center justify-center gap-1.5 rounded-[3px] border px-3 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-copper ${active ? (r === "not_effective" ? "border-risk-critical bg-risk-critical text-white" : r === "effective" ? "border-risk-track bg-risk-track text-white" : "border-ink bg-ink text-cream") : "border-line bg-paper text-graphite hover:border-ink/40"}`}>
                  {m.icon} {m.label}
                </button>
              );
            })}
          </div>
          {v.result === "not_effective" ? <p className="mt-2 text-[12.5px] leading-5 text-risk-critical">A Not Effective result means the loop is not closed. The Verify stage will offer to reopen the investigation.</p> : null}
        </fieldset>
        <section>
          <h3 className="text-[13px] font-medium text-ink">Attach evidence</h3>
          {inv.evidence.length ? (
            <ul className="mt-1.5 max-h-56 overflow-y-auto rounded-[3px] border border-line bg-paper/60 px-2">
              {inv.evidence.map((e) => (
                <li key={e.id} className="border-b border-line/70 last:border-0">
                  <Checkbox label={`${e.title || "Untitled evidence"} (${evidenceTypeMeta[e.type].label})`} checked={v.evidenceIds.includes(e.id)} onChange={() => toggleEvidence(e.id)} className="w-full py-1 text-[13px]" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[12.5px] text-stone">No evidence recorded yet. Add it on Investigate → Evidence.</p>
          )}
        </section>
        <div className="flex items-center gap-2 border-t border-line pt-4">
          <SolveButton variant="dark" onClick={close}>Done</SolveButton>
          <SolveButton variant="danger" size="sm" className="ml-auto" onClick={remove} icon={<IconTrash size={13} />}>Delete</SolveButton>
        </div>
      </div>
    </ContextPanel>
  );
}
