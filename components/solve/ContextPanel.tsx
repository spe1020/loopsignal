"use client";

import { usePanelState, type PanelApi } from "@/components/loop/ContextPanel";

export { ContextPanel, PanelProvider } from "@/components/loop/ContextPanel";

/** What the right panel is showing. Stages render content from this descriptor with fresh data. */
export type PanelState =
  | { kind: "cause"; causeId: string }
  | { kind: "evidence"; evidenceId: string | null; forCauseId?: string }
  | { kind: "category"; categoryId: string | null }
  | { kind: "action"; actionId: string | null; kindPreset?: "corrective" | "preventive"; horizonPreset?: "immediate" | "structural" }
  | { kind: "verification"; actionId: string; verificationId: string | null }
  | { kind: "containment"; containmentId: string | null }
  | { kind: "timeline"; eventId: string | null }
  | { kind: "lesson"; lessonId: string | null }
  | { kind: "problem-preview" }
  | { kind: "diagram-fishbone" }
  | { kind: "menu" };

export function usePanel(): PanelApi<PanelState> {
  return usePanelState<PanelState>();
}
