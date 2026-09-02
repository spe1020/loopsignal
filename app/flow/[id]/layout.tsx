import { FlowShell } from "@/components/flow/FlowShell";

export default async function MapLayout({ children, params }: LayoutProps<"/flow/[id]">) {
  const { id } = await params;
  return <FlowShell id={id}>{children}</FlowShell>;
}
