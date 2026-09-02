"use client";

import { useFlowPanel } from "./panel";
import { DiagramPanel } from "./panels/DiagramPanel";
import { LanePanel } from "./panels/LanePanel";
import { PainPanel } from "./panels/PainPanel";
import { RationalePanel } from "./panels/RationalePanel";
import { StepPanel } from "./panels/StepPanel";

export function PanelContent() {
  const { state } = useFlowPanel();
  if (!state) return null;
  switch (state.kind) {
    case "lane":
      return <LanePanel laneId={state.laneId} />;
    case "step":
      return <StepPanel key={state.stepId} stepId={state.stepId} version={state.version} focus={state.focus} />;
    case "pain":
      return <PainPanel painId={state.painId} version={state.version} />;
    case "diagram":
      return <DiagramPanel version={state.version} />;
    case "rationale":
      return <RationalePanel key={state.changeKey} changeKey={state.changeKey} />;
    default:
      return null;
  }
}
