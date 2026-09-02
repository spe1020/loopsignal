"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackSolve } from "@/lib/solve/analytics";
import { completionPercent } from "@/lib/solve/completion";
import { formatDate } from "@/lib/solve/format";
import { duplicateInvestigation, exportFilename, parseImport, serialize } from "@/lib/solve/io";
import { createInvestigation } from "@/lib/solve/reducer";
import { buildSample } from "@/lib/solve/sample";
import type { Investigation } from "@/lib/solve/schema";
import { deleteInvestigation, listInvestigations, nextRcaNumber, saveInvestigation } from "@/lib/solve/storage";
import { IconDownload, IconPlus, IconUpload, LoopGlyph } from "@/components/loop/icons";
import { downloadText } from "@/lib/loop/download";
import { StatusBadge } from "./ProjectHeader";
import { useToast } from "@/components/loop/Toast";
import { IconButton, SolveButton, Card } from "@/components/loop/ui";
import { IconCopy, IconTrash } from "@/components/loop/icons";
import { useMediaQuery } from "@/components/loop/useMediaQuery";

export function SolveHome() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Investigation[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const wide = useMediaQuery("(min-width: 768px)", true);

  const refresh = useCallback(async () => {
    setItems(await listInvestigations());
  }, []);

  useEffect(() => {
    let cancelled = false;
    listInvestigations().then((list) => {
      if (!cancelled) setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onNew() {
    const inv = createInvestigation({ rcaNumber: nextRcaNumber() });
    await saveInvestigation(inv);
    trackSolve("loopsolve_new");
    router.push(`/solve/${inv.id}/problem`);
  }

  async function onSample() {
    const inv = buildSample(nextRcaNumber());
    await saveInvestigation(inv);
    trackSolve("loopsolve_sample_open");
    router.push(`/solve/${inv.id}/problem`);
  }

  async function onImportFile(file: File) {
    const text = await file.text();
    const result = parseImport(text, nextRcaNumber());
    if (!result.ok) {
      toast.show(result.error, { tone: "red", ttl: 8000 });
      return;
    }
    await saveInvestigation(result.investigation);
    trackSolve("loopsolve_import", { causes: result.investigation.causes.length });
    toast.show(`Imported as ${result.investigation.rcaNumber}.`, { tone: "green" });
    await refresh();
  }

  async function onDuplicate(inv: Investigation) {
    const copy = duplicateInvestigation(inv, nextRcaNumber());
    await saveInvestigation(copy);
    toast.show(`Duplicated as ${copy.rcaNumber}.`);
    await refresh();
  }

  function onExport(inv: Investigation) {
    downloadText(exportFilename(inv), serialize(inv));
    trackSolve("loopsolve_export", { causes: inv.causes.length });
  }

  async function onDelete(inv: Investigation) {
    await deleteInvestigation(inv.id);
    await refresh();
    toast.show(`Deleted ${inv.rcaNumber}.`, {
      ttl: 8000,
      undo: async () => {
        await saveInvestigation(inv);
        await refresh();
      },
    });
  }

  return (
    <div className="loop-root">
      <section className="border-b border-line bg-cream">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-6 py-14 md:grid-cols-12 md:py-20 lg:px-8">
          <div className="md:col-span-7">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-copper">LoopSolve</p>
            <h1 className="mt-4 text-[34px] font-medium leading-[1.05] tracking-[-0.035em] text-ink md:text-[52px]">
              Define the problem. Find the cause. Close the loop.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-7 text-graphite">
              Structured problem solving for real work. Five Whys, Fishbone, evidence, corrective actions, and
              effectiveness verification in one workspace — so the fix is proven, not assumed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SolveButton variant="primary" size="lg" onClick={onNew} icon={<IconPlus size={16} />}>
                New Investigation
              </SolveButton>
              <SolveButton size="lg" onClick={onSample}>
                Explore Sample Investigation
              </SolveButton>
            </div>
            <p className="mt-6 flex items-start gap-2 text-[13px] leading-5 text-stone">
              <LoopGlyph className="mt-0.5 h-3.5 w-7" />
              This version stores investigations locally in this browser. Export important investigations for backup.
            </p>
          </div>
          <div className="hidden md:col-span-5 md:block">
            <LoopStages />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-6 py-12 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-medium tracking-[-0.02em] text-ink">Recent investigations</h2>
            <p className="mt-1 text-[14px] text-graphite">Sorted by last update.</p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              aria-label="Import a LoopSolve JSON file"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImportFile(f);
                e.target.value = "";
              }}
            />
            <SolveButton onClick={() => fileRef.current?.click()} icon={<IconUpload size={15} />}>
              Import JSON
            </SolveButton>
          </div>
        </div>

        {items === null ? (
          <p className="mt-8 text-[14px] text-stone" aria-busy="true">Loading…</p>
        ) : items.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-5 rounded-[3px] border border-dashed border-ink/20 bg-cream px-6 py-14 text-center">
            <LoopGlyph className="h-10 w-20" animated />
            <p className="max-w-md text-[15px] leading-7 text-graphite">
              No investigations yet. Start with a real problem, or open the sample to see a completed loop.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <SolveButton variant="primary" onClick={onNew} icon={<IconPlus size={16} />}>
                New Investigation
              </SolveButton>
              <SolveButton onClick={onSample}>Explore Sample Investigation</SolveButton>
            </div>
          </div>
        ) : (
          <>
            {wide ? (
            <div className="mt-6 overflow-x-auto rounded-[3px] border border-line bg-cream">
              <table className="w-full text-left text-[14px]">
                <thead className="border-b border-line bg-paper text-[11px] font-medium uppercase tracking-[0.14em] text-stone">
                  <tr>
                    <th className="px-4 py-3">RCA #</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3">Completion</th>
                    <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((inv) => {
                    const pct = completionPercent(inv);
                    return (
                      <tr key={inv.id} className="border-b border-line last:border-0 hover:bg-paper/70">
                        <td className="px-4 py-3 font-mono text-[12px] tracking-[0.06em] text-copper">
                          <Link href={`/solve/${inv.id}`} className="focus-visible:outline-2 focus-visible:outline-copper">{inv.rcaNumber}</Link>
                        </td>
                        <td className="max-w-[360px] px-4 py-3">
                          <Link href={`/solve/${inv.id}`} className="block truncate font-medium text-ink hover:text-copper focus-visible:outline-2 focus-visible:outline-copper">
                            {inv.title || <span className="font-normal text-stone">Untitled investigation</span>}
                          </Link>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                        <td className="px-4 py-3 text-graphite">{inv.owner || "—"}</td>
                        <td className="px-4 py-3 text-graphite whitespace-nowrap">{formatDate(inv.createdAt)}</td>
                        <td className="px-4 py-3 text-graphite whitespace-nowrap">{formatDate(inv.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <Completion pct={pct} />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end gap-0.5">
                            <Link href={`/solve/${inv.id}`} className="inline-flex min-h-[36px] items-center rounded-[3px] px-2.5 text-[13px] font-medium text-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-copper">Open</Link>
                            <IconButton label={`Duplicate ${inv.rcaNumber}`} onClick={() => onDuplicate(inv)} className="min-h-[36px] min-w-[36px]"><IconCopy size={15} /></IconButton>
                            <IconButton label={`Export ${inv.rcaNumber}`} onClick={() => onExport(inv)} className="min-h-[36px] min-w-[36px]"><IconDownload size={15} /></IconButton>
                            <IconButton label={`Delete ${inv.rcaNumber}`} onClick={() => onDelete(inv)} className="min-h-[36px] min-w-[36px] hover:text-risk-critical"><IconTrash size={15} /></IconButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {items.map((inv) => (
                <Card as="li" key={inv.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[12px] tracking-[0.06em] text-copper">{inv.rcaNumber}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <Link href={`/solve/${inv.id}`} className="mt-2 block text-[16px] font-medium leading-6 text-ink focus-visible:outline-2 focus-visible:outline-copper">
                    {inv.title || <span className="font-normal text-stone">Untitled investigation</span>}
                  </Link>
                  <p className="mt-1 text-[13px] text-stone">
                    {inv.owner ? `${inv.owner} · ` : ""}Updated {formatDate(inv.updatedAt)}
                  </p>
                  <div className="mt-3"><Completion pct={completionPercent(inv)} /></div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <SolveButton size="sm" variant="dark" onClick={() => router.push(`/solve/${inv.id}`)}>Open</SolveButton>
                    <SolveButton size="sm" onClick={() => onDuplicate(inv)}>Duplicate</SolveButton>
                    <SolveButton size="sm" onClick={() => onExport(inv)}>Export</SolveButton>
                    <SolveButton size="sm" variant="danger" onClick={() => onDelete(inv)}>Delete</SolveButton>
                  </div>
                </Card>
              ))}
            </ul>
            )}
          </>
        )}
      </section>

      <section className="border-t border-line bg-cream">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-8 lg:px-8">
          <p className="text-[14px] text-graphite">Need help with a recurring or cross-functional problem?</p>
          <Link
            href="/loopscan?intent=talk#intake"
            className="inline-flex min-h-[44px] items-center rounded-[3px] border border-ink/25 px-4 text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream focus-visible:outline-2 focus-visible:outline-copper"
          >
            Talk to LoopSignal
          </Link>
        </div>
      </section>
    </div>
  );
}

function Completion({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`${pct} percent complete`}>
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-paper-2">
        <span className="block h-full rounded-full bg-copper" style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-[12px] text-graphite">{pct}%</span>
    </div>
  );
}

function LoopStages() {
  const steps = ["Problem", "Contain", "Investigate", "Root Cause", "Actions", "Verify", "Learn"];
  return (
    <div className="loop-grid-bg relative rounded-[3px] border border-line bg-paper p-6">
      <LoopGlyph className="h-8 w-16" animated />
      <ol className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5 text-[14px] text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/25 font-mono text-[11px] text-graphite">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <p className="mt-5 text-[12.5px] leading-5 text-stone">
        If verification fails, the loop reopens. Nothing is closed until the fix is proven.
      </p>
    </div>
  );
}
