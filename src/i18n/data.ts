import { getCurrentLocale } from './messages'

export function localizedField(
  item: { [key: string]: unknown },
  field: string,
): unknown {
  const locale = getCurrentLocale()
  const localizedValue = item[`${field}:${locale}`]
  return localizedValue === undefined ||
    localizedValue === null ||
    localizedValue === ''
    ? item[field]
    : localizedValue
}
