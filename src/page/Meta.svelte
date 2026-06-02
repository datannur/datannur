<script lang="ts">
  import db from '@db'
  import { tabsHelper } from '@tab/tabs-helper'
  import aboutFile from '@markdown/about-main-meta.md?raw'
  import { translate } from '@i18n/i18n'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'

  const metaFolders = db.getAll('metaFolder')
  const metaDatasets = db.getAll('metaDataset')
  const metaVariables = db.getAll('metaVariable')

  const stat = [
    { entity: 'folder', items: metaFolders },
    { entity: 'dataset', items: metaDatasets },
    { entity: 'variable', items: metaVariables },
  ]

  const tabs = tabsHelper({
    aboutFile,
    metaFolders,
    metaDatasets,
    metaVariables,
    metaDiagramm: '',
    checkDb: '',
    stat,
  })
</script>

<section class="section">
  <Title
    type="internalView"
    name={$translate('nav.internal')}
    mode="mainTitle"
  />
  <Tabs {tabs} />
</section>
