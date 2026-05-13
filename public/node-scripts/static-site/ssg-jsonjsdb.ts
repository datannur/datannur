/**
 * SSG utilities for jsonjsdb integration
 * Extends ssg.ts with jsonjsdb-specific functionality
 */

import fs from 'fs'
import path from 'path'
import { generateStaticSite } from './ssg.ts'

type Row = Record<string, unknown>

/**
 * Convert array-based jsonjsdb data to object-based data
 */
export function arrayToObject(data: unknown[][]): Row[] {
  const [headers, ...rows] = data
  const result: Row[] = []
  for (const row of rows) {
    const obj: Row = {}
    for (let i = 0; i < row.length; i++) {
      const key = headers[i] as string
      obj[key] = row[i]
    }
    result.push(obj)
  }
  return result
}

/**
 * Extract database path from HTML content (jsonjsdb config)
 */
export function getDbPathFromContent(content: string): string {
  const match = content.match(/id="jsonjsdb-config"[^>]+data-path="([^"]+)"/)
  return match ? match[1] : 'data/db'
}

/**
 * Find database metadata path (handles nested folder structure)
 */
export async function getDbMetaPath(outputDb: string): Promise<string> {
  const items = await fs.promises.readdir(outputDb, { withFileTypes: true })
  const files = items.filter(
    item => item.isFile() && item.name.endsWith('.json.js'),
  ).length
  if (files > 0) return outputDb
  const folders = items.filter(item => item.isDirectory())
  if (folders.length !== 1) return outputDb
  return path.join(outputDb, folders[0].name)
}

/**
 * Generate routes from jsonjsdb entities
 * @param dbMetaPath - Path to jsonjsdb metadata files
 * @param entities - Array of entity names to generate routes for
 * @returns Array of routes in format "entity/id"
 */
export async function getEntitiesRoutes(
  dbMetaPath: string,
  entities: string[],
): Promise<string[]> {
  const routes: string[] = []
  for (const entity of entities) {
    const filePath = `${dbMetaPath}/${entity}.json.js`
    const data = await fs.promises.readFile(filePath, 'utf8')
    const index = data.indexOf('=')
    const jsonPart = index !== -1 ? data.substring(index + 1).trim() : ''
    let json = JSON.parse(jsonPart) as unknown[][] | Row[]

    if (json.length > 0 && Array.isArray(json[0])) {
      json = arrayToObject(json as unknown[][])
    }

    for (const row of json as Row[]) {
      routes.push(`${entity}/${row.id}`)
    }
  }
  return routes
}

/**
 * Create entity directories in output folder
 */
export async function createEntityDirs(
  outDir: string,
  entities: string[],
): Promise<void> {
  for (const entity of entities) {
    await fs.promises.mkdir(path.join(outDir, entity), { recursive: true })
  }
}

export interface JsonjsdbSsgConfig {
  domain: string
  indexSeo: boolean
  appPath: string
  outDir: string
  dbMetaPath: string
  port: number
  entities: string[]
  routes: string[]
}

/**
 * Load SSG configuration from JSON file
 */
export async function loadSsgConfig(
  configPath: string,
): Promise<JsonjsdbSsgConfig | null> {
  try {
    const rawConfig = JSON.parse(
      await fs.promises.readFile(configPath, 'utf-8'),
    ) as JsonjsdbSsgConfig
    return rawConfig
  } catch (error) {
    console.error('Failed to read or parse', configPath, error)
    return null
  }
}

/**
 * Complete SSG workflow for jsonjsdb-based SPA
 * Handles config loading, directory setup, route generation, and static site generation
 */
export async function generateJsonjsdbStaticSite(
  configPath: string,
  workingDir?: string,
): Promise<void> {
  if (workingDir) {
    process.chdir(workingDir)
  }

  const config = await loadSsgConfig(configPath)

  if (!config) {
    console.error('Failed to load configuration')
    process.exit(1)
  }

  process.chdir(path.join(process.cwd(), config.appPath))

  // Prepare output directory
  await fs.promises.rm(config.outDir, { recursive: true, force: true })
  await fs.promises.mkdir(config.outDir, { recursive: true })
  await createEntityDirs(config.outDir, config.entities)

  // Generate routes from database entities
  const dbMetaPath = await getDbMetaPath(config.dbMetaPath)
  const entityRoutes = await getEntitiesRoutes(dbMetaPath, config.entities)
  const allRoutes = [...config.routes, ...entityRoutes]

  // Generate static site
  await generateStaticSite(
    allRoutes,
    {
      domain: config.domain,
      port: config.port,
      appPath: config.appPath,
      outDir: config.outDir,
      generateSitemap: config.indexSeo,
      indexSeo: config.indexSeo,
    },
    {
      waitForDbSelector: '#db-loaded',
      dbPathExtractor: getDbPathFromContent,
    },
  )
}
