import type { SVGProps } from "react";
import { LOOP_MARK_DOT, LOOP_MARK_PATH, LOOP_MARK_VIEWBOX } from "@/lib/brand";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...rest }: P, children: React.ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconCheck = (p: P) => base(p, <path d="M5 12.5 10 17l9-10" />);
export const IconCircle = (p: P) => base(p, <circle cx="12" cy="12" r="8" />);
export const IconDot = (p: P) => base(p, <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" /></>);
export const IconAlert = (p: P) => base(p, <><path d="M12 3 2.5 20h19L12 3z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></>);
export const IconPlus = (p: P) => base(p, <><path d="M12 5v14" /><path d="M5 12h14" /></>);
export const IconMinus = (p: P) => base(p, <path d="M5 12h14" />);
export const IconTrash = (p: P) => base(p, <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>);
export const IconChevronDown = (p: P) => base(p, <path d="m6 9 6 6 6-6" />);
export const IconChevronRight = (p: P) => base(p, <path d="m9 6 6 6-6 6" />);
export const IconChevronLeft = (p: P) => base(p, <path d="m15 6-6 6 6 6" />);
export const IconLink = (p: P) => base(p, <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" /></>);
export const IconBranch = (p: P) => base(p, <><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="9" r="2" /><path d="M6 7v10" /><path d="M18 11c0 4-12 2-12 6" /></>);
export const IconFlag = (p: P) => base(p, <><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>);
export const IconTarget = (p: P) => base(p, <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>);
export const IconNote = (p: P) => base(p, <><path d="M6 3h9l5 5v13H6z" /><path d="M15 3v5h5" /><path d="M9 13h6M9 17h6" /></>);
export const IconQuestion = (p: P) => base(p, <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></>);
export const IconClose = (p: P) => base(p, <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>);
export const IconMore = (p: P) => base(p, <><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></>);
export const IconPrint = (p: P) => base(p, <><path d="M7 8V3h10v5" /><path d="M7 17H4V9h16v8h-3" /><path d="M7 14h10v7H7z" /></>);
export const IconDownload = (p: P) => base(p, <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 21h16" /></>);
export const IconUpload = (p: P) => base(p, <><path d="M12 15V3" /><path d="m7 8 5-5 5 5" /><path d="M4 21h16" /></>);
export const IconCopy = (p: P) => base(p, <><rect x="9" y="9" width="11" height="11" rx="1" /><path d="M5 15V5h10" /></>);
export const IconSearch = (p: P) => base(p, <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></>);
export const IconClock = (p: P) => base(p, <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IconEye = (p: P) => base(p, <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>);
export const IconExpand = (p: P) => base(p, <><path d="M4 9V4h5" /><path d="M20 15v5h-5" /><path d="M4 4l6 6" /><path d="M20 20l-6-6" /></>);
export const IconShield = (p: P) => base(p, <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></>);
export const IconArrowRight = (p: P) => base(p, <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>);
export const IconArrowLeft = (p: P) => base(p, <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>);
export const IconArrowUp = (p: P) => base(p, <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>);
export const IconArrowDown = (p: P) => base(p, <><path d="M12 5v14" /><path d="m18 13-6 6-6-6" /></>);
export const IconEdit = (p: P) => base(p, <><path d="M4 20h4l11-11-4-4L4 16z" /><path d="m13 7 4 4" /></>);
export const IconPause = (p: P) => base(p, <><path d="M8 5v14" /><path d="M16 5v14" /></>);
export const IconPlay = (p: P) => base(p, <path d="M7 4v16l13-8z" />);
export const IconTablet = (p: P) => base(p, <><rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="12" cy="18" r="0.8" fill="currentColor" /></>);
export const IconPresent = (p: P) => base(p, <><rect x="3" y="4" width="18" height="12" rx="1" /><path d="M12 16v4" /><path d="M8 20h8" /></>);
export const IconGrid = (p: P) => base(p, <><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></>);
export const IconList = (p: P) => base(p, <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="0.8" fill="currentColor" /><circle cx="4" cy="12" r="0.8" fill="currentColor" /><circle cx="4" cy="18" r="0.8" fill="currentColor" /></>);
export const IconLightning = (p: P) => base(p, <path d="M13 2 4 14h7l-1 8 9-12h-7z" />);
export const IconCompass = (p: P) => base(p, <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>);
export const IconMagnify = IconSearch;
export const IconFork = IconBranch;
export const IconWrench = (p: P) => base(p, <path d="M14.5 3.5a5 5 0 0 0-5.7 6.7L3 16v5h5l5.8-5.8a5 5 0 0 0 6.7-5.7l-3 3-2.5-.5-.5-2.5z" />);
export const IconDoc = IconNote;
export const IconBook = (p: P) => base(p, <><path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" /><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" /></>);

/** The LoopSignal infinity loop, reusable in solve UI. */
export function LoopGlyph({
  className = "h-6 w-12",
  animated = false,
  tone = "ink",
}: {
  className?: string;
  animated?: boolean;
  tone?: "ink" | "copper" | "current";
}) {
  const stroke = tone === "copper" ? "var(--copper)" : tone === "current" ? "currentColor" : "var(--ink)";
  return (
    <svg className={`shrink-0 ${className}`} viewBox={LOOP_MARK_VIEWBOX} fill="none" aria-hidden="true">
      <path
        d={LOOP_MARK_PATH}
        stroke={stroke}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? "solve-loop-spin" : undefined}
      />
      <circle cx={LOOP_MARK_DOT.cx} cy={LOOP_MARK_DOT.cy} r={LOOP_MARK_DOT.r} fill="var(--copper)" />
    </svg>
  );
}
