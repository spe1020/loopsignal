"use client";

import { useCallback } from "react";
import { useToast } from "@/components/loop/Toast";
import { trackFlow } from "@/lib/flow/analytics";
import { makeStep } from "@/lib/flow/reducer";
import type { PainPoint, Step, StepType, VersionKind } from "@/lib/flow/schema";
import { stamp } from "@/lib/loop/ids";
import { useMap } from "../MapProvider";
import { useFlowPanel } from "../panel";

/** Every way a step comes into or goes out of the map, in one place. */
export function useStepActions(version: VersionKind) {
  const { map, dispatch, restore } = useMap();
  const { open, close } = useFlowPanel();
  const toast = useToast();
  const v = version === "future" && map.versions.future ? map.versions.future : map.versions.current;

  const addAfter = useCallback(
    (after: Step | null, type: StepType = "process", laneId?: string, extra: Partial<Step> = {}) => {
      const lanes = [...map.lanes].sort((a, b) => a.order - b.order);
      const lane = laneId ?? after?.laneId ?? lanes[0]?.id;
      if (!lane) return null;
      const step = makeStep({ laneId: lane, type, valueClass: type === "wait" ? "nva" : "unclassified", ...extra });
      dispatch({ type: "add_step", version, step, afterStepId: after ? after.id : undefined });
      trackFlow(type === "decision" ? "loopflow_decision_added" : "loopflow_step_added", { stage: "map", steps: v.steps.length + 1 });
      open({ kind: "step", stepId: step.id, version, focus: "name" });
      return step;
    },
    [map.lanes, dispatch, version, v.steps.length, open],
  );

  const remove = useCallback(
    (step: Step) => {
      const snapshot = map;
      dispatch({ type: "remove_step", version, id: step.id });
      close();
      toast.show(`Deleted "${step.name || "Untitled step"}".`, { undo: () => restore(snapshot) });
    },
    [map, dispatch, version, close, toast, restore],
  );

  const addPain = useCallback(
    (step: Step, text = "") => {
      const pain: PainPoint = { ...stamp(), stepId: step.id, text, category: "other", severity: "medium" };
      dispatch({ type: "add_pain", version, pain });
      trackFlow("loopflow_pain_added", { stage: "map", pain: v.painPoints.length + 1 });
      open({ kind: "pain", painId: pain.id, version });
      return pain;
    },
    [dispatch, version, v.painPoints.length, open],
  );

  return { addAfter, remove, addPain };
}
