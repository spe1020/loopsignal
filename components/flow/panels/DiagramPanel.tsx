"use client";

import { ContextPanel } from "@/components/loop/ContextPanel";
import type { VersionKind } from "@/lib/flow/schema";
import { SwimlaneMap } from "../map/SwimlaneMap";
import { useVersion } from "../map/useVersion";
import { useFlowPanel } from "../panel";

/** Full-screen, read-only diagram for phones. Pinch-zoom via the browser; buttons for the rest. */
export function DiagramPanel({ version }: { version: VersionKind }) {
  const { map, lanes, layout, version: v } = useVersion(version);
  const { open } = useFlowPanel();
  return (
    <ContextPanel title={`${version === "future" ? "Future" : "Current"} state · ${map.mapNumber}`} fullScreen>
      <SwimlaneMap version={v} lanes={lanes} layout={layout} selectedId={null} onSelect={(id) => open({ kind: "step", stepId: id, version })} readOnly fit="none" label="Process map diagram" />
      <p className="mt-3 text-[12.5px] text-stone">Tap a step to edit it. Pinch to zoom.</p>
    </ContextPanel>
  );
}
