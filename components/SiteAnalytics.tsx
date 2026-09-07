"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AttributionCapture } from "@/components/AttributionCapture";

function stripQuery(url: string) {
  try {
    const parsed = new URL(url, window.location.origin);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0]?.split("#")[0] ?? url;
  }
}

export function SiteAnalytics() {
  const pathname = usePathname();
  if (pathname.startsWith("/company")) return null;
  return (
    <>
      <AttributionCapture />
      <Analytics
        beforeSend={(event) => new URL(event.url).pathname.startsWith("/company") ? null : ({
          ...event,
          url: stripQuery(event.url),
        })}
      />
      <SpeedInsights />
    </>
  );
}
