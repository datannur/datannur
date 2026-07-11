<script lang="ts">
  import aboutStructureEn from '@markdown/about-page/structure.en.md?raw'
  import aboutStructureFr from '@markdown/about-page/structure.fr.md?raw'
  import aboutStructureDe from '@markdown/about-page/structure.de.md?raw'
  import aboutStructureIt from '@markdown/about-page/structure.it.md?raw'
  import aboutFeaturesEn from '@markdown/about-page/features.en.md?raw'
  import aboutFeaturesFr from '@markdown/about-page/features.fr.md?raw'
  import aboutFeaturesDe from '@markdown/about-page/features.de.md?raw'
  import aboutFeaturesIt from '@markdown/about-page/features.it.md?raw'
  import { localizedMarkdown } from '@i18n/markdown'
  import { getAboutMain } from '@lib/get-about-main'
  import { tabsHelper } from '@tab/tabs-helper'
  import Title from '@layout/Title.svelte'
  import Tabs from '@tab/Tabs.svelte'
  import { t } from '@i18n/messages'

  const tabs = tabsHelper({
    aboutFile: getAboutMain(),
    aboutStructure: localizedMarkdown({
      en: aboutStructureEn,
      fr: aboutStructureFr,
      de: aboutStructureDe,
      it: aboutStructureIt,
    }),
    aboutFeatures: localizedMarkdown({
      en: aboutFeaturesEn,
      fr: aboutFeaturesFr,
      de: aboutFeaturesDe,
      it: aboutFeaturesIt,
    }),
  })
</script>

<section class="section">
  <Title type="about" name={t('nav.about')} mode="mainTitle" />
  <Tabs {tabs} />
</section>
