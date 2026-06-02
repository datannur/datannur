<script lang="ts">
  import aboutStructure from '@markdown/about-page/structure.md?raw'
  import aboutFeatures from '@markdown/about-page/features.md?raw'
  import { getAboutMain } from '@lib/get-about-main'
  import { tabsHelper } from '@tab/tabs-helper'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { translate } from '@i18n/i18n'

  const tabs = tabsHelper({
    aboutFile: getAboutMain(),
    aboutStructure,
    aboutFeatures,
  })
</script>

<section class="section">
  <Title type="about" name={$translate('nav.about')} mode="mainTitle" />
  <Tabs {tabs} />
</section>
