import { getAppBasePath, isHttp } from '@lib/url'

type LocalPortsConfig = {
  apiPort?: number
}

export type ApiAvailability =
  | {
      available: false
    }
  | {
      available: true
      docsUrl: string
      rawDocsUrl: string
      restExampleUrl: string
    }

type AvailableApi = {
  available: true
  docsUrl: string
  rawDocsUrl: string
  restExampleUrl: string
}

const defaultApiPort = 61293
const localHosts = ['localhost', '127.0.0.1', '::1']
let apiAvailabilityPromise: Promise<ApiAvailability> | null = null

function isLocalhost(): boolean {
  return localHosts.includes(window.location.hostname)
}

function isValidPort(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

async function loadLocalPortsConfig(): Promise<LocalPortsConfig | null> {
  if (!isLocalhost()) return null

  try {
    const response = await fetch('data/localhost-ports.config.json', {
      cache: 'no-store',
    })
    if (!response.ok) return null
    return (await response.json()) as LocalPortsConfig
  } catch {
    return null
  }
}

async function isRestApiReachable(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/dataset?_limit=1`, {
      cache: 'no-store',
    })
    if (!response.ok) return false

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) return false

    const data = (await response.json()) as unknown
    return Array.isArray(data)
  } catch {
    return false
  }
}

function getApiAvailability(baseUrl: string): AvailableApi {
  return {
    available: true,
    docsUrl: `${baseUrl}/`,
    rawDocsUrl: `${baseUrl}/raw`,
    restExampleUrl: `${baseUrl}/dataset?_limit=10`,
  }
}

async function resolveApiAvailability(): Promise<ApiAvailability> {
  if (!isHttp) return { available: false }

  const sameOriginBaseUrl = `${getAppBasePath()}api`
  if (await isRestApiReachable(sameOriginBaseUrl)) {
    return getApiAvailability(sameOriginBaseUrl)
  }

  if (!isLocalhost()) return { available: false }

  const localPortsConfig = await loadLocalPortsConfig()
  const apiPort = isValidPort(localPortsConfig?.apiPort)
    ? localPortsConfig.apiPort
    : defaultApiPort
  const localBaseUrl = `http://localhost:${apiPort}/api`

  if (await isRestApiReachable(localBaseUrl)) {
    return getApiAvailability(localBaseUrl)
  }

  return { available: false }
}

export async function checkApiAvailability(): Promise<ApiAvailability> {
  apiAvailabilityPromise ??= resolveApiAvailability()
  return apiAvailabilityPromise
}
