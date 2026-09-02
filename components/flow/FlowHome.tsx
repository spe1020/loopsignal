"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconPlus, IconUpload, LoopGlyph } from "@/components/loop/icons";
import { RecentList } from "@/components/loop/RecentList";
import { useToast } from "@/components/loop/Toast";
import { LoopButton } from "@/components/loop/ui";
import { trackFlow } from "@/lib/flow/analytics";
import { parseImport } from "@/lib/flow/io";
import { createMap } from "@/lib/flow/reducer";
import { buildSampleMap } from "@/lib/flow/sample";
import { nextMapNumber, saveMap } from "@/lib/flow/storage";
import { downloadText } from "@/lib/loop/download";
import { deleteRecent, duplicateRecent, exportRecent, listRecent, restoreRecent, type RecentItem } from "@/lib/loop/recent";
import { listInvestigations, saveInvestigation } from "@/lib/solve/storage";

export function FlowHome() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<RecentItem[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => setItems(await listRecent()), []);

  useEffect(() => {
    let cancelled = false;
    listRecent().then((list) => {
      if (!cancelled) setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onNew() {
    const map = createMap({ mapNumber: nextMapNumber() });
    await saveMap(map);
    trackFlow("loopflow_new");
    router.push(`/flow/${map.id}/scope`);
  }

  async function onSample() {
    const invs = await listInvestigations();
    const linked = invs.find((i) => i.title === "Machined bracket hole diameter out of tolerance");
    const map = buildSampleMap(nextMapNumber(), linked ? { linkInvestigation: { id: linked.id, status: linked.status } } : {});
    await saveMap(map);
    trackFlow("loopflow_sample_open", { linked: linked ? 1 : 0 });
    router.push(`/flow/${map.id}/map`);
  }

  async function onImportFile(file: File) {
    const result = parseImport(await file.text(), nextMapNumber());
    if (!result.ok) {
      toast.show(result.error, { tone: "red", ttl: 8000 });
      return;
    }
    await saveMap(result.map);
    const existing = new Set((await listInvestigations()).map((i) => i.id));
    let added = 0;
    for (const inv of result.investigations) {
      if (existing.has(inv.id)) continue;
      await saveInvestigation(inv);
      added += 1;
    }
    trackFlow("loopflow_import", { steps: result.map.versions.current.steps.length, investigations: added });
    toast.show(`Imported as ${result.map.mapNumber}${added ? ` with ${added} investigation${added === 1 ? "" : "s"}` : ""}.`, { tone: "green" });
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
    if (item.tool === "flow") trackFlow("loopflow_export", { kind: 0 });
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
      <section className="border-b border-line bg-cream">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-6 py-14 md:grid-cols-12 md:py-20 lg:px-8">
          <div className="md:col-span-7">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-copper">LoopFlow</p>
            <h1 className="mt-4 text-[34px] font-medium leading-[1.05] tracking-[-0.035em] text-ink md:text-[52px]">
              See the process. Find the friction. Fix it once.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-7 text-graphite">
              Process mapping for people who have to fix the process. Map what actually happens, with a time and an owner
              on every step. The map shows the waiting and the handoffs. Open a LoopSolve investigation from the pain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LoopButton variant="primary" size="lg" onClick={onNew} icon={<IconPlus size={16} />}>
                New Map
              </LoopButton>
              <LoopButton size="lg" onClick={onSample}>
                Explore Sample Map
              </LoopButton>
            </div>
            <p className="mt-6 flex items-start gap-2 text-[13px] leading-5 text-stone">
              <LoopGlyph className="mt-0.5 h-3.5 w-7" />
              This version stores maps locally in this browser. Export important maps for backup.
            </p>
          </div>
          <div className="hidden md:col-span-5 md:block">
            <FlowStages />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-6 py-12 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-medium tracking-[-0.02em] text-ink">Recent</h2>
            <p className="mt-1 text-[14px] text-graphite">Every map and investigation in this browser, newest first.</p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              aria-label="Import a LoopFlow JSON file"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImportFile(f);
                e.target.value = "";
              }}
            />
            <LoopButton onClick={() => fileRef.current?.click()} icon={<IconUpload size={15} />}>
              Import JSON
            </LoopButton>
          </div>
        </div>

        {items === null ? (
          <p className="mt-8 text-[14px] text-stone" aria-busy="true">Loading…</p>
        ) : items.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-5 rounded-[3px] border border-dashed border-ink/20 bg-cream px-6 py-14 text-center">
            <LoopGlyph className="h-10 w-20" animated />
            <p className="max-w-md text-[15px] leading-7 text-graphite">
              Nothing here yet. Start with a process that takes too long, or open the sample to see a mapped loop.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <LoopButton variant="primary" onClick={onNew} icon={<IconPlus size={16} />}>New Map</LoopButton>
              <LoopButton onClick={onSample}>Explore Sample Map</LoopButton>
            </div>
          </div>
        ) : (
          <RecentList items={items} onDuplicate={onDuplicate} onExport={onExport} onDelete={onDelete} />
        )}
      </section>

      <section className="border-t border-line bg-cream">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-8 lg:px-8">
          <p className="text-[14px] text-graphite">Need help with a process that crosses departments or systems?</p>
          <Link href="/loopscan?intent=talk#intake" className="inline-flex min-h-[44px] items-center rounded-[3px] border border-ink/25 px-4 text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream focus-visible:outline-2 focus-visible:outline-copper">
            Talk to LoopSignal
          </Link>
        </div>
      </section>
    </div>
  );
}

function FlowStages() {
  const steps = [
    ["Scope", "Boundaries and lanes"],
    ["Map", "Steps, times, waits"],
    ["Analyze", "Lead time, handoffs, pain"],
    ["Future", "Fork, change, explain"],
    ["Summary", "Print, link, report"],
  ];
  return (
    <div className="loop-grid-bg relative rounded-[3px] border border-line bg-paper p-6">
      <LoopGlyph className="h-8 w-16" animated />
      <ol className="mt-5 flex flex-col gap-2.5">
        {steps.map(([s, d], i) => (
          <li key={s} className="flex items-center gap-2.5 text-[14px] text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/25 font-mono text-[11px] text-graphite">{i + 1}</span>
            <span className="font-medium">{s}</span>
            <span className="text-stone">{d}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-[12.5px] leading-5 text-stone">
        Map reality, not the procedure. Time is the evidence. Don&apos;t redesign what you haven&apos;t measured.
      </p>
    </div>
  );
}
