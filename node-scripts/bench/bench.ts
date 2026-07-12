// Measure the datannur boot: init timings (from the console log) + JS heap.
// Usage: npm run node:ts node-scripts/bench/bench.ts <url> [deadlineMs]
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:8099/'
const browser = await chromium.launch()
const page = await browser.newPage()

let initLog: unknown = null
let searchMs: number | null = null
const t0 = Date.now()
page.on('console', msg => {
  const text = msg.text()
  console.error(
    `[${((Date.now() - t0) / 1000).toFixed(1)}s]`,
    text.slice(0, 200),
  )
  if (text.startsWith('init ')) {
    const arg = msg.args()[1]
    if (arg) {
      arg.jsonValue().then(
        (value: unknown) => {
          initLog = value
        },
        () => {
          initLog = text
        },
      )
    } else {
      initLog = text
    }
  }
  if (text.startsWith('search init time')) {
    searchMs = Number(text.split(' ').pop())
  }
})
page.on('pageerror', error =>
  console.error('PAGEERROR', String(error).slice(0, 300)),
)

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
const deadline = Date.now() + Number(process.argv[3] ?? 120000)
while (!initLog && Date.now() < deadline) {
  await new Promise(resolve => setTimeout(resolve, 200))
}
const wallMs = Date.now() - t0

// let the GC settle, then measure the heap
await new Promise(resolve => setTimeout(resolve, 2000))
const mem = await page.evaluate(() => {
  const perf = performance as Performance & {
    memory?: { usedJSHeapSize: number; totalJSHeapSize: number }
  }
  const memory = perf.memory
  return memory
    ? {
        usedMB: memory.usedJSHeapSize / 1048576,
        totalMB: memory.totalJSHeapSize / 1048576,
      }
    : null
})

console.log(
  JSON.stringify(
    {
      url,
      init: initLog,
      searchInitMs: searchMs,
      wallToInitAndSearchMs: wallMs,
      heapUsedMB: mem && Math.round(mem.usedMB),
      heapTotalMB: mem && Math.round(mem.totalMB),
    },
    null,
    2,
  ),
)
await browser.close()
