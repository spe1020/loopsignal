"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

const InvestigationContext = createContext<Ctx | null>(null);

export function useInvestigation(): Ctx {
  const ctx = useContext(InvestigationContext);
  if (!ctx) throw new Error("useInvestigation must be used inside InvestigationProvider");
  return ctx;
}

type ReducerState = { inv: Investigation | null; dirty: boolean };
type LocalAction = SolveAction | { type: "__load"; inv: Investigation } | { type: "__saved"; inv: Investigation };

function localReducer(state: ReducerState, action: LocalAction): ReducerState {
  if (action.type === "__load") return { inv: action.inv, dirty: false };
  if (action.type === "__saved") return state.inv === action.inv ? { ...state, dirty: false } : state;
  if (!state.inv) return state;
  const next = reduce(state.inv, action);
  if (next === state.inv) return state;
  return { inv: next, dirty: true };
}

export function InvestigationProvider({
  id,
  children,
  fallback,
  missing,
}: {
  id: string;
  children: ReactNode;
  fallback: ReactNode;
  missing: ReactNode;
}) {
  const [state, dispatchLocal] = useReducer(localReducer, { inv: null, dirty: false });
  const [loaded, setLoaded] = useState<{ id: string; phase: "missing" | "ready" } | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const latest = useRef<ReducerState>(state);
  const timer = useRef<number | null>(null);
  const phase = loaded?.id === id ? loaded.phase : "loading";

  useEffect(() => {
    latest.current = state;
  });

  useEffect(() => {
    let cancelled = false;
    loadInvestigation(id).then((inv) => {
      if (cancelled) return;
      if (!inv) {
        setLoaded({ id, phase: "missing" });
        return;
      }
      dispatchLocal({ type: "__load", inv });
      setSavedAt(inv.updatedAt);
      setLoaded({ id, phase: "ready" });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const persist = useCallback(async () => {
    const current = latest.current;
    if (!current.inv || !current.dirty) return;
    const inv = current.inv;
    setSaving(true);
    try {
      await saveInvestigation(inv);
      dispatchLocal({ type: "__saved", inv });
      setSavedAt(new Date().toISOString());
    } finally {
      setSaving(false);
    }
  }, []);

  // Debounced autosave (500 ms).
  useEffect(() => {
    if (!state.dirty) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      void persist();
    }, 500);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [state, persist]);

  // Flush on hide / unload so edits survive reload.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void persist();
    };
    const onUnload = () => {
      void persist();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
      void persist();
    };
  }, [persist]);

  const dispatch = useCallback((action: SolveAction) => dispatchLocal(action), []);
  const restore = useCallback((inv: Investigation) => dispatchLocal({ type: "replace", investigation: inv }), []);

  const value = useMemo<Ctx | null>(
    () =>
      state.inv
        ? { investigation: state.inv, dispatch, restore, savedAt, saving, flush: persist }
        : null,
    [state.inv, dispatch, restore, savedAt, saving, persist],
  );

  if (phase !== "ready" || !state.inv) return <>{phase === "missing" ? missing : fallback}</>;
  return <InvestigationContext.Provider value={value as Ctx}>{children}</InvestigationContext.Provider>;
}
