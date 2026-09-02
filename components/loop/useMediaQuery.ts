"use client";

import { useCallback, useSyncExternalStore } from "react";

/** True when the media query matches. `initial` is used during SSR and the first client render. */
export function useMediaQuery(query: string, initial = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = () => (typeof window === "undefined" ? initial : window.matchMedia(query).matches);
  const getServerSnapshot = () => initial;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
