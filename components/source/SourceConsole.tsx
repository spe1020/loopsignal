"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SampleDataCaption } from "@/components/SampleDataCaption";
import {
  ActionPanels,
  ComparisonTable,
  CostBreakdown,
  DualSourcePanel,
  FlagList,
  NormalizationNote,
  Recommendation,
  RequirementPanel,
  SupplierCards,
  SupplierDetail,
  TradeoffPanel,
} from "@/components/source/SourcePanels";
import {
  defaultSecondaryId,
  defaultSettings,
  demandPresets,
  modeLabels,
  optimizationModes,
  runSampleComparison,
} from "@/lib/source";
import type {
  OptimizationMode,
  ScenarioSettings,
  SourceMode,
} from "@/lib/source/types";

const consoleBtn =
  "inline-flex min-h-9 items-center justify-center border border-[#c8c8c0] bg-white px-3 py-1.5 text-[12px] font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";
const consoleBtnSolid =
  "inline-flex min-h-9 items-center justify-center border border-ink bg-ink px-3 py-1.5 text-[12px] font-medium text-white hover:bg-graphite";

type SourceConsoleProps = {
  onSampleRun: () => void;
  onSupplierSelect: (rank: number) => void;
  onPriorityChange: (priority: OptimizationMode) => void;
  onVolumeChange: (demand: number) => void;
  onDualSourceToggle: (mode: SourceMode) => void;
};

export function SourceConsole({
  onSampleRun,
  onSupplierSelect,
  onPriorityChange,
  onVolumeChange,
  onDualSourceToggle,
}: SourceConsoleProps) {
  const [settings, setSettings] = useState<ScenarioSettings>(defaultSettings);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [settingsOpen, setSettingsOpen] = useState(true);
  const compareRef = useRef<HTMLDivElement>(null);

  const result = useMemo(
    () =>
      runSampleComparison({
        ...settings,
        secondaryId:
          settings.sourceMode === "dual"
            ? (settings.secondaryId ?? undefined)
            : undefined,
      }),
    [settings],
  );

  const selected =
    result.ranked.find((item) => item.quote.id === selectedId) ?? result.recommended;

  function reset() {
    setSettings(defaultSettings);
    setSelectedId(undefined);
    setSettingsOpen(true);
  }

  function runSample() {
    reset();
    onSampleRun();
  }

  useEffect(() => {
    function onSampleEvent() {
      setSettings(defaultSettings);
      setSelectedId(undefined);
      setSettingsOpen(true);
      onSampleRun();
    }
    window.addEventListener("loopsource:sample-rfq", onSampleEvent);
    return () => window.removeEventListener("loopsource:sample-rfq", onSampleEvent);
  }, [onSampleRun]);

  function selectSupplier(id: string) {
    setSelectedId(id);
    const rank = result.ranked.find((item) => item.quote.id === id)?.rank;
    if (rank) onSupplierSelect(rank);
  }

  function setDemand(demand: number) {
    setSettings((current) => ({ ...current, demand }));
    onVolumeChange(demand);
  }

  function setPriority(priority: OptimizationMode) {
    setSettings((current) => ({ ...current, priority }));
    onPriorityChange(priority);
  }

  function setSourceMode(sourceMode: SourceMode) {
    setSettings((current) => ({
      ...current,
      sourceMode,
      secondaryId:
        sourceMode === "dual"
          ? (current.secondaryId ?? defaultSecondaryId(result.ranked))
          : current.secondaryId,
    }));
    onDualSourceToggle(sourceMode);
  }

  return (
    <div className="border border-[#c8c8c0] bg-console-surface">
      <header className="sticky top-[72px] z-20 flex flex-col gap-3 border-b border-[#c8c8c0] bg-console-surface/95 px-4 py-3 backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-5">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <p className="text-[15px] font-medium tracking-tight text-ink">
              LoopSource
            </p>
            <p className="text-[12px] text-graphite">Sourcing Decision Console</p>
          </div>
          <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-stone">
            DEMO
          </p>
          <SampleDataCaption className="mt-1" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={reset} className={consoleBtn}>
            Reset Demo
          </button>
          <button type="button" onClick={runSample} className={consoleBtnSolid}>
            Reset to sample RFQ
          </button>
          <button
            type="button"
            onClick={() =>
              compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className={consoleBtn}
          >
            Compare Suppliers
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            className={consoleBtn}
            aria-expanded={settingsOpen}
          >
            Scenario Settings
          </button>
        </div>
      </header>

      <p className="border-b border-[#d9d9d2] bg-[#fafaf7] px-4 py-2 text-[12px] leading-5 text-graphite md:px-5">
        <span className="font-medium text-ink">Public demo. </span>
        Fictional sample quotes only. Do not upload confidential supplier
        pricing. Future versions can accept CSV, Excel, or PDF quotes; this
        version uses a prebuilt RFQ.
      </p>

      {settingsOpen ? (
        <div className="hidden lg:block">
          <ScenarioControls
            settings={settings}
            onDemand={setDemand}
            onPriority={setPriority}
            onSourceMode={setSourceMode}
          />
        </div>
      ) : null}

      <div className="space-y-4 px-4 py-4 md:px-5 md:py-5">
        <Recommendation
          result={result}
          selected={selected}
          onSelectRecommended={() => selectSupplier(result.recommended.quote.id)}
        />

        <div className="lg:hidden">
          <ScenarioControls
            settings={settings}
            onDemand={setDemand}
            onPriority={setPriority}
            onSourceMode={setSourceMode}
            className="border border-[#d9d9d2] bg-white px-4 py-3"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <div ref={compareRef}>
              <SupplierCards
                result={result}
                selectedId={selected.quote.id}
                onSelect={selectSupplier}
              />
            </div>
            <ComparisonTable
              result={result}
              selectedId={selected.quote.id}
              onSelect={selectSupplier}
            />
            <SupplierDetail selected={selected} result={result} />
            <CostBreakdown selected={selected} />
            <TradeoffPanel selected={selected} result={result} />
            <ActionPanels selected={selected} result={result} />
            {result.settings.sourceMode === "dual" ? (
              <DualSourcePanel
                result={result}
                onSplit={(dualSplit) =>
                  setSettings((current) => ({ ...current, dualSplit }))
                }
                onSecondary={(secondaryId) =>
                  setSettings((current) => ({ ...current, secondaryId }))
                }
              />
            ) : null}
          </div>
          <aside className="space-y-4 xl:col-span-4">
            <RequirementPanel result={result} selected={selected} />
            <FlagList selected={selected} />
          </aside>
        </div>

        <NormalizationNote result={result} />
      </div>
    </div>
  );
}

function ScenarioControls({
  settings,
  onDemand,
  onPriority,
  onSourceMode,
  className = "border-b border-[#d9d9d2] bg-white px-4 py-3 md:px-5",
}: {
  settings: ScenarioSettings;
  onDemand: (demand: number) => void;
  onPriority: (priority: OptimizationMode) => void;
  onSourceMode: (mode: SourceMode) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="grid gap-4 lg:grid-cols-3">
        <fieldset>
          <legend className="text-[10px] font-medium tracking-[0.16em] text-stone uppercase">
            Annual Demand
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {demandPresets.map((demand) => (
              <button
                key={demand}
                type="button"
                onClick={() => onDemand(demand)}
                className={`${consoleBtn} ${settings.demand === demand ? "border-ink" : ""}`}
              >
                {demand.toLocaleString("en-US")}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-[10px] font-medium tracking-[0.16em] text-stone uppercase">
            Optimize for
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {optimizationModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onPriority(mode)}
                className={`${consoleBtn} ${settings.priority === mode ? "border-ink" : ""}`}
              >
                {modeLabels[mode]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-[10px] font-medium tracking-[0.16em] text-stone uppercase">
            Sourcing strategy
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSourceMode("single")}
              className={`${consoleBtn} ${settings.sourceMode === "single" ? "border-ink" : ""}`}
            >
              Single Source
            </button>
            <button
              type="button"
              onClick={() => onSourceMode("dual")}
              className={`${consoleBtn} ${settings.sourceMode === "dual" ? "border-ink" : ""}`}
            >
              Dual Source
            </button>
          </div>
        </fieldset>
      </div>
      <p className="mt-3 text-[11px] text-stone">
        Changing volume or priority can change the recommended supplier.
      </p>
    </div>
  );
}
