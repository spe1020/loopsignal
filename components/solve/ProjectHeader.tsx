"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteSheet, InlineTitle, MenuDivider, MenuItem, MetaInput, OverflowMenu, StatusChip, ToolHeader } from "@/components/loop/HeaderParts";
import { IconAlert, IconCheck, IconCircle, IconDot, IconPause, IconShield, LoopGlyph } from "@/components/loop/icons";
import { Chip, type Tone } from "@/components/loop/ui";
import { downloadText } from "@/lib/loop/download";
import { trackSolve } from "@/lib/solve/analytics";
import { formatDate } from "@/lib/solve/format";
import { duplicateInvestigation, exportFilename, serialize } from "@/lib/solve/io";
import type { InvestigationStatus, Stage } from "@/lib/solve/schema";
import { statusLabels } from "@/lib/solve/status";
import { deleteInvestigation, nextRcaNumber, saveInvestigation } from "@/lib/solve/storage";
import { useInvestigation } from "./InvestigationProvider";
import { useToast } from "@/components/loop/Toast";

export { downloadText };

const statusTone: Record<InvestigationStatus, { tone: Tone; icon: React.ReactNode }> = {
  draft: { tone: "neutral", icon: <IconCircle size={12} /> },
  investigating: { tone: "blue", icon: <IconDot size={12} /> },
  action_open: { tone: "amber", icon: <IconPause size={12} /> },
  verification: { tone: "copper", icon: <IconShield size={12} /> },
  reopened: { tone: "red", icon: <IconAlert size={12} /> },
  closed: { tone: "green", icon: <IconCheck size={12} /> },
};

export function StatusBadge({ status, large = false }: { status: InvestigationStatus; large?: boolean }) {
  const t = statusTone[status];
  return <StatusChip label={statusLabels[status]} tone={t.tone} icon={t.icon} large={large} />;
}

export function ProjectHeader({ stage, onFacilitate }: { stage: Stage; onFacilitate?: () => void }) {
  const { investigation: inv, dispatch, flush, savedAt, saving } = useInvestigation();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function onDuplicate() {
    await flush();
    const copy = duplicateInvestigation(inv, nextRcaNumber());
    await saveInvestigation(copy);
    toast.show(`Duplicated as ${copy.rcaNumber}.`);
    router.push(`/solve/${copy.id}/problem`);
  }

  function onExport() {
    downloadText(exportFilename(inv), serialize(inv));
    trackSolve("loopsolve_export", { stage, causes: inv.causes.length });
  }

  function onPrint() {
    trackSolve("loopsolve_print", { stage });
    if (stage !== "summary") {
      router.push(`/solve/${inv.id}/summary?print=1`);
      return;
    }
    window.print();
  }

  async function onDelete() {
    await deleteInvestigation(inv.id);
    router.push("/solve");
  }

  function toggleShopFloor() {
    dispatch({ type: "set_meta", patch: { shopFloorMode: !inv.shopFloorMode } });
    trackSolve("loopsolve_shopfloor_toggle", { stage, on: inv.shopFloorMode ? 0 : 1 });
  }

  const shop = inv.shopFloorMode;

  return (
    <>
      <ToolHeader
        number={inv.rcaNumber}
        savedAt={savedAt}
        saving={saving}
        chips={
          <>
            <StatusBadge status={inv.status} large={shop} />
            {shop ? <Chip tone="ink" icon={<LoopGlyph className="h-3 w-6" tone="current" />}>Shop floor</Chip> : null}
            {inv.source?.tool === "flow" ? (
              <Link href={`/flow/${inv.source.mapId}/map${inv.source.stepId ? `?step=${inv.source.stepId}` : ""}`} className="rounded-[3px] focus-visible:outline-2 focus-visible:outline-copper" title="Open the step in LoopFlow">
                <Chip tone="copper" icon={<LoopGlyph className="h-3 w-6" tone="current" />}>From LoopFlow {inv.source.label ?? inv.source.mapNumber ?? ""}</Chip>
              </Link>
            ) : null}
          </>
        }
        title={<InlineTitle value={inv.title} placeholder="Untitled investigation" ariaLabel="Investigation title" onChange={(title) => dispatch({ type: "set_meta", patch: { title } })} />}
        meta={
          <>
            <MetaInput key={`owner-${inv.owner ?? ""}`} label="Owner" value={inv.owner ?? ""} onChange={(owner) => dispatch({ type: "set_meta", patch: { owner } })} />
            <MetaInput key={`dept-${inv.department ?? ""}`} label="Department" value={inv.department ?? ""} onChange={(department) => dispatch({ type: "set_meta", patch: { department } })} />
            <span>Created {formatDate(inv.createdAt)}</span>
            <span>Updated {formatDate(inv.updatedAt)}</span>
          </>
        }
        menu={
          <OverflowMenu>
            {(close) => (
              <>
                <MenuItem onClick={() => { close(); void onDuplicate(); }}>Duplicate</MenuItem>
                <MenuItem onClick={() => { close(); onExport(); }}>Export JSON</MenuItem>
                <MenuItem onClick={() => { close(); onPrint(); }}>Print report</MenuItem>
                <MenuDivider />
                <MenuItem onClick={() => { close(); toggleShopFloor(); }}>{shop ? "Exit Shop Floor Mode" : "Shop Floor Mode"}</MenuItem>
                <MenuItem onClick={() => { close(); onFacilitate?.(); }} disabled={!onFacilitate}>
                  Facilitation Mode
                </MenuItem>
                <MenuDivider />
                <MenuItem danger onClick={() => { close(); setConfirmDelete(true); }}>
                  Delete investigation…
                </MenuItem>
              </>
            )}
          </OverflowMenu>
        }
      />
      {confirmDelete ? <DeleteSheet number={inv.rcaNumber} noun="investigation" onCancel={() => setConfirmDelete(false)} onConfirm={onDelete} /> : null}
    </>
  );
}
