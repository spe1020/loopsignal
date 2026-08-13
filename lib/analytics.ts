export type AnalyticsPayload = Record<
  string,
  string | number | boolean | undefined
>;

type AnalyticsWindow = Window & {
  va?: (action: string, name: string, data?: AnalyticsPayload) => void;
  gtag?: (...args: unknown[]) => void;
  dataLayer?: Record<string, unknown>[];
};

export function track(event: string, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;

  const data = payload ?? {};
  const w = window as AnalyticsWindow;

  w.dispatchEvent(
    new CustomEvent("loopworks:analytics", { detail: { event, data } }),
  );
  w.va?.("event", event, data);
  w.gtag?.("event", event, data);
  w.dataLayer?.push({ event, ...data });
}

export function getUtmParams() {
  if (typeof window === "undefined") {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
    utm_content: params.get("utm_content") ?? undefined,
    utm_term: params.get("utm_term") ?? undefined,
  };
}
