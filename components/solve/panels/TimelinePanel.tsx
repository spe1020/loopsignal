"use client";

import type { TimelineTag } from "@/lib/solve/schema";
import { fromLocalInput, toLocalInput } from "@/lib/solve/format";
import { truncate } from "@/lib/solve/text";
import { timelineTagMeta } from "../causeMeta";
import { ContextPanel, usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { Field, Select, SolveButton, TextArea } from "@/components/loop/ui";

export function TimelinePanel({ eventId }: { eventId: string | null }) {
  const { investigation: inv, dispatch } = useInvestigation();
  const { close } = usePanel();
  const item = inv.timeline.find((t) => t.id === eventId);
  if (!item) return null;
  const set = (patch: Partial<typeof item>) => dispatch({ type: "update_timeline", id: item.id, patch });
  return (
    <ContextPanel title="Timeline event" fullScreen={inv.shopFloorMode}>
      <div className="flex flex-col gap-4">
        <Field label="Time" htmlFor="tl-at">
          <input id="tl-at" type="datetime-local" value={toLocalInput(item.at)} onChange={(e) => { const iso = fromLocalInput(e.target.value); if (iso) set({ at: iso }); }} className="min-h-(--loop-control) w-full rounded-[3px] border border-line bg-cream px-3 text-ink focus:border-copper focus:outline-none" />
        </Field>
        <Field label="What happened" htmlFor="tl-text"><TextArea id="tl-text" rows={3} value={item.text} onChange={(e) => set({ text: e.target.value })} onSubmitKey={close} autoFocus /></Field>
        <Field label="Tag" htmlFor="tl-tag">
          <Select id="tl-tag" value={item.tag} onChange={(e) => set({ tag: e.target.value as TimelineTag })}>
            {(Object.keys(timelineTagMeta) as TimelineTag[]).map((t) => <option key={t} value={t}>{timelineTagMeta[t].label}</option>)}
          </Select>
        </Field>
        <Field label="Link to cause" htmlFor="tl-cause" helper="Optional. Ties this moment to a cause in the tree.">
          <Select id="tl-cause" value={item.causeId ?? ""} onChange={(e) => set({ causeId: e.target.value || undefined })}>
            <option value="">None</option>
            {inv.causes.map((c) => <option key={c.id} value={c.id}>{truncate(c.text || "Untitled cause", 70)}</option>)}
          </Select>
        </Field>
        <SolveButton variant="dark" onClick={close}>Done</SolveButton>
      </div>
    </ContextPanel>
  );
}
