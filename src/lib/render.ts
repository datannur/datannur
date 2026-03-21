import escapeHtml from 'escape-html'
import db from '@db'
import { locale } from '@lib/constant'
import { copyTextClasses, copyTextMsg } from '@lib/copy-text'
import { getTimeAgo, dateToTimestamp } from '@lib/time'
import { link } from 'svelte-fileapp'
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
  Modality,
  NullableNumber,
  Value,
  Variable,
} from '@type'

const separator = ' | '

export default class Render {
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
    let content = ''
    let level = 0
    for (const element of elements) {
      if (!element) continue
      if (!('id' in element) || !('name' in element)) continue
      let name = String(element.name)
      if (level > 0 && type !== 'display') name = separator + name
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
    if (!values || values.length === 0) return wrapLongText()
    if (!('values' in row) || !row.values) return wrapLongText()
    const nbValues = row.values.length
    let entity = 'datasetId' in row ? 'variable' : 'modality'
    let tab = entity === 'variable' ? 'variableValues' : 'values'
    if ('_entity' in row && row._entity === 'metaVariable') {
      entity = 'metaVariable'
      tab = 'variableMetaValues'
    }
    let content = '<ul class="ul-value">'
    let i = 0
    for (const value of values) {
      let valueContent = value.value
      if (value.description && value.description !== '') {
        valueContent += ' : ' + value.description
      }
      if (i > 0 && type === 'export') valueContent = separator + valueContent
      content += '<li>' + escapeHtml(valueContent) + '</li>'
      i += 1
    }
    if (nbValues > values.length && 'id' in row) {
      const nbOtherValues = nbValues - values.length
      const s = nbOtherValues > 1 ? 's' : ''
      const text = link(
        `${entity}/${row.id}?tab=${tab}`,
        `... ${nbOtherValues} autre${s} valeur${s}`,
        'value',
      )
      if (type === 'export') content += separator
      content += `<li><i>${text}</i></li>`
    }
    content += '</ul>'
    return wrapLongText(content)
  }
  static freqPreview(freqData: FreqPreview[], type: string, row: Variable) {
    if (!freqData || freqData.length === 0 || !row.id) return ''

    let content = '<ul class="ul-value">'
    let i = 0

    for (const freqItem of freqData) {
      const percentDisplay = getPercent(freqItem.freq / freqItem.total)
      const percentBackground = getPercent(freqItem.freq / freqItem.max)
      const freqNum = Render.num(freqItem.freq, type)
      const percentText = type === 'display' ? ` (${percentDisplay}%)` : ''

      const freqContent =
        type === 'display'
          ? `<div class="freq-item-container">
          <div class="freq-background color-freq" style="width: ${percentBackground}%"></div>
          <span class="freq-value">${escapeHtml(freqItem.value)}</span>
          <span class="freq-number">${freqNum}</span>
        </div>`
          : `${freqItem.value}: ${freqNum}${percentText}`

      const prefix = i > 0 && type === 'export' ? separator : ''
      content += '<li>' + prefix + freqContent + '</li>'
      i += 1
    }

    const totalFreqCount = db.getAll('freq', { variable: row }).length
    if (totalFreqCount > freqData.length) {
      const nbOtherFreq = totalFreqCount - freqData.length
      const s = nbOtherFreq > 1 ? 's' : ''
      const text = link(
        `variable/${row.id}?tab=freq`,
        `... ${nbOtherFreq} autre${s} fréquence${s}`,
        'freq',
      )
      if (type === 'export') content += separator
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
    return data.toLocaleString(locale)
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
      return row.isFavorite ? 'favoris' : 'non favoris'
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
  static modalitiesName(modalities: Modality[]) {
    if (!modalities || modalities.length === 0) return wrapLongText()
    const modalitiesName: string[] = []
    for (const modality of modalities) {
      modalitiesName.push(
        link('modality/' + modality.id, escapeHtml(modality.name), 'modality'),
      )
    }
    return wrapLongText(modalitiesName.join(' | '))
  }
  static nbValues(
    data: NullableNumber,
    type: string,
    row: EntityTypeMap['variable' | 'modality' | 'metaVariable'],
    nbValueMax: number,
  ) {
    const nbValues = data
    let entity = 'datasetId' in row ? 'variable' : 'modality'
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
    if (type === 'display' && withPercent) displayValue += ` (${percent}%)`
    return `
    <div class="num-percent-container">
      <span class="num-percent color-${colorType} placeholder" style="width: 100%"></span>
      <span class="num-percent color-${colorType}" style="width: ${percent}%"></span>
    </div>
    <span class="num-percent-value">${displayValue}</span>`
  }
  static tags(tags: Tag[]) {
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
      `<span class="${copyTextClasses}" title="${copyTextMsg}">${data}</span>`,
    )
  }
  static datetime(
    data: string | null | undefined,
    type: string,
    row: unknown,
    option: { estimation?: boolean } = {},
  ) {
    if (!data) return ''
    if (type !== 'display') return data

    let contentAfter = ''
    if (option.estimation) {
      contentAfter = ` <span style="font-size: 12px;">(estim.)</span>`
    }
    const timeAgo = getTimeAgo(data, true, true)
    const timestamp = dateToTimestamp(data, 'start')
    const content = `${timeAgo}<br>${escapeHtml(data)}${contentAfter}`
    const percent = getPercent((new Date().getTime() - timestamp) / 31536000000)
    const entity = percent < 0 ? 'value' : 'doc'
    const percentAbsInversed = 100 - Math.abs(percent)
    return `${Render.numPercent(content, percentAbsInversed, entity, type)}`
  }
}
