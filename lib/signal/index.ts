import { analyzeOpenOrders } from "@/lib/signal/engine";
import { interpretOrder } from "@/lib/signal/interpret";
import { parsePoCsv, rowCountBucket } from "@/lib/signal/parse";
import { buildSampleRows } from "@/lib/signal/sample";
import { todayStamp } from "@/lib/signal/dates";
import { SAMPLE_AS_OF_DATE } from "@/lib/sample-as-of";
import { buildDashboard } from "@/lib/signal/view";
import type {
  RawPoRow,
  SignalAnalysisResult,
  SignalMeta,
} from "@/lib/signal/types";

export { SIGNAL_LIMITS, SignalClientError } from "@/lib/signal/types";
export { buildSampleCsv } from "@/lib/signal/sample";
export { todayStamp } from "@/lib/signal/dates";
export { SAMPLE_AS_OF_DATE, formatSampleAsOf } from "@/lib/sample-as-of";
export type { SignalInterpretationRequest } from "@/lib/signal/ai";

function runAnalysis(
  rows: RawPoRow[],
  metaInput: Omit<SignalMeta, "openCount" | "receivedCount">,
): SignalAnalysisResult {
  const asOfDate = metaInput.asOfDate;
  const engine = analyzeOpenOrders(rows, asOfDate);
  const orders = engine.orders.map(interpretOrder);

  return {
    ok: true,
    meta: {
      source: metaInput.source,
      asOfDate,
      rowCount: metaInput.rowCount,
      openCount: orders.length,
      receivedCount: engine.receivedCount,
      skippedRowCount: metaInput.skippedRowCount,
      hasInventoryFields: metaInput.hasInventoryFields,
      hasBuyer: metaInput.hasBuyer,
      hasCostFields: metaInput.hasCostFields,
      rowCountBucket: metaInput.rowCountBucket,
    },
    orders,
    dashboard: buildDashboard(orders),
  };
}

export function analyzeSample(): SignalAnalysisResult {
  const asOfDate = SAMPLE_AS_OF_DATE;
  const rows = buildSampleRows(asOfDate);
  return runAnalysis(rows, {
    source: "sample",
    asOfDate,
    rowCount: rows.length,
    skippedRowCount: 0,
    hasInventoryFields: true,
    hasBuyer: true,
    hasCostFields: true,
    rowCountBucket: rowCountBucket(rows.length),
  });
}

export function analyzeCsvText(text: string): SignalAnalysisResult {
  const asOfDate = todayStamp();
  const parsed = parsePoCsv(text);
  return runAnalysis(parsed.rows, {
    source: "upload",
    asOfDate,
    rowCount: parsed.sourceRowCount,
    skippedRowCount: parsed.skippedRowCount,
    hasInventoryFields: parsed.hasInventoryFields,
    hasBuyer: parsed.hasBuyer,
    hasCostFields: parsed.hasCostFields,
    rowCountBucket: rowCountBucket(parsed.sourceRowCount),
  });
}
