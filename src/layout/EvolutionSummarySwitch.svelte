<script lang="ts">
  import Switch from '@layout/Switch.svelte'
  import Options from '@lib/options'
  import { t } from '@i18n/messages'

  let { onChange = () => {} }: { onChange: () => void } = $props()

  let evolutionSummary = $state(Options.get('evolutionSummary') as boolean)

  function updateEvolutionSummary() {
    Options.set('evolutionSummary', evolutionSummary, () => onChange())
  }
</script>

<div
  class="evolution-summary-wrapper use-tooltip"
  title={t('options.evolutionSummary')}
>
  <Switch
    bind:value={evolutionSummary}
    change={updateEvolutionSummary}
    slotPosition="left"
    treeSwitch={true}
    minimize={true}
    size="small"
  ></Switch>
</div>

<style lang="scss">
  @use 'main.scss' as *;

  .evolution-summary-wrapper {
    position: absolute;
    top: 135px;
    right: 0px;
    z-index: 2;
  }

  @include viewport-small-mobile {
    .evolution-summary-wrapper {
      top: 40px;
      left: 5px;
      right: auto;
    }
  }
</style>
