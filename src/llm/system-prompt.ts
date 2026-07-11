import promptTemplate from '@llm-prompt/_system-prompt.md?raw'
import systemInstructions from '@llm-prompt/system-instructions.md?raw'
import toolsGuidelines from '@llm-prompt/tools-guidelines.md?raw'
import schemaDoc from '@llm-prompt/schema.md?raw'
import type { Locale } from '@i18n/types'

let cachedPrompt: string | null = null
let cachedKey: string | null = null

const defaultResponseLanguage: { [locale in Locale]: string } = {
  en: 'English',
  fr: 'French',
  de: 'German',
  it: 'Italian',
}

function replacePlaceholders(
  content: string,
  placeholders: Map<string, string>,
) {
  return content.replace(
    /\{\{(\w[\w-]*)\}\}/g,
    (match, key) => placeholders.get(key) ?? match,
  )
}

export function buildSystemPrompt(locale: Locale): string {
  const dateOnly = new Date().toISOString().split('T')[0]
  const cacheKey = `${dateOnly}:${locale}`
  if (cachedPrompt && cachedKey === cacheKey) return cachedPrompt

  const placeholders = new Map([
    ['date', dateOnly],
    ['locale', locale],
    ['default-response-language', defaultResponseLanguage[locale]],
    ['system-instructions', systemInstructions],
    ['schema', schemaDoc],
    ['tools-guidelines', toolsGuidelines],
  ])

  cachedKey = cacheKey
  cachedPrompt = replacePlaceholders(
    replacePlaceholders(promptTemplate, placeholders),
    placeholders,
  )

  return cachedPrompt
}
