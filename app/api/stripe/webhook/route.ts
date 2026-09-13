import { verifyWebhook, webhook } from "@/lib/hosted/billing";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json({ error: "Empty webhook" }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 1048576) {
      await reader.cancel();
      return Response.json({ error: "Webhook too large" }, { status: 413 });
    }
    chunks.push(value);
  }
  let event;
  try {
    event = verifyWebhook(
      Buffer.concat(chunks),
      request.headers.get("stripe-signature"),
    );
  } catch {
    return Response.json(
      { error: "Invalid test webhook signature" },
      { status: 400 },
    );
  }
  try {
    const result = await webhook(event);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Reconciliation pending; retry delivery" },
      { status: 503 },
    );
  }
}
