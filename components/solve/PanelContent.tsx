"use client";

import type { Stage } from "@/lib/solve/schema";
import { usePanel } from "./ContextPanel";
import { ContainmentPanel } from "./panels/ContainmentPanel";
import { CausePanel } from "./panels/CausePanel";
import { EvidencePanel } from "./panels/EvidencePanel";
import { CategoryPanel } from "./panels/CategoryPanel";
import { ActionPanel } from "./panels/ActionPanel";
import { VerificationPanel } from "./panels/VerificationPanel";
import { TimelinePanel } from "./panels/TimelinePanel";
import { LessonPanel } from "./panels/LessonPanel";

export function PanelContent({ stage }: { stage: Stage }) {
  const { state } = usePanel();
  void stage;
  if (!state) return null;
  switch (state.kind) {
    case "containment":
      return <ContainmentPanel id={state.containmentId} />;
    case "cause":
      return <CausePanel causeId={state.causeId} />;
    case "evidence":
      return <EvidencePanel evidenceId={state.evidenceId} forCauseId={state.forCauseId} />;
    case "category":
      return <CategoryPanel categoryId={state.categoryId} />;
    case "action":
      return <ActionPanel actionId={state.actionId} kindPreset={state.kindPreset} horizonPreset={state.horizonPreset} />;
    case "verification":
      return <VerificationPanel actionId={state.actionId} verificationId={state.verificationId} />;
    case "timeline":
      return <TimelinePanel eventId={state.eventId} />;
    case "lesson":
      return <LessonPanel lessonId={state.lessonId} />;
    default:
      return null;
  }
}
