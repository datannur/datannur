import { describe, it, expect } from 'vitest'
import {
  dateToTimestamp,
  formatDateTime,
  getDateTimeSortValue,
  getTimeAgo,
  hasTimePrecision,
  normalizeLastUpdateDate,
} from '@lib/time'

const sameDateMultipleTimes = [
  [new Date(2023, 10, 25, 0, 30, 0)],
  [new Date(2023, 10, 25, 3, 0, 0)],
  [new Date(2023, 10, 25, 12, 0, 0)],
  [new Date(2023, 10, 25, 15, 30, 0)],
  [new Date(2023, 10, 25, 21, 45, 0)],
  [new Date(2023, 10, 25, 23, 45, 0)],
]

function formatLocalDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

describe('Time', () => {
  it('should parse slash date-time values', () => {
    expect(dateToTimestamp('2026/05/26T14:32:10')).toBe(
      new Date(2026, 4, 26, 14, 32, 10).getTime(),
    )
  })

  it('should normalize Unix timestamps in seconds', () => {
    expect(dateToTimestamp(1726403530)).toBe(1726403530000)
    expect(dateToTimestamp('1726403530')).toBe(1726403530000)
    expect(formatDateTime(1726403530)).toBe(formatLocalDateTime(1726403530000))
    expect(formatDateTime('1726403530')).toBe(
      formatLocalDateTime(1726403530000),
    )
  })

  it('should normalize Unix timestamps in milliseconds', () => {
    expect(dateToTimestamp('1726403530000')).toBe(1726403530000)
    expect(formatDateTime('1726403530000')).toBe(
      formatLocalDateTime(1726403530000),
    )
  })

  it('should detect time precision', () => {
    expect(hasTimePrecision('2026/05/26')).toBe(false)
    expect(hasTimePrecision('2026')).toBe(false)
    expect(hasTimePrecision('1726403530')).toBe(true)
    expect(hasTimePrecision('2026/05/26T14:32:10')).toBe(true)
    expect(hasTimePrecision('2026-05-26T14:32:10')).toBe(true)
    expect(hasTimePrecision(new Date(2026, 4, 26, 14, 32, 10).getTime())).toBe(
      true,
    )
  })

  it('should format date-time values without losing the time', () => {
    expect(formatDateTime('2026/05/26')).toBe('2026/05/26')
    expect(formatDateTime('2026/05/26T14:32:10')).toBe('2026/05/26 14:32:10')
    expect(formatDateTime('2026-05-26T14:32:10')).toBe('2026/05/26 14:32:10')
  })

  it('should normalize document last update values without losing seconds', () => {
    expect(normalizeLastUpdateDate('2026/05/26T14:32:10')).toBe(
      '2026/05/26T14:32:10',
    )
    expect(normalizeLastUpdateDate('2026/05/26')).toBe('2026/05/26')
    expect(normalizeLastUpdateDate('1706239962.0')).toBe(
      new Date(1706239962 * 1000)
        .toISOString()
        .slice(0, 19)
        .replaceAll('-', '/'),
    )
  })

  it('should sort date-times as normalized timestamps', () => {
    expect(getDateTimeSortValue('2024/10/01T14:32:10')).toBe(
      new Date(2024, 9, 1, 14, 32, 10).getTime(),
    )
    expect(getDateTimeSortValue(1726403530)).toBe(1726403530000)
  })

  it.each(sameDateMultipleTimes)(
    'should work with param day = true',
    dateNow => {
      const dates = [
        ['2023/11/25', "aujourd'hui"],
        ['2023/11/24', 'hier'],
        ['2023/11/23', 'avant-hier'],
        ['2023/11/22', 'il y a 3 jours'],
        ['2023/11/21', 'il y a 4 jours'],
        ['2023/11/20', 'il y a 5 jours'],
        ['2023/11/19', 'il y a 6 jours'],
        ['2023/11/18', 'la semaine dernière'],
        ['2023/11/17', 'la semaine dernière'],
        ['2023/11/16', 'la semaine dernière'],
      ]
      dates.forEach(([date, expected]) => {
        const result = getTimeAgo(date, true, true, dateNow)
        expect(result).toBe(expected)
      })
    },
  )
})
