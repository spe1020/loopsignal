import { brand } from "@/lib/brand";
import type { LoopScanIntent } from "@/lib/content";

export const FIT_CHECK_SECTION_ID = "fit-check";
export const CAL_PREFILL_EVENT = "loopsignal:loopscan-prefill";
export const CAL_BOOKED_EVENT = "loopsignal:loopscan-booked";

export type CalBookingIntent = "discuss_loopscan" | "talk_process";

export type CalBookingPrefill = {
  name?: string;
  email?: string;
  intent: LoopScanIntent;
  intakeSubmitted: boolean;
};

export type CalBookedDetail = {
  startTime?: string;
};

export type CalBookingTarget = {
  origin: string;
  calLink: string;
  url: string;
};

const DEFAULT_CAL_ORIGIN = "https://cal.com";

/** Public Cal.com event URL. No private API credentials. */
export const CAL_LOOPSCAN_URL_DEFAULT = "https://cal.com/loopsignal/30min";

export function getCalLoopScanUrl(serverFallback?: string) {
  return (
    process.env.NEXT_PUBLIC_CAL_LOOPSCAN_URL?.trim() ||
    serverFallback?.trim() ||
    process.env.CALENDAR_URL?.trim() ||
    CAL_LOOPSCAN_URL_DEFAULT
  );
}

export function parseCalBookingUrl(raw: string): CalBookingTarget | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (!trimmed.includes("://") && !trimmed.startsWith("//")) {
    const calLink = trimmed.replace(/^\/+|\/+$/g, "");
    if (!calLink) return null;
    return {
      origin: DEFAULT_CAL_ORIGIN,
      calLink,
      url: `${DEFAULT_CAL_ORIGIN}/${calLink}`,
    };
  }

  try {
    const parsed = new URL(trimmed);
    const calLink = parsed.pathname.replace(/^\/+|\/+$/g, "");
    if (!calLink) return null;
    return {
      origin: parsed.origin,
      calLink,
      url: `${parsed.origin}/${calLink}`,
    };
  } catch {
    return null;
  }
}

export function toBookingIntent(intent: LoopScanIntent): CalBookingIntent {
  return intent === "book" ? "discuss_loopscan" : "talk_process";
}

export function scrollToFitCheck() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.hash = FIT_CHECK_SECTION_ID;
  window.history.replaceState(
    {},
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
  document
    .getElementById(FIT_CHECK_SECTION_ID)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function formatBookingTime(startTime?: string) {
  if (!startTime) return undefined;
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export const calUiConfig = {
  hideEventTypeDetails: false,
  theme: "light" as const,
  layout: "month_view" as const,
  styles: {
    branding: {
      brandColor: brand.orange,
    },
  },
  cssVarsPerTheme: {
    light: {
      "cal-brand": brand.orange,
      "cal-brand-emphasis": brand.orangeDark,
      "cal-brand-text": "#FFFFFF",
      "cal-brand-subtle": brand.orangeSoft,
      "cal-brand-accent": "#FFFFFF",
      "cal-text": brand.graphite,
      "cal-text-emphasis": brand.charcoal,
      "cal-text-subtle": brand.gray,
      "cal-text-muted": brand.gray,
      "cal-text-inverted": brand.cream,
      "cal-bg": brand.cream,
      "cal-bg-emphasis": brand.orangeSoft,
      "cal-bg-subtle": brand.paper,
      "cal-bg-muted": "#ECECEC",
      "cal-bg-inverted": brand.charcoal,
      "cal-bg-attention": brand.orangeSoft,
      "cal-border": brand.lightGray,
      "cal-border-emphasis": brand.charcoal,
      "cal-border-subtle": brand.lightGray,
      "cal-border-muted": "#ECECEC",
      "cal-border-booker": brand.lightGray,
      "cal-border-booker-width": "1px",
      radius: "2px",
    },
    dark: {
      "cal-brand": brand.orange,
      "cal-brand-emphasis": brand.orangeDark,
      "cal-brand-text": "#FFFFFF",
      "cal-text": brand.cream,
      "cal-text-emphasis": brand.cream,
      "cal-bg": brand.cream,
      "cal-bg-emphasis": brand.orangeSoft,
      "cal-border-booker": brand.lightGray,
      "cal-border-booker-width": "1px",
      radius: "2px",
    },
  },
};
