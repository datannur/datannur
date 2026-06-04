<script lang="ts">
  import db from '@db'
  import Icon from '@layout/Icon.svelte'
  import Link from '@layout/Link.svelte'
  import { getEntityName } from '@i18n/constant-labels'
  import { entityNames } from '@lib/constant'

  let { datasetId }: { datasetId: string } = $props()

  interface RelationType {
    name: 'oneToOne' | 'oneToMany' | 'manyToMany'
    symbol: string
    tooltip: string
  }

  interface RelationGroup {
    type: RelationType
    relations: RelationDisplay[]
  }

  interface RelationDisplay {
    from: RelationEntity
    to: RelationEntity
  }

  interface RelationEntity {
    entity: string
    label: string
  }

  const schema = db.getSchema()

  const relationTypes: RelationType[] = [
    { name: 'oneToOne', symbol: 'minus', tooltip: 'one to one' },
    { name: 'oneToMany', symbol: 'arrow-right-long', tooltip: 'one to many' },
    {
      name: 'manyToMany',
      symbol: 'arrows-left-right',
      tooltip: 'many to many',
    },
  ]

  const relationRoleNames = {
    owner: getEntityName('owner'),
    manager: getEntityName('manager'),
  } as const
  const hiddenRelationRoles = ['source', 'fk']

  function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  function getRelationEntity(relationKey: string): RelationEntity {
    if (relationKey in entityNames) {
      return {
        entity: relationKey,
        label: getEntityName(relationKey as keyof typeof entityNames),
      }
    }
    for (const entity of Object.keys(entityNames)) {
      const entitySuffix = capitalize(entity)
      if (!relationKey.endsWith(entitySuffix)) continue

      const role = relationKey.slice(0, -entitySuffix.length)
      if (!role) break
      if (!(role in relationRoleNames)) break
      return {
        entity,
        label: `${getEntityName(entity as keyof typeof entityNames)} (${relationRoleNames[role as keyof typeof relationRoleNames]})`,
      }
    }
    return { entity: relationKey, label: relationKey }
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

  function getRelationDisplay(relation: string[]): RelationDisplay {
    return {
      from: getRelationEntity(relation[0]),
      to: getRelationEntity(relation[relation.length - 1]),
    }
  }

  const relations: RelationGroup[] = relationTypes.map(type => ({
    type,
    relations: schema[type.name]
      .filter(
        relation =>
          !relation.some(relationKey =>
            hiddenRelationRoles.includes(getRelationRole(relationKey) ?? ''),
          ),
      )
      .map(relation => getRelationDisplay(relation))
      .filter(
        relation =>
          relation.from.entity === datasetId ||
          relation.to.entity === datasetId,
      ),
  }))

  const hasRelation = relations.some(
    relationType => relationType.relations.length > 0,
  )
</script>

{#if hasRelation}
  <tr>
    <td><Icon type="relation" /> Relations</td>
    <td>
      {#each relations as relationType (relationType.type.name)}
        {#if relationType.relations.length}
          <ul>
            {#each relationType.relations as relation (relation.from.label + relation.to.label)}
              <li>
                <Link href={`metaDataset/${relation.from.entity}`}
                  >{relation.from.label}</Link
                >
                <span class="use-tooltip" title={relationType.type.tooltip}>
                  <Icon type={relationType.type.symbol} marginRight={false} />
                </span>
                <Link href={`metaDataset/${relation.to.entity}`}
                  >{relation.to.label}</Link
                >
              </li>
            {/each}
          </ul>
        {/if}
      {/each}
    </td>
  </tr>
{/if}
