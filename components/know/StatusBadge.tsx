import type { CoverageLabel, DocumentStatus } from "@/lib/know/types";

export const statusStyles: Record<
  DocumentStatus,
  { label: string; pill: string }
> = {
  current: {
    label: "Current",
    pill: "border-risk-track bg-risk-track-bg text-risk-track",
  },
  draft: {
    label: "Draft",
    pill: "border-risk-amber bg-risk-amber-bg text-risk-amber",
  },
  superseded: {
    label: "Superseded",
    pill: "border-risk-critical bg-risk-critical-bg text-risk-critical",
  },
};

export const coverageCopy: Record<
  CoverageLabel,
  { label: string; text: string }
> = {
  direct_match: {
    label: "Direct Match",
    text: "The answer is directly supported by a current document.",
  },
  multiple_sources: {
    label: "Multiple Sources",
    text: "The answer combines information from more than one current document.",
  },
  limited_information: {
    label: "Limited Information",
    text: "The available sample documents do not fully answer the question.",
  },
  no_answer: {
    label: "No Verified Answer",
    text: "The sample document library does not contain a verified answer.",
  },
};

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: DocumentStatus;
  size?: "sm" | "md";
}) {
  const style = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center border font-medium tracking-[0.06em] uppercase ${
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      } ${style.pill}`}
    >
      {style.label}
    </span>
  );
}

export function CoverageBadge({ coverage }: { coverage: CoverageLabel }) {
  const copy = coverageCopy[coverage];
  return (
    <span className="inline-flex items-center border border-[#c8c8c0] bg-white px-2 py-0.5 text-[10px] font-medium tracking-[0.06em] text-ink uppercase">
      {copy.label}
    </span>
  );
}
