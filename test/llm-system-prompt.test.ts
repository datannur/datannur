import { describe, expect, it } from 'vitest'
import { buildSystemPrompt } from '@llm/system-prompt'

describe('LLM system prompt', () => {
  it('should inject the default response language from the UI locale', () => {
    const englishPrompt = buildSystemPrompt('en')
    const frenchPrompt = buildSystemPrompt('fr')

    expect(englishPrompt).toContain('Default response language: English')
    expect(englishPrompt).toContain(
      'Use **English** as the default response language',
    )
    expect(frenchPrompt).toContain('Default response language: French')
    expect(frenchPrompt).toContain(
      'Use **French** as the default response language',
    )
  })

  it('should instruct the assistant to follow the user language when clear', () => {
    const prompt = buildSystemPrompt('fr')

    expect(prompt).toContain(
      "When the user's latest message is clearly in another language, answer in that language instead.",
    )
    expect(prompt).toContain('Spanish user with a French UI')
  })
})
