import { beforeEach, describe, expect, it, vi } from 'vitest'
import { highlightDiff } from '@lib/evolution'
import { currentLocale } from '@i18n/state'

vi.mock('@db', () => ({
  default: {},
}))

describe('Evolution', () => {
  beforeEach(() => {
    currentLocale.set('en')
  })

  it('should diff last update date-time values', () => {
    const diff = highlightDiff(
      '2026/06/15T12:32:13',
      '2026/06/15T13:32:13',
      'lastUpdate',
    )

    expect(diff).toContain('2026/06/15T12:32:13')
    expect(diff).toContain('2026/06/15T13:32:13')
    expect(diff).toContain('+1 hour')
  })

  it('should diff earlier last update date-time values', () => {
    const diff = highlightDiff(
      '2026/06/15T13:32:13',
      '2026/06/15T12:32:13',
      'lastUpdate',
    )

    expect(diff).toContain('-1 hour')
  })

  it('should diff last update date-time values with long units', () => {
    const diff = highlightDiff(
      '2026/01/15T12:32:13',
      '2026/06/15T12:32:13',
      'lastUpdate',
    )

    expect(diff).toContain('+5 months')
  })

  it('should localize last update date-time diff units', () => {
    currentLocale.set('fr')

    const diff = highlightDiff(
      '2026/01/15T12:32:13',
      '2026/06/15T12:32:13',
      'lastUpdate',
    )

    expect(diff).toContain('+5 mois')
  })
})
