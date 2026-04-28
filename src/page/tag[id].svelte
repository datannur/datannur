<script lang="ts">
  import { untrack } from 'svelte'
  import db from '@db'
  import { tabSelected } from '@lib/store'
  import { isBigLimit } from '@lib/constant'
  import {
    makeParentsRelative,
    addMinimumDeep,
    removeDuplicateById,
  } from '@lib/db'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper, type Tab } from '@tab/tabs-helper'
  import Title from '@layout/Title.svelte'
  import OpenAllSwitch from '@layout/OpenAllSwitch.svelte'
  import type {
    MainEntityName,
    Tag,
    Organization,
    Folder,
    Doc,
    Dataset,
    Variable,
    MainEntityMap,
  } from '@type'

  let { tag: tagProp }: { tag: Tag } = $props()
  const tag = untrack(() => tagProp)

  let opposite = $state(false)
  let tabs: Tab[] = $state([])
  let keyTab = $state(-1)

  let organizations: Organization[] = []
  let folders: Folder[] = []
  let docs: Doc[] = []
  let datasets: Dataset[] = []
  let variables: Variable[] = []
  let tags: Tag[] = []

  let withOrganizations = db.getAll('organization', { tag })
  let withFolders = db.getAll('folder', { tag })
  let withDatasets = db.getAll('dataset', { tag })
  let withVariables = db.getAll('variable', { tag })
  let withDocs = db.getAll('doc', { tag })

  const withTags = db.getAllChilds('tag', tag.id)

  for (const childTag of withTags) {
    const childOrganizations = db.getAll('organization', { tag: childTag })
    const childFolders = db.getAll('folder', { tag: childTag })
    const childDatasets = db.getAll('dataset', { tag: childTag })
    const childVariables = db.getAll('variable', { tag: childTag })
    const childDocs = db.getAll('doc', { tag: childTag })
    withOrganizations = withOrganizations.concat(childOrganizations)
    withFolders = withFolders.concat(childFolders)
    withDatasets = withDatasets.concat(childDatasets)
    withVariables = withVariables.concat(childVariables)
    withDocs = withDocs.concat(childDocs)
  }
  withOrganizations = removeDuplicateById(withOrganizations)
  withFolders = removeDuplicateById(withFolders)
  withDatasets = removeDuplicateById(withDatasets)
  withVariables = removeDuplicateById(withVariables)
  withDocs = removeDuplicateById(withDocs)

  function getOpposite<T extends MainEntityName>(
    entity: T,
    withTagItems: MainEntityMap[T][],
    selfId?: string | number,
  ) {
    if (withTagItems.length === 0) return []
    const all: MainEntityMap[T][] = []
    const ids: unknown[] = []
    for (let item of withTagItems) {
      if ('id' in item) ids.push(item.id)
    }
    for (let item of db.getAll(entity)) {
      if (ids.includes(item.id)) continue
      if (selfId && item.id === selfId) continue
      all.push(item)
    }
    return all
  }

  function loadTabs() {
    if (opposite) {
      organizations = getOpposite('organization', withOrganizations)
      folders = getOpposite('folder', withFolders)
      docs = getOpposite('doc', withDocs)
      datasets = getOpposite('dataset', withDatasets)
      variables = getOpposite('variable', withVariables)
      tags = getOpposite('tag', withTags, tag.id)
    } else {
      organizations = withOrganizations
      folders = withFolders
      docs = withDocs
      datasets = withDatasets
      variables = withVariables
      tags = withTags
    }

    makeParentsRelative(false, organizations)
    makeParentsRelative(false, folders)

    addMinimumDeep(organizations)
    addMinimumDeep(folders)

    if (db.useRecursive.tag) {
      makeParentsRelative(tag.id, tags)
      addMinimumDeep(tags)
    }

    const variablesId = new Set(variables.map(item => item.id))
    const datasetsId = new Set(datasets.map(item => item.id))
    const foldersId = new Set(folders.map(item => item.id))
    const organizationsId = new Set(organizations.map(item => item.id))

    const evolutions = db
      .getAll('evolution')
      .filter(
        evo =>
          (evo.entity === 'tag' && evo.id === tag.id) ||
          (evo.parentEntity === 'tag' && evo.parentEntityId === tag.id) ||
          (evo.entity === 'variable' && evo.id && variablesId.has(evo.id)) ||
          (evo.entity === 'dataset' && evo.id && datasetsId.has(evo.id)) ||
          (evo.entity === 'folder' && evo.id && foldersId.has(evo.id)) ||
          (evo.entity === 'organization' &&
            evo.id &&
            organizationsId.has(evo.id)),
      )

    const stat = [
      { entity: 'organization', items: organizations },
      { entity: 'folder', items: folders },
      { entity: 'doc', items: docs },
      { entity: 'dataset', items: datasets },
      { entity: 'variable', items: variables },
    ]

    tabs = tabsHelper({
      tag,
      organizations,
      folders,
      tags,
      docs,
      datasets,
      variables,
      evolutions,
      stat,
    })
  }

  let info = $derived(opposite ? '(absent)' : '(présent)')

  function toggleOpposite() {
    opposite = !opposite
    loadTabs()
  }

  loadTabs()

  let showOpenAllSwitch = $derived(
    $tabSelected.key === 'tags' && tags.length > isBigLimit,
  )
</script>

<section class="section">
  <Title
    type="tag"
    name={tag.name}
    id={tag.id}
    {info}
    toggleInfo={toggleOpposite}
  />
  {#if showOpenAllSwitch}
    <OpenAllSwitch onChange={() => keyTab++} />
  {/if}
  {#key Number(opposite) + keyTab}
    <Tabs {tabs} />
  {/key}
</section>
