<script lang="ts">
  import { onMount } from 'svelte'
  import Logs from '@lib/logs'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { tabsHelper } from '@tab/tabs-helper'
  import { checkApiAvailability } from '@lib/api-availability'
  import aboutFileEn from '@markdown/about-options.en.md?raw'
  import aboutFileFr from '@markdown/about-options.fr.md?raw'
  import { localizedMarkdown } from '@i18n/markdown'
  import { t } from '@i18n/messages'
  import type { ApiAvailability } from '@lib/api-availability'

  let logs = Logs.getAll()
  let apiAvailability = $state<ApiAvailability>({ available: false })
  let tabs = $derived(
    tabsHelper({
      options: '',
      api: apiAvailability.available ? apiAvailability : false,
      logs,
      stat: [{ entity: 'log', items: logs }],
      aboutFile: localizedMarkdown({ en: aboutFileEn, fr: aboutFileFr }),
    }),
  )

  onMount(() => {
    checkApiAvailability().then(availability => {
      apiAvailability = availability
    })
  })
</script>

<section class="section">
  <Title type="option" name={t('nav.options')} mode="mainTitle" />
  {#key apiAvailability.available}
    <Tabs {tabs} />
  {/key}
</section>
