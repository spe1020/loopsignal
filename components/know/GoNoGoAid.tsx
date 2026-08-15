import Image from "next/image";
import type { VisualAid, VisualAidSide } from "@/lib/know/types";

const sideStyles = {
  go: {
    frame: "border-risk-track bg-risk-track-bg",
    bar: "bg-risk-track",
    badge: "border-risk-track bg-risk-track text-white",
    result: "text-risk-track",
  },
  nogo: {
    frame: "border-risk-critical bg-risk-critical-bg",
    bar: "bg-risk-critical",
    badge: "border-risk-critical bg-risk-critical text-white",
    result: "text-risk-critical",
  },
} as const;

function SideCard({
  side,
  compact,
}: {
  side: VisualAidSide & { kind: "go" | "nogo" };
  compact?: boolean;
}) {
  const style = sideStyles[side.kind];

  return (
    <figure className={`overflow-hidden border ${style.frame}`}>
      <div className={`h-1.5 ${style.bar}`} />
      <div className="relative aspect-[4/3] overflow-hidden bg-ink">
        <Image
          src={side.image}
          alt={side.alt}
          fill
          className="object-cover"
          sizes={compact ? "280px" : "(min-width: 768px) 50vw, 100vw"}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-3 pb-3 pt-8">
          <span
            className={`inline-flex items-center border px-2 py-1 font-mono text-[11px] font-medium tracking-[0.12em] ${style.badge}`}
          >
            {side.label}
          </span>
        </div>
      </div>
      <figcaption className={compact ? "px-3 py-3" : "px-4 py-4"}>
        <p
          className={`font-mono text-[10px] font-medium tracking-[0.12em] uppercase ${style.result}`}
        >
          {side.result}
        </p>
        <ul className="mt-2 space-y-1.5">
          {side.criteria.map((item) => (
            <li
              key={item}
              className={`leading-5 text-ink ${compact ? "text-[12px]" : "text-[13px]"}`}
            >
              {item}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

export function GoNoGoAid({
  aid,
  note,
  compact = false,
  layout = "pair",
}: {
  aid: VisualAid;
  note?: string;
  compact?: boolean;
  layout?: "pair" | "stack";
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
          Visual aid · {aid.documentNumber}
        </p>
        <p className="text-[11px] text-stone">{aid.section}</p>
      </div>
      <h3
        className={`mt-1 font-medium tracking-tight text-ink ${
          compact ? "text-[14px]" : "text-[16px]"
        }`}
      >
        {aid.title}
      </h3>
      <p
        className={`mt-2 leading-6 text-graphite ${compact ? "text-[12px]" : "text-[14px]"}`}
      >
        {aid.instruction}
      </p>
      <div
        className={`mt-3 grid gap-2 ${layout === "pair" ? "sm:grid-cols-2" : ""}`}
      >
        <SideCard side={{ ...aid.go, kind: "go" }} compact={compact} />
        <SideCard side={{ ...aid.nogo, kind: "nogo" }} compact={compact} />
      </div>
      <p
        className={`mt-3 border border-ink bg-white px-3 py-2.5 leading-6 text-ink ${
          compact ? "text-[12px]" : "text-[13px]"
        }`}
      >
        <span className="font-medium">Accept rule. </span>
        {aid.acceptRule}
      </p>
      {note ? (
        <p className="mt-2 border border-risk-critical bg-risk-critical-bg px-3 py-2 text-[12px] leading-5 text-ink">
          {note}
        </p>
      ) : null}
    </div>
  );
}
