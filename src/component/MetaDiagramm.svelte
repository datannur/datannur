<script lang="ts">
  import db from '@db'
  import { isMobile } from '@lib/browser-utils'
  import { entityNames } from '@lib/constant'
  import { safeHtmlWithSvg } from '@lib/html-sanitizer'
  import { renderSimpleDiagram } from '@lib/simple-diagram'
  import type { EntityName } from '@type'

  const schemaRaw = db.getSchema()
  const { oneToOne: oneToOneUnused, ...schema } = schemaRaw
  void oneToOneUnused

  const direction = isMobile ? 'TB' : 'LR'
  let diagrammDefinition = `flowchart ${direction}\n`
  const relationRoleNames = {
    owner: entityNames.owner,
    manager: entityNames.manager,
  } as const
  const hiddenDiagramRelationRoles = ['source', 'fk']

  function compareNameDesc(a: string[] | string, b: string[] | string): number {
    const aName = Array.isArray(a) ? a[0] : a
    const bName = Array.isArray(b) ? b[0] : b
    if (aName > bName) return -1
    if (aName < bName) return 1
    return 0
  }

  function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  function normalizeRelationKey(relationKey: string): string[] {
    if (relationKey in entityNames) return [relationKey]
    for (const entity of Object.keys(entityNames)) {
      const entitySuffix = capitalize(entity)
      if (!relationKey.endsWith(entitySuffix)) continue

      const role = relationKey.slice(0, -entitySuffix.length)
      if (!role) break
      if (!(role in relationRoleNames)) break
      return [entity, role]
    }
    return [relationKey]
  }

  function getRelationRole(relationKey: string): string | null {
    for (const entity of Object.keys(entityNames)) {
      const entitySuffix = capitalize(entity)
      if (!relationKey.endsWith(entitySuffix)) continue

      const role = relationKey.slice(0, -entitySuffix.length)
      return role || null
    }
    return null
  }

  function getEntityCleanName(entity: string): string {
    return (
      entityNames[entity as keyof typeof entityNames] ??
      relationRoleNames[entity as keyof typeof relationRoleNames] ??
      entity
    )
  }

  schema.oneToMany = schema.oneToMany.filter(
    relation =>
      !relation.some(relationKey =>
        hiddenDiagramRelationRoles.includes(getRelationRole(relationKey) ?? ''),
      ),
  )

  schema.oneToMany = schema.oneToMany.map(relation => {
    let normalizedRelation = relation.flatMap(relationKey =>
      normalizeRelationKey(relationKey),
    )
    let otherOne: string | null = null
    if (normalizedRelation.includes('manager')) otherOne = 'owner'
    else if (normalizedRelation.includes('owner')) otherOne = 'manager'
    if (otherOne) {
      normalizedRelation = ['organization', otherOne, ...normalizedRelation]
    }
    if (
      normalizedRelation[0] === 'organization' &&
      normalizedRelation[2] === 'organization'
    ) {
      normalizedRelation.splice(2, 1)
    }
    return normalizedRelation
  })

  const schemaAlone: EntityName[] = []
  const allTables = [
    ...schema.oneToMany,
    ...schema.manyToMany,
  ] as EntityName[][]
  for (const tableRelation of allTables) {
    for (const table of tableRelation) {
      if (table in relationRoleNames) {
        continue
      }
      if (!schemaAlone.includes(table)) {
        schemaAlone.push(table)
      }
    }
  }

  schemaAlone.sort(compareNameDesc)
  schema.oneToMany.sort(compareNameDesc)
  schema.manyToMany.sort(compareNameDesc)

  const recursiveEntities: string[] = []
  for (const link of schema.oneToMany) {
    if (link[0] === link[1]) recursiveEntities.push(link[0])
  }

  for (const table of schemaAlone) {
    if (['metaFolder', 'metaDataset', 'metaVariable', 'alias'].includes(table))
      continue
    let entityName = table
    if (table in relationRoleNames) continue

    diagrammDefinition += `$${entityName}${recursiveEntities.includes(table) ? ' $recursive' : ''}\n`
  }

  const otherLinks: string[] = []
  let separator = ' - '
  for (const link of schema.oneToMany) {
    if (link.includes('metaDataset')) continue
    if (link[0] === link[1]) continue
    if (link.length > 2) {
      const lastOne = link[link.length - 1]
      let linkCleanName = ''
      for (let i = 0; i < link.length - 1; i++) {
        if (i === 0) continue
        if (i === link.length - 1) continue
        if (linkCleanName === '') linkCleanName += getEntityCleanName(link[i])
        else linkCleanName += separator + getEntityCleanName(link[i])
      }

      let reverseName = linkCleanName.split(separator).reverse().join(separator)
      const newLink = `${link[0]} -- ${linkCleanName} --> ${lastOne}\n`
      const reverseLink = `${link[0]} -- ${reverseName} --> ${lastOne}\n`
      if (otherLinks.includes(reverseLink)) continue

      otherLinks.push(newLink)
      diagrammDefinition += newLink
      continue
    }
    diagrammDefinition += `${link[0]} --> ${link[1]}\n`
  }
  for (const link of schema.manyToMany) {
    diagrammDefinition += `${link[0]} <--> ${link[1]}\n`
  }

  const svgDiagramm = renderSimpleDiagram(diagrammDefinition)
</script>

<div class="tab-inner-tab" use:safeHtmlWithSvg={svgDiagramm}></div>

<style lang="scss">
  @use 'main.scss' as *;
  @use '../style/simple-diagram.scss' as *;
  @use '../style/icon.scss' as *;

  .tab-inner-tab {
    background: $background-2;
    padding: 30px;
    text-align: center;
    :global {
      @include simple-diagram-style;
      @include icon-color;
    }
  }

  :global(html.roundedDesign) {
    .tab-inner-tab {
      border-radius: $rounded;
    }
  }
</style>
