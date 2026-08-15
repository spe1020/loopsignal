/** LoopKnow document, retrieval, and answer types. */

export const documentStatuses = ["current", "superseded", "draft"] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export const documentTypes = [
  "work_instruction",
  "specification",
  "quality",
  "maintenance",
  "engineering",
  "standard_work",
] as const;
export type DocumentType = (typeof documentTypes)[number];

export const documentFilters = [
  "all",
  "work_instructions",
  "specifications",
  "quality",
  "maintenance",
  "engineering",
  "standard_work",
] as const;
export type DocumentFilter = (typeof documentFilters)[number];

export const coverageLabels = [
  "direct_match",
  "multiple_sources",
  "limited_information",
  "no_answer",
] as const;
export type CoverageLabel = (typeof coverageLabels)[number];

export const answerStates = [
  "answered",
  "revision_change",
  "quality_history",
  "limited",
  "no_answer",
] as const;
export type AnswerState = (typeof answerStates)[number];

export const questionCategories = [
  "torque",
  "revision",
  "quality_history",
  "maintenance",
  "material",
  "inspection",
  "multiple_sources",
  "no_answer",
  "surface_finish",
  "packaging",
  "go_nogo",
  "general",
] as const;
export type QuestionCategory = (typeof questionCategories)[number];

export const actionIds = [
  "review_work_instruction",
  "open_corrective_action",
  "compare_revisions",
  "verify_with_engineering",
  "review_maintenance_sop",
  "confirm_quality_requirement",
  "review_material_spec",
  "review_current_document",
] as const;
export type ActionId = (typeof actionIds)[number];

export type DocumentSection = {
  heading: string;
  body: string;
};

export type VisualAidSide = {
  image: string;
  alt: string;
  label: string;
  result: string;
  criteria: string[];
};

export type VisualAid = {
  id: string;
  documentNumber: string;
  title: string;
  section: string;
  instruction: string;
  acceptRule: string;
  go: VisualAidSide;
  nogo: VisualAidSide;
};

export type KnowDocument = {
  id: string;
  title: string;
  number: string;
  type: DocumentType;
  typeLabel: string;
  revision: string;
  effectiveDate: string;
  owner: string;
  status: DocumentStatus;
  summary: string;
  sections: DocumentSection[];
  tags: string[];
  relatedIds: string[];
  visualAid?: VisualAid;
  supersededById?: string;
  supersedesId?: string;
};

export type RankedDocument = {
  document: KnowDocument;
  score: number;
};

export type Excerpt = {
  documentId: string;
  heading: string;
  text: string;
};

export type SourceRef = {
  documentId: string;
  title: string;
  number: string;
  revision: string;
  effectiveDate: string;
  status: DocumentStatus;
  type: DocumentType;
};

export type KnowAction = {
  id: ActionId;
  label: string;
  documentId?: string;
};

export type RevisionChange = {
  title: string;
  revisionA: { label: string; text: string };
  revisionB: { label: string; text: string };
  effectiveDate: string;
  disposition: string;
};

export type QualityHistory = {
  title: string;
  rootCause: string;
  containment: string;
  correctiveAction: string;
  verification: string;
};

export type KnowAnswer = {
  question: string;
  category: QuestionCategory;
  coverage: CoverageLabel;
  answerState: AnswerState;
  headline: string;
  answer: string;
  warning?: string;
  sources: SourceRef[];
  evidence: Excerpt[];
  nextStep: string;
  actions: KnowAction[];
  revisionChange?: RevisionChange;
  qualityHistory?: QualityHistory;
  visualAid?: VisualAid;
  visualAidNote?: string;
  primaryDocumentId?: string;
};

export type RetrievalResult = {
  query: string;
  preparedId: string | null;
  category: QuestionCategory;
  ranked: RankedDocument[];
  excerpts: Excerpt[];
};

export type SampleQuestion = {
  id: string;
  label: string;
  category: QuestionCategory;
};
