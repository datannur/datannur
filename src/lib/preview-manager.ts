import db from '@db'
import Render from '@lib/render'
import escapeHtml from 'escape-html'
import type { Row, Column } from '@type'

export default class PreviewManager {
  static cleanKey(data: string) {
    return data.replaceAll('.', '_')
  }
  static cleanKeys(data: Row[]) {
    for (const row of data) {
      for (const [key, value] of Object.entries(row)) {
        if (key.includes('.')) {
          const cleanKey = key.replaceAll('.', '_')
          row[cleanKey] = value
          delete row[key]
        }
      }
    }
  }
  static getColumns(data: Row[]): Column[] {
    const cols: Column[] = []
    for (const [key, value] of Object.entries(data[0])) {
      const render: Column['render'] =
        typeof value === 'number'
          ? (data: unknown) => Render.num(escapeHtml(String(data)))
          : Render.longText
      cols.push({ data: key, title: key, defaultContent: '', render })
    }
    return cols
  }
  static getVariableData(data: Row[], variable: string): Row[] {
    const variableData: Row[] = []
    for (const row of data) {
      for (const [key, value] of Object.entries(row)) {
        if (key === variable) {
          variableData.push({ [key]: value })
        }
      }
    }
    return variableData
  }
  static async load(datasetId: string) {
    let path = 'preview'
    const datasetIdParts = datasetId.split('-')
    if (datasetIdParts.length > 1) {
      path += '/' + datasetIdParts[0]
    }
    return (await db.load(path, datasetId, false)) as Row[]
  }
}
