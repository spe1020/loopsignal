"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trackSolve } from "@/lib/solve/analytics";
import { formatDate, formatTime } from "@/lib/solve/format";
import { duplicateInvestigation, exportFilename, serialize } from "@/lib/solve/io";
import type { Investigation, InvestigationStatus, Stage } from "@/lib/solve/schema";
import { statusLabels } from "@/lib/solve/status";
import { deleteInvestigation, nextRcaNumber, saveInvestigation } from "@/lib/solve/storage";
import { useInvestigation } from "./InvestigationProvider";
import { IconAlert, IconCheck, IconCircle, IconDot, IconMore, IconPause, IconShield, LoopGlyph } from "./icons";
import { useToast } from "./Toast";
import { Chip, IconButton, SolveButton, TextInput, type Tone } from "./ui";

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
  return (
    <Chip tone={t.tone} icon={t.icon} className={large ? "px-3 py-1.5 text-[14px]" : ""}>
      {statusLabels[status]}
    </Chip>
  );
}

export function downloadText(filename: string, text: string, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function InlineTitle({ inv, onChange }: { inv: Investigation; onChange: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(inv.title);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);
  if (editing) {
    return (
      <TextInput
        ref={ref}
        aria-label="Investigation title"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onChange(draft.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setDraft(inv.title);
            setEditing(false);
          }
        }}
        className="max-w-xl text-[18px] font-medium"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setDraft(inv.title);
        setEditing(true);
      }}
      className="min-h-(--solve-control) max-w-full truncate rounded-[3px] px-1 text-left text-[18px] font-medium tracking-[-0.01em] text-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-copper md:text-[20px]"
      title="Edit title"
    >
      {inv.title || <span className="text-stone">Untitled investigation</span>}
    </button>
  );
}

function SavedIndicator({ savedAt, saving }: { savedAt: string | null; saving: boolean }) {
  // Keyed on savedAt so the pulse animation replays on every save.
  return (
    <span key={savedAt ?? "none"} className="solve-saved-pulse inline-flex items-center gap-1.5 text-[12px] text-stone" aria-live="polite">
      <IconCheck size={12} />
      {saving ? "Saving…" : savedAt ? `Saved locally · ${formatTime(savedAt)}` : "Saved locally"}
    </span>
  );
}

export function ProjectHeader({ stage, onFacilitate }: { stage: Stage; onFacilitate?: () => void }) {
  const { investigation: inv, dispatch, flush } = useInvestigation();
  const { savedAt, saving } = useInvestigation();
  const router = useRouter();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  async function onDuplicate() {
    await flush();
    const copy = duplicateInvestigation(inv, nextRcaNumber());
    await saveInvestigation(copy);
    setMenu(false);
    toast.show(`Duplicated as ${copy.rcaNumber}.`);
    router.push(`/solve/${copy.id}/problem`);
  }

  function onExport() {
    downloadText(exportFilename(inv), serialize(inv));
    trackSolve("loopsolve_export", { stage, causes: inv.causes.length });
    setMenu(false);
  }

  function onPrint() {
    setMenu(false);
    trackSolve("loopsolve_print", { stage });
    if (stage !== "summary") {
      router.push(`/solve/${inv.id}/summary?print=1`);
      return;
    }
    window.print();
  }

  async function onDelete() {
    await deleteInvestigation(inv.id);
    setMenu(false);
    router.push("/solve");
  }

  function toggleShopFloor() {
    dispatch({ type: "set_meta", patch: { shopFloorMode: !inv.shopFloorMode } });
    trackSolve("loopsolve_shopfloor_toggle", { stage, on: inv.shopFloorMode ? 0 : 1 });
    setMenu(false);
  }

  const shop = inv.shopFloorMode;

  return (
    <header className="solve-chrome border-b border-line bg-cream">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-3 md:px-6">
        <span className="font-mono text-[12px] tracking-[0.08em] text-copper">{inv.rcaNumber}</span>
        <StatusBadge status={inv.status} large={shop} />
        {shop ? <Chip tone="ink" icon={<LoopGlyph className="h-3 w-6" tone="current" />}>Shop floor</Chip> : null}
        <span className="ml-auto hidden md:inline">
          <SavedIndicator savedAt={savedAt} saving={saving} />
        </span>
      </div>
      <div className="flex items-start gap-2 px-3 pb-3 md:px-5">
        <div className="min-w-0 flex-1">
          <InlineTitle inv={inv} onChange={(title) => dispatch({ type: "set_meta", patch: { title } })} />
          <div className="solve-secondary mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[12.5px] text-stone">
            <MetaInput key={`owner-${inv.owner ?? ""}`} label="Owner" value={inv.owner ?? ""} onChange={(owner) => dispatch({ type: "set_meta", patch: { owner } })} />
            <MetaInput key={`dept-${inv.department ?? ""}`} label="Department" value={inv.department ?? ""} onChange={(department) => dispatch({ type: "set_meta", patch: { department } })} />
            <span>Created {formatDate(inv.createdAt)}</span>
            <span>Updated {formatDate(inv.updatedAt)}</span>
            <span className="md:hidden">
              <SavedIndicator savedAt={savedAt} saving={saving} />
            </span>
          </div>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <IconButton label="More actions" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <IconMore size={18} />
          </IconButton>
          {menu ? (
            <div role="menu" className="absolute right-0 z-[65] mt-1 w-64 rounded-[3px] border border-line bg-cream p-1 shadow-xl">
              <MenuItem onClick={onDuplicate}>Duplicate</MenuItem>
              <MenuItem onClick={onExport}>Export JSON</MenuItem>
              <MenuItem onClick={onPrint}>Print report</MenuItem>
              <div className="my-1 border-t border-line" />
              <MenuItem onClick={toggleShopFloor}>{shop ? "Exit Shop Floor Mode" : "Shop Floor Mode"}</MenuItem>
              <MenuItem
                onClick={() => {
                  setMenu(false);
                  onFacilitate?.();
                }}
                disabled={!onFacilitate}
              >
                Facilitation Mode
              </MenuItem>
              <div className="my-1 border-t border-line" />
              <MenuItem
                danger
                onClick={() => {
                  setMenu(false);
                  setConfirmDelete(true);
                  setTyped("");
                }}
              >
                Delete investigation…
              </MenuItem>
            </div>
          ) : null}
        </div>
      </div>

      {confirmDelete ? (
        <DeleteSheet
          inv={inv}
          typed={typed}
          setTyped={setTyped}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={onDelete}
        />
      ) : null}
    </header>
  );
}

function MetaInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <label className="inline-flex items-center gap-1">
      <span>{label}</span>
      <input
        aria-label={label}
        value={draft}
        placeholder="—"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onChange(draft.trim())}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="min-h-[28px] w-28 rounded-[2px] border border-transparent bg-transparent px-1 text-ink hover:border-line focus:border-copper focus:outline-none"
      />
    </label>
  );
}

function MenuItem({ children, onClick, danger, disabled }: { children: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full min-h-[40px] items-center rounded-[2px] px-3 text-left text-[13.5px] transition-colors disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-copper ${
        danger ? "text-risk-critical hover:bg-risk-critical-bg" : "text-ink hover:bg-ink/5"
      }`}
    >
      {children}
    </button>
  );
}

/** Typed confirm on desktop, two-step sheet on mobile. The one destructive action with a confirm. */
function DeleteSheet({
  inv,
  typed,
  setTyped,
  onCancel,
  onConfirm,
}: {
  inv: Investigation;
  typed: string;
  setTyped: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [step, setStep] = useState(1);
  const ok = typed.trim().toUpperCase() === inv.rcaNumber.toUpperCase();
  return (
    <>
      <button type="button" aria-label="Cancel" onClick={onCancel} className="fixed inset-0 z-[70] bg-ink/30" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delete investigation"
        className="solve-sheet fixed inset-x-0 bottom-0 z-[75] rounded-t-[8px] border-t border-line bg-cream p-5 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:w-[420px] md:rounded-none md:border-l md:border-t-0"
      >
        <h2 className="text-[17px] font-medium text-ink">Delete {inv.rcaNumber}?</h2>
        <p className="mt-2 text-[14px] leading-6 text-graphite">
          This removes the investigation from this browser. There is no undo. Export it first if you may need it.
        </p>
        <div className="hidden md:block">
          <label className="mt-4 block text-[13px] text-ink" htmlFor="delete-confirm">
            Type <span className="font-mono text-copper">{inv.rcaNumber}</span> to confirm
          </label>
          <TextInput id="delete-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-1.5" autoFocus />
          <div className="mt-4 flex justify-end gap-2">
            <SolveButton onClick={onCancel}>Cancel</SolveButton>
            <SolveButton variant="danger" disabled={!ok} onClick={onConfirm}>
              Delete
            </SolveButton>
          </div>
        </div>
        <div className="md:hidden">
          {step === 1 ? (
            <div className="mt-4 flex flex-col gap-2">
              <SolveButton variant="danger" size="lg" onClick={() => setStep(2)}>
                Yes, delete this investigation
              </SolveButton>
              <SolveButton size="lg" onClick={onCancel}>
                Keep it
              </SolveButton>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-[14px] font-medium text-risk-critical">Last step. This cannot be undone.</p>
              <SolveButton variant="danger" size="lg" onClick={onConfirm}>
                Delete {inv.rcaNumber} permanently
              </SolveButton>
              <SolveButton size="lg" onClick={onCancel}>
                Cancel
              </SolveButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
