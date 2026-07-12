// Generate package/data/db-big: a synthetic large catalog by cloning "worlds"
// (dataset + variable + enumeration + value + frequency rows suffixed _w<k>);
// shared tables (organization, folder, tag, concept...) stay unique.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dataRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../package/data',
)
const srcDir = path.join(dataRoot, 'db')
const outDir = path.join(dataRoot, 'db-big')
const nWorlds = Number(process.argv[2] ?? 290) // ~290 worlds → ~100k variables

const clonedTables = [
  'dataset',
  'variable',
  'enumeration',
  'value',
  'frequency',
]

type Cell = unknown
type Row = Cell[]

function readTable(name: string): { headers: string[]; rows: Row[] } {
  const raw = fs.readFileSync(path.join(srcDir, name + '.json.js'), 'utf8')
  const json = raw.slice(raw.indexOf('=') + 1).trim()
  const data = JSON.parse(json) as Row[] // [[headers], [row], ...]
  const headers = (data[0] ?? []).map(header => String(header))
  const rows = data.slice(1)
  return { headers, rows }
}

function writeTable(name: string, headers: string[], rows: Row[]) {
  const data = [headers, ...rows]
  const payload = JSON.stringify(data)
  fs.writeFileSync(
    path.join(outDir, name + '.json.js'),
    `jsonjs.data['${name}'] = ${payload}\n`,
  )
  fs.writeFileSync(path.join(outDir, name + '.json'), payload)
}

const sfx = (id: Cell, k: number): Cell =>
  id == null || k === 0 ? id : `${String(id)}_w${k}`
const sfxList = (ids: Cell, k: number): Cell =>
  ids == null || k === 0
    ? ids
    : String(ids)
        .split(',')
        .map(s => `${s.trim()}_w${k}`)
        .join(',')

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })

// non-cloned tables + __table__ + subfolders: copied as-is
for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
  const base = entry.name.replace(/\.json(\.js)?$/, '')
  if (entry.isDirectory()) {
    fs.cpSync(path.join(srcDir, entry.name), path.join(outDir, entry.name), {
      recursive: true,
    })
  } else if (!clonedTables.includes(base)) {
    fs.copyFileSync(
      path.join(srcDir, entry.name),
      path.join(outDir, entry.name),
    )
  }
}

// clone the 5 dataset-internal tables
const level1Tables = ['variable', 'enumeration', 'value', 'frequency']
const stats: Record<string, number> = {}
for (const table of clonedTables) {
  if (process.env.LEVEL1_ONLY && level1Tables.includes(table)) {
    const { headers } = readTable(table)
    writeTable(table, headers, [])
    stats[table] = 0
    continue
  }
  const { headers, rows } = readTable(table)
  const idx = Object.fromEntries(
    headers.map((header, i): [string, number] => [header, i]),
  )
  const out: Row[] = []
  for (let k = 0; k < nWorlds; k++) {
    for (const row of rows) {
      const r = row.slice()
      if (table === 'dataset') {
        r[idx.id] = sfx(r[idx.id], k)
      } else if (table === 'variable') {
        r[idx.id] = sfx(r[idx.id], k)
        r[idx.dataset_id] = sfx(r[idx.dataset_id], k)
        r[idx.enumeration_ids] = sfxList(r[idx.enumeration_ids], k)
        r[idx.fk_variable_id] = sfx(r[idx.fk_variable_id], k)
        r[idx.source_variable_ids] = sfxList(r[idx.source_variable_ids], k)
        if (process.env.NO_TAGS) r[idx.tag_ids] = null
        if (process.env.NO_CONCEPTS) r[idx.concept_id] = null
        if (process.env.NO_LINEAGE) {
          r[idx.fk_variable_id] = null
          r[idx.source_variable_ids] = null
        }
        if (process.env.NO_ENUM) r[idx.enumeration_ids] = null
        if (process.env.NO_DATES) {
          r[idx.start_date] = null
          r[idx.end_date] = null
        }
      } else if (table === 'enumeration') {
        r[idx.id] = sfx(r[idx.id], k)
      } else if (table === 'value') {
        r[idx.enumeration_id] = sfx(r[idx.enumeration_id], k)
      } else if (table === 'frequency') {
        r[idx.variable_id] = sfx(r[idx.variable_id], k)
      }
      out.push(r)
    }
  }
  writeTable(table, headers, out)
  stats[table] = out.length
}

console.log('worlds:', nWorlds)
console.log('rows:', stats)
for (const t of clonedTables) {
  const s = fs.statSync(path.join(outDir, t + '.json.js')).size
  console.log(t + '.json.js', (s / 1024 / 1024).toFixed(1), 'MB')
}
