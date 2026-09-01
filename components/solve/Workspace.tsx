"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Stage } from "@/lib/solve/schema";
import { nextStage, prevStage, stageMeta } from "@/lib/solve/stages";
import { trackSolve } from "@/lib/solve/analytics";
import { PanelProvider, usePanel } from "./ContextPanel";
import { IconArrowLeft, IconArrowRight, IconChevronLeft } from "./icons";
import { useInvestigation } from "./InvestigationProvider";
import { ProjectHeader } from "./ProjectHeader";
import { StageRail, StageStrip } from "./StageNav";
import { SolveButton } from "./ui";
import { useMediaQuery } from "./useMediaQuery";

export type PrimaryAction = { label: string; onClick: () => void; icon?: ReactNode } | null;

type ShellApi = {
  setPrimaryAction: (a: PrimaryAction) => void;
  facilitating: boolean;
  enterFacilitation: () => void;
  exitFacilitation: () => void;
};

const ShellContext = createContext<ShellApi | null>(null);

export function useShell(): ShellApi {
  const ctx = useContext(ShellContext);
  if (!ctx) return { setPrimaryAction: () => {}, facilitating: false, enterFacilitation: () => {}, exitFacilitation: () => {} };
  return ctx;
}

/** Registers the mobile bottom-bar primary action for the current stage. */
export function usePrimaryAction(action: PrimaryAction, deps: unknown[]) {
  const { setPrimaryAction } = useShell();
  useEffect(() => {
    setPrimaryAction(action);
    return () => setPrimaryAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
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
  const [primary, setPrimary] = useState<PrimaryAction>(null);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const facilitating = params.get("facilitate") === "1" && (stage === "investigate" || stage === "root-cause");

  const setPrimaryAction = useCallback((a: PrimaryAction) => setPrimary(a), []);
  const enterFacilitation = useCallback(() => {
    const target = stage === "investigate" || stage === "root-cause" ? stage : "investigate";
    trackSolve("loopsolve_facilitation_enter", { stage: target });
    router.push(`/solve/${inv.id}/${target}?facilitate=1`);
  }, [router, inv.id, stage]);
  const exitFacilitation = useCallback(() => {
    router.push(`/solve/${inv.id}/${stage}`);
  }, [router, inv.id, stage]);

  const shell = useMemo(
    () => ({ setPrimaryAction, facilitating, enterFacilitation, exitFacilitation }),
    [setPrimaryAction, facilitating, enterFacilitation, exitFacilitation],
  );

  // Close the panel on stage change.
  useEffect(() => {
    close();
  }, [stage, close]);

  useEffect(() => {
    document.body.dataset.solveWorkspace = "1";
    return () => {
      delete document.body.dataset.solveWorkspace;
    };
  }, []);

  const shop = inv.shopFloorMode;
  const next = nextStage(stage);
  const prev = prevStage(stage);
  const panelOpen = panelState !== null;

  return (
    <ShellContext.Provider value={shell}>
      <div className={`solve-root min-h-[calc(100vh-72px)] ${shop ? "solve-shopfloor" : ""}`}>
        <div className="solve-chrome flex items-center gap-2 border-b border-line bg-paper px-4 py-1.5 text-[12px] text-stone md:px-6">
          <Link href="/solve" className="inline-flex min-h-[32px] items-center gap-1 rounded-[2px] px-1 text-graphite hover:text-ink focus-visible:outline-2 focus-visible:outline-copper">
            <IconChevronLeft size={14} />
            LoopSolve
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate">{inv.rcaNumber}</span>
        </div>
        <ProjectHeader stage={stage} onFacilitate={enterFacilitation} />
        <div
          className={`mx-auto grid w-full max-w-[1600px] grid-cols-[minmax(0,1fr)] gap-x-6 px-4 pb-24 md:grid-cols-[76px_minmax(0,1fr)] md:px-6 md:pb-10 lg:grid-cols-[228px_minmax(0,1fr)] ${
            panelOpen && desktop ? "lg:grid-cols-[228px_minmax(0,1fr)_380px]" : ""
          }`}
        >
          <div className="md:sticky md:top-[88px] md:self-start md:pt-6">
            <StageRail inv={inv} current={stage} shopFloor={shop} />
          </div>
          <StageStrip inv={inv} current={stage} shopFloor={shop} />
          <main className="solve-main min-w-0 pt-5 md:pt-6" id="solve-main">
            <div className="solve-chrome mb-4 flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
                Stage {stageMeta[stage].index} · {stageMeta[stage].label}
              </p>
              <div className="hidden items-center gap-1 md:flex">
                {prev ? (
                  <Link href={`/solve/${inv.id}/${prev}`} className="inline-flex min-h-[36px] items-center gap-1 rounded-[3px] px-2 text-[13px] text-graphite hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-copper">
                    <IconArrowLeft size={14} /> {stageMeta[prev].label}
                  </Link>
                ) : null}
                {next ? (
                  <Link href={`/solve/${inv.id}/${next}`} className="inline-flex min-h-[36px] items-center gap-1 rounded-[3px] px-2 text-[13px] text-graphite hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-copper">
                    {stageMeta[next].label} <IconArrowRight size={14} />
                  </Link>
                ) : null}
              </div>
            </div>
            {children}
          </main>
          {panelOpen && desktop ? <div className="pt-6">{panel}</div> : null}
        </div>
        {panelOpen && !desktop ? panel : null}

        {/* Mobile bottom action bar */}
        <div className="solve-chrome fixed inset-x-0 bottom-0 z-[50] flex items-center gap-2 border-t border-line bg-cream/95 px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] backdrop-blur md:hidden">
          {prev ? (
            <Link href={`/solve/${inv.id}/${prev}`} aria-label={`Back to ${stageMeta[prev].label}`} className="inline-flex min-h-(--solve-control) min-w-(--solve-control) items-center justify-center rounded-[3px] border border-line text-graphite focus-visible:outline-2 focus-visible:outline-copper">
              <IconArrowLeft size={18} />
            </Link>
          ) : null}
          {primary ? (
            <SolveButton variant="primary" size="lg" className="flex-1" onClick={primary.onClick} icon={primary.icon}>
              {primary.label}
            </SolveButton>
          ) : next ? (
            <Link href={`/solve/${inv.id}/${next}`} className="inline-flex min-h-(--solve-control) flex-1 items-center justify-center gap-2 rounded-[3px] bg-ink text-[15px] font-medium text-cream focus-visible:outline-2 focus-visible:outline-copper">
              Next: {stageMeta[next].label} <IconArrowRight size={16} />
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next && primary ? (
            <Link href={`/solve/${inv.id}/${next}`} aria-label={`Next: ${stageMeta[next].label}`} className="inline-flex min-h-(--solve-control) min-w-(--solve-control) items-center justify-center rounded-[3px] border border-line text-graphite focus-visible:outline-2 focus-visible:outline-copper">
              <IconArrowRight size={18} />
            </Link>
          ) : null}
        </div>
      </div>
    </ShellContext.Provider>
  );
}
