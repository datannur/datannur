import { locale } from '@lib/constant'
import type { Locale } from '@i18n/types'

function isQuarterSeparator(char: string): boolean {
  return 'tTqQ'.includes(char)
}

export function convertQuarterToFullDate(
  completeDate: string,
  mode: 'start' | 'end' = 'start',
): string {
  const quarter = completeDate[5]
  completeDate = completeDate.slice(0, 4)
  if (mode === 'start') {
    if (quarter === '1') completeDate += '/01'
    else if (quarter === '2') completeDate += '/04'
    else if (quarter === '3') completeDate += '/07'
    else if (quarter === '4') completeDate += '/10'
    completeDate += '/01'
  } else if (mode === 'end') {
    if (quarter === '1') completeDate += '/03'
    else if (quarter === '2') completeDate += '/06'
    else if (quarter === '3') completeDate += '/09'
    else if (quarter === '4') completeDate += '/12'
    completeDate += '/30'
  }
  return completeDate
}

export function dateToTimestamp(
  date: string | number,
  mode: 'start' | 'end' = 'start',
): number {
  if (typeof date === 'number') return normalizeTimestamp(date)
  if (isUnixTimestampString(date)) return normalizeTimestamp(Number(date))

  let completeDate = date
  if (!completeDate) return 0
  if (completeDate.length === 4) {
    if (mode === 'start') completeDate += '/01'
    if (mode === 'end') completeDate += '/12'
  }
  if (completeDate.length === 7) {
    if (mode === 'start') completeDate += '/01'
    if (mode === 'end') completeDate += '/30'
  }

  if (completeDate.length === 6 && isQuarterSeparator(completeDate[4])) {
    completeDate = convertQuarterToFullDate(completeDate, mode)
  }
  return Date.parse(normalizeDateTimeInput(completeDate))
}

function normalizeDateTimeInput(date: string): string {
  return date.replace(/^(\d{4})\/(\d{2})\/(\d{2})([T ].*)$/, '$1-$2-$3$4')
}

export function hasTimePrecision(date: string | number): boolean {
  if (typeof date === 'number') return true
  if (isUnixTimestampString(date)) return true
  return /(?:T| )\d{1,2}:\d{2}/.test(date)
}

function isUnixTimestampString(value: string): boolean {
  return /^\d{10}(?:\d{3})?$/.test(value.trim())
}

function normalizeTimestamp(timestamp: number): number {
  return Math.abs(timestamp) < 100000000000 ? timestamp * 1000 : timestamp
}

export function timestampToDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toISOString().slice(0, 10).replaceAll('-', '/')
}

export function normalizeLastUpdateDate(value: string | number | null): string {
  if (!value) return ''
  if (typeof value === 'string' && value.includes('T')) return value
  if (typeof value === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(value)) {
    return value
  }

  const numeric = Number(value)
  if (Number.isFinite(numeric)) {
    return new Date(normalizeTimestamp(numeric))
      .toISOString()
      .slice(0, 19)
      .replaceAll('-', '/')
  }

  return String(value)
}

const divisions: {
  amount: number
  name: Intl.RelativeTimeFormatUnit
  localName: string
}[] = [
  { amount: 60, name: 'seconds', localName: 'seconde' },
  { amount: 60, name: 'minutes', localName: 'minute' },
  { amount: 24, name: 'hours', localName: 'heure' },
  { amount: 7, name: 'days', localName: 'jour' },
  { amount: 4.34524, name: 'weeks', localName: 'semaine' },
  { amount: 12, name: 'months', localName: 'mois' },
  { amount: Number.POSITIVE_INFINITY, name: 'years', localName: 'an' },
]

export function getDatetime(timestamp: number, withSecond = false): string {
  const date = new Date(normalizeTimestamp(timestamp))

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  if (withSecond) {
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
  }
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

export function formatDateTime(date: string | number): string {
  if (typeof date === 'number') return getDatetime(date, true)

  if (isUnixTimestampString(date)) return getDatetime(Number(date), true)

  const timestamp = dateToTimestamp(date)
  if (Number.isFinite(timestamp) && /(?:Z|[+-]\d{2}:?\d{2})$/.test(date)) {
    return getDatetime(
      timestamp,
      /:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/.test(date),
    )
  }

  return date.replace(/-/g, '/').replace('T', ' ')
}

export function getDateTimeSortValue(date: string | number): number {
  return dateToTimestamp(date, 'start')
}

export function getTimeAgo(
  date: string | number,
  parse = false,
  day = false,
  dateNow = new Date(),
  formatLocale: Locale | string = locale,
) {
  if (!date) return ''
  if (parse && typeof date === 'string') date = dateToTimestamp(date)
  if (typeof date === 'number') date = normalizeTimestamp(date)
  if (day) dateNow.setHours(0, 0, 0, 0)
  let duration = (Number(date) - Number(dateNow)) / 1000
  const formatter = new Intl.RelativeTimeFormat(formatLocale, {
    numeric: 'auto',
  })
  if (day && duration === 0) return formatter.format(0, 'days')
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.name)
    }
    duration /= division.amount
  }
  return ''
}

export function getPeriod(
  start: string | number | Date,
  end: string | number | Date,
  parse = false,
) {
  if (!start || !end) return ''
  if (parse) {
    let startStr = String(start)
    let endStr = String(end)

    if (startStr.length === 4) startStr += '/01'
    if (startStr.length === 7) startStr += '/01'
    if (endStr.length === 4) endStr += '/12'
    if (endStr.length === 7) endStr += '/30'
    if (startStr.length === 6 && isQuarterSeparator(startStr[4])) {
      startStr = convertQuarterToFullDate(startStr, 'start')
    }
    if (endStr.length === 6 && isQuarterSeparator(endStr[4])) {
      endStr = convertQuarterToFullDate(endStr, 'end')
    }
    start = Date.parse(startStr)
    end = Date.parse(endStr)
    if (end - start < 10 * 24 * 3600 * 1000) end += 1 * 24 * 3600 * 1000
    else end += 3 * 24 * 3600 * 1000
  }
  let duration = (Number(end) - Number(start)) / 1000
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      const roundDuration = Math.round(duration)
      let unit = division.localName
      if (roundDuration > 1 && !unit.endsWith('s')) unit += 's'
      return roundDuration + ' ' + unit
    }
    duration /= division.amount
  }
  return ''
}
