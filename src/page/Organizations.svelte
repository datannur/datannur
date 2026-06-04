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
  import aboutFileEn from '@markdown/about-organization.en.md?raw'
  import aboutFileFr from '@markdown/about-organization.fr.md?raw'
  import { localizedMarkdown } from '@i18n/markdown'
  import { t } from '@i18n/messages'

  let keyTab = $state(1)

  const organizations = db.getAll('organization')
  makeParentsRelative(false, organizations)
  addMinimumDeep(organizations)

  const tags = db.getAll('tag').filter(tag => !!tag.nbOrganization)
  if (db.useRecursive.tag) {
    makeParentsRelative(false, tags)
    addMinimumDeep(tags, true, true)
  }

  const evolutions = db
    .getAll('evolution')
    .filter(evo => evo.entity === 'organization')

  const tabs = tabsHelper({
    organizations,
    tags,
    evolutions,
    stat: [{ entity: 'organization', items: organizations }],
    aboutFile: localizedMarkdown({ en: aboutFileEn, fr: aboutFileFr }),
  })

  const nbOrganization = organizations.length

  let showOpenAllSwitch = $derived(
    $tabSelected.key === 'organizations' && nbOrganization > isBigLimit,
  )
  let showEvolutionSummarySwitch = $derived(
    $tabSelected.key === 'evolutions' && evolutions.length > isBigLimit,
  )
</script>

<section class="section">
  <Title
    type="organization"
    name={t('entityPlural.organization')}
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
