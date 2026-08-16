import type { Metadata } from "next";
import { BriefDemo } from "@/components/brief/BriefDemo";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.brief);

export default function BriefPage() {
  return <BriefDemo />;
}
