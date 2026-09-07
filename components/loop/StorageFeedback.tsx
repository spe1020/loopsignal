"use client";
import { useCallback, useEffect, useState } from "react";
import { storageKind as solveKind } from "@/lib/solve/storage";
import { storageKind as flowKind } from "@/lib/flow/storage";

/** Shared home-screen feedback for create/import/duplicate/read failures. */
export function useStorageFeedback() {
  const [error, setError] = useState("");
  const [temporary, setTemporary] = useState(false);
  useEffect(() => {
    let cancelled = false;
    Promise.all([solveKind(), flowKind()])
      .then((kinds) => {
        if (!cancelled) setTemporary(kinds.includes("memory"));
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Storage is unavailable. Retry the operation; keep your original export files.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const run = useCallback(async (operation: () => Promise<void>) => {
    setError("");
    try {
      await operation();
    } catch {
      setError(
        "The operation could not finish in this browser’s storage. Your source files have not been changed. Retry, or export any open work before leaving.",
      );
    }
  }, []);
  const feedback =
    error || temporary ? (
      <div
        role="alert"
        className="border-b border-risk-amber bg-risk-amber-bg px-6 py-4 text-sm leading-6 text-ink"
      >
        {error ||
          "Temporary memory only. Documents in the affected tool will not survive a reload. Export before leaving; nothing has been saved to a company cloud."}
      </div>
    ) : null;
  return { run, feedback };
}
