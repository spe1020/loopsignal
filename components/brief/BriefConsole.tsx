"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionBoard,
  BriefSummary,
  Differentiator,
  EmptyState,
  ExecutiveStrip,
  IssueDetail,
  MeetingStepper,
  MaintenancePanel,
  OwnerFilter,
  PlantStatusCard,
  Priorities,
  ProductionPanel,
  QualityPanel,
  SchedulePanel,
  SupplyPanel,
  WhatChanged,
  consoleBtn,
} from "@/components/brief/BriefPanels";
import {
  buildExportText,
  filterActions,
  runSampleBrief,
} from "@/lib/brief";
import type {
  ActionStatus,
  BriefAction,
  BriefResult,
  Category,
  MeetingStep,
  Owner,
} from "@/lib/brief/types";

const consoleBtnSolid =
  "inline-flex min-h-9 items-center justify-center border border-ink bg-ink px-3 py-1.5 text-[12px] font-medium text-white hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-60";

type BriefConsoleProps = {
  onRun: () => void;
  onCategoryFilter: (category: string) => void;
  onOwnerFilter: (owner: string) => void;
  onIssueSelect: (input: { category: string; severity: string }) => void;
  onMeetingMode: (on: boolean) => void;
  onActionStatusChange: (input: { timing: string; owner: string }) => void;
  onCopy: () => void;
};

export function BriefConsole({
  onRun,
  onCategoryFilter,
  onOwnerFilter,
  onIssueSelect,
  onMeetingMode,
  onActionStatusChange,
  onCopy,
}: BriefConsoleProps) {
  const [brief, setBrief] = useState<BriefResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [category, setCategory] = useState<Category | "all">("all");
  const [owner, setOwner] = useState<Owner | "all">("all");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [meetingMode, setMeetingMode] = useState(false);
  const [meetingStep, setMeetingStep] = useState<MeetingStep>("production");
  const [actionStatuses, setActionStatuses] = useState<Record<string, ActionStatus>>(
    {},
  );
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const signalsRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(() => {
    window.clearTimeout(timer.current);
    setGenerating(true);
    timer.current = window.setTimeout(() => {
      const next = runSampleBrief();
      setBrief(next);
      setGenerating(false);
      setCategory("all");
      setOwner("all");
      setMeetingMode(false);
      setMeetingStep("production");
      setActionStatuses({});
      setSelectedId(next.priorities[0]?.issue.id);
      onRun();
    }, 420);
  }, [onRun]);

  function reset() {
    window.clearTimeout(timer.current);
    setBrief(null);
    setGenerating(false);
    setCategory("all");
    setOwner("all");
    setSelectedId(undefined);
    setMeetingMode(false);
    setMeetingStep("production");
    setActionStatuses({});
    setCopied(false);
  }

  useEffect(() => {
    function onRunEvent() {
      generate();
    }
    window.addEventListener("loopbrief:run", onRunEvent);
    window.addEventListener("loopbrief:sample", onRunEvent);
    return () => {
      window.removeEventListener("loopbrief:run", onRunEvent);
      window.removeEventListener("loopbrief:sample", onRunEvent);
    };
  }, [generate]);

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  const selected = brief?.issues.find((issue) => issue.id === selectedId);
  const filteredPriorities = useMemo(() => {
    if (!brief) return [];
    return brief.priorities.filter((item) => {
      if (category !== "all" && item.issue.category !== category) return false;
      if (owner !== "all" && item.issue.owner !== owner) return false;
      return true;
    });
  }, [brief, category, owner]);

  const ownerPanels = ownerPanelCategories(owner);

  const visibleActions = useMemo(() => {
    if (!brief) return [];
    return filterActions(brief.actions, category, owner);
  }, [brief, category, owner]);

  function selectIssue(id: string) {
    setSelectedId(id);
    const issue = brief?.issues.find((item) => item.id === id);
    const production = brief?.production.find((row) => row.record.id === id);
    if (issue) {
      onIssueSelect({ category: issue.category, severity: issue.severity });
      return;
    }
    if (production) {
      onIssueSelect({
        category: "production",
        severity: production.severity,
      });
    }
  }

  function changeCategory(next: Category | "all") {
    setCategory(next);
    onCategoryFilter(next);
  }

  function changeOwner(next: Owner | "all") {
    setOwner(next);
    onOwnerFilter(next);
  }

  function toggleMeeting(next: boolean) {
    setMeetingMode(next);
    setMeetingStep("production");
    onMeetingMode(next);
  }

  function changeActionStatus(
    id: string,
    status: ActionStatus,
    action: BriefAction,
  ) {
    setActionStatuses((current) => ({ ...current, [id]: status }));
    onActionStatusChange({ timing: action.timing, owner: action.owner });
  }

  async function copyBrief() {
    if (!brief) return;
    const text = buildExportText(brief, actionStatuses);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function allows(panel: Category) {
    const categoryOk = category === "all" || category === panel;
    const ownerOk = ownerPanels === "all" || ownerPanels.includes(panel);
    return categoryOk && ownerOk;
  }

  const showProduction = meetingMode
    ? meetingStep === "production"
    : allows("production");
  const showQuality = meetingMode ? meetingStep === "quality" : allows("quality");
  const showSupply = meetingMode ? meetingStep === "supply" : allows("supply");
  const showMaintenance = meetingMode
    ? meetingStep === "maintenance"
    : allows("maintenance");
  const showSchedule = meetingMode
    ? meetingStep === "schedule"
    : allows("schedule");
  const showActions = !meetingMode || meetingStep === "actions";

  return (
    <div className="border border-[#c8c8c0] bg-console-surface">
      <header className="sticky top-[72px] z-20 flex flex-col gap-3 border-b border-[#c8c8c0] bg-console-surface/95 px-4 py-3 backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-5">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <p className="text-[15px] font-medium tracking-tight text-ink">
              LoopBrief
            </p>
            <p className="text-[12px] text-graphite">Daily Operations Console</p>
          </div>
          <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-stone">
            DEMO · FICTIONAL SAMPLE DATA
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className={consoleBtnSolid}
          >
            {generating ? "Assembling…" : "Run Brief"}
          </button>
          <button type="button" onClick={reset} className={consoleBtn}>
            Reset Demo
          </button>
          <button type="button" onClick={generate} className={consoleBtn}>
            Sample Data
          </button>
          <button
            type="button"
            onClick={() => {
              setCategory("all");
              setOwner("all");
              onCategoryFilter("all");
              onOwnerFilter("all");
              signalsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            className={consoleBtn}
            disabled={!brief}
          >
            View All Signals
          </button>
          <button
            type="button"
            onClick={() => toggleMeeting(!meetingMode)}
            className={`${consoleBtn} ${meetingMode ? "border-ink" : ""}`}
            disabled={!brief}
            aria-pressed={meetingMode}
          >
            Meeting Mode
          </button>
          <button
            type="button"
            onClick={() => void copyBrief()}
            className={consoleBtn}
            disabled={!brief}
          >
            {copied ? "Copied" : "Copy Brief"}
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-[#d9d9d2] bg-[#fafaf7] px-4 py-2 text-[12px] text-graphite md:px-5">
        <p>
          <span className="font-medium text-ink">Plant:</span> Northfield
          Manufacturing
        </p>
        <p>
          <span className="font-medium text-ink">Shift:</span> Day
        </p>
        <p>
          <span className="font-medium text-ink">Brief Date:</span>{" "}
          {brief?.briefDateLabel ?? "Run the brief to set the demo date"}
        </p>
      </div>

      <p className="border-b border-[#d9d9d2] bg-[#fafaf7] px-4 py-2 text-[12px] leading-5 text-graphite md:px-5">
        <span className="font-medium text-ink">Public demo. </span>
        Fictional sample manufacturing data only. This version does not accept
        production, quality, or ERP files.
      </p>

      <div className="space-y-4 px-4 py-4 md:px-5 md:py-5">
        {!brief && !generating ? <EmptyState onRun={generate} /> : null}

        {generating ? (
          <div className="border border-[#d9d9d2] bg-white px-5 py-10 text-center">
            <p className="text-[13px] text-graphite">
              Assembling today&apos;s exceptions, owners, and actions…
            </p>
          </div>
        ) : null}

        {brief && !generating ? (
          <>
            <PlantStatusCard brief={brief} />
            <ExecutiveStrip
              brief={brief}
              active={category}
              onSelect={changeCategory}
            />
            <BriefSummary brief={brief} />

            {meetingMode ? (
              <MeetingStepper step={meetingStep} onStep={setMeetingStep} />
            ) : (
              <>
                <Priorities
                  brief={{ ...brief, priorities: filteredPriorities }}
                  selectedId={selectedId}
                  onSelect={selectIssue}
                />
                <WhatChanged brief={brief} />
                <OwnerFilter value={owner} onChange={changeOwner} />
              </>
            )}

            {selected && !meetingMode ? <IssueDetail issue={selected} /> : null}

            <div ref={signalsRef} className="space-y-4">
              {showProduction ? (
                <ProductionPanel
                  brief={brief}
                  selectedId={selectedId}
                  onSelect={selectIssue}
                />
              ) : null}
              {showQuality ? (
                <QualityPanel
                  brief={brief}
                  selectedId={selectedId}
                  onSelect={selectIssue}
                />
              ) : null}
              {showSupply ? (
                <SupplyPanel
                  brief={brief}
                  selectedId={selectedId}
                  onSelect={selectIssue}
                />
              ) : null}
              {showMaintenance ? (
                <MaintenancePanel
                  brief={brief}
                  selectedId={selectedId}
                  onSelect={selectIssue}
                />
              ) : null}
              {showSchedule ? <SchedulePanel brief={brief} /> : null}
              {showActions ? (
                <ActionBoard
                  actions={visibleActions}
                  statuses={actionStatuses}
                  onStatus={changeActionStatus}
                />
              ) : null}
            </div>

            {!meetingMode ? <Differentiator /> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function ownerPanelCategories(owner: Owner | "all"): Category[] | "all" {
  if (owner === "all") return "all";
  if (owner === "Operations") return ["production"];
  if (owner === "Quality" || owner === "Engineering") return ["quality"];
  if (owner === "Buyer" || owner === "Supply Chain") return ["supply"];
  if (owner === "Maintenance") return ["maintenance"];
  if (owner === "Planning") return ["schedule"];
  return "all";
}
