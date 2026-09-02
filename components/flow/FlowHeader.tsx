"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteSheet, InlineTitle, MenuDivider, MenuItem, MetaInput, OverflowMenu, StatusChip, ToolHeader } from "@/components/loop/HeaderParts";
import { IconCheck, IconCircle, IconDot, IconFork, IconWrench, LoopGlyph } from "@/components/loop/icons";
import { useToast } from "@/components/loop/Toast";
import { Chip, type Tone } from "@/components/loop/ui";
import { downloadCsv, downloadSvg, downloadText } from "@/lib/loop/download";
import { formatDate } from "@/lib/loop/format";
import { trackFlow } from "@/lib/flow/analytics";
import { stepsCsv } from "@/lib/flow/csv";
import { duplicateMap, exportFilename, serialize, serializeBundle } from "@/lib/flow/io";
import type { MapStatus, Stage } from "@/lib/flow/schema";
import { statusLabels } from "@/lib/flow/status";
import { deleteMap, nextMapNumber, saveMap } from "@/lib/flow/storage";
import { mapSvg } from "@/lib/flow/svg";
import { listInvestigations } from "@/lib/solve/storage";
import { useMap } from "./MapProvider";

const statusTone: Record<MapStatus, { tone: Tone; icon: React.ReactNode }> = {
  draft: { tone: "neutral", icon: <IconCircle size={12} /> },
  current_mapped: { tone: "blue", icon: <IconDot size={12} /> },
  future_drafted: { tone: "copper", icon: <IconFork size={12} /> },
  improving: { tone: "amber", icon: <IconWrench size={12} /> },
  complete: { tone: "green", icon: <IconCheck size={12} /> },
};

export function MapStatusBadge({ status, large = false }: { status: MapStatus; large?: boolean }) {
  const t = statusTone[status];
  return <StatusChip label={statusLabels[status]} tone={t.tone} icon={t.icon} large={large} />;
}

export function FlowHeader({ stage, onWalk }: { stage: Stage; onWalk?: () => void }) {
  const { map, dispatch, flush, savedAt, saving } = useMap();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function onDuplicate() {
    await flush();
    const copy = duplicateMap(map, nextMapNumber());
    await saveMap(copy);
    toast.show(`Duplicated as ${copy.mapNumber}.`);
    router.push(`/flow/${copy.id}/scope`);
  }
  function onExport() {
    downloadText(exportFilename(map), serialize(map));
    trackFlow("loopflow_export", { stage, steps: map.versions.current.steps.length, kind: 0 });
  }
  async function onExportBundle() {
    const ids = new Set(map.investigations.map((l) => l.investigationId));
    const invs = (await listInvestigations()).filter((i) => ids.has(i.id));
    downloadText(exportFilename(map, "loopflow-bundle.json"), serializeBundle(map, invs));
    trackFlow("loopflow_export", { stage, steps: map.versions.current.steps.length, kind: 1, investigations: invs.length });
  }
  function onExportSvg() {
    downloadSvg(`${map.mapNumber}-current-state.svg`, mapSvg(map, "current", { title: true }));
    if (map.versions.future) downloadSvg(`${map.mapNumber}-future-state.svg`, mapSvg(map, "future", { title: true }));
    trackFlow("loopflow_export", { stage, kind: 2 });
  }
  function onExportCsv() {
    downloadCsv(exportFilename(map, "current.csv"), stepsCsv(map, "current"));
    if (map.versions.future) downloadCsv(exportFilename(map, "future.csv"), stepsCsv(map, "future"));
    trackFlow("loopflow_export", { stage, kind: 3 });
  }
  function onPrint() {
    trackFlow("loopflow_print", { stage });
    if (stage !== "summary") {
      router.push(`/flow/${map.id}/summary?print=1`);
      return;
    }
    window.print();
  }
  async function onDelete() {
    await deleteMap(map.id);
    router.push("/flow");
  }
  function toggleShopFloor() {
    dispatch({ type: "set_meta", patch: { shopFloorMode: !map.shopFloorMode } });
  }
  const shop = map.shopFloorMode;

  return (
    <>
      <ToolHeader
        number={map.mapNumber}
        savedAt={savedAt}
        saving={saving}
        chips={
          <>
            <MapStatusBadge status={map.status} large={shop} />
            {shop ? <Chip tone="ink" icon={<LoopGlyph className="h-3 w-6" tone="current" />}>Shop floor</Chip> : null}
          </>
        }
        title={<InlineTitle value={map.title} placeholder="Untitled map" ariaLabel="Map title" onChange={(title) => dispatch({ type: "set_meta", patch: { title } })} />}
        meta={
          <>
            <MetaInput key={`owner-${map.owner ?? ""}`} label="Owner" value={map.owner ?? ""} onChange={(owner) => dispatch({ type: "set_meta", patch: { owner } })} />
            <MetaInput key={`dept-${map.department ?? ""}`} label="Department" value={map.department ?? ""} onChange={(department) => dispatch({ type: "set_meta", patch: { department } })} />
            {map.process ? <span>Process: {map.process}</span> : null}
            <span>Created {formatDate(map.createdAt)}</span>
            <span>Updated {formatDate(map.updatedAt)}</span>
          </>
        }
        menu={
          <OverflowMenu>
            {(close) => (
              <>
                <MenuItem onClick={() => { close(); void onDuplicate(); }}>Duplicate</MenuItem>
                <MenuItem onClick={() => { close(); onExport(); }}>Export JSON</MenuItem>
                <MenuItem onClick={() => { close(); void onExportBundle(); }} disabled={map.investigations.length === 0}>Export with investigations</MenuItem>
                <MenuItem onClick={() => { close(); onExportSvg(); }}>Export SVG</MenuItem>
                <MenuItem onClick={() => { close(); onExportCsv(); }}>Export CSV</MenuItem>
                <MenuItem onClick={() => { close(); onPrint(); }}>Print report</MenuItem>
                <MenuDivider />
                <MenuItem onClick={() => { close(); toggleShopFloor(); }}>{shop ? "Exit Shop Floor Mode" : "Shop Floor Mode"}</MenuItem>
                <MenuItem onClick={() => { close(); onWalk?.(); }} disabled={!onWalk || map.lanes.length === 0}>Walk Mode</MenuItem>
                <MenuDivider />
                <MenuItem danger onClick={() => { close(); setConfirmDelete(true); }}>Delete map…</MenuItem>
              </>
            )}
          </OverflowMenu>
        }
      />
      {confirmDelete ? <DeleteSheet number={map.mapNumber} noun="map" onCancel={() => setConfirmDelete(false)} onConfirm={onDelete} /> : null}
    </>
  );
}
