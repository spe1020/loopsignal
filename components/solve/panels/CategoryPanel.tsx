"use client";

import { useEffect, useRef, useState } from "react";
import { stamp, SUGGESTED_CATEGORIES } from "@/lib/solve/reducer";
import type { FishboneCategory } from "@/lib/solve/schema";
import { ContextPanel, usePanel } from "../ContextPanel";
import { useInvestigation } from "../InvestigationProvider";
import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from "../icons";
import { useToast } from "../Toast";
import { Field, SolveButton, TextInput } from "../ui";

export function CategoryPanel({ categoryId }: { categoryId: string | null }) {
  const { investigation: inv, dispatch, restore } = useInvestigation();
  const { open, close } = usePanel();
  const toast = useToast();
  const [name, setName] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const cat = categoryId ? inv.fishboneCategories.find((c) => c.id === categoryId) : null;
  const sorted = [...inv.fishboneCategories].sort((a, b) => a.order - b.order);
  const idx = cat ? sorted.findIndex((c) => c.id === cat.id) : -1;
  const existing = new Set(inv.fishboneCategories.map((c) => c.name.toLowerCase()));
  const suggestions = SUGGESTED_CATEGORIES.filter((s) => !existing.has(s.toLowerCase()));

  useEffect(() => {
    ref.current?.focus();
  }, [categoryId]);

  function add(n: string) {
    const category: FishboneCategory = { ...stamp(), name: n.trim(), order: inv.fishboneCategories.length, isDefault: false };
    dispatch({ type: "add_category", category });
    setName("");
    open({ kind: "category", categoryId: category.id });
  }

  function remove() {
    if (!cat) return;
    const snapshot = inv;
    const count = inv.causes.filter((c) => c.categoryId === cat.id).length;
    dispatch({ type: "remove_category", id: cat.id });
    close();
    toast.show(`Removed category "${cat.name}".${count ? ` ${count} cause${count > 1 ? "s" : ""} kept without a category.` : ""}`, { undo: () => restore(snapshot) });
  }

  return (
    <ContextPanel title={cat ? "Fishbone category" : "Add category"} fullScreen={inv.shopFloorMode}>
      <div className="flex flex-col gap-4">
        {cat ? (
          <>
            <Field label="Name" htmlFor="cat-name">
              <TextInput ref={ref} id="cat-name" value={cat.name} onChange={(e) => dispatch({ type: "update_category", id: cat.id, patch: { name: e.target.value } })} onKeyDown={(e) => { if (e.key === "Enter") close(); }} />
            </Field>
            <div className="flex flex-wrap gap-1.5">
              <SolveButton size="sm" disabled={idx <= 0} onClick={() => dispatch({ type: "reorder_category", id: cat.id, direction: -1 })} icon={<IconArrowUp size={13} />}>Move up</SolveButton>
              <SolveButton size="sm" disabled={idx >= sorted.length - 1} onClick={() => dispatch({ type: "reorder_category", id: cat.id, direction: 1 })} icon={<IconArrowDown size={13} />}>Move down</SolveButton>
              <SolveButton size="sm" variant="danger" className="ml-auto" onClick={remove} icon={<IconTrash size={13} />}>Remove</SolveButton>
            </div>
            <p className="text-[12.5px] leading-5 text-stone">Ribs alternate above and below the spine in this order. Categories with causes grow to fit.</p>
          </>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) add(name);
          }}
        >
          <Field label={cat ? "Add another category" : "Category name"} htmlFor="cat-new">
            <div className="flex gap-2">
              <TextInput ref={cat ? undefined : ref} id="cat-new" value={name} onChange={(e) => setName(e.target.value)} placeholder="Management, Software, Supplier…" />
              <SolveButton type="submit" variant="dark" disabled={!name.trim()} icon={<IconPlus size={14} />}>Add</SolveButton>
            </div>
          </Field>
        </form>
        {suggestions.length ? (
          <div>
            <p className="text-[12.5px] text-stone">Suggestions</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => add(s)} className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-ink/20 px-3 text-[13px] text-ink hover:border-ink hover:bg-ink hover:text-cream focus-visible:outline-2 focus-visible:outline-copper">
                  <IconPlus size={12} /> {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <ol className="border-t border-line pt-3 text-[13px] text-graphite">
          {sorted.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 py-1">
              <span className="w-5 font-mono text-[11px] text-stone">{i + 1}</span>
              <button type="button" onClick={() => open({ kind: "category", categoryId: c.id })} className={`rounded-[2px] hover:underline focus-visible:outline-2 focus-visible:outline-copper ${c.id === cat?.id ? "font-medium text-ink" : ""}`}>{c.name}</button>
              <span className="ml-auto text-[11.5px] text-stone">{inv.causes.filter((x) => x.categoryId === c.id).length}</span>
            </li>
          ))}
        </ol>
      </div>
    </ContextPanel>
  );
}
