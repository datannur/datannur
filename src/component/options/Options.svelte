<script lang="ts">
  import { onMount } from 'svelte'
  import { saveAs } from 'file-saver'
  import JSZip from 'jszip'
  import db from '@db'
  import { UrlParam } from '@lib/url'
  import { pageContentLoaded } from '@router/router-store'
  import Options from '@lib/options'
  import Logs from '@lib/logs'
  import Favorites from '@favorite/favorites'
  import SearchHistory from '@search/search-history'
  import Icon from '@layout/Icon.svelte'
  import { resetColsSearchCache } from '@lib/util'
  import { getUserData } from '@lib/user-data'
  import Switch from '@layout/Switch.svelte'
  import DarkModeSwitch from '@dark-mode/DarkModeSwitch.svelte'
  import BtnImport from '@layout/BtnImport.svelte'
  import Button from '@layout/Button.svelte'
  import LanguageSelect from '@i18n/LanguageSelect.svelte'
  import { translate } from '@i18n/i18n'
  import type { Row } from '@type'

  async function importUserData(zipFile: File) {
    const jszip = new JSZip()
    const zip = await jszip.loadAsync(zipFile)
    for (const file of Object.values(zip.files)) {
      if (file.dir) continue
      const key = file.name.split('.json')[0]
      const content = await file.async('text')
      const data = JSON.parse(content) as Row[]
      db.browser.set(key, data)
    }
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  async function downloadUserData() {
    const jszip = new JSZip()
    const dataFolder = jszip.folder('user-data')
    const userData = getUserData()
    for (const [name, data] of Object.entries(!!userData)) {
      const filename = name + '.json'
      const jsonData = JSON.stringify(data, null, 2)
      dataFolder?.file(filename, jsonData)
    }
    jszip.generateAsync({ type: 'blob' }).then(function (content) {
      saveAs(content, 'datannur-user-data.zip')
    })
  }

  let openAllRecursive = $state(Options.get('openAllRecursive')) as boolean
  function updateOpenAllRecursive() {
    Options.set('openAllRecursive', openAllRecursive)
  }

  let evolutionSummary = $state(Options.get('evolutionSummary')) as boolean
  function updateEvolutionSummary() {
    Options.set('evolutionSummary', evolutionSummary)
  }

  let openAllTab = $state(Options.get('openAllTab')) as boolean
  function updateOpenAllTab() {
    Options.set('openAllTab', openAllTab)
  }

  let roundedDesign = $state(Options.get('roundedDesign')) as boolean
  function updateRoundedDesign() {
    Options.set('roundedDesign', roundedDesign)
    document.documentElement.classList.toggle('roundedDesign')
  }

  let pageShadowColored = $state(Options.get('pageShadowColored')) as boolean
  function updatePageShadowColored() {
    Options.set('pageShadowColored', pageShadowColored)
    document.documentElement.classList.toggle('pageShadowColored')
  }

  function clearLogs() {
    Logs.clear()
    location.reload()
  }
  function clearFavorite() {
    Favorites.clear()
    location.reload()
  }
  function clearHistorySearch() {
    SearchHistory.clear()
  }
  function clearAll() {
    db.browser.clear()
    resetColsSearchCache()
    UrlParam.reset()
    location.reload()
  }

  onMount(() => {
    $pageContentLoaded = true
  })
</script>

<div class="flex-cols">
  <div class="flex-col">
    <h5 class="title is-5">{$translate('options.display')}</h5>
    <Switch
      bind:value={openAllRecursive}
      change={updateOpenAllRecursive}
      treeSwitch={true}
    >
      {$translate('options.openNested')}
    </Switch>
    <Switch
      bind:value={evolutionSummary}
      change={updateEvolutionSummary}
      treeSwitch={true}
      minimize={true}
    >
      {$translate('options.evolutionSummary')}
    </Switch>
    <Switch bind:value={openAllTab} change={updateOpenAllTab}>
      {$translate('options.openAllTabs')}
    </Switch>
    <Switch bind:value={roundedDesign} change={updateRoundedDesign}>
      {$translate('options.roundedDesign')}
    </Switch>
    <Switch bind:value={pageShadowColored} change={updatePageShadowColored}>
      {$translate('options.pageShadowColored')}
    </Switch>
    <div>
      <DarkModeSwitch label={$translate('options.darkMode')} />
    </div>
    <LanguageSelect label={$translate('language.label')} />
  </div>

  <div class="flex-col">
    <h5 class="title is-5">{$translate('options.reset')}</h5>
    <Button onclick={clearLogs}>
      {$translate('options.logs')} <Icon type="log" marginLeft={true} />
    </Button>
    <Button onclick={clearFavorite}>
      {$translate('nav.favorites')} <Icon type="favorite" marginLeft={true} />
    </Button>
    <Button onclick={resetColsSearchCache}>
      {$translate('options.columnFilters')} <Icon type="colSearch" marginLeft={true} />
    </Button>
    <Button onclick={clearHistorySearch}>
      {$translate('options.recentSearches')} <Icon type="recentSearch" marginLeft={true} />
    </Button>
    <Button onclick={clearAll}>{$translate('options.all')}</Button>
  </div>

  <div class="flex-col">
    <h5 class="title is-5">{$translate('options.userData')}</h5>
    <Button onclick={downloadUserData}>
      {$translate('options.export')} <Icon type="download" marginLeft={true} />
    </Button>
    <BtnImport onImport={importUserData}>
      {$translate('options.import')} <Icon type="upload" marginLeft={true} />
    </BtnImport>
  </div>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .flex-cols {
    padding: 3rem 3rem;
    justify-content: center;
  }

  .title {
    text-align: center;
  }

  @include viewport-small-mobile {
    .flex-cols {
      padding: 10px;
    }
  }
</style>
