import type { Metadata } from "next";
import { BriefDemo } from "@/components/brief/BriefDemo";

export const metadata: Metadata = {
  title: "LoopBrief | Daily Operations Brief Demo",
  description:
    "Turn fictional production, quality, supply, and maintenance signals into a prioritized daily operating brief. A LoopWorks manufacturing command-center demo.",
  alternates: { canonical: "/brief" },
  openGraph: {
    title: "LoopBrief | Daily Operations Brief Demo",
    description:
      "Start the day with what matters. LoopBrief turns plant signals into exceptions, owners, and actions.",
    url: "/brief",
  },
};

export default function BriefPage() {
  return <BriefDemo />;
}
