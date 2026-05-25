/**
 * LLM Configuration
 * Settings for Infomaniak API and model selection
 */

import { getAppBasePath } from '@lib/url'

export type LLMConfig = {
  baseURL: string
  proxyURL?: string
  isLocalProxy: boolean
  models: {
    text: string
    speech: string
  }
  maxTokens: number
  temperature: number
}

export type LLMCredentials = {
  apiKey: string
  productId: string
}

export type LLMStatus = {
  available: boolean
  configured: boolean
  siteKey?: string
  error?: string
}

type LocalPortsConfig = {
  appPort?: number
  llmProxyPort?: number
}

const defaultAppPort = 61291
const defaultLLMProxyPort = 61292
const devLLMProxyPort = 62292
const defaultLocalLLMProxyPort = import.meta.env.DEV
  ? devLLMProxyPort
  : defaultLLMProxyPort

// Detect environment
const isFileProtocol =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
const isLocalhost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
const currentPort =
  typeof window !== 'undefined' ? Number(window.location.port) : undefined

function getPhpProxyURL(): string {
  return `${getAppBasePath()}api/llm`
}

function shouldUseLocalProxy(appPort = defaultAppPort): boolean {
  if (isFileProtocol || !isLocalhost) return false
  if (import.meta.env.DEV) return true
  return currentPort === appPort
}

// Determine proxy URL based on environment:
// - file:// protocol: no proxy available
// - local Python app: local Python proxy
// - web server: PHP proxy
function getProxyURL(): string | undefined {
  if (isFileProtocol) return undefined
  if (shouldUseLocalProxy())
    return `http://localhost:${defaultLocalLLMProxyPort}`
  return getPhpProxyURL()
}

/**
 * Default LLM configuration
 */
export const defaultLLMConfig: LLMConfig = {
  baseURL: 'https://api.infomaniak.com',
  proxyURL: getProxyURL(),
  isLocalProxy: shouldUseLocalProxy(),
  models: {
    text: 'Qwen/Qwen3.5-122B-A10B-FP8',
    speech: 'whisper',
  },
  maxTokens: 8192,
  temperature: 0.5,
}

let llmConfig: LLMConfig = { ...defaultLLMConfig }
let llmConfigInitialization: Promise<void> | null = null

function isValidPort(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function buildProxyURL(
  port: number,
  useLocalProxy: boolean,
): string | undefined {
  if (isFileProtocol) return undefined
  if (useLocalProxy) return `http://localhost:${port}`
  return getPhpProxyURL()
}

function refreshPhpProxyURL(): void {
  if (!isFileProtocol && !llmConfig.isLocalProxy) {
    llmConfig.proxyURL = getPhpProxyURL()
  }
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

export async function initializeLLMConfig(): Promise<void> {
  llmConfigInitialization ??= (async () => {
    const localPortsConfig = await loadLocalPortsConfig()
    const appPort = isValidPort(localPortsConfig?.appPort)
      ? localPortsConfig.appPort
      : defaultAppPort
    const llmProxyPort = isValidPort(localPortsConfig?.llmProxyPort)
      ? localPortsConfig.llmProxyPort
      : defaultLocalLLMProxyPort
    const useLocalProxy = shouldUseLocalProxy(appPort)

    llmConfig = {
      ...defaultLLMConfig,
      proxyURL: buildProxyURL(llmProxyPort, useLocalProxy),
      isLocalProxy: useLocalProxy,
    }
  })()

  await llmConfigInitialization
  refreshPhpProxyURL()
}

// Session state (replaces per-request Turnstile tokens)
let turnstileSiteKey: string | null = null
let turnstileLoaded = false
let sessionToken: string | null = null
let sessionPending = false
let pendingResolvers: ((token: string | null) => void)[] = []
let turnstileToken: string | null = null
let turnstileTokenResolver: ((token: string) => void) | null = null

/**
 * Get LLM config
 */
export function getLLMConfig(): LLMConfig {
  refreshPhpProxyURL()
  return llmConfig
}

/**
 * Check if proxy is available
 */
export function isProxyAvailable(): boolean {
  refreshPhpProxyURL()
  return !!llmConfig.proxyURL
}

/**
 * Get current session token (for API requests)
 */
export function getSessionToken(): string | null {
  return sessionToken
}

/**
 * Check if running on local proxy (no session needed)
 */
export function isLocalProxy(): boolean {
  return llmConfig.isLocalProxy
}

/**
 * Create a session by validating Turnstile once
 * Call this when opening the chat panel
 */
export async function createSession(): Promise<boolean> {
  await initializeLLMConfig()

  if (llmConfig.isLocalProxy) {
    return true // No session needed for local
  }

  // Already have a session
  if (sessionToken) {
    return true
  }

  // Session creation already in progress, wait for it
  if (sessionPending) {
    return new Promise(resolve => {
      pendingResolvers.push(token => resolve(!!token))
    })
  }

  sessionPending = true

  try {
    const statusResponse = await fetch(`${llmConfig.proxyURL}/status.php`)
    if (!statusResponse.ok) {
      return false
    }

    const status = (await statusResponse.json()) as {
      enabled: boolean
      requiresTurnstile?: boolean
    }
    if (!status.enabled) {
      return false
    }

    if (status.requiresTurnstile === false) {
      const response = await fetch(`${llmConfig.proxyURL}/session.php`, {
        method: 'POST',
      })
      if (!response.ok) {
        return false
      }

      const result = (await response.json()) as {
        success: boolean
        sessionToken?: string
      }
      if (result.success && result.sessionToken) {
        sessionToken = result.sessionToken
        pendingResolvers.forEach(resolve => resolve(sessionToken))
        pendingResolvers = []
        return true
      }
      return false
    }

    // Step 1: Load Turnstile and get a token
    const turnstileToken = await getTurnstileTokenOnce()
    if (!turnstileToken) {
      return false
    }

    // Step 2: Exchange Turnstile token for a session token
    const response = await fetch(`${llmConfig.proxyURL}/session.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Turnstile-Token': turnstileToken,
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      return false
    }

    const result = (await response.json()) as {
      success: boolean
      sessionToken?: string
    }

    if (result.success && result.sessionToken) {
      sessionToken = result.sessionToken
      // Notify any waiting callers
      pendingResolvers.forEach(resolve => resolve(sessionToken))
      pendingResolvers = []
      return true
    }

    return false
  } catch {
    return false
  } finally {
    sessionPending = false
  }
}

/**
 * Get a Turnstile token (one-time, for session creation)
 */
async function getTurnstileTokenOnce(): Promise<string | null> {
  // Load Turnstile if not already loaded
  if (!turnstileLoaded) {
    const loaded = await loadTurnstile()
    if (!loaded) {
      return null
    }
  }

  // If token already received (callback fired before we started waiting)
  if (turnstileToken) {
    const token = turnstileToken
    turnstileToken = null
    return token
  }

  // Wait for token with timeout using the resolver
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      turnstileTokenResolver = null
      resolve(null)
    }, 30000) // 30s timeout

    turnstileTokenResolver = (token: string) => {
      clearTimeout(timeout)
      turnstileTokenResolver = null
      resolve(token)
    }
  })
}

/**
 * Load Turnstile widget (internal)
 */
async function loadTurnstile(): Promise<boolean> {
  if (turnstileLoaded) {
    return !!turnstileSiteKey
  }

  try {
    // Fetch siteKey from server
    const response = await fetch(`${llmConfig.proxyURL}/status.php`)
    if (!response.ok) {
      return false
    }

    const status = (await response.json()) as {
      enabled: boolean
      requiresTurnstile?: boolean
      siteKey?: string
    }
    if (status.enabled && status.requiresTurnstile === false) {
      return true
    }
    if (!status.enabled || !status.siteKey) {
      return false
    }

    turnstileSiteKey = status.siteKey

    // Load Turnstile script
    await loadTurnstileScript()

    // Render Turnstile widget
    renderTurnstile()

    turnstileLoaded = true
    return true
  } catch {
    return false
  }
}

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="turnstile"]')) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Turnstile'))
    document.head.appendChild(script)
  })
}

function renderTurnstile(): void {
  if (!turnstileSiteKey || !window.turnstile) {
    return
  }

  // Create hidden container if not exists
  let container = document.getElementById('turnstile-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'turnstile-container'
    container.style.display = 'none'
    document.body.appendChild(container)
  }

  window.turnstile.render(container, {
    sitekey: turnstileSiteKey,
    callback: (token: string) => {
      // Resolve pending token request or store for later
      if (turnstileTokenResolver) {
        turnstileTokenResolver(token)
      } else {
        turnstileToken = token
      }
    },
  })
}

/**
 * Send API credentials to proxy server (local only)
 */
export async function setProxyCredentials(
  apiKey: string,
  productId: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  await initializeLLMConfig()

  const proxyURL = llmConfig.proxyURL

  if (!proxyURL || !llmConfig.isLocalProxy) {
    return {
      success: false,
      error: 'Credentials can only be set on local proxy.',
    }
  }

  try {
    const response = await fetch(`${proxyURL}/set_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      body: JSON.stringify({ api_key: apiKey, product_id: productId }),
    })

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))) as { error: string }
      return {
        success: false,
        error: error.error ?? 'Failed to save credentials',
      }
    }

    const result = (await response.json()) as { message: string }
    return { success: true, message: result.message }
  } catch (error) {
    return {
      success: false,
      error: `Cannot connect to proxy server: ${error}`,
    }
  }
}

/**
 * Check if credentials are configured in proxy
 */
export async function checkProxyStatus(): Promise<LLMStatus> {
  await initializeLLMConfig()

  const proxyURL = llmConfig.proxyURL

  if (!proxyURL) {
    return {
      available: false,
      configured: false,
      error: 'Proxy URL not configured',
    }
  }

  try {
    const statusEndpoint = llmConfig.isLocalProxy
      ? `${proxyURL}/status`
      : `${proxyURL}/status.php`

    const response = await fetch(statusEndpoint)

    if (!response.ok) {
      return {
        available: false,
        configured: false,
        error: `Proxy not available (${response.status})`,
      }
    }

    const result = (await response.json()) as {
      configured?: boolean
      enabled?: boolean
      siteKey?: string
    }

    // Local proxy returns { configured }, PHP returns { enabled, siteKey }
    const configured = result.configured ?? result.enabled ?? false

    return {
      available: true,
      configured,
      siteKey: result.siteKey,
    }
  } catch {
    return {
      available: false,
      configured: false,
      error: 'Cannot connect to proxy server',
    }
  }
}

// Declare Turnstile types
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string
          callback: (token: string) => void
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'expired-callback'?: () => void
        },
      ) => string
      reset: (widgetId?: string) => void
    }
  }
}
