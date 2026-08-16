import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.firstLoop);

export default function FirstLoopRedirect() {
  redirect("/loopscan");
}
