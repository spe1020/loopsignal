"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { trackSolve } from "@/lib/solve/analytics";
import { stamp } from "@/lib/solve/reducer";
import { currentReview } from "@/lib/solve/reviews";
import { ClosureBlockers } from "./ClosureBlockers";
import { hardFindings, latestVerification, type Finding } from "@/lib/solve/rules";
import type { Action, Verification, VerificationResult } from "@/lib/solve/schema";
import { formatDate } from "@/lib/solve/format";
import { usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { IconAlert, IconCheck, IconClock, IconClose, IconDot, IconPlus, IconShield, LoopGlyph } from "@/components/loop/icons";
import { useToast } from "@/components/loop/Toast";
import { kindMeta } from "./ActionsStage";
import { Card, Chip, EmptyState, Note, SectionTitle, SolveButton, type Tone } from "@/components/loop/ui";
import { usePrimaryAction } from "../Workspace";

export const resultMeta: Record<VerificationResult, { label: string; tone: Tone; icon: React.ReactNode }> = {
  effective: { label: "Effective", tone: "green", icon: <IconCheck size={12} /> },
  partially_effective: { label: "Partially effective", tone: "amber", icon: <IconDot size={12} /> },
  not_effective: { label: "Not effective", tone: "red", icon: <IconClose size={12} /> },
  monitoring: { label: "Monitoring", tone: "blue", icon: <IconClock size={12} /> },
};

export function useVerifyActions() {
  const { investigation: inv, dispatch } = useInvestigation();
  const { open } = usePanel();
  function add(action: Action) {
    const item: Verification = { ...stamp(), actionId: action.id, expected: action.expectedResult ?? "", observed: "", result: "monitoring", evidenceIds: [] };
    dispatch({ type: "add_verification", item });
    trackSolve("loopsolve_verification_complete", { stage: "verify", verifications: inv.verifications.length + 1 });
    open({ kind: "verification", actionId: action.id, verificationId: item.id });
    return item;
  }
  return { add };
}

export function VerifyStage() {
  const { investigation: inv, dispatch } = useInvestigation();
  const { open, state } = usePanel();
  const { add } = useVerifyActions();
  const router = useRouter();
  const toast = useToast();
  const corrective = inv.actions.filter((a) => a.kind === "corrective" || a.requiredForClosure);
  const preventive = inv.actions.filter((a) => a.kind === "preventive" && !a.requiredForClosure);
  const hard = useMemo(() => hardFindings(inv), [inv]);
  const closable = inv.status !== "closed" && hard.length === 0;
  const lastReopen = [...inv.history].reverse().find((h) => h.type === "reopened");
  const failed = inv.verifications.filter((v) => v.result === "not_effective" && (!lastReopen || v.createdAt > lastReopen.at));
  const anyFailed = failed.length > 0 && inv.status !== "reopened" && inv.status !== "closed";
  const firstUnverified = corrective.find((a) => !inv.verifications.some((v) => v.actionId === a.id));

  usePrimaryAction(
    firstUnverified ? { label: `Verify: ${firstUnverified.title || "action"}`, onClick: () => add(firstUnverified), icon: <IconShield size={16} /> } : null,
    [firstUnverified?.id],
  );

  function fix(f: Finding) {
    if (f.entityType === "action" && f.entityId) {
      const action = inv.actions.find((a) => a.id === f.entityId);
      if (action && f.stage === "verify") {
        const v = latestVerification(inv, action.id);
        if (v)
          open({
            kind: "verification",
            actionId: action.id,
            verificationId: v.id,
          });
        else add(action);
        return;
      }
      if (action) {
        open({ kind: "action", actionId: action.id });
        return;
      }
    }
    if (f.entityType === "cause" && f.entityId && f.stage === "root-cause") {
      open({ kind: "cause", causeId: f.entityId });
      return;
    }
    if (f.entityType === "containment" && f.entityId) {
      open({ kind: "containment", containmentId: f.entityId });
      return;
    }
    router.push(`/solve/${inv.id}/${f.stage}`);
  }

  function reopen() {
    dispatch({ type: "reopen", note: "Reopened after a Not Effective verification." });
    trackSolve("loopsolve_reopened", { stage: "verify", reopened: inv.reopenedCount + 1 });
    toast.show("Investigation reopened. Everything is preserved.");
    router.push(`/solve/${inv.id}/investigate`);
  }

  function close() {
    dispatch({ type: "close" });
    trackSolve("loopsolve_closed", { stage: "verify", causes: inv.causes.length, actions: inv.actions.length });
    toast.show("Investigation closed.", { tone: "green" });
    router.push(`/solve/${inv.id}/summary`);
  }

  return (
    <div>
      <SectionTitle eyebrow="Verify" title="Prove the problem stayed solved.">
        For each required countermeasure: what did you expect, what did you observe, and was it effective? Action effectiveness is different from cause evidence and containment checks.
      </SectionTitle>

      {anyFailed ? (
        <div className="mt-6 overflow-hidden rounded-[3px] border-2 border-risk-critical bg-cream">
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:gap-6 md:p-6">
            <LoopGlyph className="h-10 w-20 shrink-0" animated tone="ink" />
            <div className="flex-1">
              <p className="text-[22px] font-medium tracking-[-0.02em] text-ink md:text-[26px]">The problem is not closed.</p>
              <p className="mt-1 text-[14.5px] leading-6 text-graphite">
                {failed.length === 1 ? "A corrective action" : `${failed.length} corrective actions`} verified <span className="font-medium text-risk-critical">Not Effective</span>. Go back to the evidence: the cause may be wrong, incomplete, or only partly addressed.
              </p>
            </div>
            <SolveButton variant="primary" size="lg" onClick={reopen} icon={<LoopGlyph className="h-3.5 w-7" tone="current" />}>
              Reopen Investigation
            </SolveButton>
          </div>
        </div>
      ) : null}

      {inv.status === "reopened" ? (
        <div className="mt-6"><Note tone="amber" icon={<IconAlert size={15} />}>Reopened {inv.reopenedCount > 1 ? `(${inv.reopenedCount} times)` : ""}. Re-verify the corrective actions once the investigation has been revisited.</Note></div>
      ) : null}

      {corrective.length === 0 ? (
        <EmptyState className="mt-6" title="No corrective actions to verify yet. Add them on the Actions stage first." />
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {corrective.map((a) => {
            const vs = inv.verifications.filter((v) => v.actionId === a.id).sort((x, y) => x.createdAt.localeCompare(y.createdAt));
            const latest = vs[vs.length - 1];
            return (
              <Card as="li" key={a.id} rule={latest ? (latest.result === "effective" && currentReview(inv, latest) ? "green" : latest.result === "not_effective" ? "red" : "amber") : "copper"} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <Chip tone={kindMeta[a.kind].tone} icon={kindMeta[a.kind].icon}>{kindMeta[a.kind].label}</Chip>
                      <span className="text-[15px] font-medium text-ink">{a.title || "Untitled action"}</span>
                    </p>
                    {a.verificationMethod ? <p className="loop-secondary mt-1 text-[13px] text-graphite"><span className="text-stone">Method:</span> {a.verificationMethod}</p> : null}
                  </div>
                  <SolveButton variant={latest ? "secondary" : "primary"} onClick={() => add(a)} icon={<IconPlus size={14} />}>{latest ? "Re-verify" : "Record verification"}</SolveButton>
                </div>
                {vs.length ? (
                  <ol className="mt-3 flex flex-col gap-2">
                    {vs.map((v) => {
                      const rm = resultMeta[v.result];
                      const reopenedAfter = lastReopen && v.createdAt <= lastReopen.at && v.result === "not_effective";
                      const sel = state?.kind === "verification" && state.verificationId === v.id;
                      return (
                        <li key={v.id}>
                          <button type="button" onClick={() => open({ kind: "verification", actionId: a.id, verificationId: v.id })} className={`block w-full min-h-[44px] rounded-[3px] border px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-copper ${sel ? "border-copper ring-2 ring-copper/30" : "border-line hover:border-ink/40"}`}>
                            <span className="flex flex-wrap items-center gap-2">
                              <Chip tone={v.result === "effective" && !currentReview(inv, v) ? "amber" : rm.tone} icon={rm.icon}>{rm.label}{v.result === "effective" ? currentReview(inv, v) ? " · approved" : " · review required" : ""}</Chip>
                              {v.checkAt ? <span className="text-[12.5px] text-graphite">{formatDate(v.checkAt)}</span> : null}
                              {v.verifier ? <span className="text-[12.5px] text-graphite">· {v.verifier}</span> : null}
                              {reopenedAfter ? <Chip tone="neutral" icon={<LoopGlyph className="h-2.5 w-5" tone="current" />}>Reopened after this result</Chip> : null}
                            </span>
                            {v.observed ? <span className="mt-1 block text-[13.5px] leading-5 text-ink">{v.observed}</span> : <span className="mt-1 block text-[13px] text-stone">No observation recorded yet.</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="mt-2 text-[13px] text-stone">Not verified yet.</p>
                )}
              </Card>
            );
          })}
        </ul>
      )}

      {preventive.length ? (
        <p className="loop-secondary mt-4 text-[12.5px] text-stone">
          {preventive.length} preventive action{preventive.length === 1 ? "" : "s"} tracked on the Actions stage. Optional preventive actions do not gate closure. Mark them required in the action editor when they must be completed and verified before closing.
        </p>
      ) : null}

      <section className="mt-8 rounded-[3px] border border-line bg-cream p-5" aria-labelledby="close-heading">
        <h3 id="close-heading" className="flex items-center gap-2 text-[16px] font-medium text-ink"><IconShield size={16} className="text-copper" /> Close the loop</h3>
        {inv.status === "closed" ? (
          <p className="mt-2 text-[14px] text-graphite">Closed {formatDate(inv.closedAt)}. The summary and report are on the next stage.</p>
        ) : (
          <>
            <p className="mt-1 text-[13.5px] leading-5 text-graphite">Closure requires supported roots, completed and assigned required countermeasures, effective explicit reviews of current source evidence, and resolved containment.</p>
            {hard.length ? <>
              <p className="mt-3 text-[14px] font-medium text-ink" role="status">{hard.length} closure blocker{hard.length === 1 ? "" : "s"} to resolve</p>
              <ClosureBlockers findings={hard} onFix={fix} />
            </> : <p className="mt-3 flex items-center gap-2 text-[13.5px] text-risk-track"><IconCheck size={16} /> All closure requirements satisfied. Current effective reviews are recorded.</p>}
            <div className="mt-4">
              <SolveButton variant="dark" size="lg" disabled={!closable} onClick={close} icon={<IconCheck size={16} />}>Close investigation</SolveButton>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
