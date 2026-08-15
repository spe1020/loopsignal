import {
  documentSearchText,
  documents,
  getDocument,
  matchesFilter,
  sortLibrary,
} from "@/lib/know/documents";
import type {
  DocumentFilter,
  Excerpt,
  KnowDocument,
  QuestionCategory,
  RankedDocument,
  RetrievalResult,
  SampleQuestion,
} from "@/lib/know/types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "before",
  "between",
  "for",
  "from",
  "have",
  "in",
  "is",
  "of",
  "on",
  "or",
  "the",
  "this",
  "to",
  "we",
  "what",
  "which",
  "with",
]);

type PreparedMatch = {
  id: string;
  category: QuestionCategory;
  documentIds: string[];
  match: (query: string) => boolean;
};

export const sampleQuestions: SampleQuestion[] = [
  {
    id: "torque",
    label: "What torque is required during the CNC shaft setup?",
    category: "torque",
  },
  {
    id: "go_nogo",
    label: "What is the go/no-go criteria for the shaft thread?",
    category: "go_nogo",
  },
  {
    id: "revision",
    label: "What changed in Revision B of the carton label?",
    category: "revision",
  },
  {
    id: "quality_history",
    label: "Have we had a thread defect issue before?",
    category: "quality_history",
  },
  {
    id: "inspection",
    label: "What is the inspection frequency for the aluminum bracket?",
    category: "inspection",
  },
  {
    id: "maintenance",
    label: "What steps are required before replacing the conveyor bearing?",
    category: "maintenance",
  },
  {
    id: "material",
    label: "What material is approved for the molded housing?",
    category: "material",
  },
  {
    id: "surface_finish",
    label: "What should happen if the surface finish defect is found?",
    category: "surface_finish",
  },
  {
    id: "multiple_sources",
    label: "Which documents mention torque requirements?",
    category: "multiple_sources",
  },
  {
    id: "no_answer",
    label: "What is the approved plating thickness for the machined shaft?",
    category: "no_answer",
  },
];

const preparedMatches: PreparedMatch[] = [
  {
    id: "no_answer",
    category: "no_answer",
    documentIds: [],
    match: (query) =>
      query.includes("plating") &&
      (query.includes("thickness") ||
        query.includes("shaft") ||
        query.includes("approved")),
  },
  {
    id: "revision",
    category: "revision",
    documentIds: ["ecn-072", "pkg-214"],
    match: (query) =>
      (query.includes("revision") &&
        (query.includes("carton") ||
          query.includes("label") ||
          query.includes("ecn"))) ||
      (query.includes("changed") &&
        (query.includes("label") || query.includes("carton"))) ||
      (query.includes("revision a") && query.includes("revision b")),
  },
  {
    id: "go_nogo",
    category: "go_nogo",
    documentIds: ["wi-102-c", "qip-118"],
    match: (query) =>
      query.includes("no-go") ||
      query.includes("nogo") ||
      query.includes("no go") ||
      (query.includes("go") && query.includes("gauge")) ||
      (query.includes("thread") &&
        (query.includes("gauge") || query.includes("criteria"))),
  },
  {
    id: "quality_history",
    category: "quality_history",
    documentIds: ["scar-018"],
    match: (query) =>
      query.includes("thread") &&
      (query.includes("defect") ||
        query.includes("before") ||
        query.includes("issue") ||
        query.includes("scar") ||
        query.includes("seen") ||
        query.includes("had")),
  },
  {
    id: "multiple_sources",
    category: "multiple_sources",
    documentIds: ["wi-102-c", "qip-118", "sw-141", "wi-102-b"],
    match: (query) =>
      query.includes("torque") &&
      (query.includes("which document") ||
        query.includes("mention") ||
        query.includes("documents")),
  },
  {
    id: "torque",
    category: "torque",
    documentIds: ["wi-102-c", "qip-118", "wi-102-b"],
    match: (query) =>
      query.includes("torque") &&
      (query.includes("shaft") ||
        query.includes("cnc") ||
        query.includes("setup") ||
        query.includes("fixture")),
  },
  {
    id: "maintenance",
    category: "maintenance",
    documentIds: ["sop-mnt-044", "pm-207"],
    match: (query) =>
      (query.includes("bearing") &&
        (query.includes("conveyor") ||
          query.includes("replac") ||
          query.includes("before") ||
          query.includes("step") ||
          query.includes("lockout"))) ||
      query.includes("lockout") ||
      query.includes("sop-mnt"),
  },
  {
    id: "material",
    category: "material",
    documentIds: ["mat-118"],
    match: (query) =>
      query.includes("material") ||
      query.includes("resin") ||
      query.includes("molded housing") ||
      query.includes("housing") ||
      query.includes("abs"),
  },
  {
    id: "inspection",
    category: "inspection",
    documentIds: ["qip-331"],
    match: (query) =>
      (query.includes("inspection") ||
        query.includes("sampling") ||
        query.includes("frequency")) &&
      (query.includes("bracket") ||
        query.includes("aluminum") ||
        query.includes("qip-331")),
  },
  {
    id: "surface_finish",
    category: "surface_finish",
    documentIds: ["qa-039"],
    match: (query) =>
      query.includes("surface") ||
      query.includes("swirl") ||
      query.includes("quality alert") ||
      (query.includes("finish") && query.includes("defect")),
  },
];

export function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  return normalizeQuery(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function scoreField(field: string, tokens: string[], weight: number): number {
  const haystack = field.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += weight;
  }
  return score;
}

function scoreDocument(document: KnowDocument, tokens: string[]): number {
  if (tokens.length === 0) return 0;

  let score =
    scoreField(document.number, tokens, 10) +
    scoreField(document.title, tokens, 7) +
    scoreField(document.tags.join(" "), tokens, 5) +
    scoreField(document.summary, tokens, 3) +
    scoreField(
      document.sections.map((section) => `${section.heading} ${section.body}`).join(" "),
      tokens,
      2,
    );

  const phrase = tokens.join(" ");
  if (phrase.length > 6 && documentSearchText(document).includes(phrase)) {
    score += 8;
  }

  if (document.status === "current") score *= 1.35;
  else if (document.status === "draft") score *= 0.7;
  else score *= 0.4;

  return score;
}

export function rankDocuments(query: string): RankedDocument[] {
  const tokens = tokenize(query);
  return documents
    .map((document) => ({
      document,
      score: scoreDocument(document, tokens),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.document.number.localeCompare(b.document.number));
}

export function searchDocuments(
  query: string,
  filter: DocumentFilter = "all",
): KnowDocument[] {
  const filtered = documents.filter((document) => matchesFilter(document, filter));
  const normalized = normalizeQuery(query);
  if (!normalized) return sortLibrary(filtered);

  const tokens = tokenize(query);
  return sortLibrary(
    filtered.filter((document) => {
      const haystack = documentSearchText(document);
      return tokens.every((token) => haystack.includes(token)) || haystack.includes(normalized);
    }),
  );
}

function excerptsFor(
  documentIds: string[],
  tokens: string[],
  limit = 3,
): Excerpt[] {
  const excerpts: Excerpt[] = [];

  for (const id of documentIds) {
    const document = getDocument(id);
    if (!document) continue;

    const rankedSections = document.sections
      .map((section) => ({
        section,
        score: scoreField(`${section.heading} ${section.body}`, tokens, 1),
      }))
      .sort((a, b) => b.score - a.score);

    const chosen =
      rankedSections.find((item) => item.score > 0)?.section ?? document.sections[0];
    if (!chosen) continue;

    excerpts.push({
      documentId: document.id,
      heading: chosen.heading,
      text: chosen.body,
    });

    if (excerpts.length >= limit) break;
  }

  return excerpts;
}

function findPrepared(query: string): PreparedMatch | undefined {
  return preparedMatches.find((item) => item.match(query));
}

export function retrieve(question: string): RetrievalResult {
  const query = normalizeQuery(question);
  const prepared = findPrepared(query);

  if (prepared?.id === "no_answer") {
    return {
      query: question.trim(),
      preparedId: prepared.id,
      category: prepared.category,
      ranked: [],
      excerpts: [],
    };
  }

  if (prepared) {
    const ranked = prepared.documentIds
      .map((id) => getDocument(id))
      .filter((document): document is KnowDocument => document != null)
      .map((document, index) => ({
        document,
        score: 100 - index,
      }));

    return {
      query: question.trim(),
      preparedId: prepared.id,
      category: prepared.category,
      ranked,
      excerpts: excerptsFor(prepared.documentIds, tokenize(query)),
    };
  }

  const ranked = rankDocuments(query);
  const top = ranked.slice(0, 4);

  return {
    query: question.trim(),
    preparedId: null,
    category: inferCategory(query, top),
    ranked: top,
    excerpts: excerptsFor(
      top.map((item) => item.document.id),
      tokenize(query),
    ),
  };
}

function inferCategory(query: string, ranked: RankedDocument[]): QuestionCategory {
  if (query.includes("torque")) return "torque";
  if (query.includes("bearing") || query.includes("lockout")) return "maintenance";
  if (query.includes("resin") || query.includes("material")) return "material";
  if (query.includes("inspect") || query.includes("sampling")) return "inspection";
  if (query.includes("label") || query.includes("carton")) return "packaging";
  if (query.includes("thread") || query.includes("scar")) return "quality_history";

  const type = ranked.find((item) => item.document.status === "current")?.document.type;
  if (type === "maintenance") return "maintenance";
  if (type === "quality") return "inspection";
  if (type === "specification") return "material";
  if (type === "engineering") return "revision";
  return "general";
}
