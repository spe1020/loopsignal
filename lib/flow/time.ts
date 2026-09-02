import type { TimeUnit } from "./schema";

export const HOUR_MIN = 60;
/** Calendar day. Lead time in a business process is wall-clock time. */
export const DAY_MIN = 24 * HOUR_MIN;

export const unitMinutes: Record<TimeUnit, number> = { minutes: 1, hours: HOUR_MIN, days: DAY_MIN };

export const unitLabels: Record<TimeUnit, { long: string; short: string }> = {
  minutes: { long: "minutes", short: "min" },
  hours: { long: "hours", short: "h" },
  days: { long: "days", short: "d" },
};

/** Minutes → value in the map's display unit (2 decimals max). */
export function toUnit(min: number, unit: TimeUnit): number {
  return Math.round((min / unitMinutes[unit]) * 100) / 100;
}

/** Value typed in the map's unit → minutes. */
export function fromUnit(value: number, unit: TimeUnit): number {
  return Math.round(value * unitMinutes[unit]);
}

/** Parse a typed time like "30", "2.5", "1h", "2d 4h", "45m". Empty → undefined. */
export function parseTime(text: string, unit: TimeUnit): number | undefined {
  const t = text.trim().toLowerCase();
  if (!t) return undefined;
  if (/^\d+(\.\d+)?$/.test(t)) return fromUnit(Number(t), unit);
  let total = 0;
  let matched = false;
  const re = /(\d+(?:\.\d+)?)\s*(d|day|days|h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    matched = true;
    const n = Number(m[1]);
    const u = m[2][0];
    total += u === "d" ? n * DAY_MIN : u === "h" ? n * HOUR_MIN : n;
  }
  return matched ? Math.round(total) : undefined;
}

/** Compact, readable duration: "45 min", "2 h 15 min", "3 d 4 h", "0". */
export function formatMinutes(min: number | undefined, opts: { unknown?: string; compact?: boolean } = {}): string {
  if (min === undefined || min === null || Number.isNaN(min)) return opts.unknown ?? "?";
  if (min === 0) return "0";
  const compact = opts.compact ?? false;
  const d = Math.floor(min / DAY_MIN);
  const h = Math.floor((min % DAY_MIN) / HOUR_MIN);
  const m = Math.round(min % HOUR_MIN);
  const parts: string[] = [];
  if (d) parts.push(`${d} d`);
  if (h) parts.push(`${h} h`);
  if (m && (!compact || parts.length < 2) && !(d && compact)) parts.push(`${m} min`);
  if (compact && parts.length > 2) parts.length = 2;
  return parts.join(" ") || `${Math.round(min)} min`;
}

/** Same as formatMinutes but in the map's display unit when the value is large. */
export function formatInUnit(min: number | undefined, unit: TimeUnit): string {
  if (min === undefined) return "?";
  if (unit === "minutes") return formatMinutes(min);
  const v = toUnit(min, unit);
  const short = unitLabels[unit].short;
  if (v >= 1) return `${Number.isInteger(v) ? v : v.toFixed(1)} ${short}`;
  return formatMinutes(min);
}

export function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}
