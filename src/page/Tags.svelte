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
  import aboutFile from '@markdown/about-tag.md?raw'
  import { translate } from '@i18n/i18n'

  let keyTab = $state(1)

  const tags = db.getAll('tag')
  if (db.useRecursive.tag) {
    makeParentsRelative(false, tags)
    addMinimumDeep(tags)
  }

  const evolutions = db.getAll('evolution').filter(evo => evo.entity === 'tag')

  const tabs = tabsHelper({
    tags,
    evolutions,
    stat: [{ entity: 'tag', items: tags }],
    aboutFile,
  })

  const nbTags = tags.length
  let showOpenAllSwitch = $derived(
    $tabSelected.key === 'tags' && nbTags > isBigLimit,
  )
  let showEvolutionSummarySwitch = $derived(
    $tabSelected.key === 'evolutions' && evolutions.length > isBigLimit,
  )
</script>

<section class="section">
  <Title type="tag" name={$translate('entityPlural.tag')} mode="mainTitle" />
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
