<script lang="ts">
  import { onMount } from 'svelte'
  import Icon from '@layout/Icon.svelte'
  import Link from '@layout/Link.svelte'
  import Popup from '@layout/Popup.svelte'
  import { buildDashboard } from './build-dashboard'
  import Render from '@lib/render'
  import { locale } from '@lib/constant'
  import { preserveScroll } from '@lib/preserve-scroll'
  import type {
    DashboardData,
    DashboardInput,
    DashboardMetric,
    DashboardPriority,
    DashboardScore,
    DashboardScoreCriterion,
  } from './dashboard-types'

  const priorityTargetVisibleLimit = 4
  const metricNumberFormatter = new Intl.NumberFormat(locale, {
    useGrouping: true,
  })

  let { dashboard: dashboardInput }: { dashboard: DashboardInput } = $props()
  const dashboard: DashboardData = $derived(buildDashboard(dashboardInput))
  const dashboardScrollKey = $derived(
    `dashboard:${dashboard.scope.type}:${dashboard.scope.id ?? 'root'}`,
  )
  const pyramidLevels = $derived([...dashboard.maturity].reverse())
  const applicableMaturity = $derived(
    dashboard.maturity.filter(item => item.applicable),
  )
  let selectedCriterion = $state<DashboardScoreCriterion | undefined>()
  let selectedDimension = $state<DashboardScore | undefined>()
  let isCriterionPopupOpen = $state(false)
  let scoreAnimationProgress = $state(0)
  let scoreAnimationFrame = 0
  let selectedPriority = $derived(
    selectedCriterion === undefined
      ? undefined
      : dashboard.priorities.find(item => item.key === selectedCriterion?.key),
  )
  const formattedGeneratedAt = new Intl.DateTimeFormat('fr-CH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())
  const exportDate = new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(new Date())
    .replaceAll('.', '-')
  const analyzedScopeLabel = $derived(
    formatAnalyzedScope(dashboard.scope.type, dashboard.scope.label),
  )
  const exportFilename = $derived(
    `datannur-bilan-${dashboard.scope.type}-${exportDate}`,
  )
  const animatedGlobalScore = $derived(
    animatedScore(dashboard.globalScore.score),
  )
  const animatedGlobalScoreLevel = $derived(scoreLevel(animatedGlobalScore))

  onMount(() => {
    const duration = 1300
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReducedMotion) {
      scoreAnimationProgress = 1
      return
    }

    const start = performance.now()
    function animateScore(now: number) {
      const elapsed = clampPercent((now - start) / duration)
      scoreAnimationProgress = easeOutCubic(elapsed)
      if (elapsed < 1) scoreAnimationFrame = requestAnimationFrame(animateScore)
    }

    scoreAnimationFrame = requestAnimationFrame(animateScore)
    return () => cancelAnimationFrame(scoreAnimationFrame)
  })

  function printReport() {
    cancelAnimationFrame(scoreAnimationFrame)
    scoreAnimationProgress = 1
    const title = document.title
    document.title = exportFilename
    window.print()
    document.title = title
  }

  function easeOutCubic(value: number): number {
    return 1 - Math.pow(1 - value, 3)
  }

  function clampPercent(value: number): number {
    return Math.max(0, Math.min(value, 1))
  }

  function animatedScore(scoreValue: number): number {
    return Math.max(
      0,
      Math.round(scoreValue * clampPercent(scoreAnimationProgress)),
    )
  }

  function animatedScoreLevel(scoreValue: number): 'low' | 'medium' | 'high' {
    return scoreLevel(animatedScore(scoreValue))
  }

  function animatedMetricValue(metric: DashboardMetric): number {
    return Math.max(
      0,
      Math.round(Number(metric.value) * clampPercent(scoreAnimationProgress)),
    )
  }

  function formatDataSize(metric: DashboardMetric): string {
    return Render.dataSize(animatedMetricValue(metric))
  }

  function formatMetricNumber(metric: DashboardMetric): string {
    return metricNumberFormatter.format(animatedMetricValue(metric))
  }

  function formatMetricNumberGroups(metric: DashboardMetric): string[] {
    return formatMetricNumber(metric).split(/[\s\u202f\u00a0]/)
  }

  function gainLabel(value: number): string {
    return value % 1 === 0 ? Render.num(value) : value.toFixed(1)
  }

  function barWidth(value: number): string {
    return `${Math.max(0, Math.min(value, 100))}%`
  }

  function scopeTypeName(type: string): string {
    const names: { [key: string]: string } = {
      catalog: 'Catalogue général',
      organization: 'Organisation',
      folder: 'Dossier',
      dataset: 'Dataset',
      tag: 'Mot clé',
      concept: 'Concept',
    }
    return names[type] ?? type
  }

  function formatAnalyzedScope(type: string, label: string): string {
    return type === 'catalog'
      ? 'Catalogue général'
      : `${scopeTypeName(type)} : ${label}`
  }

  function pyramidGeometry(index: number, total: number) {
    const topWidth = 118
    const bottomWidth = 392
    const height = 220
    const levelHeight = height / total
    const topY = index * levelHeight
    const bottomY = (index + 1) * levelHeight - 3
    const topLevelWidth = topWidth + ((bottomWidth - topWidth) * topY) / height
    const bottomLevelWidth =
      topWidth + ((bottomWidth - topWidth) * bottomY) / height
    const topLeft = (420 - topLevelWidth) / 2
    const topRight = topLeft + topLevelWidth
    const bottomLeft = (420 - bottomLevelWidth) / 2
    const bottomRight = bottomLeft + bottomLevelWidth
    return { topY, bottomY, topLeft, topRight, bottomLeft, bottomRight }
  }

  function pyramidPoints(index: number, total: number): string {
    const { topY, bottomY, topLeft, topRight, bottomLeft, bottomRight } =
      pyramidGeometry(index, total)
    return `${topLeft},${topY} ${topRight},${topY} ${bottomRight},${bottomY} ${bottomLeft},${bottomY}`
  }

  function pyramidFillPoints(
    index: number,
    total: number,
    scoreValue: number,
  ): string {
    const { topY, bottomY, topLeft, topRight, bottomLeft, bottomRight } =
      pyramidGeometry(index, total)
    const ratio = Math.max(0, Math.min(scoreValue, 100)) / 100
    const topFillRight = topLeft + (topRight - topLeft) * ratio
    const bottomFillRight = bottomLeft + (bottomRight - bottomLeft) * ratio
    return `${topLeft},${topY} ${topFillRight},${topY} ${bottomFillRight},${bottomY} ${bottomLeft},${bottomY}`
  }

  function pyramidLabelY(index: number, total: number): number {
    return index * (220 / total) + 10
  }

  function pyramidScoreSegmentPoints(): string {
    const apexY = -(118 * 220) / (392 - 118)
    const bottomY = -3
    const bottomWidth = 118 + ((392 - 118) * bottomY) / 220
    const bottomLeft = (420 - bottomWidth) / 2
    const bottomRight = bottomLeft + bottomWidth
    return `210,${apexY} ${bottomRight},${bottomY} ${bottomLeft},${bottomY}`
  }

  function pyramidScoreFillPoints(scoreValue: number): string {
    const apexY = -(118 * 220) / (392 - 118)
    const bottomY = -3
    const bottomWidth = 118 + ((392 - 118) * bottomY) / 220
    const bottomLeft = (420 - bottomWidth) / 2
    const bottomRight = bottomLeft + bottomWidth
    const ratio = Math.max(0, Math.min(scoreValue, 100)) / 100
    const fillBottomRight = bottomLeft + (bottomRight - bottomLeft) * ratio
    return `210,${apexY} ${fillBottomRight},${bottomY} ${bottomLeft},${bottomY}`
  }

  function pyramidScoreY(): number {
    return -30
  }

  function scoreLevel(score: number): 'low' | 'medium' | 'high' {
    if (score < 50) return 'low'
    if (score < 80) return 'medium'
    return 'high'
  }

  function metricIcon(metric: DashboardMetric): string {
    const icons: { [key: string]: string } = {
      organizations: 'organization',
      folders: 'folder',
      tags: 'tag',
      concepts: 'concept',
      docs: 'doc',
      datasets: 'dataset',
      variables: 'variable',
      enumerations: 'enumeration',
      rows: 'nbRow',
      dataSize: 'dataSize',
    }
    return icons[metric.key] ?? metric.key
  }

  function targetIcon(href: string): string {
    return href.split('/')[0] || 'entity'
  }

  function openCriterionPopup(
    dimension: DashboardScore,
    criterion: DashboardScoreCriterion,
  ) {
    selectedDimension = dimension
    selectedCriterion = criterion
    isCriterionPopupOpen = true
  }

  function closeCriterionPopup() {
    selectedCriterion = undefined
    selectedDimension = undefined
  }

  function visiblePriorityTargets(item: DashboardPriority) {
    return item.targets.slice(0, priorityTargetVisibleLimit)
  }

  function remainingPriorityTargetCount(item: DashboardPriority): number {
    return Math.max(item.count - visiblePriorityTargets(item).length, 0)
  }
</script>

<div
  class="dashboard dashboard-main-wrapper"
  use:preserveScroll={dashboardScrollKey}
>
  <button
    class="print-action app-only use-tooltip tooltip-bottom"
    type="button"
    onclick={printReport}
    title="Exporter le bilan en PDF"
    aria-label="Exporter le bilan en PDF"
  >
    <Icon type="pdf" mode="compact" />
  </button>

  <div class="bilan-export-area">
    <div class="print-heading">
      <h1>Bilan du catalogue</h1>
      <p>
        Périmètre analysé : {analyzedScopeLabel}<br />
        Généré le {formattedGeneratedAt}
      </p>
    </div>

    <div class="quality-grid">
      <div class="quality-left-column">
        <section class="dashboard-panel global-score-panel">
          <div class="section-heading">
            <h3>{dashboard.globalScore.label}</h3>
          </div>
          <div class="maturity-pyramid" aria-label="Pyramide de maturité">
            <svg class="pyramid-svg" viewBox="0 -96 420 316" role="img">
              <polygon
                class="pyramid-score-background {animatedGlobalScoreLevel}"
                points={pyramidScoreSegmentPoints()}
              />
              <polygon
                class="pyramid-score-fill {animatedGlobalScoreLevel}"
                points={pyramidScoreFillPoints(animatedGlobalScore)}
              />
              <text
                class="maturity-score {animatedGlobalScoreLevel}"
                x="210"
                y={pyramidScoreY()}
                text-anchor="middle"
                dominant-baseline="middle"
              >
                {animatedGlobalScore}
              </text>
              {#each pyramidLevels as level, index (level.key)}
                <polygon
                  class="pyramid-segment"
                  points={pyramidPoints(index, pyramidLevels.length)}
                />
                <polygon
                  class="pyramid-segment-fill {level.key}"
                  points={pyramidFillPoints(
                    index,
                    pyramidLevels.length,
                    level.applicable ? animatedScore(level.score) : 0,
                  )}
                />
                <foreignObject
                  x="90"
                  y={pyramidLabelY(index, pyramidLevels.length)}
                  width="240"
                  height="28"
                >
                  <div
                    class="pyramid-segment-label color-entity-{level.key}"
                    class:not-applicable={!level.applicable}
                  >
                    <Icon type={level.key} mode="compact" />
                    <span>{level.label}</span>
                    <b
                      >{level.applicable
                        ? `${animatedScore(level.score)}%`
                        : 'n/a'}</b
                    >
                  </div>
                </foreignObject>
              {/each}
            </svg>
          </div>
        </section>

        <section class="dashboard-panel diagnostic-panel">
          <div class="section-heading">
            <h3>Diagnostic</h3>
          </div>
          <div class="diagnostic-content">
            <strong>{dashboard.diagnostic.label}</strong>
            <p>{dashboard.diagnostic.description}</p>
            <div class="diagnostic-groups">
              {#if dashboard.diagnostic.strengths.length}
                <div>
                  <span>Forces</span>
                  <ul>
                    {#each dashboard.diagnostic.strengths as item (item.key)}
                      <li>
                        <Icon type={item.key} mode="compact" />
                        <span>{item.label}</span>
                        <b class={animatedScoreLevel(item.score)}
                          >{animatedScore(item.score)}%</b
                        >
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
              {#if dashboard.diagnostic.watchpoints.length}
                <div>
                  <span>À consolider</span>
                  <ul>
                    {#each dashboard.diagnostic.watchpoints as item (item.key)}
                      <li>
                        <Icon type={item.key} mode="compact" />
                        <span>{item.label}</span>
                        <b class={animatedScoreLevel(item.score)}
                          >{animatedScore(item.score)}%</b
                        >
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          </div>
        </section>
      </div>

      <div class="quality-right-column">
        {#if dashboard.summary.length}
          <section class="dashboard-panel patrimony-panel">
            <div class="section-heading">
              <h3>Patrimoine analysé</h3>
            </div>
            <div class="summary-grid" aria-label="Patrimoine analysé">
              {#each dashboard.summary as metric (metric.key)}
                <article class="metric-card">
                  <div class="metric-main">
                    <span
                      ><Icon
                        type={metricIcon(metric)}
                        mode="compact"
                      />{metric.label}</span
                    >
                    <strong class="metric-value">
                      {#if metric.unit === 'bytes'}
                        {formatDataSize(metric)}
                      {:else}
                        <span
                          class="metric-value-groups"
                          aria-label={formatMetricNumber(metric)}
                        >
                          {#each formatMetricNumberGroups(metric) as group, index (`${group}-${index}`)}
                            <span>{group}</span>
                          {/each}
                        </span>
                      {/if}
                    </strong>
                  </div>
                </article>
              {/each}
            </div>
          </section>
        {/if}

        {#if applicableMaturity.length}
          <section class="dashboard-panel quality-dimensions">
            <div class="section-heading">
              <h3>Dimensions</h3>
            </div>
            <div class="score-list">
              {#each applicableMaturity as item (item.key)}
                <article class="score-row">
                  <div class="score-main">
                    <div class="score-row-header">
                      <div>
                        <Icon type={item.key} mode="compact" />
                        <strong>{item.label}</strong>
                      </div>
                      <span class="score-value {animatedScoreLevel(item.score)}"
                        >{animatedScore(item.score)}%</span
                      >
                    </div>
                    <div
                      class="bar {animatedScoreLevel(item.score)}"
                      aria-hidden="true"
                    >
                      <div
                        style:width={barWidth(animatedScore(item.score))}
                      ></div>
                    </div>
                    <span>{item.description}</span>
                  </div>
                  <div class="criteria-list">
                    {#each item.criteria as criterion (criterion.key)}
                      <button
                        type="button"
                        class="criterion-row"
                        onclick={() => openCriterionPopup(item, criterion)}
                      >
                        <div class="criterion-header">
                          <strong>{criterion.label}</strong>
                          <b class={animatedScoreLevel(criterion.score)}
                            >{animatedScore(criterion.score)}%</b
                          >
                        </div>
                      </button>
                    {/each}
                  </div>
                </article>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    </div>
  </div>
</div>

<Popup bind:isOpen={isCriterionPopupOpen} onClose={closeCriterionPopup}>
  {#if selectedCriterion && selectedDimension}
    <div class="criterion-popup">
      <div class="criterion-popup-heading">
        <span class="dimension-badge {selectedDimension.key}">
          <Icon type={selectedDimension.key} mode="compact" />
          {selectedDimension.label}
        </span>
        <h3>{selectedCriterion.label}</h3>
        <div class="criterion-popup-score">
          <strong class={animatedScoreLevel(selectedCriterion.score)}
            >{animatedScore(selectedCriterion.score)}%</strong
          >
          <span>
            {Render.num(selectedCriterion.value)} / {Render.num(
              selectedCriterion.total,
            )}
          </span>
        </div>
      </div>

      <div class="criterion-popup-section">
        <h4>Pourquoi c'est important</h4>
        <p>{selectedCriterion.priorityImpact}</p>
      </div>

      <div class="criterion-popup-section">
        <h4>Action à faire</h4>
        <p>{selectedCriterion.priorityLabel}</p>
        {#if selectedPriority}
          <small>
            Gain potentiel : +{gainLabel(selectedPriority.gainPoints)} point{selectedPriority.gainPoints >
            1
              ? 's'
              : ''} sur la dimension.
          </small>
        {/if}
      </div>

      {#if selectedPriority?.targetGroups.length}
        <div class="criterion-popup-section">
          <h4>Accès rapide</h4>
          <div class="priority-targets popup-targets">
            {#each selectedPriority.targetGroups as target (target.href)}
              <Link
                href={target.href}
                className="target-link"
                entity={target.entity}
              >
                <Icon type={target.entity} mode="compact" />
                <span>{target.label}</span>
                <strong>{Render.num(target.count)}</strong>
              </Link>
            {/each}
          </div>
        </div>
      {:else if selectedPriority?.targets.length}
        <div class="criterion-popup-section">
          <h4>Exemples à corriger</h4>
          <div class="priority-targets popup-targets">
            {#each visiblePriorityTargets(selectedPriority) as target (target.href)}
              <Link
                href={target.href}
                className="target-link"
                entity={targetIcon(target.href)}
              >
                <Icon type={targetIcon(target.href)} mode="compact" />
                <span>{target.label}</span>
              </Link>
            {/each}
            {#if remainingPriorityTargetCount(selectedPriority) > 0}
              <small class="priority-targets-more">
                +{Render.num(remainingPriorityTargetCount(selectedPriority))} autre{remainingPriorityTargetCount(
                  selectedPriority,
                ) > 1
                  ? 's'
                  : ''}
              </small>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</Popup>

<style lang="scss">
  @use 'main.scss' as *;

  $score-low: #c6695e;
  $score-medium: #d4a930;
  $score-high: $color-3;

  .dashboard {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: auto;
    overflow: auto;
    padding: 16px;
    background: $background-2;
    @include scrollbar-light();
  }

  .dashboard-panel {
    border: 0;
    background: transparent;
  }

  .print-action {
    position: absolute;
    top: 0;
    right: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 40px;
    border: 0;
    padding: 8px 2px;
    background: transparent;
    color: color('pdf');
    font: inherit;
    line-height: 1;
    transition: $transition-basic-1;
    cursor: pointer;
  }

  .print-action:hover,
  .print-action:focus-visible {
    color: $color-1;
  }

  .print-action :global(.icon) {
    flex: none;
  }

  .print-heading {
    display: none;
  }

  h3 {
    font-size: 1rem;
    margin: 0;
    line-height: 1.2;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
    gap: 0;
    overflow: visible;
    border: 0;
    background: transparent;
  }

  .metric-card {
    min-height: 0;
    padding: 9px 0;
    border-bottom: 1px solid $color-5;
    background: $background-2;
  }

  .metric-card:nth-last-child(-n + 2) {
    border-bottom: 0;
  }

  .metric-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    width: 100%;
  }

  .metric-card span,
  .score-row span,
  small {
    color: $color-2;
  }

  .metric-main span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    min-width: 0;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .metric-main :global(.icon) {
    flex: none;
  }

  .metric-card strong {
    font-size: 1.02rem;
    line-height: 1.1;
    text-align: right;
  }

  .metric-value {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
    white-space: nowrap;
  }

  .metric-value-groups {
    display: inline-flex;
    gap: 0.16em;
    justify-content: flex-end;
    color: inherit;
  }

  .quality-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .quality-left-column,
  .quality-right-column {
    display: flex;
    flex-direction: column;
    gap: 30px;
    min-width: 0;
  }

  .global-score-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .maturity-pyramid {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-height: 248px;
    justify-content: center;
  }

  .maturity-score {
    fill: color('dashboard');
    font-family: inherit;
    font-size: 1.65rem;
    font-weight: 800;
    letter-spacing: 0;
    font-variant-numeric: tabular-nums;
    transition: fill 180ms ease;
  }

  .maturity-score.low {
    fill: $score-low;
  }

  .maturity-score.medium {
    fill: $score-medium;
  }

  .maturity-score.high {
    fill: color('dashboard');
  }

  .pyramid-svg {
    width: min(100%, 430px);
    height: auto;
    overflow: visible;
  }

  .pyramid-segment {
    fill: transparent;
    stroke: $color-5;
    stroke-width: 1;
  }

  .pyramid-score-background {
    fill: rgba(color('dashboard'), 0.12);
    stroke: none;
    transition: fill 180ms ease;
  }

  .pyramid-score-background.low {
    fill: rgba($score-low, 0.1);
  }

  .pyramid-score-background.medium {
    fill: rgba($score-medium, 0.12);
  }

  .pyramid-score-background.high {
    fill: rgba(color('dashboard'), 0.12);
  }

  .pyramid-score-fill {
    fill: rgba(color('dashboard'), 0.28);
    stroke: none;
    transition: fill 180ms ease;
  }

  .pyramid-score-fill.low {
    fill: rgba($score-low, 0.26);
  }

  .pyramid-score-fill.medium {
    fill: rgba($score-medium, 0.3);
  }

  .pyramid-score-fill.high {
    fill: rgba(color('dashboard'), 0.3);
  }

  .pyramid-segment-fill {
    fill: rgba(color('dashboard'), 0.24);
  }

  @each $entity in $entities {
    .pyramid-segment-fill.#{$entity} {
      fill: rgba(color($entity), 0.34);
    }
  }

  .pyramid-segment-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 100%;
    height: 100%;
    color: $color-1;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1;
    white-space: nowrap;
  }

  .pyramid-segment-label :global(.icon) {
    flex: none;
    margin-right: -2px;
  }

  .pyramid-segment-label span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pyramid-segment-label b {
    flex: none;
    color: $color-2;
    font-size: 0.7rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .pyramid-segment-label.not-applicable {
    color: $color-2;
    opacity: 0.55;
  }

  .diagnostic-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .diagnostic-content > strong {
    color: $color-1;
    font-size: 1rem;
    line-height: 1.2;
  }

  .diagnostic-content p {
    margin: 0;
    color: $color-2;
    line-height: 1.35;
  }

  .diagnostic-groups {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    padding-top: 4px;
  }

  .diagnostic-groups > div {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .diagnostic-groups > div > span {
    color: $color-2;
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .diagnostic-groups ul {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .diagnostic-groups li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: $color-1;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .diagnostic-groups li :global(.icon) {
    flex: none;
  }

  .diagnostic-groups li span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .diagnostic-groups li b {
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    text-align: right;
    transition: color 180ms ease;
  }

  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid $color-5;
    margin-bottom: 16px;
  }

  .section-heading h3 {
    margin: 0;
    color: $color-1;
    font-size: 1.08rem;
    font-weight: 800;
  }

  .dashboard-panel {
    padding: 0 16px 16px;
  }

  .score-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .score-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px 18px;
  }

  .score-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 9px;
    min-width: 0;
    padding: 12px;
    background: $background-2;
  }

  .score-main {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .quality-dimensions {
    padding-top: 2px;
  }

  .score-row-header {
    display: flex;
    justify-content: space-between;
    gap: 14px;
  }

  .score-row-header div {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }

  .score-main > span {
    font-size: 0.82rem;
    line-height: 1.25;
  }

  .score-value {
    flex: none;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    transition: color 180ms ease;
  }

  .low {
    color: $score-low;
  }

  .medium {
    color: $score-medium;
  }

  .high {
    color: $score-high;
  }

  .dimension-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    width: fit-content;
    max-width: 100%;
    padding: 0;
    background: transparent;
    color: $color-3;
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dimension-badge :global(.icon) {
    flex: none;
  }

  .bar {
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: $background-3;
  }

  .bar div {
    height: 100%;
    border-radius: inherit;
    background: $score-high;
    transition:
      width 1200ms cubic-bezier(0.16, 1, 0.3, 1),
      background-color 180ms ease;
  }

  .bar.low div {
    background: $score-low;
  }

  .bar.medium div {
    background: $score-medium;
  }

  .bar.high div {
    background: $score-high;
  }

  .bar.compact {
    height: 6px;
  }

  .patrimony-panel .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 28px;
  }

  .patrimony-panel .metric-card {
    min-height: 0;
  }

  .patrimony-panel .metric-card strong {
    font-size: 1.02rem;
  }

  .priority-targets {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 12px;
    width: 100%;
    padding: 0 12px 11px 12px;
  }

  .priority-targets-more {
    display: inline-flex;
    align-items: center;
    grid-column: 1 / -1;
    color: $color-2;
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.2;
  }

  @each $entity in $entities {
    :global(.target-link.color-entity-#{$entity}:hover),
    :global(.target-link.color-entity-#{$entity}:focus-visible) {
      color: #{color($entity)} !important;
    }
  }

  :global(.target-link) {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    max-width: 100%;
    padding: 0;
    color: $color-2;
    font-size: 0.8rem;
    font-weight: 700;
  }

  :global(.target-link .icon) {
    flex: none;
  }

  :global(.target-link span) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.target-link strong) {
    flex: none;
    color: $color-1;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .criteria-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }

  .criterion-row {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 7px 0;
    border: 0;
    border-top: 1px solid $color-5;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 0.78rem;
    overflow: hidden;
    text-align: left;
    cursor: pointer;
  }

  .criterion-row:hover strong,
  .criterion-row:focus-visible strong {
    color: $color-3;
  }

  .criterion-row:focus-visible {
    outline: 2px solid $color-5;
    outline-offset: 2px;
  }

  .criterion-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
    max-width: 100%;
  }

  .criterion-header strong {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .criterion-header b {
    flex: none;
    min-width: 36px;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    text-align: right;
    transition: color 180ms ease;
  }

  .criterion-popup {
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: min(680px, 82vw);
    text-align: left;
  }

  .criterion-popup-heading {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-right: 28px;
  }

  .criterion-popup-heading h3 {
    color: $color-1;
    font-size: 1.25rem;
    line-height: 1.2;
  }

  .criterion-popup-score {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .criterion-popup-score strong {
    font-size: 1.5rem;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    transition: color 180ms ease;
  }

  .criterion-popup-score span,
  .criterion-popup-section small {
    color: $color-2;
  }

  .criterion-popup-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 14px;
    border-top: 1px solid $color-5;
  }

  .criterion-popup-section h4 {
    margin: 0;
    color: $color-1;
    font-size: 0.9rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .criterion-popup-section p {
    margin: 0;
    color: $color-2;
    line-height: 1.35;
  }

  .popup-targets {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0;
  }

  :global(html.roundedDesign) {
    .dashboard-panel {
      border-radius: $rounded;
    }
  }

  @include viewport-small-mobile {
    .dashboard {
      height: auto;
      min-height: max(calc(100vh - 172px), 360px);
      padding: 10px;
    }

    .quality-grid {
      grid-template-columns: 1fr;
    }

    .quality-left-column,
    .quality-right-column {
      display: contents;
    }

    .global-score-panel {
      order: 1;
    }

    .diagnostic-panel {
      order: 2;
    }

    .quality-dimensions {
      order: 4;
    }

    .patrimony-panel {
      order: 3;
    }

    .quality-dimensions {
      margin: 0 0 8px;
      color: $color-2;
      font-size: 0.86rem;
      font-weight: 800;
      line-height: 1.2;
    }
    .patrimony-panel {
      grid-column: auto;
      grid-row: auto;
    }

    .diagnostic-groups {
      grid-template-columns: 1fr;
    }

    .patrimony-panel .summary-grid {
      grid-template-columns: 1fr;
    }

    .metric-card:nth-last-child(-n + 2) {
      border-bottom: 1px solid $color-5;
    }

    .metric-card:last-child {
      border-bottom: 0;
    }

    .score-row-header {
      flex-direction: column;
      gap: 6px;
    }

    .priority-targets {
      margin-left: 12px;
    }
  }

  @media (max-width: 1180px) {
    .quality-grid {
      grid-template-columns: 1fr;
    }

    .quality-left-column,
    .quality-right-column {
      display: contents;
    }

    .global-score-panel {
      order: 1;
    }

    .diagnostic-panel {
      order: 2;
    }

    .quality-dimensions {
      order: 4;
    }

    .patrimony-panel {
      order: 3;
    }

    .quality-dimensions,
    .patrimony-panel {
      grid-column: auto;
      grid-row: auto;
    }
  }

  @media (max-width: 1180px) {
    .priority-targets {
      margin-left: 12px;
    }
  }

  @media print {
    @page {
      margin: 18mm;
    }

    :global(header),
    :global(footer),
    :global(nav),
    :global(.navbar),
    :global(.breadcrumb),
    :global(.app-only) {
      display: none !important;
    }

    :global(html),
    :global(body) {
      background: #fff !important;
      border: 0 !important;
      box-shadow: none !important;
      height: auto !important;
      margin: 0 !important;
      overflow: visible !important;
      padding: 0 !important;
      width: auto !important;
    }

    :global(#app),
    :global(#wrapper),
    :global(.main-container),
    :global(.section),
    :global(.tabs-wrapper),
    :global(.tabs-body) {
      border: 0 !important;
      box-shadow: none !important;
      display: block !important;
      height: auto !important;
      margin: 0 !important;
      min-height: 0 !important;
      overflow: visible !important;
      padding: 0 !important;
      width: auto !important;
    }

    :global(.main-container) {
      max-width: none !important;
      min-height: 0 !important;
      padding-top: 0 !important;
    }

    :global(*) {
      scrollbar-width: none !important;
    }

    :global(*::-webkit-scrollbar) {
      display: none !important;
      height: 0 !important;
      width: 0 !important;
    }

    :global(body *) {
      visibility: hidden !important;
    }

    .bilan-export-area,
    .bilan-export-area :global(*) {
      visibility: visible !important;
    }

    .dashboard {
      border: 0;
      box-shadow: none;
      color: #111;
      margin: 0;
      overflow: visible;
      padding: 0;
      position: static;
      background: #fff;
    }

    .bilan-export-area {
      border: 0;
      box-shadow: none;
      left: 0;
      margin: 0;
      max-width: none;
      overflow: visible;
      padding: 0;
      position: absolute;
      top: 0;
      width: 100%;
    }

    .print-heading {
      display: block;
      margin-bottom: 1.8rem;

      h1 {
        margin: 0 0 0.25rem;
        font-size: 1.6rem;
      }

      p {
        margin: 0;
        color: #555;
      }
    }

    .quality-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .quality-left-column,
    .quality-right-column {
      gap: 2rem;
    }

    .dashboard-panel,
    .score-row,
    .metric-card {
      background: #fff;
      break-inside: avoid;
    }

    .dashboard-panel {
      padding: 0 0 1.35rem;
    }

    .section-heading {
      border-color: #ccc;
      margin-bottom: 1rem;
      padding-bottom: 0.55rem;
    }

    .summary-grid,
    .score-list,
    .diagnostic-groups {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .metric-card,
    .score-row {
      border-color: #ddd;
    }

    .metric-card:nth-last-child(-n + 2) {
      border-bottom: 1px solid #ddd;
    }

    .metric-card:last-child {
      border-bottom: 0;
    }

    .bar {
      background: #eee;
    }
  }
</style>
