/**
 * Future hooks. Interfaces only — no implementation in V1.
 * AI never sets classification or evidence state; the Facilitator returns
 * suggestions that a person accepts or ignores.
 */
import type { CauseNode, Investigation, LessonLearned } from "./schema";

export type SignalSource = "loopbrief" | "loopsupply";

export type SignalPayload = {
  source: SignalSource;
  title: string;
  whatHappened?: string;
  where?: string;
  when?: string;
  reference?: string;
};

export type LoopKnowPayload = {
  rcaNumber: string;
  title: string;
  problemStatement: string;
  rootCauses: string[];
  lessons: LessonLearned[];
  relatedProcesses: string[];
};

export type PriorIncident = {
  rcaNumber: string;
  title: string;
  similarity: number;
};

/** Start an investigation from an upstream signal. Not implemented in V1. */
export function startFromSignal(
  source: SignalSource,
  payload: SignalPayload,
): Promise<Investigation | null> {
  void source;
  void payload;
  return Promise.resolve(null);
}

/** Shape lessons for LoopKnow. Pure and safe to call today. */
export function publishLessons(investigation: Investigation): LoopKnowPayload {
  return {
    rcaNumber: investigation.rcaNumber,
    title: investigation.title,
    problemStatement: investigation.problem.generatedStatement,
    rootCauses: investigation.causes
      .filter((c) => c.classification === "root")
      .map((c) => c.text),
    lessons: investigation.lessons,
    relatedProcesses: [...new Set(investigation.lessons.map((l) => l.relatedProcess).filter(Boolean))],
  };
}

/** Search prior incidents. Not implemented in V1. */
export function searchPriorIncidents(query: string): Promise<PriorIncident[]> {
  void query;
  return Promise.resolve([]);
}

export type Suggestion = { text: string; reason?: string };

export interface Facilitator {
  challengeWhy(cause: CauseNode, investigation: Investigation): Promise<Suggestion[]>;
  suggestCategories(investigation: Investigation): Promise<Suggestion[]>;
  requestEvidence(cause: CauseNode, investigation: Investigation): Promise<Suggestion[]>;
  summarize(investigation: Investigation): Promise<string>;
  draftLessons(investigation: Investigation): Promise<Suggestion[]>;
}

export class NoopFacilitator implements Facilitator {
  challengeWhy() {
    return Promise.resolve([]);
  }
  suggestCategories() {
    return Promise.resolve([]);
  }
  requestEvidence() {
    return Promise.resolve([]);
  }
  summarize() {
    return Promise.resolve("");
  }
  draftLessons() {
    return Promise.resolve([]);
  }
}

export const facilitator: Facilitator = new NoopFacilitator();
