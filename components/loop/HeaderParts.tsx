"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatTime } from "@/lib/loop/format";
import { IconCheck, IconMore } from "./icons";
import { Chip, IconButton, LoopButton, TextInput, type Tone } from "./ui";

/** Icon + label + color status chip. Each tool maps its own status enum to this. */
export function StatusChip({ label, tone, icon, large = false }: { label: string; tone: Tone; icon: ReactNode; large?: boolean }) {
  return (
    <Chip tone={tone} icon={icon} className={large ? "px-3 py-1.5 text-[14px]" : ""}>
      {label}
    </Chip>
  );
}

export function SavedIndicator({ savedAt, saving }: { savedAt: string | null; saving: boolean }) {
  // Keyed on savedAt so the pulse animation replays on every save.
  return (
    <span key={savedAt ?? "none"} className="loop-saved-pulse inline-flex items-center gap-1.5 text-[12px] text-stone" aria-live="polite">
      <IconCheck size={12} />
      {saving ? "Saving…" : savedAt ? `Saved locally · ${formatTime(savedAt)}` : "Not saved"}
    </span>
  );
}

export function InlineTitle({ value, placeholder, ariaLabel, onChange }: { value: string; placeholder: string; ariaLabel: string; onChange: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);
  if (editing) {
    return (
      <TextInput
        ref={ref}
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onChange(draft.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setDraft(value);
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
        setDraft(value);
        setEditing(true);
      }}
      className="min-h-(--loop-control) max-w-full truncate rounded-[3px] px-1 text-left text-[18px] font-medium tracking-[-0.01em] text-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-copper md:text-[20px]"
      title="Edit title"
    >
      {value || <span className="text-stone">{placeholder}</span>}
    </button>
  );
}

export function MetaInput({ label, value, onChange, width = "w-28" }: { label: string; value: string; onChange: (v: string) => void; width?: string }) {
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
        className={`min-h-[28px] ${width} rounded-[2px] border border-transparent bg-transparent px-1 text-ink hover:border-line focus:border-copper focus:outline-none`}
      />
    </label>
  );
}

export function MenuItem({ children, onClick, danger, disabled }: { children: ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }) {
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

export function MenuDivider() {
  return <div className="my-1 border-t border-line" />;
}

/** Overflow "more actions" menu. Closes on outside click and Escape. */
export function OverflowMenu({ children, label = "More actions" }: { children: (close: () => void) => ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative shrink-0">
      <IconButton label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((m) => !m)}>
        <IconMore size={18} />
      </IconButton>
      {open ? (
        <div role="menu" className="absolute right-0 z-[65] mt-1 w-64 rounded-[3px] border border-line bg-cream p-1 shadow-xl">
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

/** Typed confirm on desktop, two-step sheet on mobile. The one destructive action with a confirm. */
export function DeleteSheet({
  number,
  noun,
  onCancel,
  onConfirm,
}: {
  number: string;
  noun: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [step, setStep] = useState(1);
  const ok = typed.trim().toUpperCase() === number.toUpperCase();
  return (
    <>
      <button type="button" aria-label="Cancel" onClick={onCancel} className="fixed inset-0 z-[70] bg-ink/30" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Delete ${noun}`}
        className="loop-sheet fixed inset-x-0 bottom-0 z-[75] rounded-t-[8px] border-t border-line bg-cream p-5 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:w-[420px] md:rounded-none md:border-l md:border-t-0"
      >
        <h2 className="text-[17px] font-medium text-ink">Delete {number}?</h2>
        <p className="mt-2 text-[14px] leading-6 text-graphite">
          This removes the {noun} from this browser. There is no undo. Export it first if you may need it.
        </p>
        <div className="hidden md:block">
          <label className="mt-4 block text-[13px] text-ink" htmlFor="delete-confirm">
            Type <span className="font-mono text-copper">{number}</span> to confirm
          </label>
          <TextInput id="delete-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-1.5" autoFocus />
          <div className="mt-4 flex justify-end gap-2">
            <LoopButton onClick={onCancel}>Cancel</LoopButton>
            <LoopButton variant="danger" disabled={!ok} onClick={onConfirm}>
              Delete
            </LoopButton>
          </div>
        </div>
        <div className="md:hidden">
          {step === 1 ? (
            <div className="mt-4 flex flex-col gap-2">
              <LoopButton variant="danger" size="lg" onClick={() => setStep(2)}>
                Yes, delete this {noun}
              </LoopButton>
              <LoopButton size="lg" onClick={onCancel}>
                Keep it
              </LoopButton>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-[14px] font-medium text-risk-critical">Last step. This cannot be undone.</p>
              <LoopButton variant="danger" size="lg" onClick={onConfirm}>
                Delete {number} permanently
              </LoopButton>
              <LoopButton size="lg" onClick={onCancel}>
                Cancel
              </LoopButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Shared header frame: number + status row, editable title, meta row, and
 * the overflow menu. Tools supply the chips, meta inputs, and menu items.
 */
export function ToolHeader({
  number,
  chips,
  title,
  meta,
  menu,
  savedAt,
  saving,
}: {
  number: string;
  chips: ReactNode;
  title: ReactNode;
  meta: ReactNode;
  menu: ReactNode;
  savedAt: string | null;
  saving: boolean;
}) {
  return (
    <header className="loop-chrome border-b border-line bg-cream">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-3 md:px-6">
        <span className="font-mono text-[12px] tracking-[0.08em] text-copper">{number}</span>
        {chips}
        <span className="ml-auto hidden md:inline">
          <SavedIndicator savedAt={savedAt} saving={saving} />
        </span>
      </div>
      <div className="flex items-start gap-2 px-3 pb-3 md:px-5">
        <div className="min-w-0 flex-1">
          {title}
          <div className="loop-secondary mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[12.5px] text-stone">
            {meta}
            <span className="md:hidden">
              <SavedIndicator savedAt={savedAt} saving={saving} />
            </span>
          </div>
        </div>
        {menu}
      </div>
    </header>
  );
}
