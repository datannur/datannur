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
  import { tabsHelper } from '@tab/tabs-helper'
  import Tags from '@lib/tags'
  import Tabs from '@tab/Tabs.svelte'

  import Title from '@layout/Title.svelte'
  import OpenAllSwitch from '@layout/OpenAllSwitch.svelte'
  import EvolutionSummarySwitch from '@layout/EvolutionSummarySwitch.svelte'
  import type { Folder } from '@type'

  let { folder: folderProp }: { folder: Folder } = $props()
  const folder = untrack(() => folderProp)

  const docs = folder.docsRecursive

  const folders = db.getAllChilds('folder', folder.id)
  makeParentsRelative(folder.id, folders)
  addMinimumDeep(folders)

  const datasets = getRecursive('folder', folder.id, 'dataset')
  const variables = datasets.flatMap(dataset =>
    db.getAll('variable', { dataset }),
  )

  let enumerations = variables.flatMap(variable => variable.enumerations ?? [])
  let directEnumerations = db.getAll('enumeration', { folder })
  enumerations = enumerations.concat(directEnumerations)
  enumerations = removeDuplicateById(enumerations)

  const tags = Tags.getFromEntities({ folders, datasets })
  makeParentsRelative(false, tags)
  addMinimumDeep(tags)

  const enumerationsId = new Set(enumerations.map(item => item.id))
  const variablesId = new Set(variables.map(item => item.id))
  const datasetsId = new Set(datasets.map(item => item.id))
  const foldersId = new Set(folders.map(item => item.id))

  const evolutions = db
    .getAll('evolution')
    .filter(
      evo =>
        (evo.parentEntity === 'enumeration' &&
          evo.parentEntityId &&
          enumerationsId.has(evo.parentEntityId)) ||
        (evo.entity === 'enumeration' &&
          evo.id &&
          enumerationsId.has(evo.id)) ||
        (evo.entity === 'variable' && evo.id && variablesId.has(evo.id)) ||
        (evo.entity === 'dataset' && evo.id && datasetsId.has(evo.id)) ||
        (evo.entity === 'folder' &&
          (evo.id === folder.id || foldersId.has(evo.id!))),
    )

  const stat = [
    { entity: 'folder', items: folders },
    { entity: 'tag', items: tags },
    { entity: 'doc', items: docs },
    { entity: 'dataset', items: datasets },
    { entity: 'variable', items: variables },
    { entity: 'enumeration', items: enumerations },
  ]

  const dashboard = {
    scope: { type: 'folder', id: folder.id, label: folder.name },
    entities: {
      folders: [folder, ...folders],
      tags,
      docs,
      datasets,
      variables,
      enumerations,
    },
  }

  const tabs = tabsHelper({
    folder,
    dashboard,
    folders,
    tags,
    docs,
    datasets,
    variables,
    enumerations,
    evolutions,
    stat,
  })

  const nbFolder = folders.length
  let keyTab = $state(1)
  let showOpenAllSwitch = $derived(
    $tabSelected.key === 'folders' && nbFolder > isBigLimit,
  )
  let showEvolutionSummarySwitch = $derived(
    $tabSelected.key === 'evolutions' && evolutions.length > isBigLimit,
  )
</script>

<section class="section">
  <Title type="folder" name={folder.name} id={folder.id} />
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
