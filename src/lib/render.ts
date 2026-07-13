import escapeHtml from 'escape-html'
import db from '@db'
import { getCurrentLocale, t } from '@i18n/messages'
import { copyTextClasses, getCopyTextMsg } from '@lib/copy-text'
import {
  getTimeAgo,
  dateToTimestamp,
  formatDateTime,
  getDateTimeSortValue,
  hasTimePrecision,
} from '@lib/time'
import { link } from '@lib/url'
import {
  wrapLongText,
  addIndend,
  entityToIconName,
  getPercent,
} from '@lib/util'
import type {
  AnyEntity,
  EntityName,
  EntityTypeMap,
  FavoritableEntity,
  FreqPreview,
  Tag,
  Enumeration,
  NullableNumber,
  Value,
  Variable,
} from '@type'

const separator = ' | '

export default class Render {
  static otherValuesText(count: number) {
    const key = count === 1 ? 'render.otherValue' : 'render.otherValues'
    return t(key, { count: count.toLocaleString(getCurrentLocale()) })
  }
  static otherFrequenciesText(count: number) {
    const key =
      count === 1 ? 'render.otherFrequency' : 'render.otherFrequencies'
    return t(key, { count: count.toLocaleString(getCurrentLocale()) })
  }
  static shortText(data: unknown, type: string) {
    if (!data) return ''
    if (type !== 'display') return data
    if (typeof data !== 'string') return data
    return escapeHtml(data)
  }
  static longText(data: unknown, type: string) {
    if (!data) return ''
    if (type !== 'display') return data
    if (typeof data !== 'string') return data
    return wrapLongText(escapeHtml(data))
  }
  static parentsIndent(data: AnyEntity[], type: string, row: AnyEntity) {
    if (type !== 'display') {
      const obj = data.slice(-1)[0]
      if (obj && 'name' in obj) return obj.name
      return ''
    }
    if (!('_entity' in row) || !row._entity) return ''
    return Render.tree(row._entity, [...data].reverse(), type)
  }
  static tree(entity: string, elements: AnyEntity[], type = 'display') {
    if (type !== 'display') {
      const names: string[] = []
      for (const element of elements) {
        if (!element || !('id' in element) || !('name' in element)) continue
        names.push(String(element.name))
      }
      return names.join(separator)
    }
    let content = ''
    let level = 0
    for (const element of elements) {
      if (!element) continue
      if (!('id' in element) || !('name' in element)) continue
      const name = String(element.name)
      content += link(
        entity + '/' + element.id,
        addIndend(escapeHtml(name), level),
        entity,
      )
      level += 1
    }
    return wrapLongText(`<div class="tree">${content}</div>`)
  }
  static withParentsFromId(
    entity: EntityName,
    id: string | number,
    type: string,
  ) {
    if (id === null) return ''
    const element = db.get(entity, id)
    if (!element) return ''
    const parents = db.getParents(entity, id)
    const elements = [...parents, element].reverse()
    return Render.tree(entity, elements, type)
  }
  static firstParent(data: AnyEntity[], type: string, row: AnyEntity) {
    if (!data || data.length === 0) return wrapLongText()
    const parent = data.slice(-1)[0]
    if (!parent) return wrapLongText()
    if (type !== 'display') {
      if ('name' in parent) return parent.name
      return ''
    }
    if (!('_entity' in row) || !row._entity) return wrapLongText()
    if (!('id' in parent) || !('name' in parent)) return wrapLongText()
    return wrapLongText(
      link(row._entity + '/' + parent.id, escapeHtml(String(parent.name))),
    )
  }
  static value(values: Value[], type: string, row: AnyEntity) {
    if (type !== 'display') {
      if (!values || values.length === 0) return ''
      if (!('values' in row) || !row.values) return ''
      const parts: string[] = []
      for (const value of values) {
        let valueContent = value.value ?? ''
        if (value.description && value.description !== '') {
          valueContent += ' : ' + value.description
        }
        parts.push(valueContent)
      }
      const nbValues = row.values.length
      if (nbValues > values.length && 'id' in row) {
        parts.push(Render.otherValuesText(nbValues - values.length))
      }
      return parts.join(separator)
    }
    if (!values || values.length === 0) return wrapLongText()
    if (!('values' in row) || !row.values) return wrapLongText()
    const nbValues = row.values.length
    let entity = 'datasetId' in row ? 'variable' : 'enumeration'
    let tab = entity === 'variable' ? 'variableValues' : 'values'
    if ('_entity' in row && row._entity === 'metaVariable') {
      entity = 'metaVariable'
      tab = 'variableMetaValues'
    }
    let content = '<ul class="ul-value">'
    for (const value of values) {
      let valueContent = value.value
      if (value.description && value.description !== '') {
        valueContent += ' : ' + value.description
      }
      content += '<li><span>' + escapeHtml(valueContent) + '</span></li>'
    }
    if (nbValues > values.length && 'id' in row) {
      const nbOtherValues = nbValues - values.length
      const text = link(
        `${entity}/${row.id}?tab=${tab}`,
        Render.otherValuesText(nbOtherValues),
        'value',
      )
      content += `<li><i>${text}</i></li>`
    }
    content += '</ul>'
    return wrapLongText(content)
  }
  static freqPreview(freqData: FreqPreview[], type: string, row: Variable) {
    if (!freqData || freqData.length === 0 || !row.id) return ''

    if (type !== 'display') {
      const parts: string[] = []
      for (const freqItem of freqData) {
        const scaledFreq = freqItem.scale
          ? Math.round(freqItem.frequency * freqItem.scale)
          : freqItem.frequency
        const approx = freqItem.scale ? '≈ ' : ''
        parts.push(
          `${freqItem.value}: ${approx}${Render.num(scaledFreq, type)}`,
        )
      }
      if (type === 'export') {
        const totalFreqCount = db.getAll('frequency', { variable: row }).length
        if (totalFreqCount > freqData.length) {
          parts.push(
            Render.otherFrequenciesText(totalFreqCount - freqData.length),
          )
        }
      }
      return parts.join(separator)
    }

    const ulClass = row.isPattern ? 'ul-value ul-pattern' : 'ul-value'
    let content = `<ul class="${ulClass}">`

    for (const freqItem of freqData) {
      const percentBackground = getPercent(freqItem.frequency / freqItem.max)
      const scaledFreq = freqItem.scale
        ? Math.round(freqItem.frequency * freqItem.scale)
        : freqItem.frequency
      const approx = freqItem.scale ? '≈ ' : ''
      const freqNum = approx + Render.num(scaledFreq, 'display')

      const freqContent = `<div class="freq-item-container">
          <div class="freq-background color-frequency" style="width: ${percentBackground}%"></div>
          <span class="freq-value">${escapeHtml(freqItem.value)}</span>
          <span class="freq-number">${freqNum}</span>
        </div>`

      content += '<li>' + freqContent + '</li>'
    }

    const totalFreqCount = db.getAll('frequency', { variable: row }).length
    if (totalFreqCount > freqData.length) {
      const nbOtherFreq = totalFreqCount - freqData.length
      const text = link(
        `variable/${row.id}?tab=frequency`,
        Render.otherFrequenciesText(nbOtherFreq),
        'frequency',
      )
      content += `<li><i>${text}</i></li>`
    }
    content += '</ul>'
    return wrapLongText(content)
  }
  static num(data: NullableNumber | string, type?: 'display'): string
  static num(data: NullableNumber | string, type: string): string | number
  static num(data: NullableNumber | string, type = 'display'): string | number {
    if (data === false || data === undefined || data === null) return ''
    if (type !== 'display') return data
    return data.toLocaleString(getCurrentLocale())
  }
  static dataSize(bytes: NullableNumber, type?: 'display'): string
  static dataSize(bytes: NullableNumber, type: string): string | number
  static dataSize(bytes: NullableNumber, type = 'display'): string | number {
    if (!bytes) return ''
    if (type === 'sort' || type === 'type') return bytes
    const units = ['o', 'Ko', 'Mo', 'Go', 'To']
    let index = 0
    let size = bytes
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024
      index++
    }
    const formatted =
      index === 0
        ? size.toString()
        : size.toLocaleString(getCurrentLocale(), { maximumFractionDigits: 1 })
    return `${formatted} ${units[index]}`
  }
  static statsPreview(data: string, type: string): string {
    if (!data) return ''
    if (type !== 'display') return data.replace(/<br>/g, ' ')
    return data
  }
  static favorite(
    data: boolean,
    type: string,
    row: FavoritableEntity,
    meta: { col: number; row: number },
  ) {
    if (type !== 'display') {
      return row.isFavorite ? t('render.favorite') : t('render.notFavorite')
    }
    return `
      <span class="icon favorite ${data ? ' is-active' : ''}"
        data-id="${row.id}"
        data-entity="${row._entity}"
        data-is-favorite="${row.isFavorite}"
        data-col="${meta.col}"
        data-row="${meta.row}">
        <i class="fas fa-star"></i>
      </span>`
  }
  static icon(entity: string) {
    const icon = entityToIconName(entity)
    if (['md'].includes(entity)) {
      return `<span class='icon svg-icon icon-${entity}'> <svg><use href="#icon-${icon}" /></svg> </span>`
    }
    const classNames = icon.startsWith('fa-brands') ? icon : `fas fa-${icon}`
    return `<span class='icon icon-${entity}'><i class='${classNames}'></i></span>`
  }
  static enumerationsName(enumerations: Enumeration[], type = 'display') {
    if (type !== 'display') {
      if (!enumerations || enumerations.length === 0) return ''
      return enumerations.map(enumeration => enumeration.name).join(separator)
    }
    if (!enumerations || enumerations.length === 0) return wrapLongText()
    const enumerationsName: string[] = []
    for (const enumeration of enumerations) {
      enumerationsName.push(
        link(
          'enumeration/' + enumeration.id,
          escapeHtml(enumeration.name),
          'enumeration',
        ),
      )
    }
    return wrapLongText(enumerationsName.join(' | '))
  }
  static nbValues(
    data: NullableNumber,
    type: string,
    row: EntityTypeMap['variable' | 'enumeration' | 'metaVariable'],
    nbValueMax: number,
  ) {
    const nbValues = data
    let entity = 'datasetId' in row ? 'variable' : 'enumeration'
    let tab = entity === 'variable' ? 'variableValues' : 'values'
    if (row._entity === 'metaVariable') {
      entity = 'metaVariable'
      tab = 'variableMetaValues'
    }
    if (type !== 'display') return nbValues
    if (!nbValues) return ''
    const percent = getPercent(nbValues / nbValueMax)
    let content = Render.num(nbValues, 'display')
    if (nbValues) {
      content = link(`${entity}/${row.id}?tab=${tab}`, escapeHtml(content))
    }
    return `${Render.numPercent(content, percent, 'value', type)}`
  }
  static nbDuplicate(
    nbDuplicate: NullableNumber,
    type: string,
    row: EntityTypeMap['variable' | 'metaVariable'],
  ) {
    if (type !== 'display') return nbDuplicate
    if (!nbDuplicate) return ''
    if (!row.nbRow) return ''
    const percent = getPercent(nbDuplicate / row.nbRow)
    return `${Render.numPercent(nbDuplicate, percent, 'duplicate', type)}`
  }
  static nbMissing(
    nbMissing: NullableNumber,
    type: string,
    row: EntityTypeMap['variable' | 'metaVariable'],
    stringify = true,
  ) {
    if (!row.nbRow) return ''
    if (!nbMissing) return ''
    const percent = getPercent(nbMissing / row.nbRow)
    const content = Render.numPercent(nbMissing, percent, 'missing', type, true)
    if (stringify) return `${content}`
    return content
  }
  static numPercent(
    data: number | string,
    percent: number,
    colorType: string,
    type: string,
    withPercent = false,
  ) {
    let displayValue = Render.num(data, type)
    if (!displayValue) return ''
    if (type !== 'display') return displayValue
    if (withPercent) displayValue += ` (${percent}%)`
    return `
    <div class="num-percent-container">
      <span class="num-percent color-${colorType} placeholder" style="width: 100%"></span>
      <span class="num-percent color-${colorType}" style="width: ${percent}%"></span>
    </div>
    <span class="num-percent-value">${displayValue}</span>`
  }
  static tags(tags: Tag[], type = 'display') {
    if (type !== 'display') {
      if (!tags || tags.length === 0) return ''
      return tags.map(tag => tag.name).join(separator)
    }
    if (!tags || tags.length === 0) return wrapLongText()
    const tagsName: string[] = []
    for (const tag of tags) {
      tagsName.push(link('tag/' + tag.id, escapeHtml(tag.name), 'tag'))
    }
    return wrapLongText(tagsName.join(' | '))
  }
  static copyCell(data: string, type: string) {
    if (!data) return wrapLongText()
    if (type !== 'display') return data
    return wrapLongText(
      `<span class="${copyTextClasses}" title="${getCopyTextMsg()}">${data}</span>`,
    )
  }
  static datetime(
    data: string | number | null | undefined,
    type: string,
    row: unknown,
    option: { estimation?: boolean } = {},
  ) {
    if (!data) return ''
    if (type === 'sort' || type === 'type') return getDateTimeSortValue(data)
    if (type !== 'display') return formatDateTime(data)

    let contentAfter = ''
    if (option.estimation) {
      contentAfter = ` <span style="font-size: 12px;">${t('render.estimated')}</span>`
    }
    const hasTime = hasTimePrecision(data)
    const timeAgo = getTimeAgo(data, true, !hasTime)
    const timestamp = dateToTimestamp(data, 'start')
    let datetime = escapeHtml(formatDateTime(data))
    if (datetime.length > 12) {
      datetime = `<span style="font-size: 12px;">${datetime}</span>`
    }
    const content = `${timeAgo}<br>${datetime}${contentAfter}`
    const percent = getPercent((new Date().getTime() - timestamp) / 31536000000)
    const entity = percent < 0 ? 'value' : 'doc'
    const percentAbsInversed = 100 - Math.abs(percent)
    return `${Render.numPercent(content, percentAbsInversed, entity, type)}`
  }
}
