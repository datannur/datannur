<script lang="ts">
  import db from '@db'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import aboutFileEn from '@markdown/about-doc.en.md?raw'
  import aboutFileFr from '@markdown/about-doc.fr.md?raw'
  import aboutFileDe from '@markdown/about-doc.de.md?raw'
  import { localizedMarkdown } from '@i18n/markdown'
  import { t } from '@i18n/messages'

  const docs = db.getAll('doc')

  const evolutions = db.getAll('evolution').filter(evo => evo.entity === 'doc')

  const tabs = tabsHelper({
    docs,
    evolutions,
    stat: [{ entity: 'doc', items: docs }],
    aboutFile: localizedMarkdown({ en: aboutFileEn, fr: aboutFileFr, de: aboutFileDe }),
  })
</script>

<section class="section">
  <Title type="doc" name={t('entityPlural.doc')} mode="mainTitle" />
  <Tabs {tabs} />
</section>
