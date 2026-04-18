<script lang="ts">
  import db from '@db'
  import { tabSelected } from '@lib/store'
  import { makeParentsRelative, addMinimumDeep } from '@lib/db'
  import { isBigLimit } from '@lib/constant'
  import { tabsHelper } from '@tab/tabs-helper'
  import { getAboutMain } from '@lib/get-about-main'
  import Head from '@frame/Head.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import OpenAllSwitch from '@layout/OpenAllSwitch.svelte'
  import EvolutionSummarySwitch from '@layout/EvolutionSummarySwitch.svelte'

  let keyTab = $state(1)

  let institutions = db.getAll('institution')
  let folders = db.getAll('folder')
  let tags = db.getAll('tag')
  let concepts = db.getAll('concept')
  const datasets = db.getAll('dataset')
  const variables = db.getAll('variable')
  const modalities = db.getAll('modality')
  const docs = db.getAll('doc')
  const evolutions = db.getAll('evolution')

  makeParentsRelative(false, institutions)
  makeParentsRelative(false, folders)
  addMinimumDeep(institutions)
  addMinimumDeep(folders)

  if (db.useRecursive.tag) {
    makeParentsRelative(false, tags)
    addMinimumDeep(tags)
  }
  if (db.useRecursive.concept) {
    makeParentsRelative(false, concepts)
    addMinimumDeep(concepts)
  }

  const stat = [
    { entity: 'institution', items: institutions },
    { entity: 'folder', items: folders },
    { entity: 'tag', items: tags },
    { entity: 'concept', items: concepts },
    { entity: 'doc', items: docs },
    { entity: 'dataset', items: datasets },
    { entity: 'variable', items: variables },
    { entity: 'modality', items: modalities },
  ]

  let tabs = tabsHelper({
    aboutFile: getAboutMain(),
    institutions,
    folders,
    tags,
    concepts,
    docs,
    datasets,
    variables,
    modalities,
    evolutions,
    stat,
  })

  const allEmpty =
    !db.use.institution &&
    !db.use.folder &&
    !db.use.tag &&
    !db.use.concept &&
    !db.use.doc &&
    !db.use.dataset &&
    !db.use.variable &&
    !db.use.modality

  const nbInstitution = institutions.length
  const nbFolder = folders.length
  const nbTag = tags.length
  const nbConcept = concepts.length

  let showOpenAllSwitch = $derived(
    ($tabSelected.key === 'institutions' && nbInstitution > isBigLimit) ||
      ($tabSelected.key === 'folders' && nbFolder > isBigLimit) ||
      ($tabSelected.key === 'tags' && nbTag > isBigLimit) ||
      ($tabSelected.key === 'concepts' && nbConcept > isBigLimit),
  )

  let showEvolutionSummarySwitch = $derived(
    $tabSelected.key === 'evolutions' && evolutions.length > isBigLimit,
  )
</script>

<Head title="datannur | Accueil" description="Page d'accueil de datannur" />

<section class="section">
  {#if allEmpty}
    <p class="has-text-centered">Le catalogue est vide.</p>
    <p class="has-text-centered">Vous pouvez ajouter du contenu.</p>
  {:else}
    {#if showOpenAllSwitch}
      <OpenAllSwitch onChange={() => keyTab++} />
    {/if}
    {#if showEvolutionSummarySwitch}
      <EvolutionSummarySwitch onChange={() => keyTab++} />
    {/if}
    {#key keyTab}
      <Tabs {tabs} />
    {/key}
  {/if}
</section>

<style lang="scss">
  .section {
    margin-top: 80px;
  }
</style>
