const IST_TIME_ZONE = 'Asia/Kolkata'

const parseTimestamp = (value: string): Date | null => {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return null
  }

  const normalized = raw.replace(' ', 'T')
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
  const isoValue = hasTimezone ? normalized : `${normalized}Z`
  const date = new Date(isoValue)

  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Format a date string to IST (Indian Standard Time - UTC+5:30)
 * @param dateStr ISO date string
 * @returns Formatted date string (e.g., "28 Mar 2026")
 */
export const formatDateIST = (dateStr: string): string => {
  const date = parseTimestamp(dateStr)
  if (!date) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: IST_TIME_ZONE,
  }).format(date)
}

/**
 * Format a date string to IST with time
 * @param dateStr ISO date string
 * @returns Formatted date and time string (e.g., "28 Mar 2026, 14:30")
 */
export const formatDateTimeIST = (dateStr: string): string => {
  const date = parseTimestamp(dateStr)
  if (!date) {
    return 'N/A'
  }

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: IST_TIME_ZONE,
  }).format(date)

  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: IST_TIME_ZONE,
  }).format(date)

  return `${formattedDate}, ${formattedTime}`
}
