import { formatSampleAsOf } from "@/lib/sample-as-of";

export function SampleDataCaption({
  asOf,
  className = "",
}: {
  asOf?: string;
  className?: string;
}) {
  return (
    <p
      className={`text-[10px] font-medium uppercase tracking-[0.16em] text-stone ${className}`}
    >
      Sample data as of {formatSampleAsOf(asOf)}
    </p>
  );
}
