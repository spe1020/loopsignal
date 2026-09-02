"use client";

import { useMemo } from "react";
import { trackSolve } from "@/lib/solve/analytics";
import { stamp } from "@/lib/solve/reducer";
import { findingsFor, isOverdue, softFindings } from "@/lib/solve/rules";
import type { Action, ActionHorizon, ActionKind, ActionPriority, ActionStatus } from "@/lib/solve/schema";
import { formatDate } from "@/lib/solve/format";
import { truncate } from "@/lib/solve/text";
import { usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { IconAlert, IconCheck, IconCircle, IconClock, IconDot, IconLightning, IconPlus, IconShield, IconTrash, IconWrench } from "@/components/loop/icons";
import { useToast } from "@/components/loop/Toast";
import { Card, Chip, Coaching, EmptyState, IconButton, Note, SectionTitle, SolveButton, type Tone } from "@/components/loop/ui";
import { usePrimaryAction } from "../Workspace";

export const actionStatusMeta: Record<ActionStatus, { label: string; tone: Tone; icon: React.ReactNode }> = {
  open: { label: "Open", tone: "neutral", icon: <IconCircle size={12} /> },
  in_progress: { label: "In progress", tone: "blue", icon: <IconDot size={12} /> },
  ready_for_verification: { label: "Ready to verify", tone: "copper", icon: <IconShield size={12} /> },
  complete: { label: "Complete", tone: "green", icon: <IconCheck size={12} /> },
};

export const priorityMeta: Record<ActionPriority, { label: string; tone: Tone }> = {
  critical: { label: "Critical", tone: "red" },
  high: { label: "High", tone: "amber" },
  normal: { label: "Normal", tone: "neutral" },
  low: { label: "Low", tone: "neutral" },
};

export const kindMeta: Record<ActionKind, { label: string; tone: Tone; icon: React.ReactNode }> = {
  corrective: { label: "Corrective", tone: "copper", icon: <IconWrench size={12} /> },
  preventive: { label: "Preventive", tone: "blue", icon: <IconShield size={12} /> },
};

export const horizonMeta: Record<ActionHorizon, { label: string; sub: string; icon: React.ReactNode }> = {
  immediate: { label: "Immediate / near-term", sub: "Fix the cause now.", icon: <IconLightning size={14} /> },
  structural: { label: "Structural / long-term", sub: "Change the system so it cannot come back.", icon: <IconShield size={14} /> },
};

export function useActionActions() {
  const { investigation: inv, dispatch, restore } = useInvestigation();
  const { open, close, state } = usePanel();
  const toast = useToast();
  function add(kind: ActionKind, horizon: ActionHorizon, linkedCauseIds: string[] = []) {
    const item: Action = { ...stamp(), kind, horizon, title: "", description: "", linkedCauseIds, priority: "normal", status: "open" };
    dispatch({ type: "add_action", item });
    trackSolve("loopsolve_action_created", { stage: "actions", actions: inv.actions.length + 1 });
    open({ kind: "action", actionId: item.id });
    return item;
  }
  function remove(a: Action) {
    const snapshot = inv;
    dispatch({ type: "remove_action", id: a.id });
    if (state?.kind === "action" && state.actionId === a.id) close();
    toast.show(`Deleted action "${truncate(a.title || "untitled", 40)}".`, { undo: () => restore(snapshot) });
  }
  return { add, remove };
}

export function ActionCard({ action: a, onOpen, selected, showVerify }: { action: Action; onOpen: () => void; selected: boolean; showVerify?: React.ReactNode }) {
  const { investigation: inv, dispatch } = useInvestigation();
  const { remove } = useActionActions();
  const findings = useMemo(() => softFindings(inv), [inv]);
  const byId = useMemo(() => new Map(inv.causes.map((c) => [c.id, c])), [inv.causes]);
  const overdue = isOverdue(a);
  const st = actionStatusMeta[a.status];
  const k = kindMeta[a.kind];
  const pr = priorityMeta[a.priority];
  const cf = findingsFor(findings, "action", a.id).filter((f) => f.code !== "action_overdue").map((f) => f.message);
  return (
    <Card as="li" rule="copper" className={`p-4 ${selected ? "ring-2 ring-copper/30" : ""}`}>
      <div className="flex items-start gap-2">
        <button type="button" onClick={onOpen} className="min-h-[44px] flex-1 rounded-[2px] text-left text-[15px] font-medium leading-6 text-ink hover:text-copper focus-visible:outline-2 focus-visible:outline-copper">
          {a.title || <span className="font-normal text-stone">Untitled action — tap to edit</span>}
        </button>
        <IconButton label="Delete action" onClick={() => remove(a)} className="hover:text-risk-critical"><IconTrash size={15} /></IconButton>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Chip tone={k.tone} icon={k.icon}>{k.label}</Chip>
        <Chip tone={st.tone} icon={st.icon}>{st.label}</Chip>
        {a.priority !== "normal" ? <Chip tone={pr.tone}>{pr.label}</Chip> : null}
        {overdue ? <Chip tone="red" icon={<IconAlert size={12} />}>Overdue</Chip> : null}
      </div>
      {a.description ? <p className="loop-secondary mt-2 text-[13.5px] leading-5 text-graphite">{a.description}</p> : null}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-graphite">
        {a.owner ? <span>Owner: {a.owner}</span> : null}
        {a.dueDate ? <span className={overdue ? "font-medium text-risk-critical" : ""}><IconClock size={11} className="mr-1 inline" />Due {formatDate(a.dueDate)}</span> : null}
      </div>
      <p className="mt-2 text-[12.5px] leading-5">
        <span className="text-stone">Addresses:</span>{" "}
        {a.linkedCauseIds.length ? <span className="text-ink">{a.linkedCauseIds.map((id) => truncate(byId.get(id)?.text ?? "", 50)).join(" · ")}</span> : <span className="text-risk-amber">no cause linked</span>}
      </p>
      <Coaching items={cf} />
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {(Object.keys(actionStatusMeta) as ActionStatus[]).map((s) => (
          <button key={s} type="button" aria-pressed={a.status === s} onClick={() => dispatch({ type: "update_action", id: a.id, patch: { status: s } })} className={`inline-flex min-h-[36px] items-center gap-1 rounded-[3px] border px-2.5 text-[12.5px] font-medium focus-visible:outline-2 focus-visible:outline-copper ${a.status === s ? "border-ink bg-ink text-cream" : "border-line bg-paper text-graphite hover:border-ink/40"}`}>
            {actionStatusMeta[s].icon} {actionStatusMeta[s].label}
          </button>
        ))}
        {showVerify}
      </div>
    </Card>
  );
}

export function ActionsStage() {
  const { investigation: inv } = useInvestigation();
  const { open, state } = usePanel();
  const { add } = useActionActions();
  const roots = inv.causes.filter((c) => c.classification === "root");
  const defaultLinks = roots.map((c) => c.id);

  usePrimaryAction({ label: "Add action", onClick: () => add("corrective", "immediate", defaultLinks), icon: <IconPlus size={16} /> }, [roots.length]);

  const columns = (["immediate", "structural"] as ActionHorizon[]).map((h) => ({ h, items: inv.actions.filter((a) => a.horizon === h) }));

  return (
    <div>
      <SectionTitle
        eyebrow="Actions"
        title="Correct the cause, not the symptom."
        actions={
          <>
            <SolveButton variant="primary" onClick={() => add("corrective", "immediate", defaultLinks)} icon={<IconPlus size={15} />}>Corrective action</SolveButton>
            <SolveButton onClick={() => add("preventive", "structural", defaultLinks)} icon={<IconPlus size={15} />}>Preventive action</SolveButton>
          </>
        }
      >
        Every action links to at least one cause. Corrective actions fix this problem; preventive actions keep it from recurring elsewhere.
      </SectionTitle>
      {roots.length === 0 ? (
        <div className="mt-4"><Note tone="amber">No root cause has been classified yet. Actions can be drafted now, but link them to a verified cause before closing.</Note></div>
      ) : null}
      {roots.length > 0 && !inv.actions.some((a) => a.kind === "preventive") ? (
        <div className="mt-4"><Note>Consider a systemic action so this doesn&rsquo;t recur elsewhere.</Note></div>
      ) : null}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {columns.map(({ h, items }) => (
          <section key={h} aria-labelledby={`horizon-${h}`}>
            <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-2">
              <h3 id={`horizon-${h}`} className="flex items-center gap-2 text-[14px] font-medium text-ink">
                <span className="text-copper">{horizonMeta[h].icon}</span>
                {horizonMeta[h].label}
                <span className="font-normal text-stone">· {items.length}</span>
              </h3>
              <SolveButton size="sm" variant="ghost" onClick={() => add(h === "immediate" ? "corrective" : "preventive", h, defaultLinks)} icon={<IconPlus size={13} />}>Add</SolveButton>
            </div>
            <p className="loop-secondary mt-1.5 text-[12.5px] text-stone">{horizonMeta[h].sub}{h === "immediate" ? " e.g. “Replace worn fixture locator.”" : " e.g. “Change fixture PM interval and add locator wear check to setup standard.”"}</p>
            {items.length === 0 ? (
              <EmptyState className="mt-3" title={h === "immediate" ? "Nothing here yet. What fixes the cause now?" : "Nothing here yet. What stops this from coming back?"} action={<SolveButton size="sm" onClick={() => add(h === "immediate" ? "corrective" : "preventive", h, defaultLinks)} icon={<IconPlus size={13} />}>Add {h === "immediate" ? "corrective" : "preventive"} action</SolveButton>} />
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {items.map((a) => (
                  <ActionCard key={a.id} action={a} selected={state?.kind === "action" && state.actionId === a.id} onOpen={() => open({ kind: "action", actionId: a.id })} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
