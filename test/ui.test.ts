import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'

const baseUrl = new URL('../dist/index.html', import.meta.url).href

let browser: Browser | undefined = undefined
let page: Page | undefined = undefined
let optionalMissingDcatProbeErrors = 0

function isOptionalMissingDcatProbe(url: string, errorText?: string) {
  return (
    errorText === 'net::ERR_FILE_NOT_FOUND' &&
    url.endsWith('/data/db-semantic/validation.json.js')
  )
}

function allowNextOptionalMissingDcatProbeConsoleError() {
  optionalMissingDcatProbeErrors += 1
  setTimeout(() => {
    optionalMissingDcatProbeErrors = Math.max(
      0,
      optionalMissingDcatProbeErrors - 1,
    )
  }, 100)
}

beforeAll(async () => {
  browser = await chromium.launch({ headless: true })
  page = await browser.newPage()
  page.setDefaultTimeout(10_000)
  page.setDefaultNavigationTimeout(10_000)

  page.on('console', msg => {
    if (msg.type() === 'error') {
      if (
        msg.text() === 'Failed to load resource: net::ERR_FILE_NOT_FOUND' &&
        optionalMissingDcatProbeErrors > 0
      ) {
        optionalMissingDcatProbeErrors -= 1
        return
      }
      throw new Error(`Console error: ${msg.text()}`)
    }
  })

  page.on('requestfailed', request => {
    const failure = request.failure()
    if (isOptionalMissingDcatProbe(request.url(), failure?.errorText)) {
      allowNextOptionalMissingDcatProbeConsoleError()
    }
  })

  page.on('pageerror', error => {
    throw new Error(`Page error: ${error.message}`)
  })
})

afterAll(async () => {
  await browser?.close()
})

const pageNames = [
  '',
  'organizations',
  'folders',
  'tags',
  'datasets',
  'variables',
  'enumerations',
  'favorite',
  'options',
  'about',
  '?tab=evolutions',
  'search/?search=folder',
  'meta',
  'metaFolder/data',
  'metaDataset/organization',
  'organization/dff',
  'organization/vd-ojv',
  'folder/bevnat',
  'folder/04-economie',
  'tag/population',
  'dataset/accident_route',
  'dataset/dep_sante',
  'variable/pollution_air__source_donnee',
  'variable/exportations__certification_requise',
  'enumeration/canton_sigle',
  '?tab=stat',
]

describe('UI tests', () => {
  it('should open hash routes directly in file mode for native new tabs', async () => {
    await page?.goto(`${baseUrl}#/dataset/pop_region`, {
      waitUntil: 'domcontentloaded',
    })
    await page?.waitForFunction(
      `() =>
        document.body.getAttribute('page') === 'dataset' &&
        document.title === 'Dataset | Population par région'
      `,
    )
  }, 15_000)

  pageNames.forEach(pageName => {
    it(`should display the main section for page: ${pageName}`, async () => {
      await page?.goto(`${baseUrl}#/${pageName}`, {
        waitUntil: 'domcontentloaded',
      })
      const section = await page?.waitForSelector(
        'div#wrapper > section.section',
      )
      expect(section).toBeTruthy()
    }, 15_000)
  })
})
