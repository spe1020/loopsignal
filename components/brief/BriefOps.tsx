import Link from "next/link";
import { Pill, severityStyles } from "@/components/brief/BriefBadges";
import { SectionLabel, consoleBtn } from "@/components/brief/BriefPanels";
import { botCapabilities, botPreview, defaultBotForAction } from "@/lib/brief/bots";
import type { AccountabilityFilter } from "@/lib/brief/ops";
import type {
  ActionOutcome,
  ActionStatus,
  ActionTiming,
  BotType,
  BriefAction,
  BriefIssue,
  BriefResult,
  HumanRole,
  Owner,
  OwnerType,
  Persona,
} from "@/lib/brief/types";
import {
  actionOutcomes,
  actionStatusLabels,
  actionStatuses,
  actionTimingLabels,
  actionTimings,
  botControlLabels,
  botStatusLabels,
  botTypeLabels,
  botTypes,
  categoryLabels,
  humanRoles,
  outcomeLabels,
  owners,
  ownerTypeLabels,
  personaLabels,
  personas,
  priorityTierLabels,
} from "@/lib/brief/types";

export function PersonaPicker({
  value,
  onChange,
}: {
  value: Persona;
  onChange: (persona: Persona) => void;
}) {
  return (
    <section className="border border-[#d9d9d2] bg-white px-4 py-3 md:px-5">
      <SectionLabel>My Actions</SectionLabel>
      <p className="mt-1 text-[12px] text-graphite">View as</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {personas.map((persona) => (
          <button
            key={persona}
            type="button"
            onClick={() => onChange(persona)}
            className={`${consoleBtn} ${value === persona ? "border-ink" : ""}`}
          >
            {personaLabels[persona]}
          </button>
        ))}
      </div>
    </section>
  );
}

export function MyActionsView({
  persona,
  actions,
  onOpen,
  onCopy,
  copied,
}: {
  persona: Persona;
  actions: BriefAction[];
  onOpen: (id: string) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const open = actions.filter((action) => action.status !== "complete");
  const dueNow = open.filter((action) => action.timing === "now" || action.overdue);
  const dueToday = open.filter(
    (action) => action.timing === "today" || action.timing === "before_next_shift",
  );
  const longer = open.filter(
    (action) => action.timing === "this_week" || action.timing === "longer_term",
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[18px] font-medium tracking-tight text-ink">
          {personaLabels[persona]}
        </h2>
        <button type="button" onClick={onCopy} className={consoleBtn}>
          {copied ? "Copied" : "Copy My Actions"}
        </button>
      </div>
      <ActionBucket title="My Priorities" actions={open.slice(0, 5)} onOpen={onOpen} />
      <ActionBucket title="My Open Actions" actions={open} onOpen={onOpen} />
      <ActionBucket title="Due Now" actions={dueNow} onOpen={onOpen} />
      <ActionBucket title="Due Today" actions={dueToday} onOpen={onOpen} />
      <ActionBucket title="Longer-Term" actions={longer} onOpen={onOpen} />
    </div>
  );
}

function ActionBucket({
  title,
  actions,
  onOpen,
}: {
  title: string;
  actions: BriefAction[];
  onOpen: (id: string) => void;
}) {
  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-2 md:px-5">
        <SectionLabel>{title}</SectionLabel>
      </div>
      {actions.length === 0 ? (
        <p className="px-4 py-3 text-[13px] text-graphite md:px-5">
          Nothing in this list.
        </p>
      ) : (
        <ul>
          {actions.map((action) => (
            <li key={action.id} className="border-t border-[#ecece6] first:border-t-0">
              <button
                type="button"
                onClick={() => onOpen(action.id)}
                className="w-full px-4 py-3 text-left hover:bg-[#fafaf7] md:px-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-medium text-ink">{action.title}</p>
                  {action.overdue ? <Pill tone="red">Overdue</Pill> : null}
                  {action.ownerType === "bot" ? <Pill tone="blue">Demo Bot</Pill> : null}
                </div>
                <p className="mt-1 text-[12px] text-graphite">
                  {action.assignedRole} · {actionTimingLabels[action.timing]} ·{" "}
                  {actionStatusLabels[action.status]}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AccountabilityView({
  counts,
  filter,
  onFilter,
  actions,
  onOpen,
}: {
  counts: {
    open: number;
    dueToday: number;
    inProgress: number;
    readyForReview: number;
    complete: number;
    overdue: number;
  };
  filter: AccountabilityFilter;
  onFilter: (next: AccountabilityFilter) => void;
  actions: BriefAction[];
  onOpen: (id: string) => void;
}) {
  const cards = [
    { label: "Open", value: counts.open },
    { label: "Due Today", value: counts.dueToday },
    { label: "In Progress", value: counts.inProgress },
    { label: "Ready for Review", value: counts.readyForReview },
    { label: "Complete", value: counts.complete },
    { label: "Overdue", value: counts.overdue },
  ];

  return (
    <div className="space-y-4">
      <section className="border border-[#d9d9d2] bg-white">
        <div className="border-b border-[#d9d9d2] px-4 py-3 md:px-5">
          <SectionLabel>Accountability</SectionLabel>
        </div>
        <div className="grid gap-px bg-[#d9d9d2] sm:grid-cols-3 lg:grid-cols-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-white px-3 py-3">
              <p className="text-[10px] tracking-[0.12em] text-stone uppercase">
                {card.label}
              </p>
              <p className="mt-1 font-mono text-[22px] text-ink">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-[#d9d9d2] bg-white px-4 py-3 md:px-5">
        <SectionLabel>Filters</SectionLabel>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <FilterSelect
            label="Department"
            value={filter.department}
            onChange={(value) =>
              onFilter({ ...filter, department: value as Owner | "all" })
            }
            options={["all", ...owners]}
          />
          <FilterSelect
            label="Human / Bot"
            value={filter.ownerType}
            onChange={(value) =>
              onFilter({ ...filter, ownerType: value as OwnerType | "all" })
            }
            options={["all", "human", "bot"]}
            labels={{ all: "All", human: "Human", bot: "Bot" }}
          />
          <FilterSelect
            label="Status"
            value={filter.status}
            onChange={(value) =>
              onFilter({ ...filter, status: value as ActionStatus | "all" })
            }
            options={["all", ...actionStatuses]}
            labels={{ all: "All", ...actionStatusLabels }}
          />
          <FilterSelect
            label="Due timing"
            value={filter.timing}
            onChange={(value) =>
              onFilter({ ...filter, timing: value as ActionTiming | "all" })
            }
            options={["all", ...actionTimings]}
            labels={{ all: "All", ...actionTimingLabels }}
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-[12px] text-ink">
          <input
            type="checkbox"
            checked={filter.overdueOnly}
            onChange={(event) =>
              onFilter({ ...filter, overdueOnly: event.target.checked })
            }
          />
          Overdue only
        </label>
      </section>

      <ActionBucket title="Filtered actions" actions={actions} onOpen={onOpen} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="block text-[11px] text-stone">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-9 w-full border border-[#c8c8c0] bg-white px-2 text-[12px] text-ink"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ActionDrawer({
  action,
  issue,
  brief,
  outcome,
  onClose,
  onStatus,
  onAssignHuman,
  onAssignBot,
  onRunBot,
  onApproveBot,
  onOutcome,
  onStructural,
}: {
  action: BriefAction;
  issue?: BriefIssue;
  brief: BriefResult;
  outcome?: ActionOutcome;
  onClose: () => void;
  onStatus: (status: ActionStatus) => void;
  onAssignHuman: (role: HumanRole) => void;
  onAssignBot: (bot: BotType) => void;
  onRunBot: () => void;
  onApproveBot: () => void;
  onOutcome: (outcome: ActionOutcome) => void;
  onStructural: (needed: boolean) => void;
}) {
  const botType = action.botType ?? defaultBotForAction(action);
  const capabilities = botCapabilities[botType];

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/30">
      <button
        type="button"
        aria-label="Close action detail"
        className="h-full flex-1"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l border-[#c8c8c0] bg-console-surface shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#c8c8c0] px-4 py-3">
          <div>
            <SectionLabel>Action</SectionLabel>
            <h2 className="mt-1 text-[16px] font-medium text-ink">{action.title}</h2>
          </div>
          <button type="button" onClick={onClose} className={consoleBtn}>
            Close
          </button>
        </div>
        <div className="space-y-4 px-4 py-4">
          {action.overdue ? (
            <p className="border border-risk-critical bg-risk-critical-bg px-3 py-2 text-[12px] font-medium tracking-[0.08em] text-risk-critical uppercase">
              Overdue
            </p>
          ) : null}
          <Field label="Issue" value={issue?.title ?? action.title} />
          <Field label="Why it matters" value={issue?.impact ?? action.notes} />
          <Field
            label="Assigned owner"
            value={`${action.assignedRole} · ${ownerTypeLabels[action.ownerType]}`}
          />
          <Field label="Immediate action" value={action.action} />
          <Field
            label="Longer-term action"
            value={issue?.structuralAction ?? "Define after the immediate action is closed."}
          />
          <Field
            label="Due timing"
            value={
              action.overdue
                ? `${action.dueAgeLabel ?? "Overdue"} · originally ${actionTimingLabels[action.timing]}`
                : actionTimingLabels[action.timing]
            }
          />
          <Field label="Current status" value={actionStatusLabels[action.status]} />
          <Field label="Source" value={action.sourceLabel} />
          {action.related ? (
            <Link
              href={action.related.href}
              className="inline-flex text-[12px] font-medium text-copper hover:text-copper-dark"
            >
              {action.related.label} →
            </Link>
          ) : null}

          <div>
            <SectionLabel>Status</SectionLabel>
            <select
              value={action.status}
              onChange={(event) => onStatus(event.target.value as ActionStatus)}
              className="mt-2 min-h-9 w-full border border-[#c8c8c0] bg-white px-2 text-[12px] text-ink"
            >
              {actionStatuses.map((status) => (
                <option key={status} value={status}>
                  {actionStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <AssignmentControls
            action={action}
            botType={botType}
            onAssignHuman={onAssignHuman}
            onAssignBot={onAssignBot}
            onRunBot={onRunBot}
            onApproveBot={onApproveBot}
          />

          {action.ownerType === "bot" ? (
            <div className="border border-[#ecece6] bg-[#fafaf7] px-3 py-3">
              <p className="text-[11px] font-medium tracking-[0.08em] text-stone uppercase">
                Demo Bot
              </p>
              <p className="mt-1 text-[12px] leading-5 text-graphite">
                {botPreview(action, botType)}
              </p>
              {action.botControl ? (
                <div className="mt-2">
                  <Pill tone="blue">{botControlLabels[action.botControl]}</Pill>
                </div>
              ) : null}
              <p className="mt-2 text-[11px] text-stone">
                Bot can prepare: {capabilities.prepare.join(", ")}.
              </p>
              <p className="mt-1 text-[11px] text-stone">
                Human approval required: {capabilities.approval.join(", ")}.
              </p>
            </div>
          ) : null}

          {action.status === "complete" ? (
            <div className="border border-[#d9d9d2] px-3 py-3">
              <SectionLabel>Outcome</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {actionOutcomes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onOutcome(item)}
                    className={`${consoleBtn} ${outcome === item ? "border-ink" : ""}`}
                  >
                    {outcomeLabels[item]}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-graphite">
                Does this require a longer-term action?
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" className={consoleBtn} onClick={() => onStructural(true)}>
                  Yes
                </button>
                <button type="button" className={consoleBtn} onClick={() => onStructural(false)}>
                  No
                </button>
              </div>
            </div>
          ) : null}

          <p className="text-[11px] text-stone">
            Plant {brief.plantName}. Demo only — no ERP, email, or supplier
            action is executed.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className="mt-1 text-[13px] leading-6 text-ink">{value}</p>
    </div>
  );
}

function AssignmentControls({
  action,
  botType,
  onAssignHuman,
  onAssignBot,
  onRunBot,
  onApproveBot,
}: {
  action: BriefAction;
  botType: BotType;
  onAssignHuman: (role: HumanRole) => void;
  onAssignBot: (bot: BotType) => void;
  onRunBot: () => void;
  onApproveBot: () => void;
}) {
  return (
    <div className="border border-[#d9d9d2] px-3 py-3">
      <SectionLabel>Assign To</SectionLabel>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          className={`${consoleBtn} ${action.ownerType === "human" ? "border-ink" : ""}`}
          onClick={() =>
            onAssignHuman(
              humanRoles.includes(action.assignedRole as HumanRole)
                ? (action.assignedRole as HumanRole)
                : "Operations Supervisor",
            )
          }
        >
          Human
        </button>
        {action.eligibleForBot ? (
          <button
            type="button"
            className={`${consoleBtn} ${action.ownerType === "bot" ? "border-ink" : ""}`}
            onClick={() => onAssignBot(botType)}
          >
            Bot
          </button>
        ) : null}
      </div>
      {action.ownerType === "human" ? (
        <label className="mt-3 block text-[11px] text-stone">
          Owner role
          <select
            value={
              humanRoles.includes(action.assignedRole as HumanRole)
                ? action.assignedRole
                : humanRoles[0]
            }
            onChange={(event) => onAssignHuman(event.target.value as HumanRole)}
            className="mt-1 min-h-9 w-full border border-[#c8c8c0] bg-white px-2 text-[12px] text-ink"
          >
            {humanRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <label className="mt-3 block text-[11px] text-stone">
            Demo Bot
            <select
              value={botType}
              onChange={(event) => onAssignBot(event.target.value as BotType)}
              className="mt-1 min-h-9 w-full border border-[#c8c8c0] bg-white px-2 text-[12px] text-ink"
            >
              {botTypes.map((bot) => (
                <option key={bot} value={bot}>
                  {botTypeLabels[bot]}
                </option>
              ))}
            </select>
          </label>
          {action.botStatus ? (
            <p className="mt-2 text-[12px] text-graphite">
              Status: {botStatusLabels[action.botStatus]}
              {action.botStatus === "working" ? "…" : ""}
            </p>
          ) : null}
          {action.botStatus === "ready_for_review" && action.notes ? (
            <pre className="whitespace-pre-wrap border border-[#ecece6] bg-white px-3 py-3 font-sans text-[12px] leading-5 text-graphite">
              {action.notes}
            </pre>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={consoleBtn} onClick={onRunBot}>
              Run {botTypeLabels[botType]}
            </button>
            {action.botStatus === "ready_for_review" ? (
              <button type="button" className={consoleBtn} onClick={onApproveBot}>
                Approve draft
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

export function ExpandedActionBoard({
  actions,
  onOpen,
  onStatus,
}: {
  actions: BriefAction[];
  onOpen: (id: string) => void;
  onStatus: (id: string, status: ActionStatus, action: BriefAction) => void;
}) {
  const immediate = actions.filter((action) => action.horizon === "immediate");
  const structural = actions.filter((action) => action.horizon === "structural");

  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3 md:px-5">
        <SectionLabel>Action Board</SectionLabel>
        <p className="mt-1 text-[12px] text-graphite">
          Assign to a person or a Demo Bot. Status is local to this session.
        </p>
      </div>
      <BoardGroup title="Immediate" actions={immediate} onOpen={onOpen} onStatus={onStatus} />
      <BoardGroup title="Structural" actions={structural} onOpen={onOpen} onStatus={onStatus} />
    </section>
  );
}

function BoardGroup({
  title,
  actions,
  onOpen,
  onStatus,
}: {
  title: string;
  actions: BriefAction[];
  onOpen: (id: string) => void;
  onStatus: (id: string, status: ActionStatus, action: BriefAction) => void;
}) {
  return (
    <div className="border-t border-[#ecece6]">
      <p className="bg-[#fafaf7] px-4 py-2 text-[10px] font-medium tracking-[0.14em] text-stone uppercase md:px-5">
        {title}
      </p>
      {actions.length === 0 ? (
        <p className="px-4 py-3 text-[13px] text-graphite md:px-5">
          No {title.toLowerCase()} actions in this view.
        </p>
      ) : (
        <ul>
          {actions.map((action) => {
            const style = action.overdue
              ? severityStyles.red
              : action.ownerType === "bot"
                ? severityStyles.blue
                : undefined;
            return (
              <li
                key={action.id}
                className={`grid gap-3 border-t border-[#ecece6] px-4 py-3 md:grid-cols-12 md:items-center md:px-5 ${
                  style ? `border-l-4 ${style.bar}` : ""
                }`}
              >
                <div className="md:col-span-5">
                  <button
                    type="button"
                    onClick={() => onOpen(action.id)}
                    className="text-left"
                  >
                    <p className="text-[13px] font-medium leading-5 text-ink">
                      {action.title}
                    </p>
                    <p className="mt-1 text-[11px] text-graphite">
                      {action.assignedRole} · {categoryLabels[action.category]} ·{" "}
                      {priorityTierLabels[action.priorityTier]}
                    </p>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:col-span-4">
                  {action.overdue ? (
                    <Pill tone="red">Overdue</Pill>
                  ) : (
                    <Pill>{actionTimingLabels[action.timing]}</Pill>
                  )}
                  <Pill tone={action.ownerType === "bot" ? "blue" : "neutral"}>
                    {action.ownerType === "bot" ? "Demo Bot" : "Human"}
                  </Pill>
                  {action.botStatus === "ready_for_review" ? (
                    <Pill tone="amber">Ready for Review</Pill>
                  ) : null}
                </div>
                <div className="md:col-span-3">
                  <label className="sr-only" htmlFor={`ops-status-${action.id}`}>
                    Status for {action.title}
                  </label>
                  <select
                    id={`ops-status-${action.id}`}
                    value={action.status}
                    onChange={(event) =>
                      onStatus(action.id, event.target.value as ActionStatus, action)
                    }
                    className="min-h-9 w-full border border-[#c8c8c0] bg-white px-2 text-[12px] text-ink"
                  >
                    {actionStatuses.map((item) => (
                      <option key={item} value={item}>
                        {actionStatusLabels[item]}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
