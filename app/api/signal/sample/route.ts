import { buildSampleCsv, todayStamp } from "@/lib/signal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const csv = buildSampleCsv(todayStamp());

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="loopsignal-open-po-sample.csv"',
      "Cache-Control": "no-store",
    },
  });
}
