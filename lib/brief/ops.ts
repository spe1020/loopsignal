import type {
  ActionStatus,
  ActionTiming,
  BriefAction,
  Owner,
  OwnerType,
  Persona,
} from "./types";

export type AccountabilityCounts = {
  open: number;
  dueToday: number;
  inProgress: number;
  readyForReview: number;
  complete: number;
  overdue: number;
};

export function accountabilityCounts(actions: BriefAction[]): AccountabilityCounts {
  const dueTodayTimings: ActionTiming[] = ["now", "today", "before_next_shift"];
  return {
    open: actions.filter((action) => action.status === "open").length,
    dueToday: actions.filter(
      (action) =>
        action.status !== "complete" && dueTodayTimings.includes(action.timing),
    ).length,
    inProgress: actions.filter((action) => action.status === "in_progress").length,
    readyForReview: actions.filter(
      (action) => action.botStatus === "ready_for_review",
    ).length,
    complete: actions.filter((action) => action.status === "complete").length,
    overdue: actions.filter(
      (action) => action.overdue && action.status !== "complete",
    ).length,
  };
}

export function actionsForPersona(
  actions: BriefAction[],
  persona: Persona,
): BriefAction[] {
  if (persona === "plant_manager") {
    return actions.filter(
      (action) => action.priority <= 3 || action.overdue,
    );
  }
  const roleMatch: Record<Exclude<Persona, "plant_manager">, string[]> = {
    buyer: ["Buyer"],
    planner: ["Planner", "Planning"],
    quality_engineer: ["Quality Engineer", "Quality"],
    maintenance_lead: ["Maintenance Technician", "Maintenance"],
    operations_supervisor: ["Operations Supervisor", "Operations"],
  };
  const needles = roleMatch[persona];
  return actions.filter(
    (action) =>
      needles.includes(action.assignedRole) ||
      needles.includes(action.department) ||
      needles.includes(action.owner),
  );
}

export type AccountabilityFilter = {
  department: Owner | "all";
  ownerType: OwnerType | "all";
  status: ActionStatus | "all";
  timing: ActionTiming | "all";
  overdueOnly: boolean;
};

export const defaultAccountabilityFilter: AccountabilityFilter = {
  department: "all",
  ownerType: "all",
  status: "all",
  timing: "all",
  overdueOnly: false,
};

export function filterAccountability(
  actions: BriefAction[],
  filter: AccountabilityFilter,
): BriefAction[] {
  return actions.filter((action) => {
    if (filter.department !== "all" && action.department !== filter.department) {
      return false;
    }
    if (filter.ownerType !== "all" && action.ownerType !== filter.ownerType) {
      return false;
    }
    if (filter.status !== "all" && action.status !== filter.status) {
      return false;
    }
    if (filter.timing !== "all" && action.timing !== filter.timing) {
      return false;
    }
    if (filter.overdueOnly && !action.overdue) return false;
    return true;
  });
}

export function makeStructuralFollowUp(action: BriefAction): BriefAction {
  return {
    ...action,
    id: `${action.id}-structural`,
    title: `Structural follow-up: ${action.title}`,
    action: `Define the longer-term change that prevents recurrence of ${action.title.toLowerCase()}.`,
    horizon: "structural",
    timing: "this_week",
    status: "open",
    overdue: false,
    dueAgeLabel: undefined,
    notes: "Created from the action follow-up loop in this demo session.",
    ownerType: "human",
    botType: undefined,
    botStatus: undefined,
  };
}