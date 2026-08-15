import {
  documentSearchText,
  getDocument,
  shaftThreadGaugeAid,
} from "@/lib/know/documents";
import { tokenize } from "@/lib/know/retrieve";
import type {
  CoverageLabel,
  Excerpt,
  KnowAction,
  KnowAnswer,
  KnowDocument,
  RetrievalResult,
  SourceRef,
} from "@/lib/know/types";

const SUPERSEDED_WARNING =
  "A superseded document also contains related information. The current revision is shown first.";

function toSource(document: KnowDocument): SourceRef {
  return {
    documentId: document.id,
    title: document.title,
    number: document.number,
    revision: document.revision,
    effectiveDate: document.effectiveDate,
    status: document.status,
    type: document.type,
  };
}

function sourcesFrom(ids: string[]): SourceRef[] {
  return ids
    .map((id) => getDocument(id))
    .filter((document): document is KnowDocument => document != null)
    .map(toSource);
}

function currentSources(retrieval: RetrievalResult): KnowDocument[] {
  return retrieval.ranked
    .map((item) => item.document)
    .filter((document) => document.status === "current");
}

function hasSuperseded(retrieval: RetrievalResult): boolean {
  return retrieval.ranked.some((item) => item.document.status === "superseded");
}

function evidenceFor(ids: string[], excerpts: Excerpt[]): Excerpt[] {
  return ids
    .map((id) => excerpts.find((excerpt) => excerpt.documentId === id))
    .filter((excerpt): excerpt is Excerpt => excerpt != null);
}

function coverageFor(currentCount: number): CoverageLabel {
  if (currentCount === 0) return "no_answer";
  if (currentCount === 1) return "direct_match";
  return "multiple_sources";
}

const preparedAnswers: Record<string, (retrieval: RetrievalResult) => KnowAnswer> = {
  torque: (retrieval) => ({
    question: retrieval.query,
    category: "torque",
    coverage: "direct_match",
    answerState: "answered",
    headline: "Answer",
    answer:
      "The CNC shaft setup requires the fixture bolts to be tightened to 42 ft-lb before first-piece inspection.",
    warning: hasSuperseded(retrieval) ? SUPERSEDED_WARNING : undefined,
    sources: sourcesFrom(["wi-102-c", "qip-118"]),
    evidence: evidenceFor(["wi-102-c", "qip-118"], retrieval.excerpts),
    nextStep: "Review WI-102 before changing setup parameters.",
    actions: [
      {
        id: "review_work_instruction",
        label: "Review Current Work Instruction",
        documentId: "wi-102-c",
      },
      {
        id: "confirm_quality_requirement",
        label: "Confirm Quality Requirement",
        documentId: "qip-118",
      },
    ],
    primaryDocumentId: "wi-102-c",
  }),

  go_nogo: (retrieval) => ({
    question: retrieval.query,
    category: "go_nogo",
    coverage: "direct_match",
    answerState: "answered",
    headline: "Answer",
    answer:
      "Accept the shaft coupling only when the GO plug gauge threads in by hand for the full gauge length and the NO-GO plug gauge does not enter more than 1.5 turns.",
    sources: sourcesFrom(["wi-102-c", "qip-118"]),
    evidence: evidenceFor(["wi-102-c", "qip-118"], retrieval.excerpts),
    nextStep: "Use the WI-102 visual aid at first-piece inspection before releasing the lot.",
    actions: [
      {
        id: "review_work_instruction",
        label: "Review Current Work Instruction",
        documentId: "wi-102-c",
      },
      {
        id: "confirm_quality_requirement",
        label: "Confirm Quality Requirement",
        documentId: "qip-118",
      },
    ],
    visualAid: shaftThreadGaugeAid,
    primaryDocumentId: "wi-102-c",
  }),

  revision: (retrieval) => ({
    question: retrieval.query,
    category: "revision",
    coverage: "direct_match",
    answerState: "revision_change",
    headline: "Revision Change",
    answer:
      "Revision B moves the carton label from the upper-left side panel to the upper-right side panel and sets a 1.5 inch minimum edge distance.",
    sources: sourcesFrom(["ecn-072", "pkg-214"]),
    evidence: evidenceFor(["ecn-072"], retrieval.excerpts),
    nextStep: "Use Revision B label placement for all new cartons after August 1, 2026.",
    actions: [
      {
        id: "compare_revisions",
        label: "Compare Revisions",
        documentId: "ecn-072",
      },
      {
        id: "verify_with_engineering",
        label: "Verify With Engineering",
        documentId: "ecn-072",
      },
    ],
    revisionChange: {
      title: "Carton label specification",
      revisionA: {
        label: "Revision A",
        text: "Label positioned on the upper-left side panel.",
      },
      revisionB: {
        label: "Revision B",
        text: "Label moved to the upper-right side panel and minimum distance from carton edge changed to 1.5 inches.",
      },
      effectiveDate: "August 1, 2026",
      disposition:
        "Existing Revision A carton inventory may be consumed through August 31.",
    },
    primaryDocumentId: "ecn-072",
  }),

  quality_history: (retrieval) => ({
    question: retrieval.query,
    category: "quality_history",
    coverage: "direct_match",
    answerState: "quality_history",
    headline: "Answer",
    answer:
      "Yes. A similar oversized thread condition was documented in SCAR-018.",
    sources: sourcesFrom(["scar-018"]),
    evidence: evidenceFor(["scar-018"], retrieval.excerpts),
    nextStep: "Open SCAR-018 before deciding containment or supplier follow-up.",
    actions: [
      {
        id: "open_corrective_action",
        label: "Open Corrective Action",
        documentId: "scar-018",
      },
      {
        id: "confirm_quality_requirement",
        label: "Confirm Quality Requirement",
        documentId: "scar-018",
      },
    ],
    qualityHistory: {
      title: "Thread defect investigation",
      rootCause: "Worn thread-forming tooling.",
      containment: "100% thread gauge inspection.",
      correctiveAction: "Tool replacement interval reduced.",
      verification: "Three consecutive accepted production lots.",
    },
    visualAid: shaftThreadGaugeAid,
    visualAidNote:
      "SCAR-018 failed the WI-102 NO-GO criterion: the GO gauge passed and the NO-GO gauge also passed, which means the thread was oversized.",
    primaryDocumentId: "scar-018",
  }),

  maintenance: (retrieval) => ({
    question: retrieval.query,
    category: "maintenance",
    coverage: "direct_match",
    answerState: "answered",
    headline: "Answer",
    answer:
      "Complete lockout/tagout on the Line 3 conveyor drive and verify zero energy before removing guards or replacing the bearing.",
    sources: sourcesFrom(["sop-mnt-044"]),
    evidence: evidenceFor(["sop-mnt-044"], retrieval.excerpts),
    nextStep: "Review SOP-MNT-044 before starting the bearing replacement.",
    actions: [
      {
        id: "review_maintenance_sop",
        label: "Review Maintenance SOP",
        documentId: "sop-mnt-044",
      },
    ],
    primaryDocumentId: "sop-mnt-044",
  }),

  material: (retrieval) => ({
    question: retrieval.query,
    category: "material",
    coverage: "direct_match",
    answerState: "answered",
    headline: "Answer",
    answer:
      "The molded housing is approved in natural ABS, colored Machine Gray with concentrate MG-14. Recycled-content ABS RC-ABS-20 is the approved alternate.",
    sources: sourcesFrom(["mat-118"]),
    evidence: evidenceFor(["mat-118"], retrieval.excerpts),
    nextStep: "Confirm the current material specification with Materials Engineering before substituting resin.",
    actions: [
      {
        id: "review_material_spec",
        label: "Review Material Specification",
        documentId: "mat-118",
      },
      {
        id: "verify_with_engineering",
        label: "Verify With Engineering",
        documentId: "mat-118",
      },
    ],
    primaryDocumentId: "mat-118",
  }),

  inspection: (retrieval) => ({
    question: retrieval.query,
    category: "inspection",
    coverage: "direct_match",
    answerState: "answered",
    headline: "Answer",
    answer:
      "Inspect 5 pieces per lot of 50, or 10% of the lot, whichever is greater.",
    sources: sourcesFrom(["qip-331"]),
    evidence: evidenceFor(["qip-331"], retrieval.excerpts),
    nextStep: "Confirm the sampling plan in QIP-331 before releasing or sorting a lot.",
    actions: [
      {
        id: "confirm_quality_requirement",
        label: "Confirm Quality Requirement",
        documentId: "qip-331",
      },
    ],
    primaryDocumentId: "qip-331",
  }),

  surface_finish: (retrieval) => ({
    question: retrieval.query,
    category: "surface_finish",
    coverage: "direct_match",
    answerState: "answered",
    headline: "Answer",
    answer:
      "Quarantine the affected finished goods and perform 100% visual inspection under white light at the pack station until QA-039 expires.",
    sources: sourcesFrom(["qa-039"]),
    evidence: evidenceFor(["qa-039"], retrieval.excerpts),
    nextStep: "Follow the containment and inspection requirements in QA-039 before shipping.",
    actions: [
      {
        id: "confirm_quality_requirement",
        label: "Confirm Quality Requirement",
        documentId: "qa-039",
      },
    ],
    primaryDocumentId: "qa-039",
  }),

  multiple_sources: (retrieval) => ({
    question: retrieval.query,
    category: "multiple_sources",
    coverage: "multiple_sources",
    answerState: "answered",
    headline: "Answer",
    answer:
      "Three current documents specify torque: WI-102 requires 42 ft-lb on the shaft fixture, QIP-118 confirms that value at first-piece inspection, and SW-141 requires 18 ft-lb on fastener-kit flange bolts.",
    warning: hasSuperseded(retrieval) ? SUPERSEDED_WARNING : undefined,
    sources: sourcesFrom(["wi-102-c", "qip-118", "sw-141"]),
    evidence: evidenceFor(["wi-102-c", "sw-141", "qip-118"], retrieval.excerpts),
    nextStep: "Use the torque value from the current document that matches the job being performed.",
    actions: [
      {
        id: "review_work_instruction",
        label: "Review Current Work Instruction",
        documentId: "wi-102-c",
      },
      {
        id: "review_current_document",
        label: "Review Standard Work",
        documentId: "sw-141",
      },
    ],
    primaryDocumentId: "wi-102-c",
  }),

  no_answer: (retrieval) => noAnswer(retrieval.query),
};

function noAnswer(question: string): KnowAnswer {
  return {
    question,
    category: "no_answer",
    coverage: "no_answer",
    answerState: "no_answer",
    headline: "No verified answer found.",
    answer:
      "The current sample document set does not contain an approved plating thickness for the machined shaft.",
    sources: [],
    evidence: [],
    nextStep: "Check the engineering drawing or approved material specification.",
    actions: [
      {
        id: "verify_with_engineering",
        label: "Verify With Engineering",
      },
    ],
  };
}

function limitedAnswer(retrieval: RetrievalResult, current: KnowDocument[]): KnowAnswer {
  const sources = current.slice(0, 2).map(toSource);
  return {
    question: retrieval.query,
    category: retrieval.category,
    coverage: "limited_information",
    answerState: "limited",
    headline: "Limited information",
    answer:
      current.length > 0
        ? "Related sample documents were found, but they do not fully answer this question."
        : "The available sample documents do not fully answer the question.",
    sources,
    evidence: evidenceFor(
      current.slice(0, 2).map((document) => document.id),
      retrieval.excerpts,
    ),
    nextStep: "Review with Manufacturing Engineering.",
    actions: [
      {
        id: "verify_with_engineering",
        label: "Verify With Engineering",
        documentId: current[0]?.id,
      },
    ],
    primaryDocumentId: current[0]?.id,
  };
}

function coversQuestion(document: KnowDocument, query: string): boolean {
  const tokens = tokenize(query).filter((token) => token.length >= 4);
  if (tokens.length === 0) return true;
  const haystack = documentSearchText(document);
  const hits = tokens.filter((token) => haystack.includes(token)).length;
  return hits / tokens.length >= 0.75;
}

function genericAnswer(retrieval: RetrievalResult): KnowAnswer {
  const current = currentSources(retrieval);
  const top = current[0];
  const topRanked = retrieval.ranked[0];

  if (!top || !topRanked || topRanked.score < 8 || !coversQuestion(top, retrieval.query)) {
    if (current.length > 0 && topRanked && topRanked.score >= 4) {
      return limitedAnswer(retrieval, current);
    }
    return {
      question: retrieval.query,
      category: retrieval.category,
      coverage: "no_answer",
      answerState: "no_answer",
      headline: "No verified answer found.",
      answer:
        "The sample document library does not contain a verified answer to this question.",
      sources: [],
      evidence: [],
      nextStep: "Review with Manufacturing Engineering.",
      actions: [
        {
          id: "verify_with_engineering",
          label: "Verify With Engineering",
        },
      ],
    };
  }

  const supporting = current.slice(0, 3);
  const excerpt = retrieval.excerpts.find((item) => item.documentId === top.id);
  const coverage = coverageFor(supporting.length);

  return {
    question: retrieval.query,
    category: retrieval.category,
    coverage,
    answerState: "answered",
    headline: "Answer",
    answer: excerpt?.text ?? top.summary,
    warning: hasSuperseded(retrieval) ? SUPERSEDED_WARNING : undefined,
    sources: supporting.map(toSource),
    evidence: evidenceFor(
      supporting.map((document) => document.id),
      retrieval.excerpts,
    ),
    nextStep: `Review ${top.number} before acting on this information.`,
    actions: actionsFor(top),
    primaryDocumentId: top.id,
  };
}

function actionsFor(document: KnowDocument): KnowAction[] {
  if (document.type === "work_instruction") {
    return [
      {
        id: "review_work_instruction",
        label: "Review Current Work Instruction",
        documentId: document.id,
      },
    ];
  }
  if (document.type === "maintenance") {
    return [
      {
        id: "review_maintenance_sop",
        label: "Review Maintenance SOP",
        documentId: document.id,
      },
    ];
  }
  if (document.type === "quality") {
    return [
      {
        id: "confirm_quality_requirement",
        label: "Confirm Quality Requirement",
        documentId: document.id,
      },
    ];
  }
  if (document.type === "engineering") {
    return [
      {
        id: "verify_with_engineering",
        label: "Verify With Engineering",
        documentId: document.id,
      },
    ];
  }
  if (document.number === "MAT-118") {
    return [
      {
        id: "review_material_spec",
        label: "Review Material Specification",
        documentId: document.id,
      },
    ];
  }
  return [
    {
      id: "review_current_document",
      label: "Review Current Document",
      documentId: document.id,
    },
  ];
}

export function interpret(retrieval: RetrievalResult): KnowAnswer {
  if (retrieval.preparedId && preparedAnswers[retrieval.preparedId]) {
    return preparedAnswers[retrieval.preparedId](retrieval);
  }
  return genericAnswer(retrieval);
}
