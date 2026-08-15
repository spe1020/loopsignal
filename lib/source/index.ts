import {
  compareQuotes,
  defaultSecondaryId,
  demandBucket,
} from "./engine";
import { getSampleScenario } from "./quotes";
import type {
  ComparisonResult,
  OptimizationMode,
  ScenarioSettings,
  SourceMode,
  DualSplit,
} from "./types";

export {
  calculateCost,
  compareQuotes,
  defaultSecondaryId,
  demandBucket,
  formatMoney,
  formatUnits,
  round2,
  SCORE_WEIGHTS,
  unitPriceForVolume,
} from "./engine";
export { interpretSupplier, recommendCopy } from "./interpret";
export {
  defaultDemand,
  getSampleScenario,
  rfqScenario,
  sampleScenarios,
  supplierQuotes,
} from "./quotes";
export type { SourceInterpretationRequest } from "./ai";
export type {
  CategoryScores,
  ComparisonResult,
  CostResult,
  DualSourceView,
  DualSplit,
  OptimizationMode,
  RankedSupplier,
  RfqScenario,
  ScenarioSettings,
  SourceMode,
  SupplierNarrative,
  SupplierQuote,
} from "./types";
export {
  demandPresets,
  dualSplits,
  modeLabels,
  optimizationModes,
  qualificationLabels,
  splitShares,
} from "./types";

export const defaultSettings: ScenarioSettings = {
  demand: 12000,
  priority: "balanced",
  sourceMode: "single",
  dualSplit: "80/20",
};

export function runSampleComparison(
  settings: ScenarioSettings = defaultSettings,
): ComparisonResult {
  const sample = getSampleScenario();
  return compareQuotes(sample.rfq, sample.quotes, settings);
}

export function withDefaultSecondary(
  result: ComparisonResult,
  sourceMode: SourceMode,
  dualSplit: DualSplit,
  secondaryId?: string,
): ComparisonResult {
  if (sourceMode !== "dual") return result;
  const nextSecondary = secondaryId ?? defaultSecondaryId(result.ranked);
  if (nextSecondary === result.dual?.secondaryId && dualSplit === result.dual?.split) {
    return result;
  }
  return compareQuotes(result.rfq, result.ranked.map((item) => item.quote), {
    ...result.settings,
    sourceMode,
    dualSplit,
    secondaryId: nextSecondary,
  });
}

export function scenarioMeta(input: {
  priority: OptimizationMode;
  demand: number;
  sourceMode: SourceMode;
  rank?: number;
}) {
  return {
    sample_scenario: "machined_aluminum_bracket",
    optimization_mode: input.priority,
    demand_bucket: demandBucket(input.demand),
    source_mode: input.sourceMode,
    selected_supplier_rank: input.rank,
  };
}
