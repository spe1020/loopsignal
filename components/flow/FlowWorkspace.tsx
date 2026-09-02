"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { PanelProvider, usePanelState } from "@/components/loop/ContextPanel";
import { StageRail, StageStrip } from "@/components/loop/StageNav";
import { WorkspaceShell } from "@/components/loop/WorkspaceShell";
import { trackFlow } from "@/lib/flow/analytics";
import type { Stage, VersionKind } from "@/lib/flow/schema";
import { nextStage, prevStage, stageMeta, stageNavItems } from "@/lib/flow/stages";
import { FlowHeader } from "./FlowHeader";
import { useMap } from "./MapProvider";

export { usePrimaryAction, type PrimaryAction } from "@/components/loop/WorkspaceShell";

type ShellApi = {
  /** Which version the Map stage is editing. */
  version: VersionKind;
  setVersion: (v: VersionKind) => void;
  walking: boolean;
  enterWalk: () => void;
  exitWalk: () => void;
  /** Step to select on arrival (from ?step=). */
  focusStepId: string | null;
};

const FlowShellContext = createContext<ShellApi | null>(null);

export function useFlowShell(): ShellApi {
  const ctx = useContext(FlowShellContext);
  if (!ctx) return { version: "current", setVersion: () => {}, walking: false, enterWalk: () => {}, exitWalk: () => {}, focusStepId: null };
  return ctx;
}

export function FlowWorkspace({ stage, children, panel }: { stage: Stage; children: ReactNode; panel: ReactNode }) {
  return (
    <PanelProvider>
      <Inner stage={stage} panel={panel}>
        {children}
      </Inner>
    </PanelProvider>
  );
}

function Inner({ stage, children, panel }: { stage: Stage; children: ReactNode; panel: ReactNode }) {
  const { map } = useMap();
  const { state: panelState, close } = usePanelState<unknown>();
  const router = useRouter();
  const params = useSearchParams();
  const versionParam = params.get("version");
  const version: VersionKind = versionParam === "future" && map.versions.future ? "future" : "current";
  const walking = params.get("walk") === "1" && stage === "map";
  const focusStepId = params.get("step");

  const withParams = useCallback(
    (patch: Record<string, string | null>) => {
      const q = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) q.delete(k);
        else q.set(k, v);
      }
      const qs = q.toString();
      return `/flow/${map.id}/${stage}${qs ? `?${qs}` : ""}`;
    },
    [params, map.id, stage],
  );

  const setVersion = useCallback((v: VersionKind) => router.replace(withParams({ version: v === "future" ? "future" : null, step: null })), [router, withParams]);
  const stepCount = map.versions.current.steps.length;
  const enterWalk = useCallback(() => {
    trackFlow("loopflow_walk_enter", { stage: "map", steps: stepCount });
    router.push(`/flow/${map.id}/map?walk=1${version === "future" ? "&version=future" : ""}`);
  }, [router, map.id, stepCount, version]);
  const exitWalk = useCallback(() => router.push(`/flow/${map.id}/map${version === "future" ? "?version=future" : ""}`), [router, map.id, version]);

  const shell = useMemo(() => ({ version, setVersion, walking, enterWalk, exitWalk, focusStepId }), [version, setVersion, walking, enterWalk, exitWalk, focusStepId]);

  useEffect(() => {
    close();
  }, [stage, close]);

  const shop = map.shopFloorMode;
  const next = nextStage(stage);
  const prev = prevStage(stage);
  const items = stageNavItems(map);

  return (
    <FlowShellContext.Provider value={shell}>
      <WorkspaceShell
        homeHref="/flow"
        homeLabel="LoopFlow"
        number={map.mapNumber}
        header={<FlowHeader stage={stage} onWalk={enterWalk} />}
        rail={<StageRail items={items} current={stage} shopFloor={shop} />}
        strip={<StageStrip items={items} current={stage} shopFloor={shop} />}
        stageLabel={`Stage ${stageMeta[stage].index} · ${stageMeta[stage].label}${stage === "map" && version === "future" ? " · Future state" : ""}`}
        prev={prev ? { href: `/flow/${map.id}/${prev}`, label: stageMeta[prev].label } : null}
        next={next ? { href: `/flow/${map.id}/${next}`, label: stageMeta[next].label } : null}
        panel={panel}
        panelOpen={panelState !== null}
        shopFloor={shop}
      >
        {children}
      </WorkspaceShell>
    </FlowShellContext.Provider>
  );
}
