/**
 * Date helpers. The FitTrack backend stores each day at UTC midnight, and the
 * web app addresses days by their UTC date string — the mobile app follows the
 * exact same convention so both clients always agree on "today".
 */

/** YYYY-MM-DD in UTC. */
export function getUTCDateString(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** "Mon, 12 Aug" for a YYYY-MM-DD (UTC) string or ISO date. */
export function formatDisplayDate(dateString: string): string {
  const iso = dateString.includes('T') ? dateString : `${dateString}T00:00:00Z`;
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** "Aug 12" (short) for chart axes and best-day cards. */
export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Local time "14:05" for a logged food's timestamp. */
export function formatTime(timestamp?: string): string {
  if (!timestamp) return 'No time';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** "8:00 AM" style label for an hour/minute pair. */
export function formatClockTime(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Long header date, e.g. "Sunday, 17 August". */
export function formatLongDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Shift a YYYY-MM-DD (UTC) string by N days. */
export function shiftUTCDate(dateString: string, days: number): string {
  const d = new Date(`${dateString}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return getUTCDateString(d);
}

export function isTodayUTC(dateString: string): boolean {
  return dateString === getUTCDateString();
}
