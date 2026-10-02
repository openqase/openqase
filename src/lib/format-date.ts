const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }

/**
 * Format a nullable timestamp for display. Returns null (renders as nothing
 * in JSX) for null/empty/invalid input instead of `new Date(null)`'s
 * 1 January 1970.
 */
export function formatPublishedDate(
  value: string | null | undefined,
  locale = 'en-GB',
  options: Intl.DateTimeFormatOptions = DEFAULT_OPTIONS
): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(locale, options)
}
