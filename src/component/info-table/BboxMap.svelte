<script lang="ts">
  import { t } from '@i18n/messages'
  import { loadWorldMap } from '@lib/world-map-loader'

  let { bbox }: { bbox: number[] } = $props()

  const aspect = 2 // map width : height
  const minSpan = 22 // minimum longitude span (deg) so small extents keep context

  let worldPath = $state<string | null>(null)
  $effect(() => {
    loadWorldMap().then(path => (worldPath = path))
  })

  // bbox = [west, south, east, north] in WGS84 lon/lat
  // viewBox space: x = lon + 180 (0..360), y = 90 - lat (0..180)
  const view = $derived.by(() => {
    if (
      !Array.isArray(bbox) ||
      bbox.length !== 4 ||
      !bbox.every(n => typeof n === 'number' && Number.isFinite(n))
    )
      return null
    const [west, south, east, north] = bbox
    const bw = Math.max(east - west, 0)
    const bh = Math.max(north - south, 0)
    const cx = (west + east) / 2
    const cy = (south + north) / 2

    // frame the extent with padding, floored to minSpan and clamped to the world
    let spanLon = Math.min(Math.max(bw * 2.6, bh * 2.6 * aspect, minSpan), 360)
    const spanLat = Math.min(spanLon / aspect, 180)
    spanLon = Math.min(spanLat * aspect, 360)

    const minX = Math.min(Math.max(cx + 180 - spanLon / 2, 0), 360 - spanLon)
    const minY = Math.min(Math.max(90 - cy - spanLat / 2, 0), 180 - spanLat)

    return {
      viewBox: `${minX} ${minY} ${spanLon} ${spanLat}`,
      ocean: { x: minX, y: minY, w: spanLon, h: spanLat },
      rect: { x: west + 180, y: 90 - north, w: bw, h: bh, r: spanLon * 0.01 },
      dot: { cx: west + 180 + bw / 2, cy: 90 - north + bh / 2, r: spanLon * 0.02 },
      isDot: Math.max(bw, bh) < spanLon * 0.06,
    }
  })
</script>

{#if view}
  <figure class="bbox-map">
    <svg viewBox={view.viewBox} role="img" aria-label={t('column.geo.tooltip')}>
      <rect
        class="ocean"
        x={view.ocean.x}
        y={view.ocean.y}
        width={view.ocean.w}
        height={view.ocean.h}
      />
      {#if worldPath}
        <path class="land" d={worldPath} />
      {/if}
      {#if view.isDot}
        <circle class="extent" cx={view.dot.cx} cy={view.dot.cy} r={view.dot.r} />
      {:else}
        <rect
          class="extent"
          x={view.rect.x}
          y={view.rect.y}
          width={view.rect.w}
          height={view.rect.h}
          rx={view.rect.r}
        />
      {/if}
    </svg>
  </figure>
{/if}

<style lang="scss">
  @use 'main.scss' as *;

  .bbox-map {
    margin: 0.75rem 0 0;
    max-width: 440px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
    border: 1px solid rgba(128, 128, 128, 0.3);
    border-radius: $rounded;
    overflow: hidden;
  }
  .ocean {
    fill: currentColor;
    fill-opacity: 0.05;
  }
  .land {
    fill: currentColor;
    fill-opacity: 0.14;
    stroke: currentColor;
    stroke-opacity: 0.25;
    stroke-width: 0.6px;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .extent {
    fill: #5e9381;
    fill-opacity: 0.4;
    stroke: #5e9381;
    stroke-width: 1.5px;
    vector-effect: non-scaling-stroke;
    paint-order: stroke;
  }
</style>
