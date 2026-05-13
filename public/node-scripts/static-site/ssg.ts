/**
 * Static Site Generation (SSG) utilities for SPA
 * Provides tools to pre-render SPA pages into static HTML files
 */

import fs from 'fs'
import http from 'http'
import { chromium, type Browser, type Page } from 'playwright'
import { SitemapStream, streamToPromise } from 'sitemap'
import sirv from 'sirv'

export interface SsgConfig {
  domain: string
  port: number
  appPath: string
  outDir: string
  indexFile?: string
  entryPoint?: string
  generateSitemap?: boolean
  indexSeo?: boolean
}

/**
 * Wait for server to be ready by polling the URL
 */
export async function waitUntilReady(
  url: string,
  maxAttempts = 30,
  delayMs = 200,
) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // ignore errors
    }
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  throw new Error(`Timeout: server not ready at ${url}`)
}

/**
 * Start a local HTTP server for SSG
 */
export function startServer(
  single: boolean | string = true,
  port = 3000,
): Promise<http.Server> {
  return new Promise(resolve => {
    const serve = sirv('.', { single, dev: true })
    const server = http.createServer((req, res) => {
      serve(req, res)
    })
    server.listen(port, async () => {
      console.log(`⚡ Static server on http://localhost:${port}`)
      resolve(server)
    })
  })
}

/**
 * Stop HTTP server
 */
export function stopServer(server: http.Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((err?: Error) => {
      if (err) {
        console.error('Failed to close server:', err)
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Initialize Playwright page for SSG
 */
export async function initPage(browser: Browser, port: number) {
  const pageUrl = `http://localhost:${port}`
  await waitUntilReady(pageUrl)
  const page = await browser.newPage()
  page.setDefaultTimeout(10000)
  await page.goto(pageUrl)
  return page
}

/**
 * Capture a single page and save as static HTML
 */
export async function capturePage(
  page: Page,
  route: string,
  outDir: string,
  options: {
    level?: number
    isFirstPage?: boolean
    waitForDbSelector?: string
    dbPathExtractor?: (content: string) => string
  } = {},
) {
  const {
    level = 1,
    isFirstPage = false,
    waitForDbSelector,
    dbPathExtractor,
  } = options
  const outputPath = route === '' ? 'index.html' : `${route}.html`

  await page.evaluate((route: string) => {
    window.history.pushState({ path: route }, '', route)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, route)

  try {
    if (isFirstPage && waitForDbSelector) {
      await page.waitForSelector(waitForDbSelector, {
        timeout: 30000,
        state: 'attached',
      })
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    await page.waitForSelector(
      `#page-loaded-route-${route.replaceAll('/', '___')}`,
      { timeout: 10000, state: 'attached' },
    )

    let content = await page.content()

    if (dbPathExtractor) {
      const dbPath = dbPathExtractor(content)
      const escapedDbPath = dbPath.replace(/\//g, '\\/')
      const scriptPattern = new RegExp(
        `<script src="${escapedDbPath}\\/[^"]+\\.json\\.js[^"]*"><\\/script>`,
        'g',
      )
      content = content.replace(scriptPattern, '')
    }

    fs.writeFileSync(`./${outDir}/${outputPath}`, content)
    console.log(`create page: ${route || 'index'}`)
  } catch (error) {
    let errorMessage = `Failed to capture page : ${outputPath}`
    if (level > 1) errorMessage += ` (retry ${level})`
    console.error(errorMessage, (error as Error).message)
  }
}

/**
 * Generate sitemap.xml for SEO
 */
export async function generateSitemap(
  routes: string[],
  domain: string,
  changeFrequency:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never' = 'monthly',
) {
  function calculatePriority(url: string) {
    if (url === '') return 1.0
    const depth = url.split('/').filter(Boolean).length
    return Math.max(0.3, 1.0 - depth * 0.2)
  }

  const sitemapStream = new SitemapStream({ hostname: domain })
  const writeStream = fs.createWriteStream('sitemap.xml')
  sitemapStream.pipe(writeStream)

  routes.forEach((route: string) => {
    sitemapStream.write({
      url: `/${route}`,
      changefreq: changeFrequency,
      priority: calculatePriority(route),
    })
  })

  streamToPromise(sitemapStream)
  sitemapStream.end()

  return new Promise<void>(resolve => {
    writeStream.on('finish', () => resolve())
  })
}

/**
 * Create index HTML file for SSG with static mode metadata
 */
export async function createIndexFile(
  sourceFile: string,
  targetFile: string,
  options: { indexSeo?: boolean; baseHref?: string } = {},
) {
  const { indexSeo = false, baseHref = '/' } = options

  try {
    let index = await fs.promises.readFile(sourceFile, 'utf8')
    index = index
      .toString()
      .replace(`<base href=""`, `<base href="${baseHref}"`)
      .replace('<head>', `<head><meta app-mode="static" />`)

    if (indexSeo) {
      index = index.replace(
        `<meta name="robots" content="noindex"`,
        `<meta name="robots" `,
      )
    }

    await fs.promises.writeFile(targetFile, index)
  } catch (error) {
    console.error('Failed to create index file:', error)
    throw error
  }
}

/**
 * Main SSG generator - pre-render all routes to static HTML
 */
export async function generateStaticSite(
  routes: string[],
  config: SsgConfig,
  options: {
    waitForDbSelector?: string
    dbPathExtractor?: (content: string) => string
  } = {},
) {
  const startTime = new Date()
  const indexFile = config.indexFile ?? './index.html'
  const backupFile = indexFile + '.bak'

  let server: http.Server | undefined = undefined
  let browser: Browser | undefined = undefined

  await fs.promises.rename(indexFile, backupFile)
  await createIndexFile(backupFile, indexFile, {
    indexSeo: config.indexSeo,
  })

  try {
    server = await startServer(true, config.port)
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    })

    const page = await initPage(browser, config.port)

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      const isFirstPage = i === 0
      await capturePage(page, route, config.outDir, {
        level: 1,
        isFirstPage,
        ...options,
      })
    }
  } catch (error) {
    console.error('Failed to generate static site:', error)
    throw error
  } finally {
    const cleanupPromises: Promise<void>[] = []
    if (browser) cleanupPromises.push(browser.close())
    if (server) cleanupPromises.push(stopServer(server))

    await Promise.all(cleanupPromises)
    await fs.promises.rename(backupFile, indexFile).catch(() => {})

    const timeTaken = ((+new Date() - +startTime) / 1000).toFixed(2)
    console.log(
      `Static site created ${routes.length} pages in ${timeTaken} seconds`,
    )

    if (config.generateSitemap || config.indexSeo) {
      await generateSitemap(routes, config.domain)
      console.log('Sitemap has been successfully created!')
    }
  }
}
