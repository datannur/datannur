import type { en } from './en'

export type Locale = 'en' | 'fr' | 'de' | 'it'
export type LanguageOption = 'auto' | Locale
type WidenStringValues<T> = {
  readonly [Key in keyof T]: T[Key] extends string
    ? string
    : WidenStringValues<T[Key]>
}
type TranslationLeafKey<T> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : `${Key}.${TranslationLeafKey<T[Key]>}`
}[keyof T & string]

export type Translation = WidenStringValues<typeof en>
export type TranslationKey = TranslationLeafKey<typeof en>
