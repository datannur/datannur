import { getAppBasePath, isHttp } from '@lib/url'

export type ValidationStatus =
  | 'conforms'
  | 'warnings'
  | 'errors'
  | 'notValidated'

export type CoverageItem = {
  label: string
  count: number
  total: number
  percent: number
}

export type ValidationResult = {
  severity: string
  code: string
  entityType: string
  entityId: string
  entityLabel: string
  entityLabels?: { [locale: string]: string }
  field: string
  message: string
}

export type LocalizedCount = {
  label: string
  labels?: { [locale: string]: string }
  count: number
}

export type SemanticValidation = {
  profile: string
  generatedAt: string
  validation: {
    status: ValidationStatus
    officialConformance: boolean
    shaclAvailable: boolean
    message: string
    results: ValidationResult[]
  }
  counts: {
    datasets: number
    distributions: number
    publishers: number
    licenses: { [label: string]: number }
    formats: { [label: string]: number }
    themes: { [label: string]: number }
    themeItems?: LocalizedCount[]
  }
  coverage: { [field: string]: CoverageItem }
  files: { [label: string]: string }
}

export type StacExport = {
  generatedAt: string
  itemCount: number
  datasetTotal: number
  valid: boolean
  validationMessage: string
  files: { [label: string]: string }
}

export type IsoExport = {
  generatedAt: string
  profile: string
  recordCount: number
  datasetTotal: number
  records: { id: string; file: string }[]
}

declare global {
  interface Window {
    datannurSemanticValidation?: SemanticValidation
    datannurStacExport?: StacExport
    datannurIsoExport?: IsoExport
  }
}

export const semanticBasePath = isHttp
  ? `${getAppBasePath()}data/db-semantic/`
  : 'data/db-semantic/'

/**
 * Load an export summary written by the Python export scripts: over HTTP we
 * fetch `<basename>.json`; from the filesystem we inject `<basename>.json.js`,
 * which assigns the global, since file:// blocks fetch. Memoized per basename.
 */
function makeExportLoader<T>(basename: string, globalKey: keyof Window) {
  let promise: Promise<T | null> | null = null

  const fromFetch = async () => {
    try {
      const response = await fetch(`${semanticBasePath}${basename}.json`, {
        cache: 'no-store',
      })
      return response.ok ? ((await response.json()) as T) : null
    } catch {
      return null
    }
  }

  const fromScript = () =>
    new Promise<T | null>(resolve => {
      const current = window[globalKey] as T | undefined
      if (current) return resolve(current)

      const scriptId = `datannur-${basename}-json-js`
      if (document.getElementById(scriptId)) {
        return resolve((window[globalKey] as T | undefined) ?? null)
      }

      const script = document.createElement('script')
      script.id = scriptId
      script.src = `${semanticBasePath}${basename}.json.js`
      script.onload = () =>
        resolve((window[globalKey] as T | undefined) ?? null)
      script.onerror = () => resolve(null)
      document.head.appendChild(script)
    })

  return () => (promise ??= isHttp ? fromFetch() : fromScript())
}

export const loadSemanticValidation = makeExportLoader<SemanticValidation>(
  'validation',
  'datannurSemanticValidation',
)
export const loadStacExport = makeExportLoader<StacExport>(
  'stac',
  'datannurStacExport',
)
export const loadIsoExport = makeExportLoader<IsoExport>(
  'iso',
  'datannurIsoExport',
)

export async function checkSemanticExportAvailability() {
  const [dcat, stac, iso] = await Promise.all([
    loadSemanticValidation(),
    loadStacExport(),
    loadIsoExport(),
  ])
  return dcat !== null || stac !== null || iso !== null
}
