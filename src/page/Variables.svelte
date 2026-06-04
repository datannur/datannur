<script lang="ts">
  import db from '@db'
  import { makeParentsRelative, addMinimumDeep } from '@lib/db'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import aboutFileEn from '@markdown/about-variable.en.md?raw'
  import aboutFileFr from '@markdown/about-variable.fr.md?raw'
  import { localizedMarkdown } from '@i18n/markdown'
  import { t } from '@i18n/messages'

  const variables = db.getAll('variable')
  const tags = db.getAll('tag').filter(tag => !!tag.nbVariable)
  if (db.useRecursive.tag) {
    makeParentsRelative(false, tags)
    addMinimumDeep(tags, true, true)
  }

  const evolutions = db
    .getAll('evolution')
    .filter(evo => evo.entity === 'variable')

  const tabs = tabsHelper({
    variables,
    tags,
    evolutions,
    stat: [{ entity: 'variable', items: variables }],
    aboutFile: localizedMarkdown({ en: aboutFileEn, fr: aboutFileFr }),
  })
</script>

<section class="section">
  <Title
    type="variable"
    name={t('entityPlural.variable')}
    mode="mainTitle"
  />
  <Tabs {tabs} />
</section>
