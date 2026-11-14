/** Small, dependency-free date helpers. All dates are local-time. */

const DAY = 86_400_000;

export function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** YYYY-MM-DD in local time. */
export function toDateKey(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Parse a YYYY-MM-DD key as a local date (not UTC). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/** Accepts Date, ISO timestamp, or YYYY-MM-DD key (parsed as local). */
export function toDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  return d.length === 10 ? fromDateKey(d) : new Date(d);
}

/** Calendar-day difference: b − a. */
export function diffDays(a: Date | string, b: Date | string): number {
  const da = startOfDay(toDate(a)).getTime();
  const db = startOfDay(toDate(b)).getTime();
  return Math.round((db - da) / DAY);
}

export function isToday(d: string | Date): boolean {
  return diffDays(new Date(), d) === 0;
}

export function startOfWeek(d: Date = new Date()): Date {
  // Week starts Monday for shop scheduling.
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7;
  return addDays(x, -day);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", opts);
const F = {
  weekdayLong: fmt({ weekday: "long", month: "long", day: "numeric" }),
  short: fmt({ month: "short", day: "numeric" }),
  shortYear: fmt({ month: "short", day: "numeric", year: "numeric" }),
  time: fmt({ hour: "numeric", minute: "2-digit" }),
  weekdayShort: fmt({ weekday: "short" }),
  dayTime: fmt({ month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
};

export const formatLongDay = (d: string | Date) => F.weekdayLong.format(toDate(d));
export const formatShort = (d: string | Date) => F.short.format(toDate(d));
export const formatShortYear = (d: string | Date) => F.shortYear.format(toDate(d));
export const formatTime = (d: string | Date) => F.time.format(new Date(d));
export const formatDayTime = (d: string | Date) => F.dayTime.format(new Date(d));

/** "Today", "Tomorrow", "Yesterday", "Mon", or "Nov 18". */
export function formatDue(d: string | Date): string {
  const delta = diffDays(new Date(), d);
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";
  if (delta > 1 && delta < 7) return F.weekdayShort.format(toDate(d));
  return formatShort(d);
}

/** Relative time: "just now", "12m ago", "3h ago", "Tue 2:15 PM", "Nov 2". */
export function formatRelative(iso: string): string {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  if (ms < 0) return formatTime(d);
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 12 && isToday(d)) return `${hours}h ago`;
  if (isToday(d)) return formatTime(d);
  const days = diffDays(d, new Date());
  if (days === 1) return `Yesterday ${formatTime(d)}`;
  if (days < 7) return `${F.weekdayShort.format(d)} ${formatTime(d)}`;
  return formatShort(d);
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
