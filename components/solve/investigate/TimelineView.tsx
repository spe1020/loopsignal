"use client";

import { useMemo, useState } from "react";
import { stamp } from "@/lib/solve/reducer";
import type { TimelineEvent, TimelineTag } from "@/lib/solve/schema";
import { formatDateTime, formatGap, fromLocalInput, toLocalInput } from "@/lib/solve/format";
import { truncate } from "@/lib/solve/text";
import { timelineTagMeta } from "../causeMeta";
import { usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { IconPlus, IconTrash, IconLink } from "../icons";
import { useToast } from "../Toast";
import { Chip, EmptyState, IconButton, Select, SolveButton, TextInput } from "../ui";

export function TimelineView() {
  const { investigation: inv, dispatch, restore } = useInvestigation();
  const { open, state } = usePanel();
  const toast = useToast();
  const [at, setAt] = useState("");
  const [text, setText] = useState("");
  const [tag, setTag] = useState<TimelineTag>("observed");
  const sorted = useMemo(() => [...inv.timeline].sort((a, b) => a.at.localeCompare(b.at)), [inv.timeline]);
  const causeById = useMemo(() => new Map(inv.causes.map((c) => [c.id, c])), [inv.causes]);

  function add() {
    const iso = fromLocalInput(at);
    if (!iso || !text.trim()) return;
    const item: TimelineEvent = { ...stamp(), at: iso, text: text.trim(), tag };
    dispatch({ type: "add_timeline", item });
    setText("");
  }

  function remove(t: TimelineEvent) {
    const snapshot = inv;
    dispatch({ type: "remove_timeline", id: t.id });
    toast.show(`Deleted event "${truncate(t.text, 40)}".`, { undo: () => restore(snapshot) });
  }

  return (
    <div>
      <form
        className="grid gap-2 rounded-[3px] border border-line bg-cream p-3 md:grid-cols-[200px_minmax(0,1fr)_150px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        aria-label="Add timeline event"
      >
        <input type="datetime-local" aria-label="Time" value={at} onChange={(e) => setAt(e.target.value)} required className="min-h-(--solve-control) rounded-[3px] border border-line bg-cream px-3 text-ink focus:border-copper focus:outline-none" />
        <TextInput aria-label="What happened" placeholder="What happened at this moment?" value={text} onChange={(e) => setText(e.target.value)} required />
        <Select aria-label="Tag" value={tag} onChange={(e) => setTag(e.target.value as TimelineTag)}>
          {(Object.keys(timelineTagMeta) as TimelineTag[]).map((t) => <option key={t} value={t}>{timelineTagMeta[t].label}</option>)}
        </Select>
        <SolveButton type="submit" variant="dark" icon={<IconPlus size={14} />} disabled={!at || !text.trim()}>Add</SolveButton>
      </form>
      {sorted.length === 0 ? (
        <EmptyState className="mt-4" title="No events yet. Add the moments that matter — first sign, detection, escalation, containment — and the gaps between them will show where time was lost." />
      ) : (
        <ol className="mt-4">
          {sorted.map((t, i) => {
            const m = timelineTagMeta[t.tag];
            const prev = sorted[i - 1];
            const gap = prev ? formatGap(prev.at, t.at) : "";
            const selected = state?.kind === "timeline" && state.eventId === t.id;
            const cause = t.causeId ? causeById.get(t.causeId) : undefined;
            return (
              <li key={t.id} className="relative pl-7">
                {prev ? (
                  <div className="flex items-center gap-2 py-1.5 text-[11.5px] text-stone">
                    <span className="absolute left-[9px] top-0 h-full w-px bg-line" aria-hidden />
                    <span className="relative z-10 -ml-7 w-7 text-center" aria-hidden>·</span>
                    <span className="font-mono">+{gap}</span>
                  </div>
                ) : null}
                <div className={`relative rounded-[3px] border bg-cream p-3 ${selected ? "border-copper ring-2 ring-copper/30" : "border-line"}`}>
                  <span className="absolute -left-7 top-4 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-copper bg-cream" aria-hidden />
                  <div className="flex items-start gap-2">
                    <button type="button" onClick={() => open({ kind: "timeline", eventId: t.id })} className="min-h-[44px] flex-1 rounded-[2px] text-left focus-visible:outline-2 focus-visible:outline-copper">
                      <span className="block font-mono text-[12px] tracking-[0.04em] text-graphite">{formatDateTime(t.at)}</span>
                      <span className="block text-[14.5px] leading-6 text-ink">{t.text}</span>
                    </button>
                    <IconButton label="Delete event" onClick={() => remove(t)} className="hover:text-risk-critical"><IconTrash size={15} /></IconButton>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Chip tone={m.tone} icon={m.icon}>{m.label}</Chip>
                    {cause ? (
                      <button type="button" onClick={() => open({ kind: "cause", causeId: cause.id })} className="inline-flex items-center gap-1 text-[12.5px] text-copper-dark hover:underline focus-visible:outline-2 focus-visible:outline-copper">
                        <IconLink size={12} /> {truncate(cause.text, 60)}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="solve-secondary mt-3 text-[12px] text-stone">Times are shown in your local time zone.{" "}{toLocalInput(inv.problem.whenIso) ? "" : ""}</p>
    </div>
  );
}
