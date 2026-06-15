import { describe, expect, it, vi } from 'vitest'
import { highlightDiff } from '@lib/evolution'

vi.mock('@db', () => ({
  default: {},
}))

describe('Evolution', () => {
  it('should diff last update date-time values', () => {
    const diff = highlightDiff(
      '2026/06/15T12:32:13',
      '2026/06/15T13:32:13',
      'lastUpdate',
    )

    expect(diff).toContain('2026/06/15T12:32:13')
    expect(diff).toContain('2026/06/15T13:32:13')
    expect(diff).toContain('+1 heure')
  })

  it('should diff earlier last update date-time values', () => {
    const diff = highlightDiff(
      '2026/06/15T13:32:13',
      '2026/06/15T12:32:13',
      'lastUpdate',
    )

    expect(diff).toContain('-1 heure')
  })
})
