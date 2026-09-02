"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { PanelProvider } from "@/components/loop/ContextPanel";
import { WorkspaceShell } from "@/components/loop/WorkspaceShell";
import type { Stage } from "@/lib/solve/schema";
import { nextStage, prevStage, stageMeta } from "@/lib/solve/stages";
import { trackSolve } from "@/lib/solve/analytics";
import { usePanel } from "./ContextPanel";
import { useInvestigation } from "./InvestigationProvider";
import { ProjectHeader } from "./ProjectHeader";
import { StageRail, StageStrip } from "./StageNav";

export { usePrimaryAction, type PrimaryAction } from "@/components/loop/WorkspaceShell";

type ShellApi = {
  facilitating: boolean;
  enterFacilitation: () => void;
  exitFacilitation: () => void;
};

const SolveShellContext = createContext<ShellApi | null>(null);

export function useShell(): ShellApi {
  const ctx = useContext(SolveShellContext);
  if (!ctx) return { facilitating: false, enterFacilitation: () => {}, exitFacilitation: () => {} };
  return ctx;
}

export function Workspace({ stage, children, panel }: { stage: Stage; children: ReactNode; panel: ReactNode }) {
  return (
    <PanelProvider>
      <WorkspaceInner stage={stage} panel={panel}>
        {children}
      </WorkspaceInner>
    </PanelProvider>
  );
}

function WorkspaceInner({ stage, children, panel }: { stage: Stage; children: ReactNode; panel: ReactNode }) {
  const { investigation: inv } = useInvestigation();
  const { state: panelState, close } = usePanel();
  const router = useRouter();
  const params = useSearchParams();
  const facilitating = params.get("facilitate") === "1" && (stage === "investigate" || stage === "root-cause");

  const enterFacilitation = useCallback(() => {
    const target = stage === "investigate" || stage === "root-cause" ? stage : "investigate";
    trackSolve("loopsolve_facilitation_enter", { stage: target });
    router.push(`/solve/${inv.id}/${target}?facilitate=1`);
  }, [router, inv.id, stage]);
  const exitFacilitation = useCallback(() => {
    router.push(`/solve/${inv.id}/${stage}`);
  }, [router, inv.id, stage]);

  const shell = useMemo(
    () => ({ facilitating, enterFacilitation, exitFacilitation }),
    [facilitating, enterFacilitation, exitFacilitation],
  );

  // Close the panel on stage change.
  useEffect(() => {
    close();
  }, [stage, close]);

  const shop = inv.shopFloorMode;
  const next = nextStage(stage);
  const prev = prevStage(stage);

  return (
    <SolveShellContext.Provider value={shell}>
      <WorkspaceShell
        homeHref="/solve"
        homeLabel="LoopSolve"
        number={inv.rcaNumber}
        header={<ProjectHeader stage={stage} onFacilitate={enterFacilitation} />}
        rail={<StageRail inv={inv} current={stage} shopFloor={shop} />}
        strip={<StageStrip inv={inv} current={stage} shopFloor={shop} />}
        stageLabel={`Stage ${stageMeta[stage].index} · ${stageMeta[stage].label}`}
        prev={prev ? { href: `/solve/${inv.id}/${prev}`, label: stageMeta[prev].label } : null}
        next={next ? { href: `/solve/${inv.id}/${next}`, label: stageMeta[next].label } : null}
        panel={panel}
        panelOpen={panelState !== null}
        shopFloor={shop}
      >
        {children}
      </WorkspaceShell>
    </SolveShellContext.Provider>
  );
}
