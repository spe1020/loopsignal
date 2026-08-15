import type { Metadata } from "next";
import { SignalDemo } from "@/components/signal/SignalDemo";

export const metadata: Metadata = {
  title: "LoopSignal | Open PO Supply Risk Demo",
  description:
    "Upload an open purchase-order CSV and see which supplier and material orders may need attention first. A LoopWorks demo — no ERP integration required.",
  alternates: { canonical: "/signal" },
  openGraph: {
    title: "LoopSignal | Open PO Supply Risk Demo",
    description:
      "Upload an open purchase-order CSV and see which supplier and material orders may need attention first.",
    url: "/signal",
  },
};

export default function SignalPage() {
  return <SignalDemo />;
}
