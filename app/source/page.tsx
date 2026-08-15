import type { Metadata } from "next";
import { SourceDemo } from "@/components/source/SourceDemo";

export const metadata: Metadata = {
  title: "LoopSource | Supplier Quote Comparison Demo",
  description:
    "Compare fictional supplier quotes by landed cost, lead time, commercial terms, and risk — not unit price alone. A LoopWorks sourcing decision demo.",
  alternates: { canonical: "/source" },
  openGraph: {
    title: "LoopSource | Supplier Quote Comparison Demo",
    description:
      "Compare the quote. Understand the tradeoff. LoopSource turns supplier quotes into a normalized sourcing comparison.",
    url: "/source",
  },
};

export default function SourcePage() {
  return <SourceDemo />;
}
