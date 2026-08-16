import type { Metadata } from "next";
import { KnowDemo } from "@/components/know/KnowDemo";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.know);

export default function KnowPage() {
  return <KnowDemo />;
}
