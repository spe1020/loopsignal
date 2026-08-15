import type { Metadata } from "next";
import { SignalDemo } from "@/components/signal/SignalDemo";

export const metadata: Metadata = {
  title: "LoopSupply | Open PO Supply Risk Demo",
  description:
    "Upload an open purchase-order CSV and see which supplier and material orders may need attention first. A LoopSignal demo — no ERP integration required.",
  alternates: { canonical: "/supply" },
  openGraph: {
    title: "LoopSupply | Open PO Supply Risk Demo",
    description:
      "Turn purchasing, supplier, inventory, and open-order information into clear priorities and action.",
    url: "/supply",
  },
};

export default function SupplyPage() {
  return <SignalDemo />;
}
