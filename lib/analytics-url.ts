/** Drop private or unparseable events and omit query/fragment data from telemetry. */
export function filterAnalyticsEvent<T extends { url: string }>(
  event: T,
  pageUrl: string,
): T | null {
  try {
    const page = new URL(pageUrl);
    const url = new URL(event.url, page.origin);
    if (
      page.pathname.startsWith("/company") ||
      url.pathname.startsWith("/company") ||
      !["http:", "https:"].includes(url.protocol)
    )
      return null;
    return { ...event, url: `${url.origin}${url.pathname}` };
  } catch {
    return null;
  }
}
