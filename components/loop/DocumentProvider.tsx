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
import type { BackendKind, SaveReceipt } from "@/lib/loop/storage";
import { createSaveQueue } from "@/lib/loop/saveQueue";
import { downloadText } from "@/lib/loop/download";

export type DocumentApi<T, A> = {
  doc: T;
  dispatch: (action: A) => void;
  restore: (doc: T) => void;
  savedAt: string | null;
  saving: boolean;
  dirty: boolean;
  saveError: string | null;
  storageKind: BackendKind | null;
  flush: () => Promise<void>;
};
export type DocumentContextConfig<
  T extends { id: string; updatedAt: string },
  A,
> = {
  name: string;
  saveOnLoad?: boolean;
  reduce: (doc: T, action: A) => T;
  load: (id: string) => Promise<T | undefined>;
  save: (doc: T) => Promise<SaveReceipt>;
  kind: () => Promise<BackendKind>;
  replace: (doc: T) => A;
};
type ReducerState<T> = { doc: T | null; dirty: boolean };

export function createDocumentContext<
  T extends { id: string; updatedAt: string },
  A,
>(config: DocumentContextConfig<T, A>) {
  const Context = createContext<DocumentApi<T, A> | null>(null);
  const queuedSave = createSaveQueue(config.save);
  type LocalAction =
    | A
    | { type: "__load"; doc: T; dirty: boolean }
    | { type: "__saved"; doc: T };
  function localReducer(
    state: ReducerState<T>,
    action: LocalAction,
  ): ReducerState<T> {
    const a = action as { type?: string; doc?: T; dirty?: boolean };
    if (a.type === "__load" && a.doc)
      return { doc: a.doc, dirty: Boolean(a.dirty) };
    if (a.type === "__saved")
      return state.doc === a.doc ? { ...state, dirty: false } : state;
    if (!state.doc) return state;
    const doc = config.reduce(state.doc, action as A);
    return doc === state.doc ? state : { doc, dirty: true };
  }
  function useDocument() {
    const ctx = useContext(Context);
    if (!ctx) throw new Error(`use${config.name} must be inside its provider`);
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
    const [state, dispatchLocal] = useReducer(localReducer, {
      doc: null,
      dirty: false,
    });
    const [loaded, setLoaded] = useState<{
      id: string;
      phase: "missing" | "ready" | "error";
    } | null>(null);
    const [retry, setRetry] = useState(0);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [pendingDestination, setPendingDestination] = useState<string | null>(
      null,
    );
    const [saveError, setSaveError] = useState<string | null>(null);
    const [storageKind, setStorageKind] = useState<BackendKind | null>(null);
    const latest = useRef(state);
    const inFlight = useRef<Promise<void> | null>(null);
    const phase = loaded?.id === id ? loaded.phase : "loading";
    useEffect(() => {
      latest.current = state;
    });
    useEffect(() => {
      let cancelled = false;
      Promise.all([config.load(id), config.kind()])
        .then(([doc, kind]) => {
          if (cancelled) return;
          setStorageKind(kind);
          setSaveError(null);
          setSavedAt(
            doc && kind !== "memory" && !config.saveOnLoad
              ? doc.updatedAt
              : null,
          );
          if (doc)
            dispatchLocal({
              type: "__load",
              doc,
              dirty: kind === "memory" || Boolean(config.saveOnLoad),
            });
          setLoaded({ id, phase: doc ? "ready" : "missing" });
        })
        .catch(() => {
          if (!cancelled) setLoaded({ id, phase: "error" });
        });
      return () => {
        cancelled = true;
      };
    }, [id, retry]);

    const persist = useCallback(async () => {
      if (inFlight.current) await inFlight.current;
      const current = latest.current;
      if (!current.doc || !current.dirty) return;
      const doc = current.doc;
      const job = (async () => {
        setSaving(true);
        try {
          const receipt = await queuedSave(doc);
          setStorageKind(receipt.kind);
          if (receipt.durable) {
            dispatchLocal({ type: "__saved", doc });
            // Only acknowledge this exact snapshot, never a newer unsaved edit.
            if (latest.current.doc === doc)
              latest.current = { doc, dirty: false };
            setSavedAt(new Date().toISOString());
            setSaveError(null);
          } else {
            setSavedAt(null);
            setSaveError(
              "Temporary memory only. Export before leaving; this work will not survive a reload.",
            );
          }
        } catch {
          setSaveError(
            "Save failed. Your current edits are still here. Retry or export a recovery copy before leaving.",
          );
        } finally {
          setSaving(false);
        }
      })();
      inFlight.current = job;
      await job;
      if (inFlight.current === job) inFlight.current = null;
    }, []);
    useEffect(() => {
      if (!state.dirty || phase !== "ready") return;
      const timer = window.setTimeout(() => {
        void persist();
      }, 500);
      return () => window.clearTimeout(timer);
    }, [state, persist, phase]);
    useEffect(() => {
      const onHide = () => {
        if (document.visibilityState === "hidden") void persist();
      };
      const beforeUnload = (event: BeforeUnloadEvent) => {
        if (latest.current.dirty) {
          event.preventDefault();
          event.returnValue = "";
        }
        void persist(); // Best effort only; unload cannot guarantee async completion.
      };
      const pageHide = () => {
        void persist();
      };
      const onNavigate = (event: MouseEvent) => {
        if (
          !latest.current.dirty ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const link =
          event.target instanceof Element
            ? event.target.closest<HTMLAnchorElement>("a[href]")
            : null;
        if (!link || link.target === "_blank" || link.hasAttribute("download"))
          return;
        const destination = new URL(link.href, window.location.href);
        if (
          destination.origin !== location.origin ||
          (destination.pathname === location.pathname &&
            destination.search === location.search)
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        void persist().then(() => {
          if (!latest.current.dirty) window.location.assign(destination.href);
          else setPendingDestination(destination.href);
        });
      };
      document.addEventListener("click", onNavigate, true);
      document.addEventListener("visibilitychange", onHide);
      window.addEventListener("beforeunload", beforeUnload);
      window.addEventListener("pagehide", pageHide);
      return () => {
        document.removeEventListener("click", onNavigate, true);
        document.removeEventListener("visibilitychange", onHide);
        window.removeEventListener("beforeunload", beforeUnload);
        window.removeEventListener("pagehide", pageHide);
        void persist();
      };
    }, [persist]);
    const dispatch = useCallback((action: A) => dispatchLocal(action), []);
    const restore = useCallback(
      (doc: T) => dispatchLocal(config.replace(doc)),
      [],
    );
    const value = useMemo(
      () =>
        state.doc
          ? {
              doc: state.doc,
              dispatch,
              restore,
              savedAt,
              saving,
              dirty: state.dirty,
              saveError,
              storageKind,
              flush: persist,
            }
          : null,
      [
        state,
        dispatch,
        restore,
        savedAt,
        saving,
        saveError,
        storageKind,
        persist,
      ],
    );
    if (phase === "error")
      return (
        <div role="alert" className="p-6">
          Could not read this browser’s storage. Existing records have not been
          replaced.{" "}
          <button className="underline" onClick={() => setRetry((v) => v + 1)}>
            Retry loading
          </button>
        </div>
      );
    if (phase !== "ready" || !value)
      return <>{phase === "missing" ? missing : fallback}</>;
    return (
      <Context.Provider value={value}>
        {saveError ? (
          <div
            role="alert"
            className="loop-chrome border-b border-risk-amber bg-risk-amber-bg p-3 text-sm text-ink"
          >
            {saveError}
            <div className="mt-2 flex flex-wrap gap-4">
              <button
                type="button"
                className="underline"
                onClick={() => void persist()}
              >
                Retry save
              </button>
              <button
                type="button"
                className="underline"
                onClick={() =>
                  downloadText(
                    `${value.doc.id}.recovery.json`,
                    JSON.stringify(value.doc, null, 2),
                    "application/json",
                  )
                }
              >
                Export recovery JSON
              </button>
            </div>
          </div>
        ) : null}
        {pendingDestination ? (
          <div className="border-b border-risk-amber bg-risk-amber-bg px-6 py-3 text-sm">
            <p>
              Navigation paused because these edits are not saved. Export a
              recovery copy before leaving.
            </p>
            <button
              type="button"
              className="mt-2 min-h-11 underline"
              onClick={() => {
                latest.current = { ...latest.current, dirty: false };
                window.location.assign(pendingDestination);
              }}
            >
              Discard unsaved edits and leave
            </button>
            <button
              type="button"
              className="ml-5 min-h-11 underline"
              onClick={() => setPendingDestination(null)}
            >
              Keep editing
            </button>
          </div>
        ) : null}
        {children}
      </Context.Provider>
    );
  }
  return { Provider, useDocument };
}
