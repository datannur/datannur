// CPU-profile the full boot: arm the profiler BEFORE navigation
// (processDb is one synchronous block that stalls CDP commands sent mid-boot).
// Usage: npm run node:ts node-scripts/bench/profile-boot.ts <url>
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:8099/'
const browser = await chromium.launch()
const page = await browser.newPage()

let initSeen = false
page.on('console', msg => {
  const text = msg.text()
  console.error('[console]', text.slice(0, 160))
  if (text.startsWith('search init time')) initSeen = true
})

const cdp = await page.context().newCDPSession(page)
await cdp.send('Profiler.enable')
await cdp.send('Profiler.setSamplingInterval', { interval: 4000 }) // 4ms
await cdp.send('Profiler.start')

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
const deadline = Date.now() + 900000
while (!initSeen && Date.now() < deadline) {
  await new Promise(resolve => setTimeout(resolve, 1000))
}
const { profile } = await cdp.send('Profiler.stop')

const samples = profile.samples ?? []
const hits = new Map<number, number>()
for (const sample of samples) hits.set(sample, (hits.get(sample) ?? 0) + 1)
const byNode = new Map(profile.nodes.map(node => [node.id, node]))
const total = samples.length

// aggregate per function (name+file+line): the same code can span several nodes
const byFn = new Map<string, number>()
for (const [id, count] of hits) {
  const node = byNode.get(id)
  if (!node) continue
  const frame = node.callFrame
  const loc = frame.url.replace(/^.*\/(src|node_modules)\//, '$1/')
  const key = `${frame.functionName || '(anonymous)'}  ${loc}:${frame.lineNumber + 1}`
  byFn.set(key, (byFn.get(key) ?? 0) + count)
}
const top = [...byFn.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .map(([key, count]) => `${((count / total) * 100).toFixed(1)}%  ${key}`)
console.log(top.join('\n'))
await browser.close()
