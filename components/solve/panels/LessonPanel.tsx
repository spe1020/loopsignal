"use client";

import type { LessonLearned } from "@/lib/solve/schema";
import { ContextPanel, usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { Checkbox, Field, SolveButton, TextArea, TextInput } from "@/components/loop/ui";

export function LessonPanel({ lessonId }: { lessonId: string | null }) {
  const { investigation: inv, dispatch } = useInvestigation();
  const { close } = usePanel();
  const l = inv.lessons.find((x) => x.id === lessonId);
  if (!l) return null;
  const set = (patch: Partial<LessonLearned>) => dispatch({ type: "update_lesson", id: l.id, patch });
  return (
    <ContextPanel title="Lesson learned" fullScreen={inv.shopFloorMode}>
      <div className="flex flex-col gap-4">
        <Field label="Lesson" htmlFor="les-text" helper="What should the organization know so this does not happen again — here or elsewhere?"><TextArea id="les-text" rows={4} value={l.lesson} onChange={(e) => set({ lesson: e.target.value })} autoFocus={!l.lesson} /></Field>
        <Field label="Related process" htmlFor="les-proc"><TextInput id="les-proc" value={l.relatedProcess} onChange={(e) => set({ relatedProcess: e.target.value })} /></Field>
        <fieldset>
          <legend className="text-[13px] font-medium text-ink">What needs updating?</legend>
          <div className="mt-1 flex flex-col">
            <Checkbox label="Standard work" checked={l.standardWorkUpdate} onChange={(e) => set({ standardWorkUpdate: e.target.checked })} />
            <Checkbox label="Training" checked={l.trainingUpdate} onChange={(e) => set({ trainingUpdate: e.target.checked })} />
            <Checkbox label="Documents / drawings / procedures" checked={l.documentUpdate} onChange={(e) => set({ documentUpdate: e.target.checked })} />
          </div>
        </fieldset>
        <Field label="Similar processes to review" htmlFor="les-sim" helper="Where else could the same cause be hiding?"><TextArea id="les-sim" rows={2} value={l.similarProcessesToReview ?? ""} onChange={(e) => set({ similarProcessesToReview: e.target.value })} /></Field>
        <SolveButton variant="dark" onClick={close}>Done</SolveButton>
      </div>
    </ContextPanel>
  );
}
