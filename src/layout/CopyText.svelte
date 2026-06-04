<script lang="ts">
  import { copyTextClasses, getCopyTextMsg } from '@lib/copy-text'

  let { text }: { text: string | number | undefined } = $props()
</script>

<span class={copyTextClasses} title={getCopyTextMsg()}>{text}</span>
