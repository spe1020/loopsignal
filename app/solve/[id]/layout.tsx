import { InvestigationShell } from "@/components/solve/InvestigationShell";

export default async function InvestigationLayout({ children, params }: LayoutProps<"/solve/[id]">) {
  const { id } = await params;
  return <InvestigationShell id={id}>{children}</InvestigationShell>;
}
