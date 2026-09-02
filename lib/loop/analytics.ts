import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

/**
 * Loop tools send only the event name, an optional stage/mode string from a
 * closed list, and finite numeric counts. Never free text.
 */
export function trackTool<E extends AnalyticsEvent>(
  event: E,
  props: Record<string, number | string | undefined> = {},
  stringKeys: readonly string[] = ["stage"],
) {
  const safe: Record<string, number | string> = {};
  for (const [k, v] of Object.entries(props)) {
    if (stringKeys.includes(k) && typeof v === "string") safe[k] = v;
    else if (typeof v === "number" && Number.isFinite(v)) safe[k] = v;
  }
  trackEvent(event, safe);
}
