import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StageView } from "@/components/flow/StageView";
import { isStage } from "@/lib/flow/schema";

export default async function StagePage({ params }: PageProps<"/flow/[id]/[stage]">) {
  const { stage } = await params;
  if (!isStage(stage)) notFound();
  return (
    <Suspense fallback={null}>
      <StageView stage={stage} />
    </Suspense>
  );
}
