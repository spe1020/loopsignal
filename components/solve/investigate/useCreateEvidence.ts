"use client";

import { useCallback } from "react";
import { trackSolve } from "@/lib/solve/analytics";
import { stamp } from "@/lib/solve/reducer";
import type { Evidence } from "@/lib/solve/schema";
import { usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";

/** Creates an empty evidence item (optionally pre-linked to a cause) and opens it in the panel. */
export function useCreateEvidence() {
  const { investigation: inv, dispatch } = useInvestigation();
  const { open } = usePanel();
  return useCallback(
    (forCauseId?: string) => {
      const item: Evidence = { ...stamp(), title: "", type: "observation", description: "", source: "" };
      dispatch({ type: "add_evidence", item });
      if (forCauseId) dispatch({ type: "link_evidence", evidenceId: item.id, causeId: forCauseId, relation: "supports" });
      trackSolve("loopsolve_evidence_added", { stage: "investigate", evidence: inv.evidence.length + 1 });
      open({ kind: "evidence", evidenceId: item.id, forCauseId });
      return item;
    },
    [dispatch, open, inv.evidence.length],
  );
}
