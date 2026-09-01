"use client";

import type { Stage } from "@/lib/solve/schema";
import { Workspace } from "./Workspace";
import { PanelContent } from "./PanelContent";
import { ProblemStage } from "./stages/ProblemStage";
import { ContainStage } from "./stages/ContainStage";
import { InvestigateStage } from "./stages/InvestigateStage";
import { RootCauseStage } from "./stages/RootCauseStage";
import { ActionsStage } from "./stages/ActionsStage";
import { VerifyStage } from "./stages/VerifyStage";
import { SummaryStage } from "./stages/SummaryStage";

export function StageView({ stage }: { stage: Stage }) {
  return (
    <Workspace stage={stage} panel={<PanelContent stage={stage} />}>
      {stage === "problem" ? <ProblemStage /> : null}
      {stage === "contain" ? <ContainStage /> : null}
      {stage === "investigate" ? <InvestigateStage /> : null}
      {stage === "root-cause" ? <RootCauseStage /> : null}
      {stage === "actions" ? <ActionsStage /> : null}
      {stage === "verify" ? <VerifyStage /> : null}
      {stage === "summary" ? <SummaryStage /> : null}
    </Workspace>
  );
}
