import type {
  CategoryScores,
  ColumnHighlight,
  ComparisonResult,
  CostResult,
  DualSourceView,
  DualSplit,
  HighlightBadge,
  OptimizationMode,
  RankedSupplier,
  RequirementCheck,
  RiskFlag,
  RfqScenario,
  ScenarioSettings,
  ScoreWeights,
  SupplierQuote,
} from "./types";
import { splitShares } from "./types";

export const SCORE_WEIGHTS: Record<OptimizationMode, ScoreWeights> = {
  balanced: { cost: 0.3, delivery: 0.25, risk: 0.25, flexibility: 0.2 },
  cost: { cost: 0.7, delivery: 0.1, risk: 0.1, flexibility: 0.1 },
  lead_time: { cost: 0.1, delivery: 0.65, risk: 0.15, flexibility: 0.1 },
  risk: { cost: 0.1, delivery: 0.15, risk: 0.6, flexibility: 0.15 },
  startup_flexibility: {
    cost: 0.1,
    delivery: 0.15,
    risk: 0.15,
    flexibility: 0.6,
  },
};

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatMoney(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatUnits(value: number): string {
  return value.toLocaleString("en-US");
}

export function demandBucket(demand: number): string {
  if (demand <= 5000) return "5000";
  if (demand <= 12000) return "12000";
  if (demand <= 25000) return "25000";
  return "50000";
}

export function unitPriceForVolume(
  quote: SupplierQuote,
  demand: number,
): number {
  const breaks = [...quote.priceBreaks].sort((a, b) => a.minQty - b.minQty);
  let price = quote.unitPrice;
  for (const item of breaks) {
    if (demand >= item.minQty) price = item.unitPrice;
  }
  return price;
}

export function calculateCost(quote: SupplierQuote, demand: number): CostResult {
  const unitPrice = unitPriceForVolume(quote, demand);
  const annualPieceCost = round2(demand * unitPrice);
  const tooling = quote.tooling;
  const toolingPerUnit = demand > 0 ? round2(tooling / demand) : tooling;

  let freightAmount: number | null = null;
  let freightLabel = "Not provided";
  let freightComplete = false;

  if (quote.freight.kind === "included") {
    freightAmount = 0;
    freightLabel = "Included";
    freightComplete = true;
  } else if (quote.freight.kind === "per_unit") {
    freightAmount = round2(demand * quote.freight.amount);
    freightLabel = `${formatMoney(quote.freight.amount)} per unit`;
    freightComplete = true;
  } else if (quote.freight.kind === "annual") {
    freightAmount = quote.freight.amount;
    freightLabel = `${formatMoney(quote.freight.amount)} annual estimate`;
    freightComplete = true;
  } else {
    freightLabel = "Not included — landed cost incomplete";
  }

  const knownFreight = freightAmount ?? 0;
  const firstYearCost = round2(annualPieceCost + tooling + knownFreight);
  const effectiveUnitCost = demand > 0 ? round2(firstYearCost / demand) : firstYearCost;

  return {
    unitPrice,
    annualPieceCost,
    tooling,
    toolingPerUnit,
    freightAmount,
    freightLabel,
    freightComplete,
    firstYearCost,
    effectiveUnitCost,
  };
}

function daysUntil(from: string, until: string): number {
  const start = Date.parse(`${from}T00:00:00`);
  const end = Date.parse(`${until}T00:00:00`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 999;
  return Math.round((end - start) / 86_400_000);
}

export function evaluateFlags(
  quote: SupplierQuote,
  rfq: RfqScenario,
  demand: number,
  cost: CostResult,
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const validityDays = daysUntil(rfq.quoteAsOf, quote.quoteValidThrough);
  const toolingHigh = quote.tooling >= 5000;

  if (!cost.freightComplete) {
    flags.push({
      code: "freight_missing",
      label: "Freight Missing",
      detail: "Freight is not included and no estimate was provided.",
      severity: "red",
      category: "commercial",
    });
    flags.push({
      code: "landed_cost_incomplete",
      label: "Landed Cost Incomplete",
      detail: "First-year cost excludes freight because none was quoted.",
      severity: "amber",
      category: "commercial",
    });
  }

  if (toolingHigh) {
    flags.push({
      code: "tooling_high",
      label: "Tooling High",
      detail: `${formatMoney(quote.tooling, 0)} tooling increases first-year cost.`,
      severity: "amber",
      category: "commercial",
    });
  }

  if (quote.moq > rfq.initialRelease) {
    flags.push({
      code: "moq_above_initial",
      label: "MOQ Above Initial Release",
      detail: `MOQ of ${formatUnits(quote.moq)} exceeds the ${formatUnits(rfq.initialRelease)}-piece initial release.`,
      severity: "amber",
      category: "commercial",
    });
  }

  if (validityDays <= 21) {
    flags.push({
      code: "quote_expiring_soon",
      label: "Quote Expiring Soon",
      detail: `Quote is valid through ${quote.quoteValidThrough}.`,
      severity: "amber",
      category: "commercial",
    });
  }

  if (quote.leadWeeks > rfq.requiredLeadWeeks) {
    flags.push({
      code: "lead_time_above_requirement",
      label: "Lead Time Above Requirement",
      detail: `${quote.leadWeeks} weeks quoted vs ${rfq.requiredLeadWeeks} weeks required.`,
      severity: "red",
      category: "delivery",
    });
  }

  if (quote.annualCapacity < demand) {
    flags.push({
      code: "capacity_below_demand",
      label: "Capacity Below Annual Demand",
      detail: `${formatUnits(quote.annualCapacity)}/year quoted vs ${formatUnits(demand)} demand.`,
      severity: "red",
      category: "delivery",
    });
  } else if (quote.annualCapacity < demand * 1.35) {
    flags.push({
      code: "capacity_confirmation",
      label: "Capacity Review",
      detail: "Quoted capacity is close to annual demand and should be confirmed.",
      severity: "amber",
      category: "delivery",
    });
  }

  if (quote.qualification === "new") {
    flags.push({
      code: "new_supplier",
      label: "New Supplier",
      detail: "Supplier is not yet qualified for production.",
      severity: "red",
      category: "qualification",
    });
    flags.push({
      code: "sample_required",
      label: "Sample Required",
      detail: `Sample lead time is ${quote.sampleLeadWeeks} weeks.`,
      severity: "amber",
      category: "qualification",
    });
  }

  if (quote.qualification === "conditional") {
    flags.push({
      code: "conditional_qualification",
      label: "Conditional Qualification",
      detail: "Production use depends on completing the remaining qualification step.",
      severity: "amber",
      category: "qualification",
    });
  }

  return flags;
}

export function evaluateRequirements(
  quote: SupplierQuote,
  rfq: RfqScenario,
  demand: number,
): RequirementCheck[] {
  return [
    {
      code: "lead_time",
      label: "Required lead time",
      required: `${rfq.requiredLeadWeeks} weeks`,
      quoted: `${quote.leadWeeks} weeks`,
      meets: quote.leadWeeks <= rfq.requiredLeadWeeks,
      detail:
        quote.leadWeeks <= rfq.requiredLeadWeeks
          ? undefined
          : `${quote.leadWeeks} weeks quoted vs ${rfq.requiredLeadWeeks} weeks required.`,
    },
    {
      code: "capacity",
      label: "Minimum required capacity",
      required: `${formatUnits(demand)}/year`,
      quoted: `${formatUnits(quote.annualCapacity)}/year`,
      meets: quote.annualCapacity >= demand,
      detail:
        quote.annualCapacity >= demand
          ? undefined
          : `${formatUnits(quote.annualCapacity)}/year quoted vs ${formatUnits(demand)} demand.`,
    },
    {
      code: "moq",
      label: "Initial release",
      required: `${formatUnits(rfq.initialRelease)} pieces`,
      quoted: `MOQ ${formatUnits(quote.moq)}`,
      meets: quote.moq <= rfq.initialRelease,
      detail:
        quote.moq <= rfq.initialRelease
          ? undefined
          : `MOQ of ${formatUnits(quote.moq)} exceeds the ${formatUnits(rfq.initialRelease)}-piece initial release.`,
    },
  ];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function relativeLowScore(value: number, best: number, penaltyPerUnit: number) {
  return clamp(100 - Math.max(0, value - best) * penaltyPerUnit);
}

function paymentScore(days: number): number {
  if (days >= 60) return 100;
  if (days >= 45) return 78;
  if (days >= 30) return 55;
  return 35;
}

function scoreQuote(
  quote: SupplierQuote,
  rfq: RfqScenario,
  demand: number,
  cost: CostResult,
  flags: RiskFlag[],
  costRange: { min: number; max: number },
  toolingRange: { min: number; max: number },
  weights: ScoreWeights,
  priority: OptimizationMode,
): CategoryScores {
  const costUnit = relativeLowScore(
    cost.effectiveUnitCost,
    costRange.min,
    55,
  );
  const tooling = relativeLowScore(quote.tooling, toolingRange.min, 0.006);
  const payment = paymentScore(quote.paymentDays);
  let costScore = costUnit * 0.7 + tooling * 0.15 + payment * 0.15;
  if (!cost.freightComplete) costScore -= 6;
  if (quote.moq > demand) costScore -= 18;
  else if (quote.moq > rfq.initialRelease) costScore -= 6;

  const leadDelta = quote.leadWeeks - 3;
  let leadScore = clamp(100 - leadDelta * 14);
  if (quote.leadWeeks > rfq.requiredLeadWeeks) leadScore = Math.min(leadScore, 32);
  let capacityScore = 100;
  if (quote.annualCapacity < demand) capacityScore = 12;
  else if (quote.annualCapacity < demand * 1.35) capacityScore = 58;
  else if (quote.annualCapacity < demand * 1.6) capacityScore = 82;
  const leadWeight = priority === "lead_time" ? 0.85 : 0.6;
  const deliveryScore = leadScore * leadWeight + capacityScore * (1 - leadWeight);

  let riskScore = 100;
  if (quote.qualification === "new") riskScore -= 42;
  if (quote.qualification === "conditional") riskScore -= 32;
  if (flags.some((flag) => flag.code === "freight_missing")) riskScore -= 16;
  if (flags.some((flag) => flag.code === "capacity_below_demand")) riskScore -= 30;
  if (flags.some((flag) => flag.code === "lead_time_above_requirement")) {
    riskScore -= 18;
  }
  if (flags.some((flag) => flag.code === "moq_above_initial")) riskScore -= 10;
  if (flags.some((flag) => flag.code === "quote_expiring_soon")) riskScore -= 8;
  if (flags.some((flag) => flag.code === "capacity_confirmation")) riskScore -= 6;

  let moqFlex = 40;
  if (quote.moq <= rfq.initialRelease / 2) moqFlex = 100;
  else if (quote.moq <= rfq.initialRelease) moqFlex = 82;
  else if (quote.moq <= demand) moqFlex = 42;
  else moqFlex = 12;

  let toolingFlex = 40;
  if (quote.tooling === 0) toolingFlex = 100;
  else if (quote.tooling <= 2500) toolingFlex = 78;
  else if (quote.tooling <= 4000) toolingFlex = 52;
  else toolingFlex = 22;

  let sampleFlex = 40;
  if (quote.sampleLeadWeeks <= 1) sampleFlex = 100;
  else if (quote.sampleLeadWeeks <= 2) sampleFlex = 80;
  else if (quote.sampleLeadWeeks <= 3) sampleFlex = 58;
  else sampleFlex = 28;

  const initialSupport = quote.moq <= rfq.initialRelease ? 90 : 25;
  const flexibilityScore =
    moqFlex * 0.35 + toolingFlex * 0.3 + sampleFlex * 0.2 + initialSupport * 0.15;

  const costFinal = clamp(costScore);
  const deliveryFinal = clamp(deliveryScore);
  const riskFinal = clamp(riskScore);
  const flexibilityFinal = clamp(flexibilityScore);
  let overall =
    costFinal * weights.cost +
    deliveryFinal * weights.delivery +
    riskFinal * weights.risk +
    flexibilityFinal * weights.flexibility;
  if (quote.annualCapacity < demand) overall -= 30;
  if (quote.leadWeeks > rfq.requiredLeadWeeks) overall -= 4;
  if (
    quote.qualification === "qualified" &&
    cost.freightComplete &&
    quote.annualCapacity >= demand * 1.5 &&
    quote.leadWeeks <= rfq.requiredLeadWeeks &&
    quote.moq <= rfq.initialRelease
  ) {
    overall += 3;
  }

  return {
    cost: costFinal,
    delivery: deliveryFinal,
    risk: riskFinal,
    flexibility: flexibilityFinal,
    overall: clamp(overall),
  };
}

function hasFlag(flags: RiskFlag[], code: RiskFlag["code"]): boolean {
  return flags.some((flag) => flag.code === code);
}

function buildHighlights(
  quote: SupplierQuote,
  flags: RiskFlag[],
  column: ColumnHighlight,
): HighlightBadge[] {
  const badges: HighlightBadge[] = [];

  if (quote.qualification === "qualified") {
    badges.push({ label: "Qualified", tone: "green" });
  } else if (quote.qualification === "conditional") {
    badges.push({ label: "Conditional", tone: "amber" });
  } else {
    badges.push({ label: "New Supplier", tone: "red" });
  }

  if (hasFlag(flags, "capacity_below_demand")) {
    badges.push({ label: "Capacity Risk", tone: "red" });
  } else if (hasFlag(flags, "capacity_confirmation")) {
    badges.push({ label: "Capacity Review", tone: "amber" });
  }

  if (hasFlag(flags, "lead_time_above_requirement")) {
    badges.push({ label: "Lead-Time Risk", tone: "red" });
  }

  if (quote.id === column.effectiveCostId) {
    badges.push({ label: "Best Cost", tone: "blue" });
  }

  return badges.slice(0, 3);
}

function keyConcern(quote: SupplierQuote, flags: RiskFlag[]): string {
  if (hasFlag(flags, "capacity_below_demand")) {
    return "Quoted capacity is below annual demand.";
  }
  if (hasFlag(flags, "lead_time_above_requirement")) {
    return `${quote.leadWeeks}-week lead time misses the required window.`;
  }
  if (hasFlag(flags, "freight_missing")) {
    return "Freight is not included, so landed cost is incomplete.";
  }
  if (hasFlag(flags, "new_supplier")) {
    return "Supplier is not yet qualified.";
  }
  if (hasFlag(flags, "moq_above_initial")) {
    return "MOQ exceeds the initial release quantity.";
  }
  if (hasFlag(flags, "conditional_qualification")) {
    return "Qualification is still conditional.";
  }
  if (hasFlag(flags, "capacity_confirmation")) {
    return "Capacity should be confirmed before award.";
  }
  if (quote.tooling > 0) {
    return "Tooling is required before production.";
  }
  return "No major commercial gap in the quoted terms.";
}

function rankReason(
  quote: SupplierQuote,
  rank: number,
  scores: CategoryScores,
  flags: RiskFlag[],
  demand: number,
): string {
  if (rank === 1) {
    return `${quote.name} ranks first at ${formatUnits(demand)} units because the weighted score favors its mix of first-year cost, delivery, risk, and flexibility.`;
  }
  const weak =
    scores.risk <= scores.cost && scores.risk <= scores.delivery
      ? "risk"
      : scores.delivery <= scores.cost
        ? "delivery"
        : "cost";
  const flagNote = flags[0] ? ` ${flags[0].label} is the primary constraint.` : "";
  return `${quote.name} ranks #${rank} because ${weak} is the weaker category in this scenario.${flagNote}`;
}

function columnHighlights(quotes: SupplierQuote[], costs: Map<string, CostResult>): ColumnHighlight {
  const ids = quotes.map((quote) => quote.id);
  const minBy = (read: (id: string) => number, candidates = ids) =>
    candidates.reduce((best, id) => (read(id) < read(best) ? id : best));
  const maxBy = (read: (id: string) => number) =>
    ids.reduce((best, id) => (read(id) > read(best) ? id : best));
  const completeIds = ids.filter((id) => costs.get(id)?.freightComplete);
  const costIds = completeIds.length > 0 ? completeIds : ids;

  return {
    effectiveCostId: minBy((id) => costs.get(id)?.effectiveUnitCost ?? Infinity, costIds),
    leadTimeId: minBy((id) => quotes.find((quote) => quote.id === id)?.leadWeeks ?? Infinity),
    toolingId: minBy((id) => quotes.find((quote) => quote.id === id)?.tooling ?? Infinity),
    paymentId: maxBy((id) => quotes.find((quote) => quote.id === id)?.paymentDays ?? 0),
  };
}

function buildDualSource(
  ranked: RankedSupplier[],
  split: DualSplit,
  secondaryId: string | undefined,
  demand: number,
): DualSourceView | undefined {
  if (ranked.length < 2) return undefined;
  const primary = ranked[0];
  const secondary =
    ranked.find((item) => item.quote.id === secondaryId && item.quote.id !== primary.quote.id) ??
    ranked.find((item) => item.quote.id !== primary.quote.id);
  if (!secondary) return undefined;

  const [primaryShare, secondaryShare] = splitShares[split];
  const blendedQuotedUnit = round2(
    primary.cost.unitPrice * primaryShare + secondary.cost.unitPrice * secondaryShare,
  );
  const pieceCost =
    demand * primaryShare * primary.cost.unitPrice +
    demand * secondaryShare * secondary.cost.unitPrice;
  const tooling = primary.cost.tooling + secondary.cost.tooling;
  const freight =
    (primary.cost.freightAmount ?? 0) * primaryShare +
    (secondary.cost.freightAmount ?? 0) * secondaryShare;
  const blendedFirstYearCost = round2(pieceCost + tooling + freight);
  const blendedEffectiveUnit = round2(blendedFirstYearCost / demand);

  const benefits = [
    primary.quote.qualification === "qualified"
      ? `Retains ${primary.quote.name} as a qualified primary source.`
      : `Keeps ${primary.quote.name} as the primary award.`,
    `Adds ${secondary.quote.name} as backup capacity.`,
    "Reduces single-source exposure.",
  ];

  const delta = blendedQuotedUnit - primary.cost.unitPrice;
  const tradeoff =
    delta > 0
      ? `Slightly higher quoted unit cost than a single-source award to ${primary.quote.name} (${formatMoney(blendedQuotedUnit)} vs ${formatMoney(primary.cost.unitPrice)}).`
      : `Blended quoted unit cost is ${formatMoney(blendedQuotedUnit)} versus ${formatMoney(primary.cost.unitPrice)} single-source.`;

  return {
    split,
    primaryId: primary.quote.id,
    secondaryId: secondary.quote.id,
    primaryShare,
    secondaryShare,
    blendedQuotedUnit,
    blendedEffectiveUnit,
    blendedFirstYearCost,
    benefits,
    tradeoff,
  };
}

export function compareQuotes(
  rfq: RfqScenario,
  quotes: SupplierQuote[],
  settings: ScenarioSettings,
): ComparisonResult {
  const demand = settings.demand;
  const weights = SCORE_WEIGHTS[settings.priority];
  const costs = new Map(
    quotes.map((quote) => [quote.id, calculateCost(quote, demand)] as const),
  );
  const effectiveCosts = [...costs.values()].map((item) => item.effectiveUnitCost);
  const toolingValues = quotes.map((quote) => quote.tooling);
  const costRange = {
    min: Math.min(...effectiveCosts),
    max: Math.max(...effectiveCosts),
  };
  const toolingRange = {
    min: Math.min(...toolingValues),
    max: Math.max(...toolingValues),
  };
  const highlights = columnHighlights(quotes, costs);

  const prepared = quotes.map((quote) => {
    const cost = costs.get(quote.id)!;
    const flags = evaluateFlags(quote, rfq, demand, cost);
    const requirements = evaluateRequirements(quote, rfq, demand);
    const scores = scoreQuote(
      quote,
      rfq,
      demand,
      cost,
      flags,
      costRange,
      toolingRange,
      weights,
      settings.priority,
    );
    return {
      quote,
      cost,
      scores,
      flags,
      requirements,
      meetsAllRequirements: requirements.every((item) => item.meets),
      highlights: buildHighlights(quote, flags, highlights),
      keyConcern: keyConcern(quote, flags),
    };
  });

  prepared.sort((a, b) => {
    if (b.scores.overall !== a.scores.overall) {
      return b.scores.overall - a.scores.overall;
    }
    const priority = settings.priority;
    if (priority === "cost") {
      return a.cost.effectiveUnitCost - b.cost.effectiveUnitCost;
    }
    if (priority === "lead_time") {
      return b.scores.delivery - a.scores.delivery;
    }
    if (priority === "startup_flexibility") {
      return b.scores.flexibility - a.scores.flexibility;
    }
    if (b.scores.risk !== a.scores.risk) return b.scores.risk - a.scores.risk;
    return a.cost.effectiveUnitCost - b.cost.effectiveUnitCost;
  });

  const ranked: RankedSupplier[] = prepared.map((item, index) => ({
    ...item,
    rank: index + 1,
    rankReason: rankReason(
      item.quote,
      index + 1,
      item.scores,
      item.flags,
      demand,
    ),
  }));

  const dual =
    settings.sourceMode === "dual"
      ? buildDualSource(ranked, settings.dualSplit, settings.secondaryId, demand)
      : undefined;

  return {
    rfq,
    settings,
    ranked,
    recommended: ranked[0],
    columnHighlights: highlights,
    dual,
    weights,
  };
}

export function defaultSecondaryId(ranked: RankedSupplier[]): string | undefined {
  const primaryId = ranked[0]?.quote.id;
  const backup = ranked.find(
    (item) =>
      item.quote.id !== primaryId && item.quote.qualification === "qualified",
  );
  return backup?.quote.id ?? ranked[1]?.quote.id;
}
