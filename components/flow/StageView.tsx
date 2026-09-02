"use client";

import type { Stage } from "@/lib/flow/schema";
import { FlowWorkspace } from "./FlowWorkspace";
import { PanelContent } from "./PanelContent";
import { AnalyzeStage } from "./stages/AnalyzeStage";
import { FutureStage } from "./stages/FutureStage";
import { MapStage } from "./stages/MapStage";
import { ScopeStage } from "./stages/ScopeStage";
import { SummaryStage } from "./stages/SummaryStage";

export function StageView({ stage }: { stage: Stage }) {
  return (
    <FlowWorkspace stage={stage} panel={<PanelContent />}>
      {stage === "scope" ? <ScopeStage /> : null}
      {stage === "map" ? <MapStage /> : null}
      {stage === "analyze" ? <AnalyzeStage /> : null}
      {stage === "future" ? <FutureStage /> : null}
      {stage === "summary" ? <SummaryStage /> : null}
    </FlowWorkspace>
  );
}
