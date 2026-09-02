import type { Metadata } from "next";
import { ToastProvider } from "@/components/loop/Toast";
import { routeMeta, routePageMeta } from "@/lib/seo";
import "../loop.css";

export const metadata: Metadata = routePageMeta(routeMeta.flow);

export default function FlowLayout({ children }: LayoutProps<"/flow">) {
  return <ToastProvider>{children}</ToastProvider>;
}
