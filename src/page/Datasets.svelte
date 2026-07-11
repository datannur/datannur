<script lang="ts">
  import db from '@db'
  import { makeParentsRelative, addMinimumDeep } from '@lib/db'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import aboutFileEn from '@markdown/about-dataset.en.md?raw'
  import aboutFileFr from '@markdown/about-dataset.fr.md?raw'
  import aboutFileDe from '@markdown/about-dataset.de.md?raw'
  import aboutFileIt from '@markdown/about-dataset.it.md?raw'
  import { localizedMarkdown } from '@i18n/markdown'
  import { t } from '@i18n/messages'

  const datasets = db.getAll('dataset')
  const tags = db.getAll('tag').filter(tag => !!tag.nbDataset)
  if (db.useRecursive.tag) {
    makeParentsRelative(false, tags)
    addMinimumDeep(tags, true, true)
  }

  const evolutions = db
    .getAll('evolution')
    .filter(evo => evo.entity === 'dataset')

  const tabs = tabsHelper({
    datasets,
    tags,
    evolutions,
    stat: [{ entity: 'dataset', items: datasets }],
    aboutFile: localizedMarkdown({ en: aboutFileEn, fr: aboutFileFr, de: aboutFileDe, it: aboutFileIt }),
  })
</script>

<section class="section">
  <Title
    type="dataset"
    name={t('entityPlural.dataset')}
    mode="mainTitle"
  />
  <Tabs {tabs} />
</section>
