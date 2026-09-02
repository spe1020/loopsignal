import type { LaneKind, PainCategory, Severity, StepType, TimeSource, ValueClass } from "./schema";

/** Shared visual vocabulary for the interactive map, the SVG export, and print. */

export const LANE_PALETTE = ["#1d4e89", "#177245", "#7a4a9a", "#b45309", "#0f766e", "#8a3b12", "#4a4a4a", "#9a1f6a"] as const;

export function laneColor(index: number): string {
  return LANE_PALETTE[index % LANE_PALETTE.length];
}

export const valueClassMeta: Record<ValueClass, { label: string; short: string; color: string; hint: string }> = {
  va: { label: "Value-adding", short: "VA", color: "#177245", hint: "The customer would pay for this. It changes the product or information." },
  nnva: { label: "Necessary non-value", short: "NNVA", color: "#b45309", hint: "Required (compliance, control), but the customer doesn't pay for it." },
  nva: { label: "Non-value / waste", short: "NVA", color: "#b42318", hint: "Waiting, rework, re-keying, transport. Candidate to remove." },
  unclassified: { label: "Unclassified", short: "?", color: "#7a7a7a", hint: "Not decided yet." },
};

export const stepTypeMeta: Record<StepType, { label: string; short: string }> = {
  process: { label: "Process step", short: "Step" },
  decision: { label: "Decision", short: "Decision" },
  wait: { label: "Wait", short: "Wait" },
  inspection: { label: "Inspection", short: "Inspect" },
  transport: { label: "Transport / handoff", short: "Move" },
  storage: { label: "Storage", short: "Store" },
  start: { label: "Start", short: "Start" },
  end: { label: "End", short: "End" },
};

export const timeSourceMeta: Record<TimeSource, { label: string }> = {
  observed: { label: "Observed" },
  estimated: { label: "Estimated" },
  system_record: { label: "System record" },
  unknown: { label: "Unknown" },
};

export const laneKindMeta: Record<LaneKind, { label: string }> = {
  role: { label: "Role" },
  department: { label: "Department" },
  system: { label: "System" },
  customer: { label: "Customer" },
  supplier: { label: "Supplier" },
};

export const painCategoryMeta: Record<PainCategory, { label: string }> = {
  waiting: { label: "Waiting" },
  rework: { label: "Rework" },
  handoff: { label: "Handoff" },
  information: { label: "Information" },
  system: { label: "System" },
  quality: { label: "Quality" },
  safety: { label: "Safety" },
  other: { label: "Other" },
};

export const severityMeta: Record<Severity, { label: string; rank: number }> = {
  high: { label: "High", rank: 3 },
  medium: { label: "Medium", rank: 2 },
  low: { label: "Low", rank: 1 },
};

export const COLORS = {
  ink: "#1f1f1f",
  graphite: "#4a4a4a",
  stone: "#7a7a7a",
  line: "#e6e6e6",
  cream: "#fafaf8",
  paper: "#f3f3f1",
  copper: "#e4571e",
  red: "#b42318",
  amber: "#b45309",
  green: "#177245",
} as const;
