<script lang="ts">
  import Logs from '@lib/logs'
  import { DarkMode, darkModeTheme } from '@dark-mode/dark-mode'
  import { translate } from '@i18n/i18n'

  let { label = '' }: { label?: string } = $props()

  let id = window.crypto.randomUUID()

  function toggle(event: MouseEvent) {
    const button = event.currentTarget
    DarkMode.toggle(button instanceof HTMLElement ? button : undefined)
    if ($darkModeTheme === 'dark') Logs.add('toggleDarkModeBtnOff')
    else Logs.add('toggleDarkModeBtnOn')
  }

  let day = $derived($darkModeTheme === 'dark' ? '' : 'day')
  let sun = $derived($darkModeTheme === 'dark' ? '' : 'sun')
</script>

<button
  id="checkbox_{id}"
  onclick={toggle}
  class="tdnn {day}"
  aria-label={$translate('options.darkMode')}
>
  <div class="moon {sun}"></div>
</button>

{#if label}
  <label for="checkbox_{id}">{label}</label>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .tdnn {
    --toggleHeight: 16em;
    --toggleWidth: 30em;
    --toggleBtnRadius: 10em;
    --bgColor--night: #333; //#423966;
    --bgColor--day: #bbb; // #ffbf71;
    --mooncolor: #d9fbff;
    --suncolor: #fff; // #fce570;
    --moonstar--opacity: 0.3;

    cursor: pointer;
    margin: 0 auto;
    vertical-align: middle;
    /*change size of toggle with font-size*/
    font-size: 10%;
    position: relative;
    height: var(--toggleHeight);
    width: var(--toggleWidth);
    border-radius: var(--toggleHeight);
    transition: all 780ms cubic-bezier(0.33, 1, 0.68, 1);
    background: var(--bgColor--night);
    view-transition-name: none;
  }
  .day {
    background: var(--bgColor--day);
  }
  .moon {
    position: absolute;
    display: block;
    border-radius: 50%;
    transition: all 780ms cubic-bezier(0.33, 1, 0.68, 1);
    top: 3em;
    left: 3em;
    transform: rotate(-75deg);
    width: var(--toggleBtnRadius);
    height: var(--toggleBtnRadius);
    background: var(--bgColor--night);
    box-shadow:
      3em 2.5em 0 0em var(--mooncolor) inset,
      rgba(255, 255, 255, var(--moonstar--opacity)) 0em -7em 0 -4.5em,
      rgba(255, 255, 255, var(--moonstar--opacity)) 3em 7em 0 -4.5em,
      rgba(255, 255, 255, var(--moonstar--opacity)) 2em 13em 0 -4em,
      rgba(255, 255, 255, var(--moonstar--opacity)) 6em 2em 0 -4.1em,
      rgba(255, 255, 255, var(--moonstar--opacity)) 8em 8em 0 -4.5em,
      rgba(255, 255, 255, var(--moonstar--opacity)) 6em 13em 0 -4.5em,
      rgba(255, 255, 255, var(--moonstar--opacity)) -4em 7em 0 -4.5em,
      rgba(255, 255, 255, var(--moonstar--opacity)) -1em 10em 0 -4.5em;
  }
  .sun {
    top: 4.5em;
    left: 18em;
    transform: rotate(0deg);
    width: 7em;
    height: 7em;
    background: var(--suncolor);
    box-shadow:
      3em 3em 0 5em var(--suncolor) inset,
      0 -5em 0 -2.7em var(--suncolor),
      3.5em -3.5em 0 -3em var(--suncolor),
      5em 0 0 -2.7em var(--suncolor),
      3.5em 3.5em 0 -3em var(--suncolor),
      0 5em 0 -2.7em var(--suncolor),
      -3.5em 3.5em 0 -3em var(--suncolor),
      -5em 0 0 -2.7em var(--suncolor),
      -3.5em -3.5em 0 -3em var(--suncolor);
  }

  label {
    cursor: pointer;
    padding-left: 0.3rem;
  }

  :global(::view-transition-old(root)),
  :global(::view-transition-new(root)) {
    animation-duration: 780ms;
    animation-timing-function: cubic-bezier(0.33, 1, 0.68, 1);
  }

  :global(::view-transition-new(root)) {
    animation-name: dark-mode-fade-in;
  }

  @keyframes -global-dark-mode-fade-in {
    from {
      clip-path: circle(
        0 at var(--dark-mode-transition-x, 100%)
          var(--dark-mode-transition-y, 100%)
      );
    }
    to {
      clip-path: circle(
        150% at var(--dark-mode-transition-x, 100%)
          var(--dark-mode-transition-y, 100%)
      );
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(::view-transition-group(*)) {
      animation-duration: 1ms;
    }
  }
</style>
