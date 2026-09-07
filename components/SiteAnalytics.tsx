"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AttributionCapture } from "@/components/AttributionCapture";
import { filterAnalyticsEvent } from "@/lib/analytics-url";

function beforeSend<T extends { url: string }>(event: T) {
  return typeof window === "undefined"
    ? null
    : filterAnalyticsEvent(event, window.location.href);
}

export function SiteAnalytics() {
  const pathname = usePathname();
  if (pathname.startsWith("/company")) return null;
  return (
    <>
      <AttributionCapture />
      <Analytics beforeSend={beforeSend} />
      <SpeedInsights beforeSend={beforeSend} />
    </>
  );
}
