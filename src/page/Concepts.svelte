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
  import aboutFileEn from '@markdown/about-concept.en.md?raw'
  import aboutFileFr from '@markdown/about-concept.fr.md?raw'
  import aboutFileDe from '@markdown/about-concept.de.md?raw'
  import aboutFileIt from '@markdown/about-concept.it.md?raw'
  import { localizedMarkdown } from '@i18n/markdown'
  import { t } from '@i18n/messages'

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
    aboutFile: localizedMarkdown({ en: aboutFileEn, fr: aboutFileFr, de: aboutFileDe, it: aboutFileIt }),
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
    name={t('entityPlural.concept')}
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
