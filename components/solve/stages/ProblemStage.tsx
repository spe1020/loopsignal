"use client";

import { useState } from "react";
import type { ProblemStatement } from "@/lib/solve/schema";
import { problemChecks } from "@/lib/solve/text";
import { fromLocalInput, toLocalInput } from "@/lib/solve/format";
import { useInvestigation } from "../InvestigationProvider";
import { IconCheck, IconChevronDown, IconChevronRight, IconCircle } from "@/components/loop/icons";
import { Card, Checkbox, Field, SectionTitle, TextArea, TextInput } from "@/components/loop/ui";

const guided: { key: keyof ProblemStatement; label: string; helper: string; rows?: number }[] = [
  { key: "whatHappened", label: "What happened?", helper: "The actual condition, as observed. Numbers beat adjectives.", rows: 3 },
  { key: "whatShouldHaveHappened", label: "What should have happened?", helper: "The requirement, standard, or expected result.", rows: 2 },
  { key: "where", label: "Where?", helper: "Site, line, cell, station, or machine." },
  { key: "when", label: "When?", helper: "Date, shift, or window. Add an exact time below if you have one." },
  { key: "frequency", label: "How often?", helper: "First time, recurring, every shift, one lot…" },
  { key: "impact", label: "What is the impact?", helper: "Quantity, cost, delay, risk — in plain terms." },
  { key: "affected", label: "Who or what is affected?", helper: "Customer, order, downstream process, product." },
];

export function ProblemStage() {
  const { investigation: inv, dispatch } = useInvestigation();
  const p = inv.problem;
  const [more, setMore] = useState(
    Boolean(p.process || p.department || p.equipment || p.product || p.financialImpactNote || Object.values(p.impactFlags).some(Boolean)),
  );
  const set = (patch: Partial<ProblemStatement>) => dispatch({ type: "set_problem", patch });
  const checks = problemChecks(p);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <SectionTitle eyebrow="Define" title="Describe the problem as a condition, not a conclusion.">
          Separate what was observed from what you think caused it. The cause comes later.
        </SectionTitle>

        <div className="mt-6 flex flex-col gap-5">
          {guided.map((f) => (
            <Field key={f.key} label={f.label} helper={f.helper} htmlFor={`problem-${f.key}`}>
              {f.rows ? (
                <TextArea id={`problem-${f.key}`} rows={f.rows} value={(p[f.key] as string) ?? ""} onChange={(e) => set({ [f.key]: e.target.value })} />
              ) : (
                <TextInput id={`problem-${f.key}`} value={(p[f.key] as string) ?? ""} onChange={(e) => set({ [f.key]: e.target.value })} />
              )}
              {f.key === "when" ? (
                <input
                  type="datetime-local"
                  aria-label="Exact time (optional)"
                  value={toLocalInput(p.whenIso)}
                  onChange={(e) => set({ whenIso: fromLocalInput(e.target.value) })}
                  className="loop-secondary mt-1 min-h-[40px] w-full max-w-xs rounded-[3px] border border-line bg-cream px-3 text-[13px] text-graphite focus:border-copper focus:outline-none"
                />
              ) : null}
            </Field>
          ))}

          <div className="rounded-[3px] border border-line bg-cream">
            <button
              type="button"
              aria-expanded={more}
              onClick={() => setMore((m) => !m)}
              className="flex w-full min-h-(--loop-control) items-center gap-2 px-4 text-left text-[14px] font-medium text-ink focus-visible:outline-2 focus-visible:outline-copper"
            >
              {more ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
              More detail
              <span className="loop-secondary ml-2 font-normal text-stone">process, equipment, impact flags</span>
            </button>
            {more ? (
              <div className="grid gap-4 border-t border-line px-4 py-4 sm:grid-cols-2">
                <Field label="Process" htmlFor="problem-process"><TextInput id="problem-process" value={p.process ?? ""} onChange={(e) => set({ process: e.target.value })} /></Field>
                <Field label="Department" htmlFor="problem-department"><TextInput id="problem-department" value={p.department ?? ""} onChange={(e) => set({ department: e.target.value })} /></Field>
                <Field label="Equipment" htmlFor="problem-equipment"><TextInput id="problem-equipment" value={p.equipment ?? ""} onChange={(e) => set({ equipment: e.target.value })} /></Field>
                <Field label="Product or service" htmlFor="problem-product"><TextInput id="problem-product" value={p.product ?? ""} onChange={(e) => set({ product: e.target.value })} /></Field>
                <fieldset className="sm:col-span-2">
                  <legend className="text-[13px] font-medium text-ink">Impact flags</legend>
                  <div className="mt-1 flex flex-wrap gap-x-6">
                    {(["customer", "financial", "safety", "quality", "delivery"] as const).map((k) => (
                      <Checkbox key={k} label={k[0].toUpperCase() + k.slice(1)} checked={p.impactFlags[k]} onChange={(e) => set({ impactFlags: { ...p.impactFlags, [k]: e.target.checked } })} />
                    ))}
                  </div>
                </fieldset>
                <Field label="Financial note" htmlFor="problem-fin" className="sm:col-span-2" helper="Scrap, rework, expedite, downtime — an estimate is fine.">
                  <TextInput id="problem-fin" value={p.financialImpactNote ?? ""} onChange={(e) => set({ financialImpactNote: e.target.value })} />
                </Field>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-5 xl:sticky xl:top-[104px] xl:self-start">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-copper">Generated problem statement</p>
          <p className="mt-2 min-h-[64px] text-[14.5px] leading-6 text-ink" aria-live="polite">
            {p.generatedStatement || <span className="text-stone">Fill in the fields and the statement builds itself here.</span>}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-graphite">Quality check</p>
          <ul className="mt-2 flex flex-col gap-2">
            {checks.map((c) => (
              <li key={c.key} className="flex items-start gap-2.5">
                <span className={`mt-0.5 shrink-0 ${c.ok ? "text-risk-track" : "text-stone"}`} aria-hidden>
                  {c.ok ? <IconCheck size={15} /> : <IconCircle size={15} />}
                </span>
                <span>
                  <span className={`block text-[13.5px] ${c.ok ? "text-ink" : "text-graphite"}`}>
                    {c.label}
                    <span className="sr-only">{c.ok ? " — covered" : " — not yet"}</span>
                  </span>
                  {!c.ok ? <span className="loop-secondary block text-[12px] leading-5 text-stone">{c.hint}</span> : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="loop-secondary mt-3 text-[12px] leading-5 text-stone">Guidance only. Nothing here blocks you.</p>
        </Card>
      </aside>
    </div>
  );
}
