/** The only fallback when NEXT_PUBLIC_SITE_URL is unset (local dev). */
export const SITE_URL_FALLBACK = "https://www.loopsignal.co";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL_FALLBACK
).replace(/\/$/, "");

/** Absolute URL for a site path. Homepage is the origin with no trailing slash. */
export function absoluteUrl(path: string = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return siteUrl;
  return `${siteUrl}${normalized}`;
}
