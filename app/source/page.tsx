import type { Metadata } from "next";
import { SourceDemo } from "@/components/source/SourceDemo";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.source);

export default function SourcePage() {
  return <SourceDemo />;
}
