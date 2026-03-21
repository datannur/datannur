import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { formatWithPrettier } from './util.ts'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const publicDir = dirname(scriptDir)

const packageJson = JSON.parse(
  readFileSync(join(publicDir, 'package.json'), 'utf-8'),
) as { datannur: { dbPath: string; schemasPath: string } }
const dbPath = packageJson.datannur.dbPath
const schemasPath = packageJson.datannur.schemasPath

const schemasDir = join(publicDir, schemasPath)
const dataDir = join(publicDir, dbPath)
const metaSchemaPath = join(schemasDir, '__meta__.schema.json')

type JSONValue = string | number | boolean | null | JSONObject | JSONValue[]
interface JSONObject {
  [key: string]: JSONValue
}

function getMetaSchema(): { baseUrl: string } {
  const meta = JSON.parse(readFileSync(metaSchemaPath, 'utf-8')) as JSONObject
  const metaId = meta.$id as string
  const baseUrl = metaId.substring(0, metaId.lastIndexOf('/') + 1)
  return { baseUrl }
}

function analyzeData(entityName: string): JSONObject {
  const dataFile = join(dataDir, `${entityName}.json`)
  const data = JSON.parse(readFileSync(dataFile, 'utf-8')) as unknown[]

  if (!Array.isArray(data) || data.length === 0) {
    return {}
  }

  const properties: JSONObject = {}
  const requiredFields = new Set<string>()

  // Get all unique keys
  const allKeys = new Set<string>()
  for (const item of data) {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item as JSONObject).forEach(key => allKeys.add(key))
    }
  }

  // Analyze each key across all items
  for (const key of allKeys) {
    const values = data.map(item =>
      typeof item === 'object' && item !== null
        ? (item as JSONObject)[key]
        : undefined,
    )

    // Determine types present in the data
    const types = new Set<string>()
    for (const value of values) {
      if (value === '' || value === null) {
        types.add('null')
      } else if (typeof value === 'string') {
        types.add('string')
      } else if (typeof value === 'number') {
        types.add(Number.isInteger(value) ? 'integer' : 'number')
      } else if (typeof value === 'boolean') {
        types.add('boolean')
      }
    }

    // Sort types: main types alphabetically, then null at the end
    const typeArray = Array.from(types)
    const mainTypes = typeArray.filter(t => t !== 'null').sort()
    const hasNull = typeArray.includes('null')
    const sortedTypes = hasNull ? [...mainTypes, 'null'] : mainTypes

    properties[key] = {
      type: sortedTypes.length === 1 ? sortedTypes[0] : sortedTypes,
      description: `${key} field`,
    }

    // Check if field is always present (even if empty/null)
    const alwaysPresent = data.every(
      item => typeof item === 'object' && item !== null && key in item,
    )
    if (alwaysPresent) {
      requiredFields.add(key)
    }

    // Special handling for *_ids fields
    if (key.endsWith('_ids')) {
      const prop = properties[key] as JSONObject
      prop.pattern = '^([a-zA-Z0-9_-]+(, ?[a-zA-Z0-9_-]+)*)?$'
      prop.examples = ['id1,id2,id3', 'single-id', null]
    }
  }

  return {
    properties,
    required: Array.from(requiredFields),
  }
}

function generateSchema(
  entityName: string,
  mode: 'create' | 'update',
  strict = false,
): void {
  const { baseUrl } = getMetaSchema()
  const schemaFile = join(schemasDir, `${entityName}.schema.json`)

  let existingSchema: JSONObject | null = null
  if (mode === 'update') {
    try {
      existingSchema = JSON.parse(
        readFileSync(schemaFile, 'utf-8'),
      ) as JSONObject
    } catch {
      console.log(
        `⚠️  ${entityName}.schema.json not found, creating new schema`,
      )
      mode = 'create'
    }
  }

  const analysis = analyzeData(entityName)

  if (mode === 'create') {
    // In create mode, only mark 'id' as required by default (progressive approach)
    // Use strict flag to include all always-present fields in required
    const requiredFields = strict
      ? (analysis.required as string[])
      : ['id'].filter(f =>
          Object.keys(analysis.properties as JSONObject).includes(f),
        )

    const schema: JSONObject = {
      $schema: './__meta__.schema.json',
      $id: `${baseUrl}${entityName}.schema.json`,
      title: `${entityName.charAt(0).toUpperCase()}${entityName.slice(1)} Collection`,
      description: `${entityName} entities (array format)`,
      type: 'array',
      items: {
        type: 'object',
        required: requiredFields,
        additionalProperties: false,
        properties: analysis.properties as JSONObject,
      },
    }

    writeFileSync(schemaFile, JSON.stringify(schema, null, 2) + '\n')
    formatWithPrettier(schemaFile)
    console.log(`✅ Created ${entityName}.schema.json`)
  } else {
    // Update mode: merge new fields, preserve descriptions
    const items = existingSchema!.items as JSONObject
    const existingProps = (items.properties as JSONObject) ?? {}
    const newProps = analysis.properties as JSONObject

    let updated = false

    // Update baseUrl if changed
    const currentId = existingSchema!.$id as string
    const expectedId = `${baseUrl}${entityName}.schema.json`
    if (currentId !== expectedId) {
      existingSchema!.$id = expectedId
      updated = true
    }

    // Add new properties (without marking them as required by default)
    for (const [key, value] of Object.entries(newProps)) {
      if (!(key in existingProps)) {
        existingProps[key] = value
        updated = true
        console.log(`  + Added property: ${key} (optional)`)
      }
    }

    // Update required fields only in strict mode
    if (strict) {
      const currentRequired = new Set((items.required as string[]) ?? [])
      const newRequired = new Set((analysis.required as string[]) ?? [])

      for (const field of newRequired) {
        if (!currentRequired.has(field)) {
          currentRequired.add(field)
          updated = true
          console.log(`  + Added required: ${field}`)
        }
      }

      items.required = Array.from(currentRequired)
    } else {
      // Preserve existing required fields (do not auto-add new ones)
      // This allows progressive adoption: users can manually add fields to required when ready
    }

    if (updated) {
      writeFileSync(schemaFile, JSON.stringify(existingSchema, null, 2) + '\n')
      formatWithPrettier(schemaFile)
      console.log(`✅ Updated ${entityName}.schema.json`)
    } else {
      console.log(`  No changes for ${entityName}.schema.json`)
    }
  }
}

// Main
const command = process.argv[2]
const strict = process.argv.includes('--strict')

if (!command || !['generate', 'update', 'reset'].includes(command)) {
  console.log('Usage: manage-schemas.ts <generate|update|reset> [--strict]')
  console.log(
    '  --strict: In update mode, auto-add always-present fields to required',
  )
  process.exit(1)
}

const tables = readdirSync(dataDir)
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''))

if (command === 'reset') {
  console.log('🗑️  Resetting all schemas...')
  const existingSchemas = readdirSync(schemasDir).filter(
    f =>
      f.endsWith('.schema.json') &&
      f !== '__meta__.schema.json' &&
      f !== '__table__.schema.json',
  )

  for (const file of existingSchemas) {
    unlinkSync(join(schemasDir, file))
    console.log(`  Deleted ${file}`)
  }
  console.log('✅ All data schemas deleted (userData schemas preserved)\n')
  console.log('Run "generate" to create new schemas')
  process.exit(0)
}

console.log(
  `📋 ${command === 'generate' ? 'Generating' : 'Updating'} schemas${strict ? ' (strict mode)' : ''}...\n`,
)

for (const table of tables) {
  try {
    generateSchema(table, command === 'generate' ? 'create' : 'update', strict)
  } catch (error) {
    console.log(`❌ Error processing ${table}:`, (error as Error).message)
  }
}

console.log(`\n✅ Done!`)
