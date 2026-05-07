import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium, type BrowserContextOptions, type Page } from 'playwright'

type ImageFormat = 'jpeg' | 'png'
type Theme = 'light' | 'dark'
type Viewport = { width: number; height: number; deviceScaleFactor?: number }
type SeedEntityRef = { entity: string; entityId: string | number }
type ScreenshotPageAction =
  | 'focusSearch'
  | 'scrollBottom'
  | { type: 'search'; value: string }
  | { type: 'wait'; ms: number }

type SeedLog = {
  action: string
  entity?: string
  entityId?: string | number
}

export type ScreenshotUserDataSeed = {
  appName?: string
  favorites?: SeedEntityRef[]
  searchHistory?: SeedEntityRef[]
  logs?: SeedLog[]
}

export type ScreenshotPageConfig = {
  name: string
  path: string
  viewport?: string
  waitFor?: string
  fullPage?: boolean
  themes?: Theme[]
  actions?: ScreenshotPageAction[]
}

export type ScreenshotSuiteConfig = {
  baseUrl: string
  outDir: string
  browserChannel?: string
  format?: ImageFormat
  quality?: number
  waitFor?: string
  fullPage?: boolean
  themes?: Theme[]
  viewports: { [name: string]: Viewport }
  seed?: ScreenshotUserDataSeed
  pages: ScreenshotPageConfig[]
}

type CaptureOptions = {
  url: string
  name: string
  outDir: string
  browserChannel?: string
  width: number
  height: number
  deviceScaleFactor: number
  format: ImageFormat
  quality: number
  fullPage: boolean
  waitFor: string
  themes: Theme[]
  seed?: ScreenshotUserDataSeed
  actions: ScreenshotPageAction[]
}

const defaultConfigPath = 'node-scripts/screenshots.config.ts'
const defaultFormat: ImageFormat = 'jpeg'
const defaultQuality = 88
const defaultDeviceScaleFactor = 1
const defaultWaitFor = 'div#wrapper > section.section'
const defaultThemes: Theme[] = ['light', 'dark']

function joinUrl(baseUrl: string, pagePath: string) {
  return new URL(pagePath, baseUrl).href
}

async function loadConfig() {
  const configPath = path.resolve(defaultConfigPath)
  const module = (await import(configPath)) as {
    default: ScreenshotSuiteConfig
  }
  return module.default
}

function getOptions(config: ScreenshotSuiteConfig, page: ScreenshotPageConfig) {
  const viewportName = page.viewport ?? 'desktop'
  const viewport = config.viewports[viewportName]

  if (!viewport) {
    throw new Error(
      `Unknown viewport "${viewportName}" for screenshot "${page.name}"`,
    )
  }

  return {
    url: joinUrl(config.baseUrl, page.path),
    name: page.name,
    outDir: config.outDir,
    browserChannel: config.browserChannel,
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor ?? defaultDeviceScaleFactor,
    format: config.format ?? defaultFormat,
    quality: config.quality ?? defaultQuality,
    fullPage: page.fullPage ?? config.fullPage ?? false,
    waitFor: page.waitFor ?? config.waitFor ?? defaultWaitFor,
    themes: page.themes ?? config.themes ?? defaultThemes,
    seed: config.seed,
    actions: page.actions ?? [],
  }
}

function getFilePath(options: CaptureOptions, theme: Theme) {
  const suffix = theme === 'dark' ? '-dark' : ''
  const extension = options.format === 'jpeg' ? 'jpg' : 'png'
  return path.join(options.outDir, `${options.name}${suffix}.${extension}`)
}

function timestamp(index: number) {
  return Date.now() - index * 60_000
}

function buildFavorite(ref: SeedEntityRef, index: number) {
  return {
    id: `${ref.entity}/${ref.entityId}`,
    entity: ref.entity,
    entityId: ref.entityId,
    timestamp: timestamp(index),
  }
}

function buildSearchHistoryEntry(ref: SeedEntityRef, index: number) {
  return {
    id: index,
    entity: ref.entity,
    entityId: ref.entityId,
    timestamp: timestamp(index),
  }
}

function buildLog(log: SeedLog, index: number) {
  return {
    id: index + 1,
    action: log.action,
    entity: log.entity ?? '',
    entityId: log.entityId ?? '',
    timestamp: timestamp(index),
  }
}

function buildUserDataSeed(seed: ScreenshotUserDataSeed) {
  return {
    'userData/favorite': seed.favorites?.map(buildFavorite) ?? [],
    'userData/searchHistory':
      seed.searchHistory?.map(buildSearchHistoryEntry) ?? [],
    'userData/log': seed.logs?.map(buildLog) ?? [],
  }
}

async function setIndexedDbValue(
  page: Page,
  key: string,
  value: unknown,
): Promise<void> {
  await page.evaluate(
    ({ key, value }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('ldb', 1)

        request.onupgradeneeded = event => {
          const db = (event.target as IDBOpenDBRequest).result
          if (!db.objectStoreNames.contains('s')) {
            db.createObjectStore('s', { keyPath: 'k' })
          }
        }

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction('s', 'readwrite')
          transaction.onerror = () => reject(transaction.error)
          transaction.oncomplete = () => {
            db.close()
            resolve()
          }
          transaction.objectStore('s').put({ k: key, v: value })
        }
      }),
    { key, value },
  )
}

async function seedUserData(page: Page, options: CaptureOptions) {
  if (!options.seed) return

  const url = new URL(options.url)
  if (!url.protocol.startsWith('http')) return

  await page.goto(url.origin, { waitUntil: 'domcontentloaded' })
  const userData = buildUserDataSeed(options.seed)
  const appName = options.seed.appName ?? 'datannur-app-v2'

  for (const [key, value] of Object.entries(userData)) {
    await setIndexedDbValue(page, `${appName}/${key}`, value)
  }
}

async function applyPageActions(page: Page, actions: ScreenshotPageAction[]) {
  for (const action of actions) {
    if (typeof action !== 'string' && action.type === 'search') {
      await page.locator('#header-search-input').click()
      await page.locator('#header-search-input').fill(action.value)
      await page.waitForSelector('#search-bar-result-wrapper.is-open')
      await page.waitForSelector('#search-bar-result-wrapper tbody tr')
    } else if (typeof action !== 'string' && action.type === 'wait') {
      await page.waitForTimeout(action.ms)
    } else if (action === 'focusSearch') {
      await page.locator('#header-search-input').click()
      await page.waitForSelector('#search-bar-result-wrapper.is-open')
    } else if (action === 'scrollBottom') {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    }
  }
}

async function captureTheme(options: CaptureOptions, theme: Theme) {
  const browser = await chromium.launch({
    channel: options.browserChannel,
    headless: true,
  })
  const contextOptions: BrowserContextOptions = {
    colorScheme: theme,
    deviceScaleFactor: options.deviceScaleFactor,
    viewport: {
      width: options.width,
      height: options.height,
    },
  }
  const context = await browser.newContext(contextOptions)

  await context.addInitScript(selectedTheme => {
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }, theme)

  const page = await context.newPage()
  await seedUserData(page, options)
  await page.goto(options.url, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector(options.waitFor, { state: 'visible' })
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images)
        .filter(image => !image.complete)
        .map(
          image =>
            new Promise(resolve => {
              image.addEventListener('load', resolve, { once: true })
              image.addEventListener('error', resolve, { once: true })
            }),
        ),
    ),
  )
  await applyPageActions(page, options.actions)
  await page.waitForTimeout(300)

  const filePath = getFilePath(options, theme)
  await page.screenshot({
    path: filePath,
    type: options.format,
    quality: options.format === 'jpeg' ? options.quality : undefined,
    fullPage: options.fullPage,
  })

  await browser.close()
  return filePath
}

async function main() {
  const config = await loadConfig()
  await mkdir(config.outDir, { recursive: true })

  const filePaths = []
  for (const page of config.pages) {
    const options = getOptions(config, page)
    await mkdir(options.outDir, { recursive: true })
    for (const theme of options.themes) {
      filePaths.push(await captureTheme(options, theme))
    }
  }

  console.log(filePaths.join('\n'))
}

await main()
