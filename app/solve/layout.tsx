import type { Metadata } from "next";
import { ToastProvider } from "@/components/solve/Toast";
import { routeMeta, routePageMeta } from "@/lib/seo";
import "./solve.css";

export const metadata: Metadata = routePageMeta(routeMeta.solve);

export default function SolveLayout({ children }: LayoutProps<"/solve">) {
  return <ToastProvider>{children}</ToastProvider>;
}
