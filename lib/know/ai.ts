import type { Excerpt, SourceRef } from "@/lib/know/types";

/**
 * Future AI interpretation should receive retrieved current-document excerpts
 * only — never the full library and never raw user uploads. Keep revision
 * priority, source selection, and “no verified answer” logic in retrieval.
 */
export type KnowInterpretationRequest = {
  question: string;
  sources: SourceRef[];
  excerpts: Excerpt[];
};
