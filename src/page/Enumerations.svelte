<script lang="ts">
  import db from '@db'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import aboutFileEn from '@markdown/about-enumeration.en.md?raw'
  import aboutFileFr from '@markdown/about-enumeration.fr.md?raw'
  import { localizedMarkdown } from '@i18n/markdown'
  import { t } from '@i18n/messages'

  const enumerations = db.getAll('enumeration')
  const evolutions = db
    .getAll('evolution')
    .filter(evo => evo.entity === 'enumeration' || evo.entity === 'value')

  const tabs = tabsHelper({
    enumerations,
    enumerationsCompare: enumerations.length > 1,
    evolutions,
    stat: [{ entity: 'enumeration', items: enumerations }],
    aboutFile: localizedMarkdown({ en: aboutFileEn, fr: aboutFileFr }),
  })
</script>

<section class="section">
  <Title
    type="enumeration"
    name={t('entityPlural.enumeration')}
    mode="mainTitle"
  />
  <Tabs {tabs} />
</section>
