import Link from "next/link";
import {
  brand,
  LOOP_MARK_DOT,
  LOOP_MARK_PATH,
  LOOP_MARK_STROKE_WIDTH,
  LOOP_MARK_VIEWBOX,
} from "@/lib/brand";

export type LogoVariant = "horizontal" | "stacked" | "mark";
export type LogoTone = "onLight" | "onDark" | "mono";

export function LoopMark({
  className = "h-7 w-14",
  tone = "onLight",
}: {
  className?: string;
  tone?: LogoTone;
}) {
  const stroke =
    tone === "onDark" ? "#FFFFFF" : tone === "mono" ? "currentColor" : brand.charcoal;
  const dot = tone === "mono" ? "currentColor" : brand.orange;

  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox={LOOP_MARK_VIEWBOX}
      fill="none"
      aria-hidden="true"
    >
      <path
        d={LOOP_MARK_PATH}
        stroke={stroke}
        strokeWidth={LOOP_MARK_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={LOOP_MARK_DOT.cx}
        cy={LOOP_MARK_DOT.cy}
        r={LOOP_MARK_DOT.r}
        fill={dot}
      />
    </svg>
  );
}

function Tagline({ tone }: { tone: LogoTone }) {
  const color =
    tone === "onDark" ? "text-white/55" : tone === "mono" ? "text-current" : "text-stone";

  return (
    <span
      className={`block text-[9px] font-medium uppercase tracking-[0.12em] sm:text-[10px] ${color}`}
    >
      Find the signal. Close the loop
      {tone === "mono" ? "." : <span className="text-copper">.</span>}
    </span>
  );
}

export function Logo({
  href = "/",
  variant = "horizontal",
  tone,
  inverted = false,
  showTagline = false,
  className = "",
}: {
  href?: string;
  variant?: LogoVariant;
  tone?: LogoTone;
  inverted?: boolean;
  showTagline?: boolean;
  className?: string;
}) {
  const resolvedTone: LogoTone = tone ?? (inverted ? "onDark" : "onLight");
  const textColor =
    resolvedTone === "onDark"
      ? "text-white"
      : resolvedTone === "mono"
        ? "text-current"
        : "text-ink";

  const markClass =
    variant === "stacked"
      ? "h-10 w-20"
      : variant === "mark"
        ? "h-8 w-16"
        : "h-7 w-14 sm:h-8 sm:w-16";

  const wordmark = (
    <span className="text-[15px] font-medium tracking-[-0.03em] whitespace-nowrap sm:text-[16px]">
      LoopSignal
    </span>
  );

  const inner =
    variant === "mark" ? (
      <LoopMark className={markClass} tone={resolvedTone} />
    ) : variant === "stacked" ? (
      <span className="inline-flex flex-col items-center gap-2">
        <LoopMark className={markClass} tone={resolvedTone} />
        <span className="inline-flex flex-col items-center gap-1">
          {wordmark}
          {showTagline ? <Tagline tone={resolvedTone} /> : null}
        </span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-3 sm:gap-4">
        <LoopMark className={markClass} tone={resolvedTone} />
        <span className="inline-flex flex-col items-start gap-0.5">
          {wordmark}
          {showTagline ? <Tagline tone={resolvedTone} /> : null}
        </span>
      </span>
    );

  return (
    <Link
      href={href}
      aria-label="LoopSignal home"
      className={`inline-flex shrink-0 items-center ${textColor} ${className}`}
    >
      {inner}
    </Link>
  );
}
