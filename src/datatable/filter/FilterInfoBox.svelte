<script lang="ts">
  let {
    nbActiveFilter = 0,
    click,
  }: {
    nbActiveFilter?: number
    click?: (event: MouseEvent) => void
  } = $props()
</script>

{#if nbActiveFilter > 0}
  <button class="filter-info-box" onclick={click}>
    {nbActiveFilter} filtre{nbActiveFilter > 1 ? 's' : ''}
    actif{nbActiveFilter > 1 ? 's' : ''}
    <i class="close-btn fa-solid fa-xmark"></i>
  </button>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .filter-info-box {
    position: absolute;
    font-size: 12px;
    top: 35px;
    left: -45px;
    width: 40px;
    padding: 3px;
    text-align: center;
    line-height: 14px;
    font-style: italic;
    cursor: pointer;
    transition: $transition-basic-1;
    border: 1px solid transparent;
    background: transparent;
    .close-btn {
      opacity: 0;
      position: absolute;
      color: rgba(198, 105, 94, 0.5);
      font-size: 30px;
      top: 8px;
      left: 0;
      right: 0;
      z-index: 1;
      transition: $transition-basic-1;
    }
    :global(html.roundedDesign) & {
      border-radius: 10px;
    }
    &:hover {
      border: 1px solid rgba(198, 105, 94, 1);
      background: rgba(198, 105, 94, 0.2);
      .close-btn {
        opacity: 1;
      }
    }
  }

  @include viewport-small-mobile {
    .filter-info-box {
      position: fixed;
      top: 5px;
      left: calc(50% - 20px);
      z-index: 50;
    }
  }
</style>
