<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import { tabSelected } from '@lib/store'
  import {
    makeParentsRelative,
    getRecursive,
    removeDuplicateById,
    addMinimumDeep,
  } from '@lib/db'
  import { isBigLimit } from '@lib/constant'
  import Tags from '@lib/tags'
  import { tabsHelper } from '@tab/tabs-helper'
  import Tabs from '@tab/Tabs.svelte'
  import Title from '@layout/Title.svelte'
  import OpenAllSwitch from '@layout/OpenAllSwitch.svelte'
  import EvolutionSummarySwitch from '@layout/EvolutionSummarySwitch.svelte'
  import type { Organization } from '@type'

  let { organization: organizationProp }: { organization: Organization } =
    $props()
  const organization = untrack(() => organizationProp)

  let keyTab = $state(1)

  const docs = organization.docsRecursive

  const organizations = db.getAllChilds('organization', organization.id)
  makeParentsRelative(organization.id, organizations)
  addMinimumDeep(organizations)

  const folders = getRecursive('organization', organization.id, 'folder')
  makeParentsRelative(false, folders)
  addMinimumDeep(folders)

  const datasets = getRecursive('organization', organization.id, 'dataset')
  const variables = datasets.flatMap(dataset =>
    db.getAll('variable', { dataset }),
  )

  let enumerations = variables.flatMap(variable => variable.enumerations ?? [])
  enumerations = removeDuplicateById(enumerations)

  const tags = Tags.getFromEntities({
    organizations: organizations,
    folders,
    datasets,
  })
  makeParentsRelative(false, tags)
  addMinimumDeep(tags)

  const enumerationsId = new Set(enumerations.map(item => item.id))
  const variablesId = new Set(variables.map(item => item.id))
  const datasetsId = new Set(datasets.map(item => item.id))
  const foldersId = new Set(folders.map(item => item.id))
  const organizationsId = new Set(organizations.map(item => item.id))

  const evolutions = db
    .getAll('evolution')
    .filter(
      evo =>
        (evo.entity === 'organization' &&
          (evo.id === organization.id || organizationsId.has(evo.id!))) ||
        (evo.entity === 'folder' && evo.id && foldersId.has(evo.id)) ||
        (evo.entity === 'dataset' && evo.id && datasetsId.has(evo.id)) ||
        (evo.entity === 'variable' && evo.id && variablesId.has(evo.id)) ||
        (evo.entity === 'enumeration' && evo.id && enumerationsId.has(evo.id)) ||
        (evo.parentEntity === 'enumeration' &&
          evo.parentEntityId &&
          enumerationsId.has(evo.parentEntityId)),
    )

  const stat = [
    { entity: 'organization', items: organizations },
    { entity: 'folder', items: folders },
    { entity: 'tag', items: tags },
    { entity: 'doc', items: docs },
    { entity: 'dataset', items: datasets },
    { entity: 'variable', items: variables },
    { entity: 'enumeration', items: enumerations },
  ]

  const tabs = tabsHelper({
    organization,
    organizations,
    folders,
    tags,
    docs,
    datasets,
    variables,
    enumerations,
    evolutions,
    stat,
  })

  const nbOrganization = organizations.length
  const nbFolder = folders.length
  let showOpenAllSwitch = $derived(
    ($tabSelected.key === 'organizations' && nbOrganization > isBigLimit) ||
      ($tabSelected.key === 'folders' && nbFolder > isBigLimit),
  )
  let showEvolutionSummarySwitch = $derived(
    $tabSelected.key === 'evolutions' && evolutions.length > isBigLimit,
  )
</script>

<section class="section">
  <Title type="organization" name={organization.name} id={organization.id} />
  {#if showOpenAllSwitch}
    <OpenAllSwitch onChange={() => keyTab++} />
  {/if}
  {#if showEvolutionSummarySwitch}
    <EvolutionSummarySwitch onChange={() => keyTab++} />
  {/if}
  {#key keyTab}
    <Tabs {tabs} />
  {/key}
</section>
