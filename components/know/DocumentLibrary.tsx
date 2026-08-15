import type { Ref } from "react";
import { StatusBadge } from "@/components/know/StatusBadge";
import { filterLabels } from "@/lib/know";
import type { DocumentFilter, KnowDocument } from "@/lib/know/types";
import { documentFilters } from "@/lib/know/types";

export function DocumentLibrary({
  documents,
  filter,
  query,
  selectedId,
  inputRef,
  onFilter,
  onQuery,
  onSelect,
}: {
  documents: KnowDocument[];
  filter: DocumentFilter;
  query: string;
  selectedId?: string;
  inputRef?: Ref<HTMLInputElement>;
  onFilter: (filter: DocumentFilter) => void;
  onQuery: (query: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#d9d9d2] px-3 py-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
          Document Library
        </p>
        <label className="mt-2 block">
          <span className="sr-only">Search documents</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search documents"
            className="w-full border border-[#c8c8c0] bg-white px-2.5 py-2 text-[13px] text-ink outline-none placeholder:text-stone focus:border-ink"
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-1">
          {documentFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onFilter(item)}
              className={`border px-2 py-1 text-[10px] font-medium tracking-[0.04em] ${
                filter === item
                  ? "border-ink bg-ink text-white"
                  : "border-[#d9d9d2] bg-white text-graphite hover:border-ink"
              }`}
            >
              {filterLabels[item]}
            </button>
          ))}
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <li className="px-3 py-4 text-[13px] text-graphite">
            No sample documents match this search.
          </li>
        ) : (
          documents.map((document) => {
            const selected = document.id === selectedId;
            return (
              <li key={document.id}>
                <button
                  type="button"
                  onClick={() => onSelect(document.id)}
                  className={`w-full border-b border-[#ecece6] px-3 py-2.5 text-left ${
                    selected ? "bg-white" : "bg-transparent hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-ink">
                      {document.number}
                    </span>
                    <StatusBadge status={document.status} />
                  </div>
                  <p className="mt-1 text-[13px] leading-5 font-medium text-ink">
                    {document.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-stone">
                    Rev {document.revision} · {document.typeLabel}
                  </p>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
