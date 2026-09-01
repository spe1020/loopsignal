import { redirect } from "next/navigation";

export default async function InvestigationIndex({ params }: PageProps<"/solve/[id]">) {
  const { id } = await params;
  redirect(`/solve/${id}/problem`);
}
