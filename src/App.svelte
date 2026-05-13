<script lang="ts">
  import '@src/style/from-bulma/minireset.scss'
  import '@src/style/from-bulma/generic.scss'
  import '@src/style/from-bulma/navbar.scss'
  import '@src/style/from-bulma/tabs.scss'
  import '@src/style/from-bulma/table.scss'
  import '@fortawesome/fontawesome-free/css/fontawesome.min.css'
  import '@fortawesome/fontawesome-free/css/solid.min.css'
  import 'datatables.net-bm/css/dataTables.bulma.min.css'
  import 'datatables.net-buttons-bm/css/buttons.bulma.min.css'
  import 'datatables.net-fixedcolumns-bm/css/fixedColumns.bulma.min.css'
  import 'datatables.net-fixedheader-bm/css/fixedHeader.bulma.min.css'
  import 'datatables.net-scroller-bm/css/scroller.bulma.min.css'
  import '@src/style/global.scss'
  import '@lib/viewport-manager'
  import IconSprite from '@layout/IconSprite.svelte'
  import CheckDb from '@src/app-mode/CheckDb.svelte'
  import Main from '@src/app-mode/Main.svelte'
  import { appMode } from '@lib/url'
</script>

<IconSprite />

{#if appMode === 'check_db'}
  <CheckDb />
{:else}
  <Main />
{/if}
