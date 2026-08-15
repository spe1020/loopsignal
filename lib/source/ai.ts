import type {
  CategoryScores,
  DualSplit,
  FlagCode,
  OptimizationMode,
  SourceMode,
} from "./types";

/**
 * Future AI interpretation should receive structured comparison JSON, not
 * raw quote files. Keep landed-cost math, scoring, ranking, MOQ checks,
 * lead-time comparison, and capacity checks in the commercial engine.
 *
 * A later layer can summarize tradeoffs, draft clarification questions,
 * recommend negotiation targets, or write award rationale from this shape.
 */
export type SourceInterpretationRequest = {
  scenarioId: string;
  demand: number;
  priority: OptimizationMode;
  sourceMode: SourceMode;
  dualSplit?: DualSplit;
  ranked: Array<{
    supplierId: string;
    rank: number;
    scores: CategoryScores;
    flags: FlagCode[];
    freightComplete: boolean;
    meetsRequirements: boolean;
  }>;
};

export type FutureQuoteIngest = {
  format: "csv" | "xlsx" | "pdf";
  supplierCount: number;
  extractedFields: string[];
};
