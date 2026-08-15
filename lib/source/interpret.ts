import { formatMoney, formatUnits } from "./engine";
import { modeLabels, qualificationLabels } from "./types";
import type {
  ComparisonResult,
  RankedSupplier,
  SourcingAction,
  SupplierNarrative,
} from "./types";

function has(supplier: RankedSupplier, code: string): boolean {
  return supplier.flags.some((flag) => flag.code === code);
}

function unique(items: SourcingAction[]): SourcingAction[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function recommendCopy(
  result: ComparisonResult,
  supplier: RankedSupplier,
): { headline: string; explanation: string } {
  const { settings } = result;
  const demand = formatUnits(settings.demand);
  const mode = modeLabels[settings.priority];
  const cost = supplier.cost;

  if (result.settings.sourceMode === "dual" && result.dual) {
    const primary = result.ranked.find((item) => item.quote.id === result.dual?.primaryId);
    const secondary = result.ranked.find(
      (item) => item.quote.id === result.dual?.secondaryId,
    );
    return {
      headline: `${result.dual.split} dual source`,
      explanation: `A ${result.dual.split} split between ${primary?.quote.name ?? "the primary supplier"} and ${secondary?.quote.name ?? "the backup supplier"} keeps a primary award while adding backup capacity. Blended estimated unit cost is ${formatMoney(result.dual.blendedQuotedUnit)} at ${demand} pieces.`,
    };
  }

  if (supplier.rank === 1) {
    const lowestUnit = Math.min(...result.ranked.map((item) => item.cost.unitPrice));
    const priceLead =
      supplier.cost.unitPrice > lowestUnit
        ? `${supplier.quote.name} is not the lowest quoted unit price, but provides`
        : `${supplier.quote.name} provides`;
    const freight = cost.freightComplete ? "included freight" : "incomplete freight";
    const status = qualificationLabels[supplier.quote.qualification].toLowerCase();
    const capacity =
      supplier.quote.annualCapacity >= settings.demand
        ? "sufficient annual capacity"
        : "capacity that needs review";
    return {
      headline: supplier.quote.name,
      explanation: `${priceLead} the strongest ${mode.toLowerCase()} outcome at ${demand} units based on first-year cost, ${supplier.quote.leadWeeks}-week lead time, ${status}, ${freight}, and ${capacity}.`,
    };
  }

  return {
    headline: supplier.quote.name,
    explanation: supplier.rankReason,
  };
}

export function interpretSupplier(supplier: RankedSupplier, result: ComparisonResult): SupplierNarrative {
  const quote = supplier.quote;
  const cost = supplier.cost;
  const rfq = result.rfq;
  const demand = result.settings.demand;

  const strengths: string[] = [quote.strength];
  if (cost.unitPrice === Math.min(...result.ranked.map((item) => item.cost.unitPrice))) {
    strengths.push("Lowest quoted unit price in this volume scenario.");
  }
  if (quote.id === result.columnHighlights.effectiveCostId) {
    strengths.push(
      `Lowest effective first-year unit cost (${formatMoney(cost.effectiveUnitCost)}).`,
    );
  }
  if (quote.leadWeeks <= rfq.requiredLeadWeeks) {
    strengths.push(`${quote.leadWeeks}-week lead time meets the RFQ requirement.`);
  }
  if (quote.tooling === 0) strengths.push("No tooling or setup charge.");
  if (quote.qualification === "qualified") {
    strengths.push("Existing qualified supplier.");
  }
  if (quote.freight.kind === "included") strengths.push("Freight is included.");
  if (quote.paymentDays >= 45) {
    strengths.push(`${quote.paymentTerms} improves cash timing.`);
  }
  if (quote.annualCapacity >= demand * 1.5) {
    strengths.push("Annual capacity is well above demand.");
  }
  if (quote.moq <= rfq.initialRelease) {
    strengths.push(`MOQ of ${formatUnits(quote.moq)} supports the initial release.`);
  }

  const concerns: string[] = [];
  for (const flag of supplier.flags) {
    concerns.push(flag.detail);
  }
  if (!supplier.meetsAllRequirements) {
    const missed = supplier.requirements.filter((item) => !item.meets);
    for (const item of missed) {
      if (item.detail && !concerns.includes(item.detail)) concerns.push(item.detail);
    }
  }

  const gains: string[] = [];
  const giveUps: string[] = [];

  if (quote.id === result.columnHighlights.effectiveCostId || quote.id === result.columnHighlights.leadTimeId || quote.tooling === 0) {
    if (quote.id === result.columnHighlights.effectiveCostId) {
      gains.push("lowest effective first-year unit cost in this scenario");
    }
    if (quote.unitPrice === Math.min(...result.ranked.map((item) => item.cost.unitPrice))) {
      gains.push("lowest quoted unit cost");
    }
  } else if (quote.unitPrice === Math.min(...result.ranked.map((item) => item.cost.unitPrice))) {
    gains.push("lowest quoted unit cost");
  }

  if (quote.leadWeeks === Math.min(...result.ranked.map((item) => item.quote.leadWeeks))) {
    gains.push("fastest quoted lead time");
  }
  if (quote.tooling === 0) gains.push("no tooling investment");
  if (quote.qualification === "qualified") gains.push("qualified supplier status");
  if (quote.freight.kind === "included") gains.push("freight included");
  if (quote.annualCapacity >= demand) gains.push("capacity covers annual demand");
  if (quote.paymentDays >= 45) gains.push(`${quote.paymentTerms} terms`);
  if (quote.moq <= 1000) gains.push("low MOQ");
  if (gains.length === 0) gains.push(quote.strength.toLowerCase());

  if (has(supplier, "lead_time_above_requirement")) {
    giveUps.push(`${quote.leadWeeks}-week lead time`);
  }
  if (quote.tooling > 0) giveUps.push(`${formatMoney(quote.tooling, 0)} tooling`);
  if (has(supplier, "moq_above_initial")) {
    giveUps.push(`${formatUnits(quote.moq)}-piece MOQ`);
  }
  if (quote.qualification !== "qualified") {
    giveUps.push(
      quote.qualification === "new"
        ? "supplier is not yet qualified"
        : "qualification is still conditional",
    );
  }
  if (!cost.freightComplete) giveUps.push("freight is not included");
  if (has(supplier, "capacity_below_demand")) {
    giveUps.push("quoted capacity is below annual demand");
  }
  if (has(supplier, "quote_expiring_soon")) giveUps.push("quote is expiring soon");
  if (giveUps.length === 0) {
    giveUps.push("no major commercial concession in the quoted terms");
  }

  const recommendedActions: string[] = [];
  if (!cost.freightComplete) recommendedActions.push("Request a freight estimate before comparing landed cost.");
  if (has(supplier, "capacity_below_demand") || has(supplier, "capacity_confirmation")) {
    recommendedActions.push("Confirm available capacity against the annual volume.");
  }
  if (quote.qualification !== "qualified") {
    recommendedActions.push("Request sample parts and complete the remaining qualification step.");
  }
  if (quote.tooling > 0) {
    recommendedActions.push("Clarify tooling ownership, storage, and reuse.");
  }
  if (has(supplier, "moq_above_initial")) {
    recommendedActions.push("Negotiate MOQ against the initial 3,000-piece release.");
  }
  if (has(supplier, "quote_expiring_soon")) {
    recommendedActions.push("Confirm quote validity before the expiration date.");
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push("Confirm the quoted cell, lead time, and first-year volume before award.");
  }

  const immediate: SourcingAction[] = [];
  const longer: SourcingAction[] = [];

  if (!cost.freightComplete) {
    immediate.push({
      id: "confirm_freight",
      label: "Confirm freight assumption",
      detail: "Ask for a domestic freight estimate so landed cost can be completed.",
    });
  }
  if (has(supplier, "capacity_below_demand") || has(supplier, "capacity_confirmation")) {
    immediate.push({
      id: "confirm_capacity",
      label: "Request capacity confirmation",
      detail: "Verify the cell can support the selected annual volume.",
    });
  }
  if (quote.qualification !== "qualified") {
    immediate.push({
      id: "request_samples",
      label: "Request sample parts",
      detail: `Sample lead time is ${quote.sampleLeadWeeks} weeks.`,
    });
  }
  if (quote.tooling > 0) {
    immediate.push({
      id: "clarify_tooling",
      label: "Clarify tooling ownership",
      detail: quote.toolingNote,
    });
  }
  if (has(supplier, "moq_above_initial")) {
    immediate.push({
      id: "negotiate_moq",
      label: "Negotiate MOQ",
      detail: `MOQ of ${formatUnits(quote.moq)} is above the ${formatUnits(rfq.initialRelease)}-piece initial release.`,
    });
  }
  if (has(supplier, "quote_expiring_soon")) {
    immediate.push({
      id: "confirm_validity",
      label: "Confirm quote validity",
      detail: `Quote is valid through ${quote.quoteValidThrough}.`,
    });
  }
  if (immediate.length === 0) {
    immediate.push({
      id: "confirm_award_terms",
      label: "Confirm award terms",
      detail: "Lock volume, lead time, and freight before issuing the PO.",
    });
  }

  if (quote.qualification !== "qualified") {
    longer.push({
      id: "complete_qualification",
      label: "Complete supplier qualification",
      detail: "Finish the remaining audit or first-article step before relying on this source.",
    });
  }
  longer.push({
    id: "second_source",
    label: "Develop second-source strategy",
    detail: "Keep a qualified backup so a single award does not become a single point of failure.",
  });
  longer.push({
    id: "annual_pricing",
    label: "Negotiate annual pricing agreement",
    detail: "Use the volume ladder already quoted to lock a longer commercial window.",
  });
  if (quote.tooling > 0) {
    longer.push({
      id: "tooling_amortization",
      label: "Review tooling amortization",
      detail: "Decide whether tooling stays in first-year cost or is recovered over a longer horizon.",
    });
  }
  if (quote.annualCapacity < demand * 1.5) {
    longer.push({
      id: "capacity_commitment",
      label: "Establish capacity commitment",
      detail: "Get a written capacity reservation if this award becomes the primary source.",
    });
  }
  longer.push({
    id: "dual_source_split",
    label: "Evaluate dual-source split",
    detail: "Test an 80/20 or 70/30 split if backup capacity matters more than a single-source price.",
  });

  const uniqueStrengths = [...new Set(strengths)].slice(0, 5);
  const uniqueConcerns = [...new Set(concerns)].slice(0, 5);

  return {
    strengths: uniqueStrengths,
    concerns: uniqueConcerns.length > 0 ? uniqueConcerns : ["No major concern in the quoted commercial terms."],
    recommendedActions,
    tradeoff: {
      gains: [...new Set(gains)].slice(0, 5),
      giveUps: [...new Set(giveUps)].slice(0, 5),
      summary: `Selecting ${quote.name} trades ${giveUps[0]} against ${gains[0]}.`,
    },
    immediateActions: unique(immediate).slice(0, 5),
    longerTermActions: unique(longer).slice(0, 5),
  };
}
