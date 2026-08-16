import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.talkToUs);

export default function TalkToUsRedirect() {
  redirect("/loopscan");
}
