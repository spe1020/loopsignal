import type { Metadata } from "next";
import { SignalDemo } from "@/components/signal/SignalDemo";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.supply);

export default function SupplyPage() {
  return <SignalDemo />;
}
