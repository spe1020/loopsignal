import type { Finding } from "@/lib/solve/rules";
import { IconAlert } from "@/components/loop/icons";

/** Render the complete domain result. Unknown future codes cannot be hidden. */
export function ClosureBlockers({
  findings,
  onFix,
}: {
  findings: Finding[];
  onFix: (finding: Finding) => void;
}) {
  return (
    <ul className="mt-3 flex flex-col gap-3" aria-label="Closure blockers">
      {findings.map((f, i) => (
        <li
          key={`${f.code}:${f.entityId ?? i}`}
          data-finding-code={f.code}
          className="flex items-start gap-2 text-[13.5px] leading-5"
        >
          <IconAlert size={16} className="mt-0.5 shrink-0 text-risk-amber" />
          <div className="min-w-0">
            <p>{f.message || `Resolve ${f.code} before closure.`}</p>
            <button
              type="button"
              onClick={() => onFix(f)}
              className="min-h-[44px] py-2 text-left font-medium text-copper underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-copper"
            >
              {f.stage === "verify"
                ? "Review verification"
                : f.stage === "actions"
                  ? "Review required action"
                  : f.stage === "root-cause"
                    ? "Review root cause"
                    : `Open ${f.stage} stage`}{" "}
              →
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
