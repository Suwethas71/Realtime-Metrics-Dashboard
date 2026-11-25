<script setup>
import { computed, ref } from 'vue';
import { LineChart } from 'lucide-vue-next';
import { useMetricsStore } from '../stores/metrics';
import { CATEGORIES, CATEGORY_META, STATUSES } from '../lib/constants';
import { clockTime, formatValue } from '../lib/format';
import { useNow } from '../composables/useNow';
import ActivityFeed from '../components/ActivityFeed.vue';
import EmptyState from '../components/EmptyState.vue';
import PageState from '../components/PageState.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';
import TrendChart from '../components/TrendChart.vue';

const store = useMetricsStore();
const now = useNow(1000);
const STATUS_COLOR = { ACTIVE: 'var(--active)', WARNING: 'var(--warning-mark)', CRITICAL: 'var(--critical-mark)' };

const breakdown = computed(() => {
  const rows = CATEGORIES.map((category) => {
    const list = store.metrics.filter((m) => m.category === category);
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, list.filter((m) => m.status === s).length]));
    return { category, total: list.length, byStatus };
  });
  const max = Math.max(1, ...rows.map((r) => r.total));
  return { rows, max };
});

// Metrics with the most observed changes come first.
const ranked = computed(() =>
  [...store.metrics].sort((a, b) => store.seriesFor(b.id).length - store.seriesFor(a.id).length || a.id - b.id)
);
const selectedId = ref(null);
const selected = computed(() => store.byId.get(selectedId.value) || ranked.value[0]);
const selectValue = computed({
  get: () => selected.value?.id ?? null,
  set: (id) => {
    selectedId.value = id;
  }
});
const series = computed(() => (selected.value ? store.seriesFor(selected.value.id) : []));
const values = computed(() => series.value.map((p) => p.v));
</script>

<template>
  <PageState>
    <div class="analytics">
      <section class="panel" aria-labelledby="trend-heading">
        <div class="panel-head">
          <div>
            <h2 id="trend-heading" class="panel-title">Live trend</h2>
            <p class="panel-sub">Values recorded by this browser since it opened. The API keeps no history.</p>
          </div>
        </div>
        <div class="panel-body">
          <SkeletonBlock v-if="store.phase === 'loading'" :height="260" />
          <EmptyState v-else-if="!selected" :icon="LineChart" title="No metrics to chart">
            Create a metric to start recording its values.
          </EmptyState>
          <div v-else class="trend">
            <div class="trend-top">
              <label class="trend-select">
                <span class="visually-hidden">Metric to chart</span>
                <select v-model.number="selectValue" class="select">
                  <option v-for="m in ranked" :key="m.id" :value="m.id">
                    {{ m.title }} ({{ Math.max(store.seriesFor(m.id).length - 1, 0) }} changes)
                  </option>
                </select>
              </label>
              <dl class="trend-stats">
                <div><dt>Current</dt><dd>{{ formatValue(selected.value) }}</dd></div>
                <div><dt>Session low</dt><dd>{{ values.length ? formatValue(Math.min(...values)) : '—' }}</dd></div>
                <div><dt>Session high</dt><dd>{{ values.length ? formatValue(Math.max(...values)) : '—' }}</dd></div>
                <div><dt>First seen</dt><dd>{{ series[0] ? clockTime(series[0].t) : '—' }}</dd></div>
              </dl>
            </div>
            <TrendChart :series="series" :color="CATEGORY_META[selected.category].color" :now="now" :height="series.length > 1 ? 260 : 200" />
            <p v-if="series.length <= 1" class="trend-note">
              Only one reading so far. Edit this metric, or turn on <strong>Simulate live changes</strong> on the dashboard, and the
              line will move.
            </p>
          </div>
        </div>
      </section>

      <div class="analytics-row">
        <section class="panel" aria-labelledby="breakdown-heading">
          <div class="panel-head">
            <div>
              <h2 id="breakdown-heading" class="panel-title">Category breakdown</h2>
              <p class="panel-sub">Metrics per category, split by status</p>
            </div>
          </div>
          <div class="panel-body">
            <SkeletonBlock v-if="store.phase === 'loading'" :height="180" />
            <table v-else class="breakdown">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col" class="bar-col">Metrics</th>
                  <th scope="col" class="num">Active</th>
                  <th scope="col" class="num">Warning</th>
                  <th scope="col" class="num">Critical</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in breakdown.rows" :key="row.category">
                  <th scope="row">
                    <RouterLink :to="{ name: 'dashboard', query: { category: row.category } }" class="cat-tag">
                      <span class="dot" :style="{ '--dot': CATEGORY_META[row.category].color }" aria-hidden="true" />
                      {{ CATEGORY_META[row.category].label }}
                    </RouterLink>
                  </th>
                  <td class="bar-col">
                    <div class="count-bar">
                      <div class="count-track">
                        <template v-for="s in STATUSES" :key="s">
                          <span
                            v-if="row.byStatus[s]"
                            :style="{ width: `${(row.byStatus[s] / breakdown.max) * 100}%`, background: STATUS_COLOR[s] }"
                          />
                        </template>
                      </div>
                      <strong>{{ row.total }}</strong>
                    </div>
                  </td>
                  <td v-for="s in STATUSES" :key="s" class="num" :class="{ zero: !row.byStatus[s] }">{{ row.byStatus[s] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="panel" aria-labelledby="log-heading">
          <div class="panel-head">
            <div>
              <h2 id="log-heading" class="panel-title">Change log</h2>
              <p class="panel-sub">
                {{ store.activity.length }} {{ store.activity.length === 1 ? 'change' : 'changes' }} detected this session
              </p>
            </div>
          </div>
          <div class="panel-body log-body">
            <ActivityFeed :events="store.activity" :now="now" />
          </div>
        </section>
      </div>
    </div>
  </PageState>
</template>
