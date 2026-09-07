"use client";

import Link from "next/link";
import { useStorageFeedback } from "@/components/loop/StorageFeedback";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackSolve } from "@/lib/solve/analytics";
import { parseImport } from "@/lib/solve/io";
import { createInvestigation } from "@/lib/solve/reducer";
import { buildSample } from "@/lib/solve/sample";
import { nextRcaNumber, saveInvestigation } from "@/lib/solve/storage";
import { IconPlus, IconUpload, LoopGlyph } from "@/components/loop/icons";
import { RecentList } from "@/components/loop/RecentList";
import { downloadText } from "@/lib/loop/download";
import { deleteRecent, duplicateRecent, exportRecent, listRecent, restoreRecent, type RecentItem } from "@/lib/loop/recent";
import { useToast } from "@/components/loop/Toast";
import { SolveButton } from "@/components/loop/ui";

export function SolveHome() {
  const { run, feedback } = useStorageFeedback();
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<RecentItem[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setItems(await listRecent());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void run(async () => {
      const list = await listRecent();
      if (!cancelled) setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, [run]);

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

  async function onDuplicate(item: RecentItem) {
    const copy = await duplicateRecent(item);
    toast.show(`Duplicated as ${copy.number}.`);
    await refresh();
  }

  function onExport(item: RecentItem) {
    const { filename, text } = exportRecent(item);
    downloadText(filename, text);
    if (item.tool === "solve") trackSolve("loopsolve_export");
  }

  async function onDelete(item: RecentItem) {
    await deleteRecent(item);
    await refresh();
    toast.show(`Deleted ${item.number}.`, {
      ttl: 8000,
      undo: async () => {
        await restoreRecent(item);
        await refresh();
      },
    });
  }

  return (
    <div className="loop-root">
      {feedback}
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
              <SolveButton variant="primary" size="lg" onClick={() => void run(onNew)} icon={<IconPlus size={16} />}>
                New Investigation
              </SolveButton>
              <SolveButton size="lg" onClick={() => void run(onSample)}>
                Explore Sample Investigation
              </SolveButton>
            </div>
            <p className="mt-6 flex items-start gap-2 text-[13px] leading-5 text-stone">
              <LoopGlyph className="mt-0.5 h-3.5 w-7" />
              Individual browser-local tool. Investigation content is not uploaded. Export important investigations for backup.
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
            <h2 className="text-[22px] font-medium tracking-[-0.02em] text-ink">Recent</h2>
            <p className="mt-1 text-[14px] text-graphite">Every investigation and process map in this browser, newest first.</p>
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
                if (f) void run(() => onImportFile(f));
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
              No investigations yet. Start with a real problem, or open the sample to explore an investigation still needing verification.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <SolveButton variant="primary" onClick={() => void run(onNew)} icon={<IconPlus size={16} />}>
                New Investigation
              </SolveButton>
              <SolveButton onClick={() => void run(onSample)}>Explore Sample Investigation</SolveButton>
            </div>
          </div>
        ) : (
          <RecentList items={items} onDuplicate={(item) => run(() => onDuplicate(item))} onExport={onExport} onDelete={(item) => run(() => onDelete(item))} />
        )}
      </section>

      <section className="border-t border-line bg-cream">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-8 lg:px-8">
          <p className="text-[14px] text-graphite">Have a recurring or cross-functional problem?</p>
          <Link
            href="/loopscan#intake"
            className="inline-flex min-h-[44px] items-center rounded-[3px] border border-ink/25 px-4 text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream focus-visible:outline-2 focus-visible:outline-copper"
          >
            Start with LoopScan
          </Link>
        </div>
      </section>
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
