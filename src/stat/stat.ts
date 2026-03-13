import Render from '@lib/render'
import { getTimeAgo } from '@lib/time'
import Histogram from './histogram'
import { attributs } from './attributs'
import type { Attribut } from './attributs-def'

type ValueType = number | string | '__empty__'

export type ValueEntry = {
  count: number
  start: ValueType
  end?: ValueType
  readable?: string
  icon?: string
  link?: string
}

export type AttributWithValues = Attribut & {
  values: ValueEntry[]
  totalValue: number
}

type DatabaseItem = Record<string, unknown>

function getValueReadable(start: ValueType, end: ValueType | undefined) {
  if (start === 0 || start === end) return Render.num(start)
  return `${Render.num(start)} - ${Render.num(end)}`
}

function addReadableValues(values: ValueEntry[], type: string) {
  for (const value of values) {
    if (value.start === '__empty__') {
      value.readable = 'vide / manquant'
      continue
    }
    if (!['numeric', 'string'].includes(type)) {
      value.readable = String(value.start)
      continue
    }
    value.readable = getValueReadable(value.start, value.end)
    if (type === 'string') {
      value.readable +=
        ' caractère' + (parseInt(value.start as string) > 1 ? 's' : '')
    }
  }
  return values
}

function getValuesSorted(
  values: Record<string, ValueEntry>,
  sortBy: 'start' | 'count' = 'count',
) {
  const list = Object.entries(values)
  const sorted = list.map(([start, valueEntry]) => ({
    start,
    count: valueEntry.count,
    icon: valueEntry.icon,
    link: valueEntry.link,
  }))
  sorted.sort((a, b) => {
    if (a.start === '__empty__') return -1
    if (b.start === '__empty__') return 1
    if (sortBy === 'count') return b.count - a.count
    const aVal = typeof a.start === 'number' ? a.start : 0
    const bVal = typeof b.start === 'number' ? b.start : 0
    return bVal - aVal
  })

  return sorted
}

function mergeZeroEmpty(values: ValueEntry[]) {
  if (values[0]?.start === '__empty__' && values[1]?.start === 0) {
    values[0].count += values[1].count
    values.splice(1, 1)
  } else if (values[0]?.start === 0) {
    values[0].start = '__empty__'
  }
  return values
}

function prepareTimeAgo(values: ValueEntry[]) {
  const newValues: ValueEntry[] = []
  let emptyValue: ValueEntry | null = null
  for (const value of values) {
    if (value.start === '__empty__') {
      emptyValue = value
    } else {
      newValues.push({
        start: getTimeAgo(value.end ?? ''),
        end: getTimeAgo(value.start ?? ''),
        count: value.count,
      })
    }
  }
  if (emptyValue) newValues.push(emptyValue)
  newValues.reverse()
  return newValues
}

function addNumeric(items: DatabaseItem[], attribut: Attribut): ValueEntry[] {
  const rawValues: (number | null | undefined)[] = []
  for (const item of items) {
    if (attribut.getValue) {
      const val = attribut.getValue(item)
      if (typeof val === 'number' || val === undefined) rawValues.push(val)
      else console.warn('addNumeric() getValue() is not a number', val)
    } else if (
      attribut.parseDate &&
      attribut.variable &&
      item[attribut.variable] &&
      typeof item[attribut.variable] === 'string'
    ) {
      rawValues.push(Date.parse(item[attribut.variable] as string))
    } else if (attribut.variable) {
      let val = item[attribut.variable]
      if (val === '' || val === undefined) val = null
      if (typeof val === 'number' || val === null) rawValues.push(val)
      else console.warn('addNumeric() attribut.variable is not a number', val)
    }
  }
  let histogramValues = Histogram.get(
    rawValues,
    attribut.nbRange || 10,
  ) as ValueEntry[]
  if (attribut.type === 'string')
    histogramValues = mergeZeroEmpty(histogramValues)
  if (attribut.rangeType === 'timeAgo')
    histogramValues = prepareTimeAgo(histogramValues)
  return histogramValues
}

function addNonExclusive(
  items: DatabaseItem[],
  attribut: Attribut,
): ValueEntry[] {
  const set = new Set<string>()
  const values: Record<string, ValueEntry> = {}
  if (!attribut.nonExclusive) return []
  for (const item of items) {
    if (!(attribut.nonExclusive in item)) continue
    const itemValue = item[attribut.nonExclusive]
    if (Array.isArray(itemValue)) {
      for (const { name } of itemValue) {
        if (typeof name === 'string') {
          if (set.has(name)) {
            values[name].count += 1
          } else {
            values[name] = { start: name, count: 1 }
            set.add(name)
          }
        }
      }
    }
  }
  return getValuesSorted(values)
}

function addCategory(
  items: DatabaseItem[],
  attribut: Attribut,
  sortBy: 'start' | 'count' = 'count',
): ValueEntry[] {
  const set = new Set<string>()
  const values: Record<string, ValueEntry> = {}
  for (const item of items) {
    // Skip if no source for value
    if (!attribut.getValue && !attribut.variable) continue

    const rawValue: unknown | undefined = attribut.getValue
      ? attribut.getValue(item)
      : item[attribut.variable!]

    const value =
      rawValue === false ||
      rawValue === null ||
      rawValue === undefined ||
      Number.isNaN(rawValue) ||
      rawValue === ''
        ? '__empty__'
        : rawValue
    const key = String(value)
    if (set.has(key)) {
      values[key].count += 1
    } else {
      values[key] = { start: value as ValueType, count: 1 }
      set.add(key)
    }
  }
  return getValuesSorted(values, sortBy)
}

function addSubtype(items: DatabaseItem[], attribut: Attribut): ValueEntry[] {
  const set = new Set<string>()
  const values: Record<string, ValueEntry> = {}
  for (const item of items) {
    if (!attribut.subtype || !attribut.subtype(item)) continue
    const value = attribut.getValue ? attribut.getValue(item) : ''
    const key = String(value)
    if (set.has(key)) {
      values[key].count += 1
    } else {
      values[key] = { start: value as ValueType, count: 1 }
      set.add(key)
    }
  }
  return getValuesSorted(values)
}

function addWithHtml(items: DatabaseItem[], attribut: Attribut): ValueEntry[] {
  const set = new Set<string>()
  const values: Record<string, ValueEntry> = {}
  for (const item of items) {
    if (
      attribut.subtype !== undefined &&
      (!attribut.subtype || !attribut.subtype(item))
    )
      continue
    const value = attribut.withHtml?.text ? item[attribut.withHtml?.text] : ''
    const icon = attribut.withHtml?.icon
      ? (item[attribut.withHtml?.icon] as string)
      : undefined
    const link = attribut.withHtml?.link
      ? (item[attribut.withHtml?.link] as string)
      : undefined
    const key = String(value)
    if (set.has(key)) {
      values[key].count += 1
    } else {
      values[key] = {
        start: value as ValueType,
        count: 1,
        icon: icon,
        link: link,
      }
      set.add(key)
    }
  }
  return getValuesSorted(values)
}

function getValuesForAttribut(items: DatabaseItem[], attribut: Attribut) {
  const total = items.length
  const subtypeTotal = () =>
    attribut.subtype ? items.filter(attribut.subtype).length : total

  if (attribut.type && ['numeric', 'string'].includes(attribut.type))
    return { values: addNumeric(items, attribut), totalValue: total }
  if (attribut.nonExclusive)
    return { values: addNonExclusive(items, attribut), totalValue: total }
  if (attribut.withHtml)
    return { values: addWithHtml(items, attribut), totalValue: subtypeTotal() }
  if (attribut.subtype)
    return { values: addSubtype(items, attribut), totalValue: subtypeTotal() }
  if (attribut.type === 'categoryOrdered')
    return { values: addCategory(items, attribut, 'start'), totalValue: total }
  return { values: addCategory(items, attribut), totalValue: total }
}

export function addValuesToAttribut(
  items: DatabaseItem[],
  attribut: Attribut,
): AttributWithValues | undefined {
  const { values: rawValues, totalValue } = getValuesForAttribut(
    items,
    attribut,
  )
  if (rawValues.length === 0) return
  if (
    rawValues.length === 1 &&
    [0, '0', '__empty__'].includes(rawValues[0].start as string | number)
  )
    return
  const values = addReadableValues(rawValues, attribut.type ?? '')
  return { ...attribut, values, totalValue }
}

export function addValues(items: DatabaseItem[], attributs: Attribut[]) {
  const attributsWithValues: AttributWithValues[] = []
  for (const attribut of attributs) {
    const attributWithValues = addValuesToAttribut(items, attribut)
    if (attributWithValues) attributsWithValues.push(attributWithValues)
  }
  return attributsWithValues
}

export function statExists(entity: string, attribut: string): boolean {
  if (!(entity in attributs)) return false
  return attributs[entity as keyof typeof attributs].includes(attribut)
}
