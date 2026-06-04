<script lang="ts">
  import db from '@db'
  import { tabsHelper } from '@tab/tabs-helper'
  import aboutFileEn from '@markdown/about-main-meta.en.md?raw'
  import aboutFileFr from '@markdown/about-main-meta.fr.md?raw'
  import { localizedMarkdown } from '@i18n/markdown'
  import { t } from '@i18n/messages'
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
    aboutFile: localizedMarkdown({ en: aboutFileEn, fr: aboutFileFr }),
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
    name={t('nav.internal')}
    mode="mainTitle"
  />
  <Tabs {tabs} />
</section>
