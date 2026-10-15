const RELEASE_DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30;

/** Parses a `YYYY-MM-DD` string without letting the local timezone shift the day. */
function parseIsoDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `April 12, 2026` for a `YYYY-MM-DD` date, or `null` when it cannot be parsed. */
export function formatReleaseDate(releaseDate: string): string | null {
  const date = parseIsoDate(releaseDate);
  return date ? RELEASE_DATE_FORMAT.format(date) : null;
}

/** `2h 18m` for a runtime in minutes, or `null` when the runtime is unknown. */
export function formatRuntime(runtimeMinutes: number | null): string | null {
  if (runtimeMinutes === null || runtimeMinutes <= 0) {
    return null;
  }

  const hours = Math.floor(runtimeMinutes / 60);
  const minutes = runtimeMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * Human friendly countdown for an upcoming release, relative to `now`.
 * Returns `null` for past or unparseable dates.
 */
export function formatReleaseCountdown(releaseDate: string, now: number): string | null {
  const date = parseIsoDate(releaseDate);
  if (!date) {
    return null;
  }

  const days = Math.round((date.getTime() - now) / MS_PER_DAY);
  if (days < 0) {
    return null;
  }
  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Tomorrow';
  }
  if (days <= DAYS_PER_MONTH) {
    return `In ${days}d`;
  }
  return `In ${Math.round(days / DAYS_PER_MONTH)}mo`;
}

/**
 * True when a title has a parseable release date that is still in the future,
 * relative to `now`. Titles opening today or earlier are already out, so they
 * are excluded from "coming soon" lists.
 */
export function isUpcomingRelease(releaseDate: string, now: number): boolean {
  const date = parseIsoDate(releaseDate);
  if (!date) {
    return false;
  }
  const days = Math.round((date.getTime() - now) / MS_PER_DAY);
  return days >= 1;
}

/** `2026` for a `YYYY-MM-DD` date, or `null` when it cannot be parsed. */
export function formatReleaseYear(releaseDate: string | undefined): number | null {
  if (!releaseDate) {
    return null;
  }

  const year = new Date(releaseDate).getFullYear();
  return Number.isNaN(year) ? null : year;
}
