"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IconClose } from "./icons";

type Toast = {
  id: number;
  message: string;
  undo?: () => void;
  tone?: "neutral" | "red" | "green";
  ttl: number;
};

type ToastApi = {
  show: (message: string, opts?: { undo?: () => void; tone?: Toast["tone"]; ttl?: number }) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) return { show: () => {} };
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback<ToastApi["show"]>((message, opts = {}) => {
    counter.current += 1;
    const id = counter.current;
    setToasts((t) => [...t.slice(-2), { id, message, undo: opts.undo, tone: opts.tone, ttl: opts.ttl ?? (opts.undo ? 8000 : 4000) }]);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6 print:hidden">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const h = window.setTimeout(onDone, toast.ttl);
    return () => window.clearTimeout(h);
  }, [toast.ttl, onDone]);
  const tone =
    toast.tone === "red" ? "border-risk-critical/40" : toast.tone === "green" ? "border-risk-track/40" : "border-white/15";
  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[3px] border bg-ink px-4 py-3 text-[14px] text-cream shadow-lg ${tone}`}
    >
      <span className="flex-1">{toast.message}</span>
      {toast.undo ? (
        <button
          type="button"
          onClick={() => {
            toast.undo?.();
            onDone();
          }}
          className="min-h-[36px] rounded-[3px] border border-copper/60 px-3 text-[13px] font-medium text-copper hover:bg-copper hover:text-white focus-visible:outline-2 focus-visible:outline-copper"
        >
          Undo
        </button>
      ) : null}
      <button
        type="button"
        onClick={onDone}
        aria-label="Dismiss"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-white/60 hover:text-white focus-visible:outline-2 focus-visible:outline-copper"
      >
        <IconClose size={14} />
      </button>
    </div>
  );
}
