import type { SignalDashboard } from "@/lib/signal/types";

/**
 * Future AI interpretation should accept structured analysis JSON, not the
 * raw CSV. Keep deterministic calculations in the analysis engine; use this
 * shape if a later server-side narrative layer is added.
 */
export type SignalInterpretationRequest = {
  asOfDate: string;
  dashboard: SignalDashboard;
};
