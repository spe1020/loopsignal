"use client";

import { useFlowPanel } from "./panel";
import { LanePanel } from "./panels/LanePanel";

export function PanelContent() {
  const { state } = useFlowPanel();
  if (!state) return null;
  switch (state.kind) {
    case "lane":
      return <LanePanel laneId={state.laneId} />;
    default:
      return null;
  }
}
