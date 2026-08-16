/** Frozen as-of date for prerendered demo fixtures. Never use `new Date()` here. */
export const SAMPLE_AS_OF_DATE = "2026-08-15";

export function formatSampleAsOf(isoDate = SAMPLE_AS_OF_DATE): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
