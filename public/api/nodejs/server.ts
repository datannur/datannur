import { readFile, readdir } from 'fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const publicDir = join(currentDir, '../..')

const packageJson = JSON.parse(
  await readFile(join(publicDir, 'package.json'), 'utf-8'),
) as { datannur: { dbPath: string; schemasPath: string } }
const dbPath = packageJson.datannur.dbPath
const schemasPath = packageJson.datannur.schemasPath

const schemasDir = join(publicDir, schemasPath)
const dataDir = join(publicDir, dbPath)
const localPortsConfigPath = join(
  publicDir,
  'data',
  'localhost-ports.config.json',
)
const ignoreSchemas = ['__meta__.schema.json', '__table__.schema.json']
const defaultNodeApiPort = 61293

type LocalPortsConfig = {
  nodeApiPort?: number
}

async function loadTables() {
  const files = await readdir(schemasDir)
  return files
    .filter(
      file => file.endsWith('.schema.json') && !ignoreSchemas.includes(file),
    )
    .map(file => file.replace('.schema.json', ''))
    .sort()
}

async function loadTableData(
  tableName: string,
): Promise<Record<string, unknown>[]> {
  const filePath = join(dataDir, `${tableName}.json`)
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content) as Record<string, unknown>[]
}

async function loadNodeApiPort() {
  try {
    const content = await readFile(localPortsConfigPath, 'utf-8')
    const config = JSON.parse(content) as LocalPortsConfig
    if (
      typeof config.nodeApiPort === 'number' &&
      Number.isInteger(config.nodeApiPort) &&
      config.nodeApiPort > 0
    ) {
      return config.nodeApiPort
    }
  } catch {
    return defaultNodeApiPort
  }

  return defaultNodeApiPort
}

function applyFilters(
  data: Record<string, unknown>[],
  query: Record<string, string>,
) {
  let result = [...data]

  const limit = query._limit ? Number(query._limit) : undefined
  const offset = query._offset ? Number(query._offset) : 0
  const sort = query._sort
  const order = query._order ?? 'asc'

  if (sort) {
    result.sort((a, b) => {
      const aVal = a[sort]
      const bVal = b[sort]

      if (aVal === bVal) return 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'desc'
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'desc' ? bVal - aVal : aVal - bVal
      }
      return 0
    })
  }

  if (offset > 0) {
    result = result.slice(offset)
  }

  if (limit !== undefined) {
    result = result.slice(0, limit)
  }

  return result
}

function parseUrl(url: string) {
  const [path, queryString] = url.split('?')
  const query: Record<string, string> = {}

  if (queryString) {
    for (const param of queryString.split('&')) {
      const [key, value] = param.split('=')
      if (key && value) {
        query[decodeURIComponent(key)] = decodeURIComponent(value)
      }
    }
  }

  return { path, query }
}

function sendJSON(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'Content-Type': 'application/json',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'Access-Control-Allow-Origin': '*',
  })
  res.end(JSON.stringify(data))
}

const tables = await loadTables()
const tableSet = new Set(tables)
const port = await loadNodeApiPort()

const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    const { path, query } = parseUrl(req.url ?? '')
    const segments = path.split('/').filter(Boolean)

    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Access-Control-Allow-Origin': '*',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      res.end()
      return
    }

    if (req.method !== 'GET') {
      sendJSON(res, { error: 'Method not allowed' }, 405)
      return
    }

    const [tableName, id] = segments

    if (!tableName || !tableSet.has(tableName)) {
      sendJSON(res, { error: 'Not found' }, 404)
      return
    }

    try {
      const data = await loadTableData(tableName)

      if (id) {
        const record = data.find(item => item.id === id)
        if (!record) {
          sendJSON(res, { error: 'Record not found' }, 404)
          return
        }
        sendJSON(res, record)
      } else {
        const filtered = applyFilters(data, query)
        sendJSON(res, filtered)
      }
    } catch (err) {
      console.error(err)
      sendJSON(res, { error: 'Internal server error' }, 500)
    }
  },
)

const host = '127.0.0.1'

server.listen(port, host, () => {
  console.log(`🚀 API Server running at http://localhost:${port}`)
  console.log(`📊 Available tables: ${tables.join(', ')}`)
})
