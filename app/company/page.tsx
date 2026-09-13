import type { Metadata } from "next";
import { CompanyWorkspace } from "@/components/company/CompanyWorkspace";
import "./workspace.css";
export const metadata: Metadata = {
  title: "Private company workspace | LoopSignal",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <CompanyWorkspace />;
}
