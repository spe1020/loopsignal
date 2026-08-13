import { deliverLead, parseLoopScanLead } from "@/lib/leads";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Please complete the form and try again." },
      { status: 400 },
    );
  }

  if (
    body &&
    typeof body === "object" &&
    "company_website" in body &&
    String((body as { company_website?: string }).company_website ?? "")
      .trim()
      .length > 0
  ) {
    return Response.json({ ok: true });
  }

  const parsed = parseLoopScanLead(body);
  if (typeof parsed === "string") {
    return Response.json({ error: parsed }, { status: 400 });
  }

  try {
    await deliverLead(parsed);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[loopscan] lead delivery failed", error);
    return Response.json(
      {
        error:
          "We couldn’t send that just now. Please try again in a moment.",
      },
      { status: 502 },
    );
  }
}
