import { GoNoGoAid } from "@/components/know/GoNoGoAid";
import { StatusBadge } from "@/components/know/StatusBadge";
import { relatedDocuments } from "@/lib/know";
import type { Excerpt, KnowDocument } from "@/lib/know/types";

export function SourcePanel({
  document,
  excerpt,
  onSelectRelated,
}: {
  document: KnowDocument | null;
  excerpt?: Excerpt;
  onSelectRelated: (id: string) => void;
}) {
  if (!document) {
    return (
      <div className="px-4 py-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
          Source
        </p>
        <p className="mt-2 text-[13px] leading-6 text-graphite">
          Select a document or generate an answer to see revision, owner, and
          related records.
        </p>
      </div>
    );
  }

  const related = relatedDocuments(document);

  return (
    <div className="px-4 py-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
        Document details
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[12px] text-ink">{document.number}</span>
        <StatusBadge status={document.status} size="md" />
      </div>
      <h3 className="mt-2 text-[16px] leading-6 font-medium tracking-tight text-ink">
        {document.title}
      </h3>
      <p className="mt-1 text-[12px] text-graphite">{document.typeLabel}</p>

      <dl className="mt-4 space-y-1.5 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-stone">Revision</dt>
          <dd className="font-medium text-ink">{document.revision}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone">Effective</dt>
          <dd className="text-ink">{document.effectiveDate}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone">Owner</dt>
          <dd className="text-right text-ink">{document.owner}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone">Status</dt>
          <dd className="text-ink">
            {document.status === "current"
              ? "Current"
              : document.status === "draft"
                ? "Draft"
                : "Superseded"}
          </dd>
        </div>
      </dl>

      {document.status === "superseded" && document.supersededById ? (
        <button
          type="button"
          onClick={() => onSelectRelated(document.supersededById!)}
          className="mt-3 w-full border border-risk-critical bg-risk-critical-bg px-3 py-2 text-left text-[12px] leading-5 text-ink"
        >
          This revision is superseded. Open the current document.
        </button>
      ) : null}

      {document.status === "draft" ? (
        <p className="mt-3 border border-risk-amber bg-risk-amber-bg px-3 py-2 text-[12px] leading-5 text-ink">
          Draft — not released for production use.
        </p>
      ) : null}

      {excerpt ? (
        <section className="mt-4 border-t border-[#d9d9d2] pt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Relevant section
          </p>
          <p className="mt-2 text-[13px] font-medium text-ink">{excerpt.heading}</p>
          <p className="mt-1 text-[13px] leading-6 text-graphite">“{excerpt.text}”</p>
        </section>
      ) : (
        <section className="mt-4 border-t border-[#d9d9d2] pt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Summary
          </p>
          <p className="mt-2 text-[13px] leading-6 text-graphite">{document.summary}</p>
        </section>
      )}

      {document.visualAid ? (
        <section className="mt-4 border-t border-[#d9d9d2] pt-4">
          <GoNoGoAid aid={document.visualAid} compact layout="stack" />
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-4 border-t border-[#d9d9d2] pt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
            Related documents
          </p>
          <ul className="mt-2 space-y-1">
            {related.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectRelated(item.id)}
                  className="w-full text-left text-[13px] text-ink underline decoration-[#cfcfc8] underline-offset-4 hover:decoration-ink"
                >
                  {item.number} — {item.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
