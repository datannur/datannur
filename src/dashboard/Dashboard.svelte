<script lang="ts">
  import Icon from '@layout/Icon.svelte'
  import Link from '@layout/Link.svelte'
  import Popup from '@layout/Popup.svelte'
  import { buildDashboard } from './build-dashboard'
  import QualityRadar from './QualityRadar.svelte'
  import Render from '@lib/render'
  import { locale } from '@lib/constant'
  import { getTimeAgo } from '@lib/time'
  import { preserveScroll } from '@lib/preserve-scroll'
  import type {
    DashboardData,
    DashboardInput,
    DashboardMetric,
    DashboardPriority,
    DashboardScore,
    DashboardScoreCriterion,
    DashboardTimelineItem,
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
  let selectedCriterion = $state<DashboardScoreCriterion | undefined>()
  let selectedDimension = $state<DashboardScore | undefined>()
  let isCriterionPopupOpen = $state(false)
  let selectedPriority = $derived(
    selectedCriterion === undefined
      ? undefined
      : dashboard.priorities.find(item => item.key === selectedCriterion?.key),
  )

  function formatDataSize(metric: DashboardMetric): string {
    return Render.dataSize(metric.value)
  }

  function formatMetricNumber(metric: DashboardMetric): string {
    const value = Number(metric.value)
    return metricNumberFormatter.format(value)
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

  function timelineDate(item: DashboardTimelineItem): string {
    return getTimeAgo(item.timestamp) || item.date || ''
  }

  function openEvolutionTab(event: MouseEvent) {
    event.preventDefault()
    window.dispatchEvent(
      new CustomEvent('llm-tab-change', { detail: 'evolutions' }),
    )
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

<div class="dashboard" use:preserveScroll={dashboardScrollKey}>
  <div class="quality-grid">
    <div class="quality-left-column">
      <section class="dashboard-panel global-score-panel">
        <div class="section-heading">
          <h3>{dashboard.globalScore.label}</h3>
        </div>
        <QualityRadar
          dimensions={dashboard.maturity}
          globalScore={dashboard.globalScore}
        />
      </section>

      {#if dashboard.timeline.recent.length || dashboard.timeline.upcoming.length}
        <section class="dashboard-panel timeline-panel">
          <div class="section-heading timeline-heading">
            <h3>Activité</h3>
            <a
              href="?tab=evolutions"
              class="timeline-tab-link"
              onclick={openEvolutionTab}
            >
              <Icon type="evolution" mode="compact" />
              Voir l'évolution
            </a>
          </div>
          <div class="timeline-grid">
            {#if dashboard.timeline.recent.length}
              <div class="timeline-block">
                <h4 class="timeline-subtitle">Dernières</h4>
                <div class="timeline-list">
                  {#each dashboard.timeline.recent as item, index (`${item.key}-${index}`)}
                    <Link
                      href={item.href}
                      className="timeline-link"
                      entity={item.entity}
                    >
                      <span class="timeline-content">
                        <strong class="timeline-entity"
                          ><Icon type={item.entity} mode="compact" /><span
                            >{item.label}</span
                          ></strong
                        >
                        <small class="timeline-activity"
                          ><Icon
                            type={item.type}
                            mode="compact"
                          />{item.typeLabel} · {timelineDate(item)}</small
                        >
                      </span>
                    </Link>
                  {/each}
                </div>
              </div>
            {/if}

            {#if dashboard.timeline.upcoming.length}
              <div class="timeline-block">
                <h4 class="timeline-subtitle">Prochaines</h4>
                <div class="timeline-list">
                  {#each dashboard.timeline.upcoming as item, index (`${item.key}-${index}`)}
                    <Link
                      href={item.href}
                      className="timeline-link"
                      entity={item.entity}
                    >
                      <span class="timeline-content">
                        <strong class="timeline-entity"
                          ><Icon type={item.entity} mode="compact" /><span
                            >{item.label}</span
                          ></strong
                        >
                        <small class="timeline-activity"
                          ><Icon
                            type={item.type}
                            mode="compact"
                          />{item.typeLabel} · {timelineDate(item)}</small
                        >
                      </span>
                    </Link>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </section>
      {/if}
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

      {#if dashboard.maturity.length}
        <section class="dashboard-panel quality-dimensions">
          <div class="section-heading">
            <h3>Dimensions</h3>
          </div>
          <div class="score-list">
            {#each dashboard.maturity as item (item.key)}
              <article class="score-row">
                <div class="score-main">
                  <div class="score-row-header">
                    <div>
                      <Icon type={item.key} mode="compact" />
                      <strong>{item.label}</strong>
                    </div>
                    <span class="score-value {scoreLevel(item.score)}"
                      >{item.score}%</span
                    >
                  </div>
                  <div class="bar {scoreLevel(item.score)}" aria-hidden="true">
                    <div style:width={barWidth(item.score)}></div>
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
                        <span>
                          <small
                            >{Render.num(criterion.value)} / {Render.num(
                              criterion.total,
                            )}</small
                          >
                          <b class={scoreLevel(criterion.score)}
                            >{criterion.score}%</b
                          >
                        </span>
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
          <strong class={scoreLevel(selectedCriterion.score)}
            >{selectedCriterion.score}%</strong
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
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: auto; //max(calc(100vh - 172px), 360px);
    overflow: auto;
    padding: 16px;
    background: $background-2;
    @include scrollbar-light();
  }

  .dashboard-panel {
    border: 0;
    background: transparent;
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

  .timeline-tab-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: $color-2;
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
  }

  .timeline-tab-link:hover,
  .timeline-tab-link:focus-visible {
    color: $color-3;
  }

  .timeline-tab-link :global(.icon) {
    flex: none;
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

  .timeline-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .timeline-list {
    display: flex;
    flex-direction: column;
  }

  :global(.timeline-link) {
    display: block;
    min-width: 0;
    padding: 8px 0;
    border-bottom: 1px solid $color-5;
    color: $color-1;
  }

  .timeline-entity {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    width: 100%;
    min-width: 0;
  }

  .timeline-activity {
    display: inline-flex;
  }

  .timeline-entity,
  .timeline-activity {
    align-items: center;
    gap: 4px;
  }

  .timeline-entity {
    transition: $transition-basic-1;
  }

  .timeline-entity :global(.icon),
  .timeline-activity :global(.icon) {
    flex: none;
  }

  .timeline-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  :global(.timeline-link strong) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.86rem;
  }

  .timeline-entity span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.timeline-link small) {
    color: $color-2;
  }

  @each $entity in $entities {
    :global(.timeline-link.color-entity-#{$entity}:hover .timeline-entity),
    :global(
      .timeline-link.color-entity-#{$entity}:focus-visible .timeline-entity
    ),
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

  .criterion-header span {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    flex: none;
    max-width: 45%;
    color: $color-2;
  }

  .criterion-header small {
    color: inherit;
    font-size: 0.76rem;
    white-space: nowrap;
  }

  .criterion-header b {
    min-width: 36px;
    font-size: 0.8rem;
    text-align: right;
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
    line-height: 1;
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

    .quality-dimensions {
      order: 3;
    }

    .patrimony-panel {
      order: 2;
    }

    .timeline-panel {
      order: 4;
    }

    .quality-dimensions,
    .timeline-subtitle {
      margin: 0 0 8px;
      color: $color-2;
      font-size: 0.86rem;
      font-weight: 800;
      line-height: 1.2;
    }
    .patrimony-panel,
    .timeline-panel {
      grid-column: auto;
      grid-row: auto;
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

    .timeline-grid {
      grid-template-columns: 1fr;
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

    .quality-dimensions {
      order: 3;
    }

    .patrimony-panel {
      order: 2;
    }

    .timeline-panel {
      order: 4;
    }

    .quality-dimensions,
    .patrimony-panel,
    .timeline-panel {
      grid-column: auto;
      grid-row: auto;
    }
  }

  @media (max-width: 1180px) {
    .priority-targets {
      margin-left: 12px;
    }

    .timeline-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
