import type { Metadata } from "next";
import { routePageMeta } from "@/lib/seo";
import { DemoWorkspace } from "@/components/workspace/DemoWorkspace";
export const metadata: Metadata = routePageMeta({
  path: "/workspace",
  title: "Live manufacturing example",
  description:
    "Explore a fictional LoopSignal investigation. Connect evidence, actions, verified results, and approved lessons in one browser-local workspace.",
});
export default function WorkspacePage() {
  return <DemoWorkspace />;
}
