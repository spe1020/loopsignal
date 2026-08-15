const NY_TZ = "America/New_York";
const DAY_MS = 86_400_000;

export function todayStamp(timeZone = NY_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(isoDate: string, days: number): string {
  const utc = Date.parse(`${isoDate}T00:00:00Z`);
  if (!Number.isFinite(utc)) {
    throw new Error("invalid date");
  }
  return new Date(utc + days * DAY_MS).toISOString().slice(0, 10);
}

export function diffDays(later: string, earlier: string): number {
  const a = Date.parse(`${later}T00:00:00Z`);
  const b = Date.parse(`${earlier}T00:00:00Z`);
  return Math.round((a - b) / DAY_MS);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function parseDateValue(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (match) {
    return toIso(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(raw);
  if (match) {
    return toIso(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(raw);
  if (match) {
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    return toIso(year, Number(match[1]), Number(match[2]));
  }

  return null;
}

export function formatIsoDate(isoDate: string): string {
  const utc = Date.parse(`${isoDate}T00:00:00Z`);
  if (!Number.isFinite(utc)) return isoDate;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(utc);
}

export function formatDayCount(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export function formatRelativeDue(
  daysPastDue: number,
  daysUntilDue: number,
): string {
  if (daysPastDue > 0) return `${formatDayCount(daysPastDue)} ago`;
  if (daysUntilDue === 0) return "today";
  return `in ${formatDayCount(daysUntilDue)}`;
}
