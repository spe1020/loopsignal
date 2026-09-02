"use client";

import { useEffect, useState } from "react";
import { StatusChip } from "@/components/loop/HeaderParts";
import { IconAlert, IconCheck, IconCircle, IconDot, IconPause, IconShield } from "@/components/loop/icons";
import type { Tone } from "@/components/loop/ui";
import type { Investigation, InvestigationStatus } from "@/lib/solve/schema";
import { statusLabels } from "@/lib/solve/status";
import { listInvestigations } from "@/lib/solve/storage";
import { useMap } from "./MapProvider";

const tone: Record<InvestigationStatus, { tone: Tone; icon: React.ReactNode }> = {
  draft: { tone: "neutral", icon: <IconCircle size={12} /> },
  investigating: { tone: "blue", icon: <IconDot size={12} /> },
  action_open: { tone: "amber", icon: <IconPause size={12} /> },
  verification: { tone: "copper", icon: <IconShield size={12} /> },
  reopened: { tone: "red", icon: <IconAlert size={12} /> },
  closed: { tone: "green", icon: <IconCheck size={12} /> },
};

export function InvestigationStatusChip({ status }: { status: InvestigationStatus }) {
  return <StatusChip label={statusLabels[status]} tone={tone[status].tone} icon={tone[status].icon} />;
}

/**
 * Live LoopSolve status for every investigation this map links to. Reads the
 * same browser store, refreshes when the tab regains focus, and syncs the
 * last-known status onto the map so the derived map status stays right.
 */
export function useLinkedInvestigations(): Map<string, Investigation> {
  const { map, dispatch } = useMap();
  const [byId, setById] = useState<Map<string, Investigation>>(new Map());
  const ids = map.investigations.map((l) => l.investigationId).join(",");
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!ids) {
        setById(new Map());
        return;
      }
      const want = new Set(ids.split(","));
      const all = await listInvestigations();
      if (cancelled) return;
      const m = new Map(all.filter((i) => want.has(i.id)).map((i) => [i.id, i]));
      setById(m);
      for (const inv of m.values()) dispatch({ type: "sync_investigation_status", investigationId: inv.id, status: inv.status });
    }
    void load();
    const onFocus = () => void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ids, dispatch]);
  return byId;
}

export function useLinkedInvestigation(id?: string): Investigation | undefined {
  const all = useLinkedInvestigations();
  return id ? all.get(id) : undefined;
}
