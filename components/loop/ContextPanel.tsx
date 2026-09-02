"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IconClose } from "./icons";
import { IconButton } from "./ui";
import { useMediaQuery } from "./useMediaQuery";

export type PanelApi<S> = {
  state: S | null;
  open: (s: S) => void;
  close: () => void;
};

const PanelContext = createContext<PanelApi<unknown> | null>(null);

/** Typed accessor; each tool wraps this with its own panel-state union. */
export function usePanelState<S>(): PanelApi<S> {
  const ctx = useContext(PanelContext);
  if (!ctx) return { state: null, open: () => {}, close: () => {} };
  return ctx as PanelApi<S>;
}

export function PanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<unknown>(null);
  const open = useCallback((s: unknown) => setState(s), []);
  const close = useCallback(() => setState(null), []);
  const value = useMemo(() => ({ state, open, close }), [state, open, close]);
  return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>;
}

/**
 * Right context panel on desktop, slide-over sheet on tablet, bottom sheet on
 * mobile (full-screen sheet in Shop Floor Mode). Never a centered modal.
 */
export function ContextPanel({
  title,
  children,
  fullScreen = false,
  actions,
}: {
  title: string;
  children: ReactNode;
  fullScreen?: boolean;
  /** Optional header actions rendered left of the close button. */
  actions?: ReactNode;
}) {
  const { close } = usePanelState<unknown>();
  const ref = useRef<HTMLDivElement>(null);
  // Below the desktop breakpoint (or full-screen) the panel is a sheet with a
  // blocking backdrop, so it is modal for assistive tech. On desktop it is a
  // side column and the page stays interactive.
  const desktop = useMediaQuery("(min-width: 1024px)");
  const modal = fullScreen || !desktop;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const first = ref.current?.querySelector<HTMLElement>("input, textarea, select, button:not([data-close])");
    if (window.innerWidth < 1024) first?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const desktopClasses = fullScreen
    ? "lg:fixed lg:inset-0 lg:w-auto lg:max-h-none lg:border-0 lg:rounded-none"
    : "lg:sticky lg:top-[88px] lg:h-[calc(100vh-104px)] lg:w-full lg:rounded-[3px] lg:border lg:border-line lg:shadow-none";
  const mobileClasses = fullScreen
    ? "fixed inset-0 rounded-none max-h-none md:inset-0 md:w-auto md:max-w-none"
    : "fixed inset-x-0 bottom-0 max-h-[86vh] rounded-t-[8px] border-t md:inset-y-0 md:left-auto md:right-0 md:w-[420px] md:max-h-none md:rounded-none md:border-l md:border-t-0";

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        data-close
        onClick={close}
        className={`loop-chrome fixed inset-0 z-[55] bg-ink/25 ${fullScreen ? "" : "lg:hidden"}`}
      />
      <aside
        ref={ref}
        role="dialog"
        aria-label={title}
        aria-modal={modal}
        className={`loop-panel loop-chrome z-[60] flex flex-col overflow-hidden border-line bg-cream shadow-2xl ${mobileClasses} ${desktopClasses}`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h2 className="truncate text-[14px] font-medium tracking-[0.01em] text-ink">{title}</h2>
          <div className="flex items-center gap-1">
            {actions}
            <IconButton label="Close panel" data-close onClick={close}>
              <IconClose size={16} />
            </IconButton>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">{children}</div>
      </aside>
    </>
  );
}
