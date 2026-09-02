"use client";

import { type ReactNode } from "react";
import { createDocumentContext } from "@/components/loop/DocumentProvider";
import { reduce, type FlowAction } from "@/lib/flow/reducer";
import type { ProcessMap } from "@/lib/flow/schema";
import { loadMap, saveMap } from "@/lib/flow/storage";

type Ctx = {
  map: ProcessMap;
  dispatch: (action: FlowAction) => void;
  /** Replace the whole document (undo, import). */
  restore: (map: ProcessMap) => void;
  savedAt: string | null;
  saving: boolean;
  flush: () => Promise<void>;
};

const ctx = createDocumentContext<ProcessMap, FlowAction>({
  name: "Map",
  reduce,
  load: loadMap,
  save: saveMap,
  replace: (map) => ({ type: "replace", map }),
});

export function useMap(): Ctx {
  const d = ctx.useDocument();
  return { map: d.doc, dispatch: d.dispatch, restore: d.restore, savedAt: d.savedAt, saving: d.saving, flush: d.flush };
}

export function MapProvider(props: { id: string; children: ReactNode; fallback: ReactNode; missing: ReactNode }) {
  return <ctx.Provider {...props} />;
}
