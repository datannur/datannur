// Capture a normalized snapshot of a db table via the console handle logged
// by Main.svelte ("db (Jsonjsdb):", db) — used to prove a processing refactor
// output-identical (diff a before/after snapshot).
// Usage: npm run node:ts node-scripts/bench/snapshot-table.ts <url> <outfile> [table]
import fs from 'node:fs'
import { chromium, type JSHandle } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:8098/'
const outfile = process.argv[3] ?? 'table-snapshot.json'
const table = process.argv[4] ?? 'evolution'
const browser = await chromium.launch()
const page = await browser.newPage()

let dbHandle: JSHandle | null = null
page.on('console', msg => {
  if (msg.text().startsWith('db (Jsonjsdb):')) dbHandle = msg.args()[1] ?? null
})

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
const deadline = Date.now() + 120000
while (!dbHandle && Date.now() < deadline) {
  await new Promise(resolve => setTimeout(resolve, 200))
}
if (!dbHandle) throw new Error('db handle not captured')

const json = await (dbHandle as JSHandle).evaluate((dbRaw, tableName) => {
  const db = dbRaw as { tables: Record<string, Record<string, unknown>[]> }
  const rows = (db.tables[tableName] ?? []).map(row => {
    const normalized: Record<string, unknown> = {}
    for (const key of Object.keys(row).sort()) {
      const value = row[key]
      if (
        value === null ||
        ['string', 'number', 'boolean'].includes(typeof value)
      ) {
        normalized[key] = value
      } else if (value === undefined) {
        normalized[key] = '__undefined__'
      } else {
        normalized[key] =
          '__object:' + (Array.isArray(value) ? 'array' : typeof value) + '__'
      }
    }
    return normalized
  })
  rows.sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1))
  return JSON.stringify(rows, null, 1)
}, table)
fs.writeFileSync(outfile, json)
console.log(
  'table:',
  table,
  'rows:',
  (JSON.parse(json) as unknown[]).length,
  '->',
  outfile,
)
await browser.close()
