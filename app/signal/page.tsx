import { permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.signal);

export default function SignalRedirect() {
  permanentRedirect("/supply");
}
