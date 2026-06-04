import { getCurrentLocale } from './messages'
import type { Locale } from './types'

export function localizedMarkdown(files: { [locale in Locale]: string }) {
  return files[getCurrentLocale()] ?? files.en
}
