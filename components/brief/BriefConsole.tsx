"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SampleDataCaption } from "@/components/SampleDataCaption";
import {
  AccountabilityView,
  ActionDrawer,
  ExpandedActionBoard,
  MyActionsView,
  PersonaPicker,
} from "@/components/brief/BriefOps";
import {
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
  ActionMessage,
  DistributionAndSchedule,
  ExecutiveEmailPreview,
  OperatingLoop,
  ReportPicker,
  ReportView,
} from "@/components/brief/BriefReports";
import {
  accountabilityCounts,
  actionsForPersona,
  botDraft,
  buildExecutiveEmail,
  buildExportText,
  buildMyActionsText,
  buildReport,
  defaultAccountabilityFilter,
  defaultBotForAction,
  filterAccountability,
  filterActions,
  makeStructuralFollowUp,
  resolveActions,
  runSampleBrief,
} from "@/lib/brief";
import type { AccountabilityFilter } from "@/lib/brief/ops";
import type {
  ActionOutcome,
  ActionStatus,
  BotType,
  BriefAction,
  BriefResult,
  Category,
  HumanRole,
  MeetingStep,
  Owner,
  Persona,
  ReportKind,
} from "@/lib/brief/types";
import { personaLabels } from "@/lib/brief/types";

const consoleBtnSolid =
  "inline-flex min-h-9 items-center justify-center border border-ink bg-ink px-3 py-1.5 text-[12px] font-medium text-white hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-60";

const sampleBrief = runSampleBrief();

type ShellView = "console" | "reports" | "my_actions" | "accountability";

type BriefConsoleProps = {
  onRun: () => void;
  onCategoryFilter: (category: string) => void;
  onOwnerFilter: (owner: string) => void;
  onIssueSelect: (input: { category: string; severity: string }) => void;
  onMeetingMode: (on: boolean) => void;
  onActionStatusChange: (input: { timing: string; owner: string }) => void;
  onCopy: () => void;
  onReportView?: (kind: string) => void;
  onReportCopy?: (kind: string) => void;
  onEmailPreview?: () => void;
  onPersonaView?: (persona: string) => void;
  onAssign?: (input: { owner_type: string; bot_type?: string }) => void;
  onBotRun?: (bot_type: string) => void;
  onActionSelect?: (category: string) => void;
  onOutcome?: (outcome: string) => void;
};

export function BriefConsole({
  onRun,
  onCategoryFilter,
  onOwnerFilter,
  onIssueSelect,
  onMeetingMode,
  onActionStatusChange,
  onCopy,
  onReportView,
  onReportCopy,
  onEmailPreview,
  onPersonaView,
  onAssign,
  onBotRun,
  onActionSelect,
  onOutcome,
}: BriefConsoleProps) {
  const [brief, setBrief] = useState<BriefResult | null>(sampleBrief);
  const [generating, setGenerating] = useState(false);
  const [category, setCategory] = useState<Category | "all">("all");
  const [owner, setOwner] = useState<Owner | "all">("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(
    sampleBrief.priorities[0]?.issue.id,
  );
  const [meetingMode, setMeetingMode] = useState(false);
  const [meetingStep, setMeetingStep] = useState<MeetingStep>("production");
  const [overrides, setOverrides] = useState<Record<string, Partial<BriefAction>>>({});
  const [followUps, setFollowUps] = useState<BriefAction[]>([]);
  const [outcomes, setOutcomes] = useState<Record<string, ActionOutcome>>({});
  const [shellView, setShellView] = useState<ShellView>("console");
  const [reportKind, setReportKind] = useState<ReportKind>("executive");
  const [persona, setPersona] = useState<Persona>("plant_manager");
  const [acctFilter, setAcctFilter] = useState<AccountabilityFilter>(
    defaultAccountabilityFilter,
  );
  const [selectedActionId, setSelectedActionId] = useState<string | undefined>();
  const [copied, setCopied] = useState<"brief" | "report" | "email" | "mine" | "">("");
  const [emailOpen, setEmailOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const botTimer = useRef<number | undefined>(undefined);
  const signalsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(() => {
    window.clearTimeout(timer.current);
    window.clearTimeout(botTimer.current);
    setGenerating(true);
    timer.current = window.setTimeout(() => {
      const next = runSampleBrief();
      setBrief(next);
      setGenerating(false);
      setCategory("all");
      setOwner("all");
      setMeetingMode(false);
      setMeetingStep("production");
      setOverrides({});
      setFollowUps([]);
      setOutcomes({});
      setShellView("console");
      setReportKind("executive");
      setSelectedActionId(undefined);
      setEmailOpen(false);
      setSelectedId(next.priorities[0]?.issue.id);
      onRun();
    }, 420);
  }, [onRun]);

  function reset() {
    window.clearTimeout(timer.current);
    window.clearTimeout(botTimer.current);
    setBrief(sampleBrief);
    setGenerating(false);
    setCategory("all");
    setOwner("all");
    setSelectedId(sampleBrief.priorities[0]?.issue.id);
    setMeetingMode(false);
    setMeetingStep("production");
    setOverrides({});
    setFollowUps([]);
    setOutcomes({});
    setShellView("console");
    setSelectedActionId(undefined);
    setCopied("");
    setEmailOpen(false);
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
    return () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(botTimer.current);
    };
  }, []);

  const liveActions = useMemo(() => {
    if (!brief) return [];
    return [...resolveActions(brief.actions, overrides), ...followUps];
  }, [brief, followUps, overrides]);

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
    return filterActions(liveActions, category, owner);
  }, [liveActions, category, owner]);

  const selectedAction = liveActions.find((action) => action.id === selectedActionId);
  const report = brief ? buildReport(reportKind, brief, liveActions) : null;
  const email = brief ? buildExecutiveEmail(brief, liveActions) : null;
  const personaActions = actionsForPersona(liveActions, persona);
  const counts = accountabilityCounts(liveActions);
  const filteredAcct = filterAccountability(liveActions, acctFilter);

  function patchAction(id: string, patch: Partial<BriefAction>) {
    setOverrides((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  }

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
    setShellView("console");
    onMeetingMode(next);
  }

  function changeActionStatus(
    id: string,
    status: ActionStatus,
    action: BriefAction,
  ) {
    patchAction(id, { status });
    onActionStatusChange({ timing: action.timing, owner: action.owner });
  }

  function openAction(id: string) {
    const action = liveActions.find((item) => item.id === id);
    setSelectedActionId(id);
    if (action) onActionSelect?.(action.category);
  }

  function runBot(action: BriefAction) {
    const botType = action.botType ?? defaultBotForAction(action);
    patchAction(action.id, { ownerType: "bot", botType, botStatus: "working" });
    onBotRun?.(botType);
    window.clearTimeout(botTimer.current);
    botTimer.current = window.setTimeout(() => {
      patchAction(action.id, {
        botStatus: "ready_for_review",
        notes: botDraft({ ...action, botType }, botType),
      });
    }, 700);
  }

  async function copyText(label: "brief" | "report" | "email" | "mine", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      if (label === "brief") onCopy();
      if (label === "report") onReportCopy?.(reportKind);
      if (label === "email") onEmailPreview?.();
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
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
    <div className="relative border border-[#c8c8c0] bg-console-surface">
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
          <SampleDataCaption asOf={brief?.briefDate} className="mt-1" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className={consoleBtnSolid}
          >
            {generating ? "Assembling…" : "Run it again"}
          </button>
          <button type="button" onClick={reset} className={consoleBtn}>
            Reset Demo
          </button>
          <button type="button" onClick={generate} className={consoleBtn}>
            Reset to sample
          </button>
          <button
            type="button"
            onClick={() => {
              setCategory("all");
              setOwner("all");
              onCategoryFilter("all");
              onOwnerFilter("all");
              setShellView("console");
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
            onClick={() => {
              setShellView("console");
              setMeetingMode(false);
              window.setTimeout(() => {
                actionsRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 50);
            }}
            className={consoleBtn}
            disabled={!brief}
          >
            Action Board
          </button>
          <button
            type="button"
            onClick={() => {
              setShellView("reports");
              setMeetingMode(false);
              onReportView?.(reportKind);
            }}
            className={`${consoleBtn} ${shellView === "reports" ? "border-ink" : ""}`}
            disabled={!brief}
          >
            Reports
          </button>
          <button
            type="button"
            onClick={() => {
              setShellView("my_actions");
              setMeetingMode(false);
              onPersonaView?.(persona);
            }}
            className={`${consoleBtn} ${shellView === "my_actions" ? "border-ink" : ""}`}
            disabled={!brief}
          >
            My Actions
          </button>
          <button
            type="button"
            onClick={() => {
              setShellView("accountability");
              setMeetingMode(false);
            }}
            className={`${consoleBtn} ${shellView === "accountability" ? "border-ink" : ""}`}
            disabled={!brief}
          >
            Accountability
          </button>
          <button
            type="button"
            onClick={() => {
              if (!brief) return;
              const statuses: Record<string, ActionStatus> = {};
              for (const action of liveActions) statuses[action.id] = action.status;
              void copyText("brief", buildExportText(brief, statuses));
            }}
            className={consoleBtn}
            disabled={!brief}
          >
            {copied === "brief" ? "Copied" : "Copy Brief"}
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
          {brief?.briefDateLabel ?? sampleBrief.briefDateLabel}
        </p>
      </div>

      <p className="border-b border-[#d9d9d2] bg-[#fafaf7] px-4 py-2 text-[12px] leading-5 text-graphite md:px-5">
        <span className="font-medium text-ink">Public demo. </span>
        Fictional sample manufacturing data only. Demo Bots do not send email,
        change ERP, or contact suppliers.
      </p>

      <div className="space-y-4 px-4 py-4 md:px-5 md:py-5">
        {!brief && !generating ? <EmptyState onRun={generate} /> : null}

        {generating && !brief ? (
          <div className="border border-[#d9d9d2] bg-white px-5 py-10 text-center">
            <p className="text-[13px] text-graphite">
              Assembling today&apos;s exceptions, owners, and actions…
            </p>
          </div>
        ) : null}

        {brief && shellView === "reports" && report && email ? (
          <>
            <button
              type="button"
              className={consoleBtn}
              onClick={() => setShellView("console")}
            >
              Back to console
            </button>
            <ReportPicker
              active={reportKind}
              onSelect={(kind) => {
                setReportKind(kind);
                onReportView?.(kind);
              }}
            />
            <ReportView
              brief={brief}
              report={report}
              copied={copied === "report"}
              onCopy={() => void copyText("report", report.copyText)}
            />
            {reportKind === "executive" ? (
              <>
                <button
                  type="button"
                  className={consoleBtn}
                  onClick={() => {
                    setEmailOpen(true);
                    onEmailPreview?.();
                  }}
                >
                  Preview Executive Email
                </button>
                {emailOpen ? (
                  <ExecutiveEmailPreview
                    email={email}
                    copied={copied === "email"}
                    onCopy={() =>
                      void copyText("email", `${email.subject}\n\n${email.body}`)
                    }
                  />
                ) : null}
              </>
            ) : null}
            <DistributionAndSchedule />
            <OperatingLoop />
            <ActionMessage />
          </>
        ) : null}

        {brief && shellView === "my_actions" ? (
          <>
            <button
              type="button"
              className={consoleBtn}
              onClick={() => setShellView("console")}
            >
              Back to console
            </button>
            <PersonaPicker
              value={persona}
              onChange={(next) => {
                setPersona(next);
                onPersonaView?.(next);
              }}
            />
            <MyActionsView
              persona={persona}
              actions={personaActions}
              onOpen={openAction}
              copied={copied === "mine"}
              onCopy={() =>
                void copyText(
                  "mine",
                  buildMyActionsText(personaLabels[persona], personaActions),
                )
              }
            />
          </>
        ) : null}

        {brief && shellView === "accountability" ? (
          <>
            <button
              type="button"
              className={consoleBtn}
              onClick={() => setShellView("console")}
            >
              Back to console
            </button>
            <AccountabilityView
              counts={counts}
              filter={acctFilter}
              onFilter={setAcctFilter}
              actions={filteredAcct}
              onOpen={openAction}
            />
          </>
        ) : null}

        {brief && shellView === "console" ? (
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
                <div id="brief-actions" ref={actionsRef}>
                  <ExpandedActionBoard
                    actions={visibleActions}
                    onOpen={openAction}
                    onStatus={changeActionStatus}
                  />
                </div>
              ) : null}
            </div>

            {!meetingMode ? (
              <>
                <OperatingLoop />
                <ActionMessage />
                <Differentiator />
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {brief && selectedAction ? (
        <ActionDrawer
          action={selectedAction}
          issue={brief.issues.find((issue) => issue.id === selectedAction.issueId)}
          brief={brief}
          outcome={outcomes[selectedAction.id]}
          onClose={() => setSelectedActionId(undefined)}
          onStatus={(status) => changeActionStatus(selectedAction.id, status, selectedAction)}
          onAssignHuman={(role: HumanRole) => {
            patchAction(selectedAction.id, {
              ownerType: "human",
              assignedRole: role,
              botType: undefined,
              botStatus: undefined,
            });
            onAssign?.({ owner_type: "human" });
          }}
          onAssignBot={(bot: BotType) => {
            patchAction(selectedAction.id, {
              ownerType: "bot",
              assignedRole: "Demo Bot",
              botType: bot,
              botStatus: selectedAction.botStatus ?? "queued",
            });
            onAssign?.({ owner_type: "bot", bot_type: bot });
          }}
          onRunBot={() => runBot(selectedAction)}
          onApproveBot={() =>
            patchAction(selectedAction.id, {
              botStatus: "approved",
              status: "in_progress",
            })
          }
          onOutcome={(outcome) => {
            setOutcomes((current) => ({ ...current, [selectedAction.id]: outcome }));
            onOutcome?.(outcome);
          }}
          onStructural={(needed) => {
            if (!needed) return;
            setFollowUps((current) => {
              if (current.some((item) => item.id === `${selectedAction.id}-structural`)) {
                return current;
              }
              return [...current, makeStructuralFollowUp(selectedAction)];
            });
          }}
        />
      ) : null}
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
