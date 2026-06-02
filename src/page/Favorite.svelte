<script lang="ts">
  import db from '@db'
  import { makeParentsRelative, addMinimumDeep } from '@lib/db'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import aboutFile from '@markdown/about-favorite.md?raw'
  import { translate } from '@i18n/i18n'

  const organizations = db
    .getAll('organization')
    .filter(item => item.isFavorite)
  const folders = db.getAll('folder').filter(item => item.isFavorite)
  const tags = db.getAll('tag').filter(item => item.isFavorite)
  const docs = db.getAll('doc').filter(item => item.isFavorite)
  const datasets = db.getAll('dataset').filter(item => item.isFavorite)
  const variables = db.getAll('variable').filter(item => item.isFavorite)
  const enumerations = db.getAll('enumeration').filter(item => item.isFavorite)
  const evolutions = db.getAll('evolution').filter(item => item.isFavorite)

  const allFav = [
    ...organizations,
    ...folders,
    ...tags,
    ...docs,
    ...datasets,
    ...variables,
    ...enumerations,
  ]

  makeParentsRelative(false, folders)
  makeParentsRelative(false, organizations)

  addMinimumDeep(organizations, true, true)
  addMinimumDeep(folders, true, true)

  if (db.useRecursive.tag) {
    makeParentsRelative(false, tags)
    addMinimumDeep(tags, true, true)
  }

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
    allFav,
    organizations,
    folders,
    tags,
    docs,
    datasets,
    variables,
    enumerations,
    evolutions,
    stat,
    aboutFile,
  })
</script>

<section class="section">
  <Title
    type="favorite"
    name={$translate('nav.favorites')}
    isFavoritePage={true}
    mode="mainTitle"
  />
  <Tabs {tabs} />
</section>
