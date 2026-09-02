"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { IconArrowLeft, IconArrowRight, IconChevronLeft } from "./icons";
import { LoopButton } from "./ui";
import { useMediaQuery } from "./useMediaQuery";

export type PrimaryAction = { label: string; onClick: () => void; icon?: ReactNode } | null;

type ShellApi = { setPrimaryAction: (a: PrimaryAction) => void };

const ShellContext = createContext<ShellApi | null>(null);

/** Registers the mobile bottom-bar primary action for the current stage. */
export function usePrimaryAction(action: PrimaryAction, deps: unknown[]) {
  const ctx = useContext(ShellContext);
  const set = ctx?.setPrimaryAction;
  useEffect(() => {
    set?.(action);
    return () => set?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export type StageLink = { href: string; label: string };

/**
 * The responsive workspace frame every Loop tool shares: breadcrumb, header,
 * rail (desktop) / icon rail (tablet) / strip (mobile), stage heading with
 * prev/next, optional right panel, and the mobile bottom action bar.
 */
export function WorkspaceShell({
  homeHref,
  homeLabel,
  number,
  header,
  rail,
  strip,
  stageLabel,
  prev,
  next,
  panel,
  panelOpen,
  shopFloor,
  children,
}: {
  homeHref: string;
  homeLabel: string;
  number: string;
  header: ReactNode;
  rail: ReactNode;
  strip: ReactNode;
  stageLabel: string;
  prev: StageLink | null;
  next: StageLink | null;
  panel: ReactNode;
  panelOpen: boolean;
  shopFloor: boolean;
  children: ReactNode;
}) {
  const [primary, setPrimary] = useState<PrimaryAction>(null);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const setPrimaryAction = useCallback((a: PrimaryAction) => setPrimary(a), []);
  const shell = useMemo(() => ({ setPrimaryAction }), [setPrimaryAction]);

  useEffect(() => {
    document.body.dataset.loopWorkspace = "1";
    return () => {
      delete document.body.dataset.loopWorkspace;
    };
  }, []);

  return (
    <ShellContext.Provider value={shell}>
      <div className={`loop-root min-h-[calc(100vh-72px)] ${shopFloor ? "loop-shopfloor" : ""}`}>
        <div className="loop-chrome flex items-center gap-2 border-b border-line bg-paper px-4 py-1.5 text-[12px] text-stone md:px-6">
          <Link href={homeHref} className="inline-flex min-h-[32px] items-center gap-1 rounded-[2px] px-1 text-graphite hover:text-ink focus-visible:outline-2 focus-visible:outline-copper">
            <IconChevronLeft size={14} />
            {homeLabel}
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate">{number}</span>
        </div>
        {header}
        <div
          className={`mx-auto grid w-full max-w-[1600px] grid-cols-[minmax(0,1fr)] gap-x-6 px-4 pb-24 md:grid-cols-[76px_minmax(0,1fr)] md:px-6 md:pb-10 lg:grid-cols-[228px_minmax(0,1fr)] ${
            panelOpen && desktop ? "lg:grid-cols-[228px_minmax(0,1fr)_380px]" : ""
          }`}
        >
          <div className="md:sticky md:top-[88px] md:self-start md:pt-6">{rail}</div>
          {strip}
          <main className="loop-main min-w-0 pt-5 md:pt-6" id="loop-main">
            <div className="loop-chrome mb-4 flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">{stageLabel}</p>
              <div className="hidden items-center gap-1 md:flex">
                {prev ? (
                  <Link href={prev.href} className="inline-flex min-h-[36px] items-center gap-1 rounded-[3px] px-2 text-[13px] text-graphite hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-copper">
                    <IconArrowLeft size={14} /> {prev.label}
                  </Link>
                ) : null}
                {next ? (
                  <Link href={next.href} className="inline-flex min-h-[36px] items-center gap-1 rounded-[3px] px-2 text-[13px] text-graphite hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-copper">
                    {next.label} <IconArrowRight size={14} />
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
        <div className="loop-chrome fixed inset-x-0 bottom-0 z-[50] flex items-center gap-2 border-t border-line bg-cream/95 px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] backdrop-blur md:hidden">
          {prev ? (
            <Link href={prev.href} aria-label={`Back to ${prev.label}`} className="inline-flex min-h-(--loop-control) min-w-(--loop-control) items-center justify-center rounded-[3px] border border-line text-graphite focus-visible:outline-2 focus-visible:outline-copper">
              <IconArrowLeft size={18} />
            </Link>
          ) : null}
          {primary ? (
            <LoopButton variant="primary" size="lg" className="flex-1" onClick={primary.onClick} icon={primary.icon}>
              {primary.label}
            </LoopButton>
          ) : next ? (
            <Link href={next.href} className="inline-flex min-h-(--loop-control) flex-1 items-center justify-center gap-2 rounded-[3px] bg-ink text-[15px] font-medium text-cream focus-visible:outline-2 focus-visible:outline-copper">
              Next: {next.label} <IconArrowRight size={16} />
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next && primary ? (
            <Link href={next.href} aria-label={`Next: ${next.label}`} className="inline-flex min-h-(--loop-control) min-w-(--loop-control) items-center justify-center rounded-[3px] border border-line text-graphite focus-visible:outline-2 focus-visible:outline-copper">
              <IconArrowRight size={18} />
            </Link>
          ) : null}
        </div>
      </div>
    </ShellContext.Provider>
  );
}
