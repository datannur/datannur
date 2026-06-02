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
  import aboutFile from '@markdown/about-concept.md?raw'
  import { translate } from '@i18n/i18n'

  let keyTab = $state(1)

  const concepts = db.getAll('concept')
  if (db.useRecursive.concept) {
    makeParentsRelative(false, concepts)
    addMinimumDeep(concepts)
  }

  const evolutions = db
    .getAll('evolution')
    .filter(evo => evo.entity === 'concept')

  const tabs = tabsHelper({
    concepts,
    evolutions,
    stat: [{ entity: 'concept', items: concepts }],
    aboutFile,
  })

  const nbConcepts = concepts.length
  let showOpenAllSwitch = $derived(
    $tabSelected.key === 'concepts' && nbConcepts > isBigLimit,
  )
  let showEvolutionSummarySwitch = $derived(
    $tabSelected.key === 'evolutions' && evolutions.length > isBigLimit,
  )
</script>

<section class="section">
  <Title
    type="concept"
    name={$translate('entityPlural.concept')}
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
