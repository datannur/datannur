import { describe, expect, it, vi } from 'vitest'

describe('simple diagram', () => {
  it('should parse labeled bidirectional edges', async () => {
    vi.stubGlobal('window', {
      location: {
        hash: '',
        search: '',
        pathname: '/',
        protocol: 'http:',
      },
    })
    vi.stubGlobal('document', {
      body: { getAttribute: () => null },
      cookie: '',
      querySelector: () => null,
    })
    vi.stubGlobal('HTMLScriptElement', class HTMLScriptElement {})

    const { parseSimpleDiagram, renderSimpleDiagram } =
      await import('@lib/simple-diagram')
    const diagram = parseSimpleDiagram(
      '$variable <-- source - dérivé --> $variable',
    )

    expect(diagram.nodes.map(node => node.id)).toEqual(['variable'])
    expect(diagram.edges).toEqual([
      {
        from: 'variable',
        to: 'variable',
        type: 'bidirectional',
        label: 'source - dérivé',
      },
    ])

    const svg = renderSimpleDiagram(
      '$variable <-- source - dérivé --> $variable',
    )
    expect(svg).toContain('source - dérivé')
    expect(svg).toMatch(
      /C \d+(?:\.\d+)? -?\d+(?:\.\d+)?, \d+(?:\.\d+)? \d+(?:\.\d+)?, \d+(?:\.\d+)? \d+(?:\.\d+)?/,
    )
    vi.unstubAllGlobals()
  })
})
