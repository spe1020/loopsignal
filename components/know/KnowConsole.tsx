"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { DocumentLibrary } from "@/components/know/DocumentLibrary";
import { GoNoGoAid } from "@/components/know/GoNoGoAid";
import { SourcePanel } from "@/components/know/SourcePanel";
import {
  CoverageBadge,
  StatusBadge,
  coverageCopy,
} from "@/components/know/StatusBadge";
import {
  answerQuestion,
  getDocument,
  sampleQuestions,
  searchDocuments,
} from "@/lib/know";
import {
  trackKnowAnswerGenerated,
  trackKnowDocumentView,
  trackKnowNoAnswer,
  trackKnowSampleQuestion,
  trackKnowSearch,
} from "@/lib/analytics";
import type { DocumentFilter, KnowAnswer } from "@/lib/know/types";

const consoleBtn =
  "inline-flex min-h-9 items-center justify-center border border-[#c8c8c0] bg-white px-3 py-1.5 text-[12px] font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";
const consoleBtnSolid =
  "inline-flex min-h-9 items-center justify-center border border-ink bg-ink px-3 py-1.5 text-[12px] font-medium text-white hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-60";

const whyItMatters = [
  "Find the current revision.",
  "Recover previous corrective actions.",
  "Reduce time spent searching shared drives.",
  "Make tribal knowledge easier to access.",
  "Help new employees find trusted answers faster.",
];

function trackAnswer(answer: KnowAnswer) {
  const primaryType = answer.sources[0]?.type;
  if (answer.answerState === "no_answer") {
    trackKnowNoAnswer(answer.category);
    return;
  }
  trackKnowAnswerGenerated({
    question_category: answer.category,
    answer_state: answer.answerState,
    source_count: answer.sources.length,
    document_type: primaryType,
  });
}

export function KnowConsole() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<KnowAnswer | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [filter, setFilter] = useState<DocumentFilter>("all");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const askRef = useRef<HTMLTextAreaElement>(null);
  const lastSearch = useRef("");

  const libraryDocs = useMemo(
    () => searchDocuments(libraryQuery, filter),
    [libraryQuery, filter],
  );

  const selected = selectedId ? (getDocument(selectedId) ?? null) : null;
  const selectedExcerpt = answer?.evidence.find(
    (item) => item.documentId === selectedId,
  );

  useEffect(() => {
    function openLibrary() {
      setLibraryOpen(true);
    }
    window.addEventListener("loopknow:view-documents", openLibrary);
    return () => {
      window.removeEventListener("loopknow:view-documents", openLibrary);
    };
  }, []);

  useEffect(() => {
    if (!libraryOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [libraryOpen]);

  useEffect(() => {
    if (libraryQuery.trim().length < 2) return;
    const key = `${filter}:${libraryQuery.trim().toLowerCase()}`;
    if (key === lastSearch.current) return;
    lastSearch.current = key;
    trackKnowSearch({
      result_count: libraryDocs.length,
      filter,
    });
  }, [filter, libraryDocs.length, libraryQuery]);

  function selectDocument(id: string, track = true) {
    setSelectedId(id);
    const document = getDocument(id);
    if (track && document) trackKnowDocumentView(document.type);
  }

  function runQuestion(question: string, sampleCategory?: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    if (sampleCategory) trackKnowSampleQuestion(sampleCategory);
    const next = answerQuestion(trimmed);
    setAnswer(next);
    setInput(trimmed);
    setSamplesOpen(false);
    if (next.primaryDocumentId) selectDocument(next.primaryDocumentId, false);
    else setSelectedId(undefined);
    trackAnswer(next);
  }

  function reset() {
    setInput("");
    setAnswer(null);
    setSelectedId(undefined);
    setFilter("all");
    setLibraryQuery("");
    setLibraryOpen(false);
    setSamplesOpen(true);
    lastSearch.current = "";
  }

  function onAction(documentId?: string) {
    if (documentId) selectDocument(documentId);
  }

  return (
    <div className="border border-[#c8c8c0] bg-console-surface">
      <header className="sticky top-[72px] z-20 flex flex-col gap-3 border-b border-[#c8c8c0] bg-console-surface/95 px-4 py-3 backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-5">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <p className="text-[15px] font-medium tracking-tight text-ink">
              LoopKnow
            </p>
            <p className="text-[12px] text-graphite">
              Manufacturing Knowledge Console
            </p>
          </div>
          <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-stone">
            DEMO · FICTIONAL SAMPLE DOCUMENTS
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setLibraryOpen(true);
              searchRef.current?.focus();
            }}
            className={consoleBtn}
          >
            View Documents
          </button>
          <button
            type="button"
            onClick={() => {
              setSamplesOpen(true);
              askRef.current?.focus();
            }}
            className={consoleBtn}
          >
            Sample Questions
          </button>
          <button type="button" onClick={reset} className={consoleBtn}>
            Reset Demo
          </button>
        </div>
      </header>

      <p className="border-b border-[#d9d9d2] bg-[#fafaf7] px-4 py-2 text-[12px] leading-5 text-graphite md:px-5">
        <span className="font-medium text-ink">Public demo. </span>
        Do not upload confidential, proprietary, export-controlled, personal, or
        sensitive company documents. This demo uses fictional manufacturing
        content only.
      </p>

      <div className="lg:grid lg:min-h-[680px] lg:grid-cols-12">
        <aside className="hidden border-r border-[#d9d9d2] lg:col-span-3 lg:sticky lg:top-[136px] lg:block lg:h-[calc(100vh-9rem)] lg:self-start lg:overflow-hidden">
          <DocumentLibrary
            documents={libraryDocs}
            filter={filter}
            query={libraryQuery}
            selectedId={selectedId}
            inputRef={searchRef}
            onFilter={setFilter}
            onQuery={setLibraryQuery}
            onSelect={selectDocument}
          />
        </aside>

        <div className="flex flex-col border-[#d9d9d2] lg:col-span-6 lg:border-r">
          <AskWorkspace
            input={input}
            answer={answer}
            samplesOpen={samplesOpen}
            askRef={askRef}
            onInput={setInput}
            onAsk={() => runQuestion(input)}
            onSample={(question, category) => runQuestion(question, category)}
            onSelectSource={selectDocument}
            onAction={onAction}
          />
        </div>

        <aside className="border-t border-[#d9d9d2] lg:col-span-3 lg:sticky lg:top-[136px] lg:h-[calc(100vh-9rem)] lg:self-start lg:overflow-y-auto lg:border-t-0">
          <SourcePanel
            document={selected}
            excerpt={selectedExcerpt}
            onSelectRelated={selectDocument}
          />
        </aside>
      </div>

      {libraryOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close document library"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setLibraryOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,360px)] flex-col bg-console-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-[#c8c8c0] px-3 py-3">
              <p className="text-[13px] font-medium text-ink">Documents</p>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className={consoleBtn}
              >
                Close
              </button>
            </div>
            <DocumentLibrary
              documents={libraryDocs}
              filter={filter}
              query={libraryQuery}
              selectedId={selectedId}
              onFilter={setFilter}
              onQuery={setLibraryQuery}
              onSelect={(id) => {
                selectDocument(id);
                setLibraryOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}

      <section className="border-t border-[#d9d9d2] bg-[#fafaf7] px-4 py-4 md:px-5">
        <h2 className="text-[13px] font-medium text-ink">Why LoopKnow matters</h2>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-5">
          {whyItMatters.map((item) => (
            <li key={item} className="text-[12px] leading-5 text-graphite">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AskWorkspace({
  input,
  answer,
  samplesOpen,
  askRef,
  onInput,
  onAsk,
  onSample,
  onSelectSource,
  onAction,
}: {
  input: string;
  answer: KnowAnswer | null;
  samplesOpen: boolean;
  askRef: RefObject<HTMLTextAreaElement | null>;
  onInput: (value: string) => void;
  onAsk: () => void;
  onSample: (question: string, category: string) => void;
  onSelectSource: (id: string) => void;
  onAction: (documentId?: string) => void;
}) {
  return (
    <div className="flex h-full flex-col px-4 py-4 md:px-5">
      <h2 className="text-[15px] font-medium tracking-tight text-ink">
        Ask LoopKnow
      </h2>
      <textarea
        ref={askRef}
        value={input}
        onChange={(event) => onInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onAsk();
          }
        }}
        rows={3}
        placeholder="Ask about a process, specification, quality issue, setup, maintenance procedure, or document revision..."
        className="mt-3 w-full resize-none border border-[#c8c8c0] bg-white px-3 py-3 text-[14px] leading-6 text-ink outline-none placeholder:text-stone focus:border-ink"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onAsk} className={consoleBtnSolid}>
          Ask
        </button>
        <p className="text-[11px] text-stone">
          Documents → answers → cited source → action
        </p>
      </div>

      {samplesOpen || !answer ? (
        <div className="mt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Sample questions
          </p>
          <ul className="mt-2 divide-y divide-[#ecece6] border-y border-[#ecece6]">
            {sampleQuestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSample(item.label, item.category)}
                  className="w-full py-2 text-left text-[13px] leading-5 text-ink hover:text-copper"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {answer ? (
        <AnswerReport
          answer={answer}
          onSelectSource={onSelectSource}
          onAction={onAction}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 border border-[#d9d9d2] bg-white px-4 py-4">
      <p className="text-[13px] leading-6 text-graphite">
        Ask a question against the fictional document library. Every answer
        shows the source, revision, and a suggested next step. If the sample
        set cannot verify an answer, LoopKnow will say so.
      </p>
    </div>
  );
}

function AnswerReport({
  answer,
  onSelectSource,
  onAction,
}: {
  answer: KnowAnswer;
  onSelectSource: (id: string) => void;
  onAction: (documentId?: string) => void;
}) {
  const coverage = coverageCopy[answer.coverage];

  return (
    <div className="mt-5 border border-[#d9d9d2] bg-white">
      <div className="border-b border-[#d9d9d2] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <CoverageBadge coverage={answer.coverage} />
          {answer.sources.length > 0 ? (
            <span className="text-[11px] text-stone">
              Sources used: {answer.sources.length}
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 text-[16px] font-medium tracking-tight text-ink">
          {answer.headline}
        </h3>
        <p className="mt-2 text-[14px] leading-6 text-ink">{answer.answer}</p>
        <p className="mt-2 text-[12px] leading-5 text-stone">{coverage.text}</p>
        {answer.warning ? (
          <p
            role="status"
            className="mt-3 border border-risk-amber bg-risk-amber-bg px-3 py-2 text-[12px] leading-5 text-ink"
          >
            {answer.warning}
          </p>
        ) : null}
      </div>

      {answer.revisionChange ? (
        <section className="border-b border-[#d9d9d2] px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Revision change
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="border border-[#d9d9d2] bg-[#fafaf7] px-3 py-3">
              <p className="text-[12px] font-medium text-ink">
                {answer.revisionChange.revisionA.label}
              </p>
              <p className="mt-1 text-[13px] leading-6 text-graphite">
                {answer.revisionChange.revisionA.text}
              </p>
            </div>
            <div className="border border-[#d9d9d2] bg-white px-3 py-3">
              <p className="text-[12px] font-medium text-ink">
                {answer.revisionChange.revisionB.label}
              </p>
              <p className="mt-1 text-[13px] leading-6 text-graphite">
                {answer.revisionChange.revisionB.text}
              </p>
            </div>
          </div>
          <dl className="mt-3 space-y-1.5 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-stone">Effective date</dt>
              <dd className="text-ink">{answer.revisionChange.effectiveDate}</dd>
            </div>
            <div>
              <dt className="text-stone">Disposition</dt>
              <dd className="mt-1 text-ink">{answer.revisionChange.disposition}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {answer.visualAid ? (
        <section className="border-b border-[#d9d9d2] px-4 py-4">
          <GoNoGoAid
            aid={answer.visualAid}
            note={answer.visualAidNote}
            compact
          />
        </section>
      ) : null}

      {answer.qualityHistory ? (
        <section className="border-b border-[#d9d9d2] px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Quality history
          </p>
          <dl className="mt-3 space-y-3 text-[13px]">
            <div>
              <dt className="font-medium text-ink">Root Cause</dt>
              <dd className="mt-0.5 text-graphite">
                {answer.qualityHistory.rootCause}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Containment</dt>
              <dd className="mt-0.5 text-graphite">
                {answer.qualityHistory.containment}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Corrective Action</dt>
              <dd className="mt-0.5 text-graphite">
                {answer.qualityHistory.correctiveAction}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Verification</dt>
              <dd className="mt-0.5 text-graphite">
                {answer.qualityHistory.verification}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {answer.sources.length > 0 ? (
        <section className="border-b border-[#d9d9d2] px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            {answer.sources.length === 1 ? "Source" : "Sources"}
          </p>
          <ul className="mt-2 space-y-2">
            {answer.sources.map((source) => (
              <li key={source.documentId}>
                <button
                  type="button"
                  onClick={() => onSelectSource(source.documentId)}
                  className="w-full border border-[#d9d9d2] bg-[#fafaf7] px-3 py-2.5 text-left hover:border-ink"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] text-ink">
                      {source.number}
                    </span>
                    <StatusBadge status={source.status} />
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-ink">
                    {source.title}
                  </p>
                  <p className="text-[11px] text-stone">
                    Revision {source.revision} · Effective {source.effectiveDate}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {answer.evidence.length > 0 ? (
        <section className="border-b border-[#d9d9d2] px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Evidence
          </p>
          <ul className="mt-2 space-y-3">
            {answer.evidence.map((item) => {
              const document = getDocument(item.documentId);
              return (
                <li key={`${item.documentId}-${item.heading}`}>
                  <p className="text-[13px] font-medium text-ink">
                    Relevant section: {item.heading}
                  </p>
                  {document ? (
                    <p className="text-[11px] text-stone">
                      {document.number} · Rev {document.revision}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[13px] leading-6 text-graphite">
                    “{item.text}”
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="px-4 py-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
          Suggested next step
        </p>
        <p className="mt-2 text-[14px] leading-6 text-ink">{answer.nextStep}</p>
        {answer.actions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {answer.actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => onAction(action.documentId)}
                className={consoleBtn}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
