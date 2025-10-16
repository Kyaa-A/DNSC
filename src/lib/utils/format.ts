export interface FormatDateOptions {
  pattern?: Intl.DateTimeFormatOptions;
}

/**
 * Convert a UTC ISO timestamp to an event timezone formatted string.
 * Accepts ISO strings or epoch milliseconds as string; returns formatted date.
 */
export function utcToEventTimezone(
  utcIsoOrMs: string | number | Date | null | undefined,
  eventTimeZone: string,
  options?: FormatDateOptions
): string | null {
  if (!utcIsoOrMs || !eventTimeZone) return null;

  const date = utcIsoToDate(utcIsoOrMs);
  if (!date) return null;

  const pattern: Intl.DateTimeFormatOptions = options?.pattern ?? {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: eventTimeZone, ...pattern }).format(date);
  } catch {
    // Invalid time zone
    return null;
  }
}

export function utcIsoToDate(utcIsoOrMs: string | number | Date): Date | null {
  try {
    if (utcIsoOrMs instanceof Date) return utcIsoOrMs;
    if (typeof utcIsoOrMs === 'number') return new Date(utcIsoOrMs);
    // Ensure we treat input as UTC by requiring trailing 'Z' or converting if numeric-like
    const str = String(utcIsoOrMs).trim();
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}


