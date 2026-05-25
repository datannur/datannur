export type LocalEditConfig = {
  serverURL?: string
  isLocalServer: boolean
}

export type LocalEditStatus = {
  available: boolean
  error?: string
}

type LocalPortsConfig = {
  editServerPort?: number
}

const defaultEditServerPort = 61294
const devEditServerPort = 62294
const defaultLocalEditServerPort = import.meta.env.DEV
  ? devEditServerPort
  : defaultEditServerPort

const isFileProtocol =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
const isLocalhost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)

export const defaultLocalEditConfig: LocalEditConfig = {
  serverURL:
    isLocalhost && !isFileProtocol
      ? `http://localhost:${defaultLocalEditServerPort}`
      : undefined,
  isLocalServer: isLocalhost && !isFileProtocol,
}

let localEditConfig: LocalEditConfig = { ...defaultLocalEditConfig }
let localEditConfigInitialization: Promise<void> | null = null

function isValidPort(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function buildServerURL(port: number): string | undefined {
  if (!isLocalhost || isFileProtocol) return undefined
  return `http://localhost:${port}`
}

async function loadLocalPortsConfig(): Promise<LocalPortsConfig | null> {
  if (!isLocalhost || isFileProtocol || import.meta.env.DEV) {
    return null
  }

  try {
    const response = await fetch('data/localhost-ports.config.json', {
      cache: 'no-store',
    })
    if (!response.ok) {
      return null
    }
    return (await response.json()) as LocalPortsConfig
  } catch {
    return null
  }
}

export async function initializeLocalEditConfig(): Promise<void> {
  localEditConfigInitialization ??= (async () => {
    const localPortsConfig = await loadLocalPortsConfig()
    const editServerPort = isValidPort(localPortsConfig?.editServerPort)
      ? localPortsConfig.editServerPort
      : defaultLocalEditServerPort

    localEditConfig = {
      ...defaultLocalEditConfig,
      serverURL: buildServerURL(editServerPort),
    }
  })()

  await localEditConfigInitialization
}

export function getLocalEditConfig(): LocalEditConfig {
  return localEditConfig
}

export function isLocalEditAvailable(): boolean {
  return !!localEditConfig.serverURL
}

export async function checkLocalEditStatus(): Promise<LocalEditStatus> {
  await initializeLocalEditConfig()

  const serverURL = localEditConfig.serverURL

  if (!serverURL) {
    return {
      available: false,
      error: 'Local edit server URL not configured',
    }
  }

  try {
    const response = await fetch(`${serverURL}/api/status`)

    if (!response.ok) {
      return {
        available: false,
        error: `Local edit server not available (${response.status})`,
      }
    }

    const result = (await response.json()) as {
      available?: boolean
    }

    return {
      available: result.available ?? false,
    }
  } catch {
    return {
      available: false,
      error: 'Cannot connect to local edit server',
    }
  }
}
