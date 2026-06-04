<script lang="ts">
  import db from '@db'
  import { tabSelected } from '@lib/store'
  import { makeParentsRelative, addMinimumDeep } from '@lib/db'
  import { isBigLimit } from '@lib/constant'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import OpenAllSwitch from '@layout/OpenAllSwitch.svelte'
  import EvolutionSummarySwitch from '@layout/EvolutionSummarySwitch.svelte'
  import aboutFileEn from '@markdown/about-folder.en.md?raw'
  import aboutFileFr from '@markdown/about-folder.fr.md?raw'
  import { localizedMarkdown } from '@i18n/markdown'
  import { t } from '@i18n/messages'

  const folders = db.getAll('folder')
  makeParentsRelative(false, folders)
  addMinimumDeep(folders)

  const tags = db.getAll('tag').filter(tag => !!tag.nbFolder)
  if (db.useRecursive.tag) {
    makeParentsRelative(false, tags)
    addMinimumDeep(tags, true, true)
  }

  const evolutions = db
    .getAll('evolution')
    .filter(evo => evo.entity === 'folder')

  const tabs = tabsHelper({
    folders,
    tags,
    evolutions,
    stat: [{ entity: 'folder', items: folders }],
    aboutFile: localizedMarkdown({ en: aboutFileEn, fr: aboutFileFr }),
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
  <Title
    type="folder"
    name={t('entityPlural.folder')}
    mode="mainTitle"
  />
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
