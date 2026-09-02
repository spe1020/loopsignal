"use client";

import { ContextPanel } from "@/components/loop/ContextPanel";
import { IconTrash } from "@/components/loop/icons";
import { useToast } from "@/components/loop/Toast";
import { Field, LoopButton, Select, TextInput } from "@/components/loop/ui";
import type { LaneKind } from "@/lib/flow/schema";
import { laneKinds } from "@/lib/flow/schema";
import { laneKindMeta } from "@/lib/flow/visual";
import { useMap } from "../MapProvider";
import { useFlowPanel } from "../panel";

export function LanePanel({ laneId }: { laneId: string | null }) {
  const { map, dispatch, restore } = useMap();
  const { close } = useFlowPanel();
  const toast = useToast();
  const lane = map.lanes.find((l) => l.id === laneId);
  if (!lane) return null;
  const stepsIn = map.versions.current.steps.filter((s) => s.laneId === lane.id).length + (map.versions.future?.steps.filter((s) => s.laneId === lane.id).length ?? 0);
  const set = (patch: Partial<typeof lane>) => dispatch({ type: "update_lane", id: lane.id, patch });
  function remove() {
    const snapshot = map;
    dispatch({ type: "remove_lane", id: lane!.id });
    close();
    toast.show(`Lane "${lane!.name || "Untitled"}" deleted.${stepsIn ? " Its steps moved to the first lane." : ""}`, { undo: () => restore(snapshot) });
  }
  return (
    <ContextPanel title="Lane" fullScreen={map.shopFloorMode}>
      <div className="flex flex-col gap-4">
        <Field label="Name" htmlFor="lane-name" helper="A role, department, system, the customer, or a supplier.">
          <TextInput id="lane-name" value={lane.name} onChange={(e) => set({ name: e.target.value })} autoFocus={!lane.name} onKeyDown={(e) => { if (e.key === "Enter") close(); }} />
        </Field>
        <Field label="Kind" htmlFor="lane-kind">
          <Select id="lane-kind" value={lane.kind} onChange={(e) => set({ kind: e.target.value as LaneKind })}>
            {laneKinds.map((k) => <option key={k} value={k}>{laneKindMeta[k].label}</option>)}
          </Select>
        </Field>
        <p className="text-[12.5px] text-stone">{stepsIn} step{stepsIn === 1 ? "" : "s"} in this lane.</p>
        <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
          <LoopButton size="sm" variant="danger" onClick={remove} icon={<IconTrash size={13} />} disabled={map.lanes.length <= 1 && stepsIn > 0}>Delete lane</LoopButton>
          <LoopButton variant="dark" onClick={close}>Done</LoopButton>
        </div>
      </div>
    </ContextPanel>
  );
}
