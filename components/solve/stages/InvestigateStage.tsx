"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { hardFindings, softFindings } from "@/lib/solve/rules";
import { useInvestigation } from "../InvestigationProvider";
import { IconBranch, IconClock, IconGrid, IconNote, IconPresent, IconPlus } from "../icons";
import { Chip, Note, SectionTitle, Segmented, SolveButton } from "../ui";
import { usePrimaryAction, useShell } from "../Workspace";
import { EvidenceView } from "../investigate/EvidenceView";
import { FishboneView } from "../investigate/FishboneView";
import { FiveWhys } from "../investigate/FiveWhys";
import { TimelineView } from "../investigate/TimelineView";
import { Facilitation } from "../Facilitation";
import { useCreateEvidence } from "../investigate/useCreateEvidence";

export type InvestigateMode = "whys" | "fishbone" | "evidence" | "timeline";

export function InvestigateStage() {
  const { investigation: inv } = useInvestigation();
  const router = useRouter();
  const params = useSearchParams();
  const { enterFacilitation, facilitating } = useShell();
  const createEvidence = useCreateEvidence();
  const modeParam = params.get("mode");
  const mode: InvestigateMode = modeParam === "fishbone" || modeParam === "evidence" || modeParam === "timeline" ? modeParam : "whys";
  const findings = useMemo(() => softFindings(inv), [inv]);
  const needs = findings.filter((f) => f.code === "needs_investigation");
  void hardFindings;

  function setMode(m: InvestigateMode) {
    const q = new URLSearchParams(params.toString());
    if (m === "whys") q.delete("mode");
    else q.set("mode", m);
    const qs = q.toString();
    router.replace(`/solve/${inv.id}/investigate${qs ? `?${qs}` : ""}`);
  }

  usePrimaryAction(
    mode === "evidence"
      ? { label: "Add evidence", onClick: () => createEvidence(), icon: <IconPlus size={16} /> }
      : null,
    [mode],
  );

  if (facilitating) return <Facilitation stage="investigate" />;

  const counts = {
    whys: inv.causes.filter((c) => !(c.origin === "fishbone" && c.parentId === null)).length,
    fishbone: inv.causes.filter((c) => c.parentId === null && c.categoryId).length,
    evidence: inv.evidence.length,
    timeline: inv.timeline.length,
  };
  const badge = (n: number) => (n ? <span className="rounded-full bg-current/10 px-1.5 font-mono text-[10.5px] opacity-80">{n}</span> : undefined);

  return (
    <div>
      <SectionTitle
        eyebrow="Investigate"
        title="Follow the evidence."
        actions={
          <SolveButton onClick={enterFacilitation} icon={<IconPresent size={15} />}>
            Facilitate
          </SolveButton>
        }
      >
        Five Whys, Fishbone, Evidence, and Timeline all work on the same causes. Promote, link, and move — nothing is duplicated.
      </SectionTitle>
      {needs.length ? (
        <div className="mt-4">
          <Note tone="amber">
            {needs.length === 1 ? "One cause needs further investigation" : `${needs.length} causes need further investigation`} — the removal test is still “not sure”. Open it from Root Cause to add evidence.
          </Note>
        </div>
      ) : null}
      <div className="mt-5">
        <Segmented
          label="Investigation tool"
          value={mode}
          onChange={setMode}
          options={[
            { value: "whys", label: "Five Whys", icon: <IconBranch size={14} />, badge: badge(counts.whys) },
            { value: "fishbone", label: "Fishbone", icon: <IconGrid size={14} />, badge: badge(counts.fishbone) },
            { value: "evidence", label: "Evidence", icon: <IconNote size={14} />, badge: badge(counts.evidence) },
            { value: "timeline", label: "Timeline", icon: <IconClock size={14} />, badge: badge(counts.timeline) },
          ]}
        />
      </div>
      <div className="mt-5">
        {mode === "whys" ? <FiveWhys /> : null}
        {mode === "fishbone" ? <FishboneView /> : null}
        {mode === "evidence" ? <EvidenceView /> : null}
        {mode === "timeline" ? <TimelineView /> : null}
      </div>
      <p className="solve-secondary mt-8 flex flex-wrap items-center gap-2 text-[12px] text-stone">
        <Chip tone="neutral">Cause evidence state</Chip> says how well a cause is supported. It is not the same as containment verification or action effectiveness.
      </p>
    </div>
  );
}
