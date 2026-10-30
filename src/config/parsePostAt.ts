import moment from 'moment-timezone';

/**
 * Formats mods can use for `postAt`, tried in order with strict parsing.
 * ISO 8601 covers `2027-01-04T09:00` and ones with an offset, like
 * `2027-01-04T09:00-05:00`.
 */
const postAtFormats = [
  moment.ISO_8601,
  'YYYY-MM-DD HH:mm',
  'YYYY-MM-DD h:mma',
  'YYYY-MM-DD h:mm a',
  'MMM D, YYYY h:mma',
  'MMM D, YYYY h:mm a',
  'MMMM D, YYYY h:mma',
  'MMMM D, YYYY h:mm a',
  'MMM D YYYY h:mma',
  'MMM D YYYY h:mm a',
  'MMMM D YYYY h:mma',
  'MMMM D YYYY h:mm a',
  'YYYY-MM-DD',
];

/** Shown when a `postAt` value doesn't parse */
export const postAtFormatHelp =
  'use a date and time like "2027-01-04 9:00am", "Jan 4, 2027 9:00am", "2027-01-04T09:00-05:00", or just "2027-01-04" for midnight';

/**
 * Parse a `postAt` value. An offset in the value wins; otherwise we read the
 * time in `timezone`, or UTC when the config doesn't set one.
 *
 * Returns null when the value doesn't match any format in `postAtFormats`.
 */
export function parsePostAt(
  value: string,
  /** IANA timezone name, already validated; null means UTC */
  timezone: string | null
): Date | null {
  const parsed = moment.tz(
    value.trim(),
    postAtFormats,
    true,
    timezone ?? 'UTC'
  );
  return parsed.isValid() ? parsed.toDate() : null;
}

/** Whether moment-timezone knows this IANA timezone name */
export function isKnownTimezone(timezone: string): boolean {
  return moment.tz.zone(timezone) !== null;
}
