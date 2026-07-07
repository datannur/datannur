/**
 * LLM Tools - Functions that the LLM can call to interact with the app
 *
 * These tools allow the LLM to:
 * - Query the database
 * - Navigate the app
 * - Manipulate UI state
 * - Access user data
 */

import db from '@db'
import { router } from '@router/router.svelte'
import Search from '@search/search'
import { en } from '@i18n/en'
import { fr } from '@i18n/fr'
import { de } from '@i18n/de'
import type { Locale } from '@i18n/types'
import type { EntityName, MainEntity, MainEntityName } from '@type'
import { mainEntityNames } from '@lib/constant'

type LLMToolDescriptionKey = keyof typeof en.llm.tool

/**
 * Tool definitions for LLM
 * Each tool has a name, description, parameters schema, and handler function
 */

export type LLMTool = {
  name: string
  description: string
  descriptionKey: LLMToolDescriptionKey
  parameters: {
    type: 'object'
    properties: {
      [key: string]: { type: string; description: string; enum?: string[] }
    }
    required: string[]
  }
  handler: (params: unknown) => unknown
}

const mainEntityEnumValues = Object.keys(mainEntityNames)

/**
 * Database query tools
 */

/**
 * Find entities with optional filtering
 * Returns count + lightweight list (max 20 items)
 */
function filterEntities(
  entity: MainEntityName,
  criteria?: Record<string, unknown>,
): MainEntity[] {
  let entities = db.getAll(entity)

  if (criteria && Object.keys(criteria).length > 0) {
    entities = entities.filter(e =>
      Object.entries(criteria).every(
        ([key, value]) => (e as Record<string, unknown>)[key] === value,
      ),
    )
  }

  return entities
}

const countEntities: LLMTool = {
  name: 'countEntities',
  description:
    'Count entities matching criteria. Use for "how many" questions.',
  descriptionKey: 'countEntities',
  parameters: {
    type: 'object',
    properties: {
      entity: {
        type: 'string',
        description: 'Entity type to count',
        enum: mainEntityEnumValues,
      },
      criteria: {
        type: 'object',
        description: 'Filter criteria (e.g., {type: "panel"})',
      },
    },
    required: ['entity'],
  },
  handler: ((params: {
    entity: MainEntityName
    criteria?: Record<string, unknown>
  }) => {
    const { entity, criteria } = params
    return { count: filterEntities(entity, criteria).length }
  }) as (params: unknown) => unknown,
}

const listEntities: LLMTool = {
  name: 'listEntities',
  description:
    'List entities matching criteria. Returns first 20 items (id, name) + total count. Use when user asks for a list.',
  descriptionKey: 'listEntities',
  parameters: {
    type: 'object',
    properties: {
      entity: {
        type: 'string',
        description: 'Entity type to list',
        enum: mainEntityEnumValues,
      },
      criteria: {
        type: 'object',
        description: 'Filter criteria (e.g., {type: "panel"})',
      },
    },
    required: ['entity'],
  },
  handler: ((params: {
    entity: MainEntityName
    criteria?: Record<string, unknown>
  }) => {
    const { entity, criteria } = params
    const entities = filterEntities(entity, criteria)
    return {
      count: entities.length,
      items: entities.slice(0, 20).map(e => ({
        id: e.id as string | number,
        name: e.name as string,
      })),
    }
  }) as (params: unknown) => unknown,
}

const getEntity: LLMTool = {
  name: 'getEntity',
  description: 'Get a single entity by ID',
  descriptionKey: 'getEntity',
  parameters: {
    type: 'object',
    properties: {
      entity: {
        type: 'string',
        description: 'Entity type',
        enum: mainEntityEnumValues,
      },
      id: {
        type: 'string',
        description: 'Entity ID',
      },
    },
    required: ['entity', 'id'],
  },
  handler: ((params: { entity: EntityName; id: string }) => {
    return db.get(params.entity, params.id)
  }) as (params: unknown) => unknown,
}

/**
 * Search tools
 */

const searchInCatalog: LLMTool = {
  name: 'searchInCatalog',
  description:
    'Full-text search across all entities. Returns lightweight results with id, name and entity type. Use getEntity() for full details.',
  descriptionKey: 'searchInCatalog',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      entityType: {
        type: 'string',
        description: 'Limit to entity type (or "all" for all entities)',
        enum: [...mainEntityEnumValues, 'all'],
      },
      limit: {
        type: 'number',
        description: 'Maximum results (default: 20)',
      },
    },
    required: ['query'],
  },
  handler: (async (params: {
    query: string
    entityType?: MainEntityName | 'all'
    limit?: number
  }) => {
    const { query, entityType = 'all', limit = 20 } = params

    const results = await Search.find(query)

    const filtered =
      entityType === 'all'
        ? results
        : results.filter((r: { entity: string }) => r.entity === entityType)

    return filtered
      .slice(0, limit)
      .map((r: { id: string | number; name: string; entity: string }) => ({
        id: r.id,
        name: r.name,
        entity: r.entity,
      }))
  }) as (params: unknown) => unknown,
}

/**
 * Aggregation & analysis tools
 */

const groupBy: LLMTool = {
  name: 'groupBy',
  description: 'Group entities by field and count occurrences',
  descriptionKey: 'groupBy',
  parameters: {
    type: 'object',
    properties: {
      entity: {
        type: 'string',
        description: 'Entity type',
        enum: mainEntityEnumValues,
      },
      field: {
        type: 'string',
        description: 'Field to group by (e.g., "type", "folderId")',
      },
      criteria: {
        type: 'object',
        description: 'Pre-filter criteria',
      },
    },
    required: ['entity', 'field'],
  },
  handler: ((params: {
    entity: EntityName
    field: string
    criteria?: Record<string, unknown>
  }) => {
    let entities = db.getAll(params.entity)

    if (params.criteria && Object.keys(params.criteria).length > 0) {
      entities = entities.filter((e: unknown) =>
        Object.entries(params.criteria!).every(
          ([key, value]) => (e as Record<string, unknown>)[key] === value,
        ),
      )
    }

    const groups: { [key: string]: number } = {}

    for (const entity of entities) {
      const value = (entity as Record<string, unknown>)[params.field]
      const key = value?.toString() ?? 'null'
      groups[key] = (groups[key] ?? 0) + 1
    }

    return groups
  }) as (params: unknown) => unknown,
}

const getStatistics: LLMTool = {
  name: 'getStatistics',
  description: 'Get statistical summary of a numeric field',
  descriptionKey: 'getStatistics',
  parameters: {
    type: 'object',
    properties: {
      entity: {
        type: 'string',
        description: 'Entity type',
        enum: ['dataset', 'variable'],
      },
      field: {
        type: 'string',
        description: 'Numeric field (e.g., "nbRow", "nbDistinct")',
      },
      criteria: {
        type: 'object',
        description: 'Filter criteria',
      },
    },
    required: ['entity', 'field'],
  },
  handler: ((params: {
    entity: 'dataset' | 'variable'
    field: string
    criteria?: Record<string, unknown>
  }) => {
    let entities = db.getAll(params.entity, undefined)

    if (params.criteria && Object.keys(params.criteria).length > 0) {
      entities = entities.filter((e: unknown) =>
        Object.entries(params.criteria!).every(
          ([key, value]) => (e as Record<string, unknown>)[key] === value,
        ),
      )
    }

    const values = entities
      .map((e: unknown) => (e as Record<string, unknown>)[params.field])
      .filter((v: unknown) => typeof v === 'number') as number[]

    if (values.length === 0) return null

    const sum = values.reduce((a, b) => a + b, 0)
    const sorted = [...values].sort((a, b) => a - b)

    return {
      count: values.length,
      sum,
      mean: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
    }
  }) as (params: unknown) => unknown,
}

/**
 * Navigation tools
 */

const navigate: LLMTool = {
  name: 'navigate',
  description:
    'Navigate to a page in the app, optionally to a specific tab. Available tabs by route: organization (folders, tags, docs, datasets, variables, enumerations, evolutions, stat), folder (folders, tags, docs, datasets, variables, enumerations, evolutions, stat), tag (tags, organizations, folders, docs, datasets, variables), dataset (docs, datasets, variables, enumerations, datasetPreview, evolutions, stat), variable (variables, variableValues, frequency, variablePreview, evolutions), enumeration (values, variables, evolutions)',
  descriptionKey: 'navigate',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Route path (e.g., "/dataset/123", "/variable/456", "/")',
      },
      tab: {
        type: 'string',
        description:
          'Tab to display (e.g., "folders", "variables", "datasets", "enumerations", "docs", "evolutions", "stat")',
      },
    },
    required: ['path'],
  },
  handler: ((params: { path: string; tab?: string }) => {
    const fullPath = params.tab
      ? `${params.path}?tab=${params.tab}`
      : params.path
    router.navigate(fullPath)

    // Emit event to change tab when staying on same page
    if (params.tab) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('llm-tab-change', { detail: params.tab }),
        )
      }, 50)
    }

    return { success: true, path: fullPath }
  }) as (params: unknown) => unknown,
}

/**
 * All available tools
 */
export const llmTools: LLMTool[] = [
  // Query tools
  countEntities,
  listEntities,
  getEntity,
  searchInCatalog,

  // Analysis tools
  groupBy,
  getStatistics,

  // Navigation
  navigate,
]

export type ToolDefinition = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: {
        [key: string]: { type: string; description: string; enum?: string[] }
      }
      required: string[]
    }
  }
}

/**
 * Get tool definitions in OpenAI function calling format
 */
export function getToolDefinitions(locale: Locale): ToolDefinition[] {
  const toolDescriptionsByLocale = {
    en: en.llm.tool,
    fr: fr.llm.tool,
    de: de.llm.tool,
  } satisfies { [locale in Locale]: Record<string, string> }
  const toolDescriptions = toolDescriptionsByLocale[locale] ?? en.llm.tool

  return llmTools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: toolDescriptions[tool.descriptionKey] ?? tool.description,
      parameters: tool.parameters,
    },
  }))
}

/**
 * Execute a tool by name with parameters
 */
export function executeTool(toolName: string, parameters: unknown): unknown {
  const tool = llmTools.find(t => t.name === toolName)

  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`)
  }

  try {
    return tool.handler(parameters)
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    }
  }
}
