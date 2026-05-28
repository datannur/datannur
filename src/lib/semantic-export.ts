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
  field: string
  message: string
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
  }
  coverage: { [field: string]: CoverageItem }
  files: { [label: string]: string }
}

declare global {
  interface Window {
    datannurSemanticValidation?: SemanticValidation
  }
}

const semanticExportScriptId = 'datannur-semantic-validation-json-js'
let semanticValidationPromise: Promise<SemanticValidation | null> | null = null

export const semanticBasePath = isHttp
  ? `${getAppBasePath()}data/db-semantic/`
  : 'data/db-semantic/'

async function fetchSemanticValidation() {
  try {
    const response = await fetch(`${semanticBasePath}validation.json`, {
      cache: 'no-store',
    })
    if (!response.ok) return null
    return (await response.json()) as SemanticValidation
  } catch {
    return null
  }
}

async function loadSemanticValidationScript() {
  if (window.datannurSemanticValidation)
    return window.datannurSemanticValidation

  return new Promise<SemanticValidation | null>(resolve => {
    const existingScript = document.getElementById(semanticExportScriptId)
    if (existingScript) {
      resolve(window.datannurSemanticValidation ?? null)
      return
    }

    const script = document.createElement('script')
    script.id = semanticExportScriptId
    script.src = `${semanticBasePath}validation.json.js`
    script.onload = () => resolve(window.datannurSemanticValidation ?? null)
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })
}

export async function loadSemanticValidation() {
  semanticValidationPromise ??= isHttp
    ? fetchSemanticValidation()
    : loadSemanticValidationScript()
  return semanticValidationPromise
}

export async function checkSemanticExportAvailability() {
  return (await loadSemanticValidation()) !== null
}
