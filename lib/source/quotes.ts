import { SAMPLE_AS_OF_DATE } from "@/lib/sample-as-of";
import type { RfqScenario, SupplierQuote } from "./types";

export const defaultDemand = 12000;

export const rfqScenario: RfqScenario = {
  id: "machined_aluminum_bracket",
  title: "Machined Aluminum Bracket",
  partName: "Machined Aluminum Bracket",
  annualDemand: defaultDemand,
  initialRelease: 3000,
  requiredLeadWeeks: 6,
  qualityTarget: "Standard production requirement",
  destination: "Northfield Assembly Plant (fictional domestic plant)",
  minCapacity: defaultDemand,
  quoteAsOf: SAMPLE_AS_OF_DATE,
};

export const supplierQuotes: SupplierQuote[] = [
  {
    id: "apex",
    name: "Apex Machining",
    source: "sample",
    unitPrice: 8.35,
    priceBreaks: [
      { minQty: 1, unitPrice: 8.65 },
      { minQty: 5000, unitPrice: 8.5 },
      { minQty: 12000, unitPrice: 8.35 },
      { minQty: 25000, unitPrice: 8.1 },
      { minQty: 50000, unitPrice: 7.9 },
    ],
    tooling: 2500,
    toolingNote: "Fixture set. Customer-owned after payment.",
    moq: 1000,
    leadWeeks: 5,
    annualCapacity: 25000,
    paymentTerms: "Net 30",
    paymentDays: 30,
    freight: { kind: "included" },
    origin: "Cedar Ridge, OH (fictional)",
    quoteValidThrough: "2026-11-15",
    qualification: "qualified",
    sampleLeadWeeks: 2,
    notes:
      "Existing qualified supplier for this part family. Production cell is confirmed for the quoted volume.",
    strength: "Balanced cost and lead time",
  },
  {
    id: "ridgeway",
    name: "Ridgeway Precision",
    source: "sample",
    unitPrice: 7.8,
    priceBreaks: [
      { minQty: 1, unitPrice: 8.2 },
      { minQty: 5000, unitPrice: 8.05 },
      { minQty: 12000, unitPrice: 7.8 },
      { minQty: 25000, unitPrice: 7.4 },
      { minQty: 50000, unitPrice: 7.05 },
    ],
    tooling: 6500,
    toolingNote: "Dedicated fixture and first-article package. Ownership not specified.",
    moq: 5000,
    leadWeeks: 9,
    annualCapacity: 80000,
    paymentTerms: "Net 45",
    paymentDays: 45,
    freight: { kind: "not_included" },
    origin: "Westvale, TX (fictional)",
    quoteValidThrough: "2026-08-28",
    qualification: "new",
    sampleLeadWeeks: 4,
    notes:
      "New supplier. First-article inspection is required before a production release. Freight is excluded and no estimate was provided.",
    strength: "Lowest quoted piece price",
  },
  {
    id: "harbor",
    name: "Harbor Components",
    source: "sample",
    unitPrice: 8.7,
    priceBreaks: [
      { minQty: 1, unitPrice: 8.9 },
      { minQty: 5000, unitPrice: 8.9 },
      { minQty: 12000, unitPrice: 8.7 },
      { minQty: 25000, unitPrice: 8.55 },
      { minQty: 50000, unitPrice: 8.4 },
    ],
    tooling: 0,
    toolingNote: "No tooling. Uses an existing process.",
    moq: 500,
    leadWeeks: 3,
    annualCapacity: 15000,
    paymentTerms: "Net 30",
    paymentDays: 30,
    freight: { kind: "included" },
    origin: "Lakeport, IN (fictional)",
    quoteValidThrough: "2026-10-15",
    qualification: "qualified",
    sampleLeadWeeks: 1,
    notes:
      "Fastest quoted lead time and no startup tooling. Annual cell capacity is limited relative to higher-volume scenarios.",
    strength: "Fastest response and lowest startup cost",
  },
  {
    id: "summit",
    name: "Summit Manufacturing",
    source: "sample",
    unitPrice: 8.05,
    priceBreaks: [
      { minQty: 1, unitPrice: 8.25 },
      { minQty: 5000, unitPrice: 8.25 },
      { minQty: 12000, unitPrice: 8.05 },
      { minQty: 25000, unitPrice: 7.75 },
      { minQty: 50000, unitPrice: 7.5 },
    ],
    tooling: 3500,
    toolingNote: "Setup and inspection fixture. Amortization not offered in the quote.",
    moq: 2500,
    leadWeeks: 6,
    annualCapacity: 22000,
    paymentTerms: "Net 60",
    paymentDays: 60,
    freight: { kind: "included" },
    origin: "Hillcrest, PA (fictional)",
    quoteValidThrough: "2026-09-30",
    qualification: "conditional",
    sampleLeadWeeks: 3,
    notes:
      "Conditional qualification pending a process audit. Strong payment terms and an annual agreement were offered as a follow-up.",
    strength: "Strong commercial terms",
  },
];

export const sampleScenarios = [
  {
    id: rfqScenario.id,
    label: "Machined Aluminum Bracket",
    rfq: rfqScenario,
    quotes: supplierQuotes,
  },
] as const;

export function getSampleScenario(id = rfqScenario.id) {
  return sampleScenarios.find((item) => item.id === id) ?? sampleScenarios[0];
}
