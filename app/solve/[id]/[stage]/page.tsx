import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StageView } from "@/components/solve/StageView";
import { isStage } from "@/lib/solve/schema";

export default async function StagePage({ params }: PageProps<"/solve/[id]/[stage]">) {
  const { stage } = await params;
  if (!isStage(stage)) notFound();
  return (
    <Suspense fallback={null}>
      <StageView stage={stage} />
    </Suspense>
  );
}
