import type { Metadata } from "next";
import { KnowDemo } from "@/components/know/KnowDemo";

export const metadata: Metadata = {
  title: "LoopKnow | Manufacturing Knowledge Demo",
  description:
    "Ask a question against fictional manufacturing documents and see a cited, revision-aware answer. A LoopSignal demo of operational knowledge systems.",
  alternates: { canonical: "/know" },
  openGraph: {
    title: "LoopKnow | Manufacturing Knowledge Demo",
    description:
      "Turn SOPs, specifications, and quality records into answers your team can verify.",
    url: "/know",
  },
};

export default function KnowPage() {
  return <KnowDemo />;
}
