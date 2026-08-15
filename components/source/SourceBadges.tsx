import type { FlagSeverity, QualificationStatus } from "@/lib/source/types";

export const qualificationStyles: Record<
  QualificationStatus,
  { label: string; pill: string }
> = {
  qualified: {
    label: "Qualified",
    pill: "border-risk-track bg-risk-track-bg text-risk-track",
  },
  conditional: {
    label: "Conditional",
    pill: "border-risk-amber bg-risk-amber-bg text-risk-amber",
  },
  new: {
    label: "New Supplier",
    pill: "border-risk-critical bg-risk-critical-bg text-risk-critical",
  },
};

export const highlightStyles = {
  green: "border-risk-track bg-risk-track-bg text-risk-track",
  amber: "border-risk-amber bg-risk-amber-bg text-risk-amber",
  red: "border-risk-critical bg-risk-critical-bg text-risk-critical",
  blue: "border-risk-confirm bg-risk-confirm-bg text-risk-confirm",
} as const;

export const severityStyles: Record<FlagSeverity, string> = {
  green: highlightStyles.green,
  amber: highlightStyles.amber,
  red: highlightStyles.red,
};

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof highlightStyles | "neutral";
}) {
  const pill =
    tone === "neutral"
      ? "border-[#c8c8c0] bg-white text-ink"
      : highlightStyles[tone];
  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 text-[9px] font-medium tracking-[0.06em] uppercase ${pill}`}
    >
      {children}
    </span>
  );
}

export function QualificationBadge({
  status,
}: {
  status: QualificationStatus;
}) {
  const style = qualificationStyles[status];
  return <Pill tone={status === "qualified" ? "green" : status === "conditional" ? "amber" : "red"}>{style.label}</Pill>;
}

export function ComplianceBadge({ meets }: { meets: boolean }) {
  return meets ? (
    <Pill tone="green">Meets Requirement</Pill>
  ) : (
    <Pill tone="red">Exception</Pill>
  );
}
