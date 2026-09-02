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

/**
 * One local document, one reducer, debounced autosave. Each Loop tool creates
 * its own typed context from this factory so the persistence behaviour is
 * identical everywhere: 500 ms debounce, flush on hide / unload / unmount.
 */

export type DocumentApi<T, A> = {
  doc: T;
  dispatch: (action: A) => void;
  /** Replace the whole document (undo, import). */
  restore: (doc: T) => void;
  savedAt: string | null;
  saving: boolean;
  flush: () => Promise<void>;
};

export type DocumentContextConfig<T extends { id: string; updatedAt: string }, A> = {
  name: string;
  reduce: (doc: T, action: A) => T;
  load: (id: string) => Promise<T | undefined>;
  save: (doc: T) => Promise<void>;
  /** Build the "replace whole document" action. */
  replace: (doc: T) => A;
};

type ReducerState<T> = { doc: T | null; dirty: boolean };

export function createDocumentContext<T extends { id: string; updatedAt: string }, A>(config: DocumentContextConfig<T, A>) {
  const Context = createContext<DocumentApi<T, A> | null>(null);

  type LocalAction = A | { type: "__load"; doc: T } | { type: "__saved"; doc: T };

  function localReducer(state: ReducerState<T>, action: LocalAction): ReducerState<T> {
    const a = action as { type?: string; doc?: T };
    if (a.type === "__load" && a.doc) return { doc: a.doc, dirty: false };
    if (a.type === "__saved") return state.doc === a.doc ? { ...state, dirty: false } : state;
    if (!state.doc) return state;
    const next = config.reduce(state.doc, action as A);
    if (next === state.doc) return state;
    return { doc: next, dirty: true };
  }

  function useDocument(): DocumentApi<T, A> {
    const ctx = useContext(Context);
    if (!ctx) throw new Error(`use${config.name} must be used inside ${config.name}Provider`);
    return ctx;
  }

  function Provider({
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
    const [state, dispatchLocal] = useReducer(localReducer, { doc: null, dirty: false });
    const [loaded, setLoaded] = useState<{ id: string; phase: "missing" | "ready" } | null>(null);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const latest = useRef<ReducerState<T>>(state);
    const timer = useRef<number | null>(null);
    const phase = loaded?.id === id ? loaded.phase : "loading";

    useEffect(() => {
      latest.current = state;
    });

    useEffect(() => {
      let cancelled = false;
      config.load(id).then((doc) => {
        if (cancelled) return;
        if (!doc) {
          setLoaded({ id, phase: "missing" });
          return;
        }
        dispatchLocal({ type: "__load", doc });
        setSavedAt(doc.updatedAt);
        setLoaded({ id, phase: "ready" });
      });
      return () => {
        cancelled = true;
      };
    }, [id]);

    const persist = useCallback(async () => {
      const current = latest.current;
      if (!current.doc || !current.dirty) return;
      const doc = current.doc;
      setSaving(true);
      try {
        await config.save(doc);
        dispatchLocal({ type: "__saved", doc });
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

    const dispatch = useCallback((action: A) => dispatchLocal(action), []);
    const restore = useCallback((doc: T) => dispatchLocal(config.replace(doc)), []);

    const value = useMemo<DocumentApi<T, A> | null>(
      () => (state.doc ? { doc: state.doc, dispatch, restore, savedAt, saving, flush: persist } : null),
      [state.doc, dispatch, restore, savedAt, saving, persist],
    );

    if (phase !== "ready" || !state.doc) return <>{phase === "missing" ? missing : fallback}</>;
    return <Context.Provider value={value as DocumentApi<T, A>}>{children}</Context.Provider>;
  }

  return { Provider, useDocument };
}
