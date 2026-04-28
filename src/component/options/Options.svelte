<script lang="ts">
  import { onMount } from 'svelte'
  import { saveAs } from 'file-saver'
  import JSZip from 'jszip'
  import db from '@db'
  import { pageContentLoaded, UrlParam } from 'svelte-fileapp'
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
    <h5 class="title is-5">Affichage</h5>
    <Switch
      bind:value={openAllRecursive}
      change={updateOpenAllRecursive}
      treeSwitch={true}
    >
      Afficher les éléments imbriqués (organisations et dossiers)
    </Switch>
    <Switch
      bind:value={evolutionSummary}
      change={updateEvolutionSummary}
      treeSwitch={true}
      minimize={true}
    >
      Afficher les évolultions de façon résumée
    </Switch>
    <Switch bind:value={openAllTab} change={updateOpenAllTab}>
      Charger tous les onglets automatiquement
    </Switch>
    <Switch bind:value={roundedDesign} change={updateRoundedDesign}>
      Design arrondi
    </Switch>
    <Switch bind:value={pageShadowColored} change={updatePageShadowColored}>
      mode néon (onglets colorés)
    </Switch>
    <div>
      <DarkModeSwitch label="Mode sombre" />
    </div>
  </div>

  <div class="flex-col">
    <h5 class="title is-5">Réinitialiser</h5>
    <Button onclick={clearLogs}>
      Logs <Icon type="log" marginLeft={true} />
    </Button>
    <Button onclick={clearFavorite}>
      Favoris <Icon type="favorite" marginLeft={true} />
    </Button>
    <Button onclick={resetColsSearchCache}>
      Filtres de colonne <Icon type="colSearch" marginLeft={true} />
    </Button>
    <Button onclick={clearHistorySearch}>
      Recherches récentes <Icon type="recentSearch" marginLeft={true} />
    </Button>
    <Button onclick={clearAll}>Tout</Button>
  </div>

  <div class="flex-col">
    <h5 class="title is-5">Mes données utilisateur</h5>
    <Button onclick={downloadUserData}>
      Exporter <Icon type="download" marginLeft={true} />
    </Button>
    <BtnImport onImport={importUserData}>
      Importer <Icon type="upload" marginLeft={true} />
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

  :global(body.small-mobile) {
    .flex-cols {
      padding: 10px;
    }
  }
</style>
