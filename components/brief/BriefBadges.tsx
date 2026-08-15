import type { PlantStatus, Severity } from "@/lib/brief/types";
import { plantStatusLabels, severityShort } from "@/lib/brief/types";

export const severityStyles: Record<
  Severity,
  { text: string; bg: string; border: string; bar: string; pill: string; mark: string }
> = {
  red: {
    text: "text-risk-critical",
    bg: "bg-risk-critical-bg",
    border: "border-risk-critical",
    bar: "border-l-risk-critical",
    pill: "border-risk-critical bg-risk-critical-bg text-risk-critical",
    mark: "■",
  },
  amber: {
    text: "text-risk-amber",
    bg: "bg-risk-amber-bg",
    border: "border-risk-amber",
    bar: "border-l-risk-amber",
    pill: "border-risk-amber bg-risk-amber-bg text-risk-amber",
    mark: "▲",
  },
  green: {
    text: "text-risk-track",
    bg: "bg-risk-track-bg",
    border: "border-risk-track",
    bar: "border-l-risk-track",
    pill: "border-risk-track bg-risk-track-bg text-risk-track",
    mark: "◆",
  },
  blue: {
    text: "text-risk-confirm",
    bg: "bg-risk-confirm-bg",
    border: "border-risk-confirm",
    bar: "border-l-risk-confirm",
    pill: "border-risk-confirm bg-risk-confirm-bg text-risk-confirm",
    mark: "●",
  },
};

export const plantStatusStyles: Record<
  PlantStatus,
  { pill: string; banner: string }
> = {
  stable: {
    pill: severityStyles.green.pill,
    banner: "border-risk-track bg-risk-track-bg",
  },
  watch: {
    pill: severityStyles.amber.pill,
    banner: "border-risk-amber bg-risk-amber-bg",
  },
  action_required: {
    pill: severityStyles.red.pill,
    banner: "border-risk-critical bg-risk-critical-bg",
  },
};

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Severity | "neutral";
}) {
  const pill =
    tone === "neutral"
      ? "border-[#c8c8c0] bg-white text-ink"
      : severityStyles[tone].pill;
  return (
    <span
      className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9px] font-medium tracking-[0.06em] uppercase ${pill}`}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({
  severity,
  size = "sm",
}: {
  severity: Severity;
  size?: "sm" | "md";
}) {
  const style = severityStyles[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-medium tracking-[0.06em] uppercase ${
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      } ${style.pill}`}
    >
      <span aria-hidden className="font-mono leading-none">
        {style.mark}
      </span>
      {severityShort[severity]}
    </span>
  );
}

export function PlantStatusBadge({ status }: { status: PlantStatus }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] uppercase ${plantStatusStyles[status].pill}`}
    >
      {plantStatusLabels[status]}
    </span>
  );
}
