import { interpret } from "@/lib/know/interpret";
import { retrieve } from "@/lib/know/retrieve";
import type { KnowAnswer } from "@/lib/know/types";

export {
  documentById,
  documents,
  filterLabels,
  getDocument,
  matchesFilter,
  relatedDocuments,
  shaftThreadGaugeAid,
  sortLibrary,
} from "@/lib/know/documents";
export {
  normalizeQuery,
  rankDocuments,
  retrieve,
  sampleQuestions,
  searchDocuments,
  tokenize,
} from "@/lib/know/retrieve";
export { interpret } from "@/lib/know/interpret";
export type { KnowInterpretationRequest } from "@/lib/know/ai";
export type {
  AnswerState,
  CoverageLabel,
  DocumentFilter,
  DocumentStatus,
  DocumentType,
  KnowAction,
  KnowAnswer,
  KnowDocument,
  QuestionCategory,
  SampleQuestion,
  SourceRef,
  VisualAid,
} from "@/lib/know/types";

export function answerQuestion(question: string): KnowAnswer {
  return interpret(retrieve(question));
}
