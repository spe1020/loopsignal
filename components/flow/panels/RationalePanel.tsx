"use client";

import { ContextPanel } from "@/components/loop/ContextPanel";
import { LoopGlyph } from "@/components/loop/icons";
import { Field, LoopButton, Select, TextArea } from "@/components/loop/ui";
import { diffVersions } from "@/lib/flow/diff";
import { useLinkedInvestigations } from "../LinkedInvestigations";
import { useMap } from "../MapProvider";
import { useFlowPanel } from "../panel";

/** Why this future-state change exists, and which LoopSolve action makes it real. */
export function RationalePanel({ changeKey }: { changeKey: string }) {
  const { map, dispatch } = useMap();
  const { close } = useFlowPanel();
  const linked = useLinkedInvestigations();
  const future = map.versions.future;
  const entry = future ? diffVersions(map.versions.current, future).entries.find((e) => e.key === changeKey) : undefined;
  const current = future?.rationale[changeKey];
  // The stored rationale is the source of truth; every keystroke dispatches.
  const text = current?.text ?? "";
  const invId = current?.linkedAction?.investigationId ?? "";
  const actionId = current?.linkedAction?.actionId ?? "";
  if (!future || !entry || entry.kind === "unchanged") return null;
  const name = entry.kind === "removed" ? entry.currentStep.name : entry.futureStep.name;
  const what = entry.kind === "removed" ? "Removed" : entry.kind === "added" ? "Added" : "Changed";
  const inv = invId ? linked.get(invId) : undefined;
  const investigations = [...linked.values()];

  function save(nextText: string, nextInv = invId, nextAction = actionId) {
    dispatch({ type: "set_rationale", key: changeKey, rationale: { text: nextText, linkedAction: nextInv && nextAction ? { investigationId: nextInv, actionId: nextAction } : undefined } });
  }

  return (
    <ContextPanel title={`${what}: ${name || "Untitled step"}`} fullScreen={map.shopFloorMode}>
      <div className="flex flex-col gap-4">
        {entry.kind === "changed" ? (
          <ul className="text-[12.5px] text-graphite">
            {entry.changes.map((c) => <li key={c.field}>{c.field}: <span className="line-through">{String(c.before ?? "—")}</span> → <span className="text-ink">{String(c.after ?? "—")}</span></li>)}
          </ul>
        ) : null}
        <Field label="Rationale" htmlFor="rat-text" required helper={entry.kind === "removed" ? "What change makes this step unnecessary?" : "What has to be true for this to work? Which corrective action makes it real?"}>
          <TextArea id="rat-text" rows={4} value={text} autoFocus onChange={(e) => save(e.target.value)} onSubmitKey={close} />
        </Field>
        <section className="rounded-[3px] border border-line bg-paper p-3">
          <p className="flex items-center gap-2 text-[13px] font-medium text-ink"><LoopGlyph className="h-3 w-6" /> Linked LoopSolve action</p>
          {investigations.length ? (
            <div className="mt-2 grid gap-2">
              <Select aria-label="Investigation" value={invId} onChange={(e) => save(text, e.target.value, "")}>
                <option value="">None</option>
                {investigations.map((i) => <option key={i.id} value={i.id}>{i.rcaNumber} · {i.title || "Untitled"}</option>)}
              </Select>
              {inv ? (
                <Select aria-label="Action" value={actionId} onChange={(e) => save(text, invId, e.target.value)}>
                  <option value="">Choose an action…</option>
                  {inv.actions.map((a) => <option key={a.id} value={a.id}>{a.title || "Untitled action"} · {a.status.replace(/_/g, " ")}</option>)}
                </Select>
              ) : null}
              {inv && !inv.actions.length ? <p className="text-[12px] text-stone">{inv.rcaNumber} has no actions yet.</p> : null}
            </div>
          ) : (
            <p className="mt-1 text-[12.5px] text-stone">Start an investigation from a pain point on the current map, then link its action here so the future state is traceable.</p>
          )}
        </section>
        <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
          <LoopButton size="sm" variant="ghost" onClick={() => { dispatch({ type: "clear_rationale", key: changeKey }); close(); }}>Clear</LoopButton>
          <LoopButton variant="dark" onClick={close}>Done</LoopButton>
        </div>
      </div>
    </ContextPanel>
  );
}
