"use client";

import { usePanelState, type PanelApi } from "@/components/loop/ContextPanel";
import type { VersionKind } from "@/lib/flow/schema";

/** What the right panel is showing. Stages render content from this descriptor with fresh data. */
export type FlowPanelState =
  | { kind: "step"; stepId: string; version: VersionKind; focus?: "name" | "time" }
  | { kind: "lane"; laneId: string | null }
  | { kind: "pain"; painId: string; version: VersionKind }
  | { kind: "branch"; version: VersionKind; fromStepId: string; edgeId: string | null }
  | { kind: "rationale"; changeKey: string }
  | { kind: "diagram"; version: VersionKind };

export function useFlowPanel(): PanelApi<FlowPanelState> {
  return usePanelState<FlowPanelState>();
}
