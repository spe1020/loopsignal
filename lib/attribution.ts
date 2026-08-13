export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export type ReferringSource =
  | "linkedin"
  | "google"
  | "direct"
  | "referral"
  | "email"
  | "other";

export type StoredAttribution = {
  landingPage: string;
  referrer?: string;
  referringSource: ReferringSource;
  firstVisitAt: string;
  capturedAt: string;
  utm: UtmParams;
};

export type LeadAttribution = {
  landingPage?: string;
  referringSource?: ReferringSource;
  referrer?: string;
  firstVisitAt?: string;
  utm: UtmParams;
};

const STORAGE_KEY = "lw_attr_v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const UTM_PATTERN = /^[a-zA-Z0-9._-]{1,80}$/;

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const REFERRING_SOURCES: ReferringSource[] = [
  "linkedin",
  "google",
  "direct",
  "referral",
  "email",
  "other",
];

export function sanitizeUtmValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!UTM_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

export function sanitizePath(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;

  try {
    if (value.startsWith("/")) {
      return value.split("?")[0].split("#")[0].slice(0, 200) || "/";
    }
    return new URL(value).pathname.slice(0, 200) || "/";
  } catch {
    return undefined;
  }
}

export function sanitizeReferrerUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;

  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.slice(0, 300);
  } catch {
    return undefined;
  }
}

export function sanitizeReferringSource(
  value: unknown,
): ReferringSource | undefined {
  if (typeof value !== "string") return undefined;
  return REFERRING_SOURCES.includes(value as ReferringSource)
    ? (value as ReferringSource)
    : undefined;
}

export function sanitizeIsoTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 40) return undefined;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return undefined;
  return new Date(time).toISOString();
}

export function sanitizeUtm(input: unknown): UtmParams {
  const source =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};

  return {
    utm_source: sanitizeUtmValue(source.utm_source),
    utm_medium: sanitizeUtmValue(source.utm_medium),
    utm_campaign: sanitizeUtmValue(source.utm_campaign),
    utm_content: sanitizeUtmValue(source.utm_content),
    utm_term: sanitizeUtmValue(source.utm_term),
  };
}

export function normalizeReferrer(referrer: string, currentOrigin: string): {
  referrer?: string;
  referringSource: ReferringSource;
} {
  if (!referrer) {
    return { referringSource: "direct" };
  }

  try {
    const url = new URL(referrer);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const stripped = `${url.origin}${url.pathname}`.slice(0, 300);

    if (url.origin === currentOrigin) {
      return { referrer: stripped, referringSource: "direct" };
    }

    if (host.includes("linkedin.com") || host === "lnkd.in") {
      return { referrer: stripped, referringSource: "linkedin" };
    }
    if (host.includes("google.")) {
      return { referrer: stripped, referringSource: "google" };
    }
    if (
      host.includes("mail.") ||
      host.includes("outlook.") ||
      host.includes("yahoo.com")
    ) {
      return { referrer: stripped, referringSource: "email" };
    }

    return { referrer: stripped, referringSource: "referral" };
  } catch {
    return { referringSource: "other" };
  }
}

function readUtmFromSearch(search: string): UtmParams {
  const params = new URLSearchParams(search);
  const utm: UtmParams = {};

  for (const key of UTM_KEYS) {
    const value = sanitizeUtmValue(params.get(key));
    if (value) utm[key] = value;
  }

  return utm;
}

function readStored(): StoredAttribution | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAttribution;
    const capturedAt = Date.parse(parsed.capturedAt);
    if (Number.isNaN(capturedAt) || Date.now() - capturedAt > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(value: StoredAttribution) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private browsing or blocked storage should not break the site.
  }
}

export function captureAttribution() {
  if (typeof window === "undefined") return;

  const existing = readStored();
  if (existing) return;

  const utm = readUtmFromSearch(window.location.search);
  const { referrer, referringSource } = normalizeReferrer(
    document.referrer,
    window.location.origin,
  );
  const now = new Date().toISOString();

  writeStored({
    landingPage: window.location.pathname || "/",
    referrer,
    referringSource,
    firstVisitAt: now,
    capturedAt: now,
    utm,
  });
}

export function getStoredAttribution(): StoredAttribution | null {
  return readStored();
}

export function getLeadAttribution(): LeadAttribution {
  const stored = readStored();
  if (!stored) {
    return { utm: {} };
  }

  return {
    landingPage: stored.landingPage,
    referringSource: stored.referringSource,
    referrer: stored.referrer,
    firstVisitAt: stored.firstVisitAt,
    utm: stored.utm,
  };
}

export function getUtmParams(): UtmParams {
  return getLeadAttribution().utm;
}

export function getReferringPage(): string | undefined {
  if (typeof window === "undefined") return undefined;
  if (!document.referrer) return undefined;

  try {
    const url = new URL(document.referrer);
    if (url.origin === window.location.origin) {
      return url.pathname || "/";
    }
    return normalizeReferrer(document.referrer, window.location.origin)
      .referringSource;
  } catch {
    return undefined;
  }
}
