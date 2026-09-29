/**
 * ISO-date (`YYYY-MM-DD`) arithmetic on the calendar, independent of the time zone: everything goes through UTC so a date string never
 * shifts by a day depending on where the code runs.
 */
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The UTC timestamp of an ISO date, or `null` when the text is not a real calendar date (`2026-02-30` is not). */
export function parseISO(text: string): number | null {
  const m = ISO.exec(text);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  return back.getUTCFullYear() === y && back.getUTCMonth() === mo - 1 && back.getUTCDate() === d ? t : null;
}

export function toISO(t: number): string {
  const d = new Date(t);
  return `${String(d.getUTCFullYear()).padStart(4, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function addDays(iso: string, days: number): string {
  const t = parseISO(iso);
  return t === null ? iso : toISO(t + days * 86_400_000);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** `Tuesday 14 April 2026` — the accessible name of a calendar day. */
export function longName(iso: string): string {
  const t = parseISO(iso);
  if (t === null) return iso;
  const d = new Date(t);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Today in the local calendar, as an ISO date. The one place the wall clock is read; components call it once, at creation. */
export function localToday(now: Date = new Date()): string {
  return `${String(now.getFullYear()).padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function clampISO(iso: string, min: string, max: string): string {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}
