import type { RiskLevel } from "@/lib/signal/types";

export const riskStyles: Record<
  RiskLevel,
  {
    label: string;
    mark: string;
    text: string;
    bg: string;
    border: string;
    bar: string;
    pill: string;
  }
> = {
  critical: {
    label: "Critical",
    mark: "■",
    text: "text-risk-critical",
    bg: "bg-risk-critical-bg",
    border: "border-risk-critical",
    bar: "border-l-risk-critical",
    pill: "border-risk-critical bg-risk-critical-bg text-risk-critical",
  },
  at_risk: {
    label: "At Risk",
    mark: "▲",
    text: "text-risk-amber",
    bg: "bg-risk-amber-bg",
    border: "border-risk-amber",
    bar: "border-l-risk-amber",
    pill: "border-risk-amber bg-risk-amber-bg text-risk-amber",
  },
  needs_confirmation: {
    label: "Needs Confirmation",
    mark: "●",
    text: "text-risk-confirm",
    bg: "bg-risk-confirm-bg",
    border: "border-risk-confirm",
    bar: "border-l-risk-confirm",
    pill: "border-risk-confirm bg-risk-confirm-bg text-risk-confirm",
  },
  on_track: {
    label: "On Track",
    mark: "◆",
    text: "text-risk-track",
    bg: "bg-risk-track-bg",
    border: "border-risk-track",
    bar: "border-l-risk-track",
    pill: "border-risk-track bg-risk-track-bg text-risk-track",
  },
};

export function RiskBadge({
  level,
  size = "md",
}: {
  level: RiskLevel;
  size?: "sm" | "md";
}) {
  const style = riskStyles[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-medium tracking-[0.06em] uppercase ${
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      } ${style.pill}`}
    >
      <span aria-hidden className="font-mono leading-none">
        {style.mark}
      </span>
      {style.label}
    </span>
  );
}
