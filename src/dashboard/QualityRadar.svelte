<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import type { DashboardGlobalScore, DashboardScore } from './dashboard-types'

  type RadarPoint = {
    x: number
    y: number
  }

  const size = 280
  const center = size / 2
  const maxRadius = 104
  const gridSteps = [25, 50, 75, 100]

  let {
    dimensions,
    globalScore,
  }: {
    dimensions: DashboardScore[]
    globalScore: DashboardGlobalScore
  } = $props()

  const axes = $derived(dimensions)
  const angleStep = $derived(axes.length > 0 ? (Math.PI * 2) / axes.length : 0)
  const gridPolygons = $derived(
    gridSteps.map(step => pointsToString(getPolygonPoints(step))),
  )
  const scorePolygon = $derived(pointsToString(getScorePoints()))

  function getPoint(
    index: number,
    value: number,
    radius = maxRadius,
  ): RadarPoint {
    const angle = -Math.PI / 2 + index * angleStep
    const distance = radius * (Math.max(0, Math.min(value, 100)) / 100)
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    }
  }

  function getPolygonPoints(value: number): RadarPoint[] {
    return axes.map((axis, index) => {
      void axis
      return getPoint(index, value)
    })
  }

  function getScorePoints(): RadarPoint[] {
    return axes.map((axis, index) => getPoint(index, axis.score))
  }

  function pointsToString(points: RadarPoint[]): string {
    return points.map(point => `${point.x},${point.y}`).join(' ')
  }

  function scoreLevel(score: number): 'low' | 'medium' | 'high' {
    if (score < 50) return 'low'
    if (score < 80) return 'medium'
    return 'high'
  }

  function labelStyle(index: number): string {
    const angle = -Math.PI / 2 + index * angleStep
    const radius = 42
    const x = 50 + Math.cos(angle) * radius
    const y = 50 + Math.sin(angle) * radius
    return `left: ${x}%; top: ${y}%;`
  }
</script>

<div class="quality-radar" aria-label="Score qualité par dimension">
  <svg class="radar-svg" viewBox="0 0 {size} {size}" role="img">
    <title>{globalScore.label}: {globalScore.score} sur 100</title>
    {#each gridPolygons as polygon, index (index)}
      <polygon class="radar-grid" points={polygon} />
    {/each}
    {#each axes as axis, index (axis.key)}
      {@const end = getPoint(index, 100)}
      <line class="radar-axis" x1={center} y1={center} x2={end.x} y2={end.y} />
    {/each}
    {#if axes.length > 2}
      <polygon
        class="radar-score-fill {scoreLevel(globalScore.score)}"
        points={scorePolygon}
      />
      <polygon
        class="radar-score-line {scoreLevel(globalScore.score)}"
        points={scorePolygon}
      />
      {#each axes as axis, index (axis.key)}
        {@const point = getPoint(index, axis.score)}
        <circle
          class="radar-score-point {scoreLevel(axis.score)}"
          cx={point.x}
          cy={point.y}
          r="3"
        />
      {/each}
    {/if}
    <circle class="radar-center" cx={center} cy={center} r="35" />
    <text
      class="radar-score {scoreLevel(globalScore.score)}"
      x={center}
      y={center - 3}
      text-anchor="middle"
    >
      {globalScore.score}
    </text>
    <text
      class="radar-score-total"
      x={center}
      y={center + 18}
      text-anchor="middle"
    >
      / 100
    </text>
  </svg>
  {#each axes as axis, index (axis.key)}
    <div class="radar-label" style={labelStyle(index)}>
      <Icon type={axis.key} mode="compact" />
      <span>{axis.label}</span>
    </div>
  {/each}
</div>

<style lang="scss">
  @use 'main.scss' as *;

  $score-low: #c6695e;
  $score-medium: #d4a930;
  $score-high: $color-3;

  .quality-radar {
    position: relative;
    width: min(100%, 420px);
    margin: 0 auto;
    aspect-ratio: 1;
  }

  .radar-svg {
    position: absolute;
    inset: 17%;
    width: 66%;
    height: 66%;
    display: block;
    overflow: visible;
  }

  .radar-grid,
  .radar-axis {
    fill: none;
    stroke: $color-5;
    stroke-width: 1;
  }

  .radar-axis {
    opacity: 0.75;
  }

  .radar-score-fill {
    fill: $score-high;
    fill-opacity: 0.18;
  }

  .radar-score-fill.low {
    fill: $score-low;
  }

  .radar-score-fill.medium {
    fill: $score-medium;
  }

  .radar-score-fill.high {
    fill: $score-high;
  }

  .radar-score-line {
    fill: none;
    stroke: $score-high;
    stroke-width: 3;
    stroke-linejoin: round;
  }

  .radar-score-line.low {
    stroke: $score-low;
  }

  .radar-score-line.medium {
    stroke: $score-medium;
  }

  .radar-score-line.high {
    stroke: $score-high;
  }

  .radar-score-point {
    fill: $score-high;
    stroke: $background-2;
    stroke-width: 2;
  }

  .radar-score-point.low {
    fill: $score-low;
  }

  .radar-score-point.medium {
    fill: $score-medium;
  }

  .radar-score-point.high {
    fill: $score-high;
  }

  .radar-center {
    fill: $background-2;
    fill-opacity: 0.78;
    stroke: $color-5;
    stroke-opacity: 0.8;
  }

  .radar-score {
    fill: $score-high;
    font-size: 1.55rem;
    font-weight: 800;
  }

  .radar-score.low {
    fill: $score-low;
  }

  .radar-score.medium {
    fill: $score-medium;
  }

  .radar-score.high {
    fill: $score-high;
  }

  .radar-score-total {
    fill: $color-2;
    font-weight: 700;
  }

  .radar-score-total {
    font-size: 0.78rem;
  }

  .radar-label {
    position: absolute;
    z-index: 1;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: max-content;
    max-width: 38%;
    color: $color-2;
    font-size: 0.76rem;
    font-weight: 700;
    line-height: 1.05;
    text-align: center;
  }

  .radar-label span {
    white-space: normal;
  }
</style>
