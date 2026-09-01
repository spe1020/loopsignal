"use client";

import { stamp } from "@/lib/solve/reducer";
import type { ContainmentAction, ContainmentStatus } from "@/lib/solve/schema";
import { usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { IconCheck, IconCircle, IconDot, IconPlus, IconShield, IconTrash } from "../icons";
import { useToast } from "../Toast";
import { usePrimaryAction } from "../Workspace";
import { Card, Chip, EmptyState, IconButton, Note, SectionTitle, SolveButton, type Tone } from "../ui";

export const containmentStatusMeta: Record<ContainmentStatus, { label: string; tone: Tone; icon: React.ReactNode }> = {
  open: { label: "Open", tone: "neutral", icon: <IconCircle size={12} /> },
  in_progress: { label: "In progress", tone: "blue", icon: <IconDot size={12} /> },
  verified: { label: "Verified", tone: "green", icon: <IconCheck size={12} /> },
  released: { label: "Released", tone: "ink", icon: <IconShield size={12} /> },
};

const quickAdds = [
  "Stop the process",
  "Segregate suspect inventory",
  "Inspect WIP",
  "Notify downstream",
  "Add temporary inspection",
  "Hold shipment",
];

export function ContainStage() {
  const { investigation: inv, dispatch, restore } = useInvestigation();
  const { open } = usePanel();
  const toast = useToast();

  function add(action = "") {
    const item: ContainmentAction = { ...stamp(), action, owner: "", scope: "", status: "open" };
    dispatch({ type: "add_containment", item });
    open({ kind: "containment", containmentId: item.id });
  }

  function remove(item: ContainmentAction) {
    const snapshot = inv;
    dispatch({ type: "remove_containment", id: item.id });
    toast.show("Containment action deleted.", { undo: () => restore(snapshot) });
  }

  usePrimaryAction({ label: "Add containment", onClick: () => add(), icon: <IconPlus size={16} /> }, []);

  return (
    <div>
      <SectionTitle
        eyebrow="Contain"
        title="Protect the customer while you investigate."
        actions={
          <SolveButton variant="primary" onClick={() => add()} icon={<IconPlus size={15} />}>
            Add containment action
          </SolveButton>
        }
      >
        Stop the bleeding first. Each action has an owner, a scope, and a verification that it worked.
      </SectionTitle>

      <div className="mt-5">
        <Note tone="amber" icon={<IconShield size={15} />}>
          Containment protects the customer or process. It is not root cause correction.
        </Note>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Quick add">
        {quickAdds.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => add(q)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-ink/20 bg-cream px-3.5 text-[13px] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream focus-visible:outline-2 focus-visible:outline-copper"
          >
            <IconPlus size={13} /> {q}
          </button>
        ))}
      </div>

      {inv.containment.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No containment yet. If the problem could reach a customer or the next process, add the action that stops it."
          action={<SolveButton onClick={() => add()} icon={<IconPlus size={15} />}>Add containment action</SolveButton>}
        />
      ) : (
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {inv.containment.map((c) => {
            const m = containmentStatusMeta[c.status];
            return (
              <Card as="li" key={c.id} rule="amber" className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => open({ kind: "containment", containmentId: c.id })}
                    className="min-h-(--solve-control) flex-1 rounded-[2px] text-left text-[15px] font-medium leading-6 text-ink hover:text-copper focus-visible:outline-2 focus-visible:outline-copper"
                  >
                    {c.action || <span className="font-normal text-stone">Untitled containment — tap to edit</span>}
                  </button>
                  <IconButton label="Delete containment" onClick={() => remove(c)} className="hover:text-risk-critical">
                    <IconTrash size={15} />
                  </IconButton>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Chip tone={m.tone} icon={m.icon}>{m.label}</Chip>
                  {c.owner ? <span className="text-[13px] text-graphite">Owner: {c.owner}</span> : null}
                  {c.quantityAffected ? <span className="text-[13px] text-graphite">Qty: {c.quantityAffected}</span> : null}
                </div>
                {c.scope ? <p className="solve-secondary mt-2 text-[13px] leading-5 text-graphite">Scope: {c.scope}</p> : null}
                {c.verificationNote ? (
                  <p className="solve-secondary mt-1 text-[13px] leading-5 text-graphite">
                    <span className="text-stone">Containment check:</span> {c.verificationNote}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Set status">
                  {(Object.keys(containmentStatusMeta) as ContainmentStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={c.status === s}
                      onClick={() => dispatch({ type: "update_containment", id: c.id, patch: { status: s } })}
                      className={`inline-flex min-h-[36px] items-center gap-1 rounded-[3px] border px-2.5 text-[12.5px] font-medium focus-visible:outline-2 focus-visible:outline-copper ${
                        c.status === s ? "border-ink bg-ink text-cream" : "border-line bg-paper text-graphite hover:border-ink/40"
                      }`}
                    >
                      {containmentStatusMeta[s].icon} {containmentStatusMeta[s].label}
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
