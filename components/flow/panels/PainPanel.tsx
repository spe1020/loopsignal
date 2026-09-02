"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContextPanel } from "@/components/loop/ContextPanel";
import { IconTrash, LoopGlyph } from "@/components/loop/icons";
import { useToast } from "@/components/loop/Toast";
import { Field, LoopButton, Select, TextArea } from "@/components/loop/ui";
import { trackFlow } from "@/lib/flow/analytics";
import type { PainCategory, Severity, VersionKind } from "@/lib/flow/schema";
import { painCategories, severities } from "@/lib/flow/schema";
import { investigationFromMap } from "@/lib/flow/solveLink";
import { painCategoryMeta, severityMeta } from "@/lib/flow/visual";
import { nextRcaNumber, saveInvestigation } from "@/lib/solve/storage";
import { InvestigationStatusChip, useLinkedInvestigation } from "../LinkedInvestigations";
import { useMap } from "../MapProvider";
import { useFlowPanel } from "../panel";

export function PainPanel({ painId, version }: { painId: string; version: VersionKind }) {
  const { map, dispatch, restore } = useMap();
  const { open, close } = useFlowPanel();
  const router = useRouter();
  const toast = useToast();
  const v = version === "future" && map.versions.future ? map.versions.future : map.versions.current;
  const pain = v.painPoints.find((p) => p.id === painId);
  const linked = useLinkedInvestigation(pain?.investigationId);
  if (!pain) return null;
  const step = v.steps.find((s) => s.id === pain.stepId);
  const set = (patch: Partial<typeof pain>) => dispatch({ type: "update_pain", version, id: pain.id, patch });

  function remove() {
    const snapshot = map;
    dispatch({ type: "remove_pain", version, id: pain!.id });
    if (step) open({ kind: "step", stepId: step.id, version });
    else close();
    toast.show("Pain point deleted.", { undo: () => restore(snapshot) });
  }

  async function startInvestigation() {
    if (!step) return;
    const { investigation, link, note } = investigationFromMap({ map, step, pain: pain!, rcaNumber: nextRcaNumber() });
    await saveInvestigation(investigation);
    dispatch({ type: "link_investigation", link, note });
    trackFlow("loopflow_investigation_started", { stage: "map", pain: 1 });
    toast.show(`Opened ${investigation.rcaNumber} in LoopSolve.`);
    router.push(`/solve/${investigation.id}/problem`);
  }

  return (
    <ContextPanel title="Pain point" fullScreen={map.shopFloorMode}>
      <div className="flex flex-col gap-4">
        {step ? (
          <button type="button" onClick={() => open({ kind: "step", stepId: step.id, version })} className="rounded-[2px] text-left text-[12.5px] text-stone hover:text-ink focus-visible:outline-2 focus-visible:outline-copper">
            At step {step.order + 1}: <span className="text-graphite">{step.name || "Untitled step"}</span>
          </button>
        ) : null}
        <Field label="What's wrong here?" htmlFor="pain-text" helper="Say what happens, not who is at fault. Numbers help.">
          <TextArea id="pain-text" rows={3} value={pain.text} onChange={(e) => set({ text: e.target.value })} autoFocus={!pain.text} onSubmitKey={close} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="pain-cat">
            <Select id="pain-cat" value={pain.category} onChange={(e) => set({ category: e.target.value as PainCategory })}>
              {painCategories.map((c) => <option key={c} value={c}>{painCategoryMeta[c].label}</option>)}
            </Select>
          </Field>
          <Field label="Severity" htmlFor="pain-sev">
            <Select id="pain-sev" value={pain.severity} onChange={(e) => set({ severity: e.target.value as Severity })}>
              {severities.map((s) => <option key={s} value={s}>{severityMeta[s].label}</option>)}
            </Select>
          </Field>
        </div>

        <section className="rounded-[3px] border border-line bg-paper p-3" aria-label="Investigation">
          {pain.investigationId ? (
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <LoopGlyph className="h-3.5 w-7" />
              <span className="text-graphite">LoopSolve</span>
              {linked ? (
                <>
                  <Link href={`/solve/${linked.id}`} className="font-mono text-[12px] text-copper hover:underline focus-visible:outline-2 focus-visible:outline-copper">{linked.rcaNumber}</Link>
                  <InvestigationStatusChip status={linked.status} />
                </>
              ) : (
                <span className="text-stone">investigation not found in this browser</span>
              )}
            </div>
          ) : (
            <>
              <p className="text-[13px] text-graphite">Pain points lead to investigations, not sticky notes.</p>
              <LoopButton className="mt-2" variant="primary" size="sm" onClick={startInvestigation} disabled={version !== "current"} icon={<LoopGlyph className="h-3 w-6" tone="current" />}>Start LoopSolve investigation</LoopButton>
              {version !== "current" ? <p className="mt-1 text-[12px] text-stone">Investigations start from the current state.</p> : null}
            </>
          )}
        </section>

        <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
          <LoopButton size="sm" variant="danger" onClick={remove} icon={<IconTrash size={13} />}>Delete</LoopButton>
          <LoopButton variant="dark" onClick={close}>Done</LoopButton>
        </div>
      </div>
    </ContextPanel>
  );
}
