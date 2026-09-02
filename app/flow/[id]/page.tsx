import { redirect } from "next/navigation";

export default async function MapIndex({ params }: PageProps<"/flow/[id]">) {
  const { id } = await params;
  redirect(`/flow/${id}/scope`);
}
