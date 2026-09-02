"use client";

import { type ReactNode } from "react";
import { createDocumentContext } from "@/components/loop/DocumentProvider";
import { reduce, type SolveAction } from "@/lib/solve/reducer";
import type { Investigation } from "@/lib/solve/schema";
import { loadInvestigation, saveInvestigation } from "@/lib/solve/storage";

type Ctx = {
  investigation: Investigation;
  dispatch: (action: SolveAction) => void;
  /** Replace the whole document (undo, import). */
  restore: (inv: Investigation) => void;
  savedAt: string | null;
  saving: boolean;
  flush: () => Promise<void>;
};

const ctx = createDocumentContext<Investigation, SolveAction>({
  name: "Investigation",
  reduce,
  load: loadInvestigation,
  save: saveInvestigation,
  replace: (investigation) => ({ type: "replace", investigation }),
});

export function useInvestigation(): Ctx {
  const d = ctx.useDocument();
  return { investigation: d.doc, dispatch: d.dispatch, restore: d.restore, savedAt: d.savedAt, saving: d.saving, flush: d.flush };
}

export function InvestigationProvider(props: { id: string; children: ReactNode; fallback: ReactNode; missing: ReactNode }) {
  return <ctx.Provider {...props} />;
}
