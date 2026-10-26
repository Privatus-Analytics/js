<template>
  <div class="privatus-panel" :class="{ 'has-header': showHeader }">
    <p v-if="loading && !insights" class="privatus-message">Loading...</p>
    <p v-else-if="error" class="privatus-message privatus-error" role="alert">{{ error }}</p>
    <template v-else-if="insights">
      <div class="privatus-metrics">
        <div class="privatus-metric">
          <span class="privatus-label">Visitors</span>
          <span class="privatus-value" data-metric="visitors">{{ formatNumber(insights.metrics.visitors) }}</span>
          <span v-if="change('visitors')" class="privatus-change" :class="changeClass('visitors')">{{ change('visitors') }}</span>
        </div>
        <div class="privatus-metric">
          <span class="privatus-label">Pageviews</span>
          <span class="privatus-value" data-metric="pageviews">{{ formatNumber(insights.metrics.pageviews) }}</span>
          <span v-if="change('pageviews')" class="privatus-change" :class="changeClass('pageviews')">{{ change('pageviews') }}</span>
        </div>
      </div>
      <ol v-if="insights.pages.length" class="privatus-pages">
        <li v-for="row in insights.pages" :key="row.value" class="privatus-page">
          <span class="privatus-path" :title="row.value">{{ row.value }}</span>
          <span class="privatus-count">{{ formatNumber(row.pageviews) }}</span>
        </li>
      </ol>
      <p v-else-if="(topPages ?? 5) > 0" class="privatus-message">No pageviews in this period yet.</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { formatChange, formatNumber, loadInsights, type Insights, type Metrics } from './api'

const props = withDefaults(
  defineProps<{
    showHeader?: boolean
    token?: string | null
    siteId?: string | null
    period?: string | null
    topPages?: number | null
  }>(),
  { showHeader: false, token: null, siteId: null, period: '7d', topPages: 5 },
)

const insights = ref<Insights | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)
let request = 0

async function refresh() {
  const current = ++request
  loading.value = true
  error.value = null
  try {
    const result = await loadInsights({ token: props.token, siteId: props.siteId, period: props.period, topPages: props.topPages })
    if (current === request) insights.value = result
  } catch (e) {
    if (current === request) {
      insights.value = null
      error.value = e instanceof Error ? e.message : String(e)
    }
  } finally {
    if (current === request) loading.value = false
  }
}

function change(metric: keyof Metrics): string {
  return formatChange(insights.value?.change?.[metric] ?? null)
}

function changeClass(metric: keyof Metrics): string {
  const value = insights.value?.change?.[metric] ?? 0
  return value > 0 ? 'up' : value < 0 ? 'down' : ''
}

onMounted(refresh)
watch(() => [props.token, props.siteId, props.period, props.topPages], refresh)
</script>

<style scoped>
.privatus-panel {
  height: 100%;
  padding: 12px;
  overflow: auto;
  color: var(--theme--foreground, #172940);
}

.privatus-panel.has-header {
  padding-top: 0;
}

.privatus-message {
  color: var(--theme--foreground-subdued, #6b7d93);
}

.privatus-error {
  color: var(--theme--danger, #e35169);
}

.privatus-metrics {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.privatus-metric {
  display: flex;
  flex-direction: column;
}

.privatus-label {
  font-size: 12px;
  color: var(--theme--foreground-subdued, #6b7d93);
}

.privatus-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.privatus-change {
  font-size: 12px;
}

.privatus-change.up {
  color: var(--theme--success, #2ecda7);
}

.privatus-change.down {
  color: var(--theme--danger, #e35169);
}

.privatus-pages {
  margin: 0;
  padding: 0;
  list-style: none;
}

.privatus-page {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  border-top: 1px solid var(--theme--border-color-subdued, #f0f4f9);
}

.privatus-path {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.privatus-count {
  font-variant-numeric: tabular-nums;
  color: var(--theme--foreground-subdued, #6b7d93);
}
</style>
