<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus, SearchX, ServerCrash, Sparkles } from 'lucide-vue-next';
import { useMetricsStore } from '../stores/metrics';
import { useEditorStore } from '../stores/editor';
import { CATEGORIES, CATEGORY_META, STATUS_RANK } from '../lib/constants';
import { useNow } from '../composables/useNow';
import ActivityFeed from '../components/ActivityFeed.vue';
import EmptyState from '../components/EmptyState.vue';
import MetricCard from '../components/MetricCard.vue';
import PageState from '../components/PageState.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';
import StatusOverview from '../components/StatusOverview.vue';
import ToggleSwitch from '../components/ToggleSwitch.vue';

const store = useMetricsStore();
const editor = useEditorStore();
const route = useRoute();
const router = useRouter();
const now = useNow(1000);

const SORTS = {
  severity: { label: 'Severity', fn: (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.id - b.id },
  recent: { label: 'Recently updated', fn: (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) },
  title: { label: 'Title A–Z', fn: (a, b) => a.title.localeCompare(b.title) }
};

// Filter and sort live in the URL query (?category=SALES&sort=recent), so a
// filtered view can be shared or reloaded.
const category = computed(() => (CATEGORIES.includes(route.query.category) ? route.query.category : 'ALL'));
const sort = computed(() => (SORTS[route.query.sort] ? route.query.sort : 'severity'));

function setQuery(key, value, fallback) {
  const query = { ...route.query };
  if (value === fallback) delete query[key];
  else query[key] = value;
  router.replace({ query });
}

const visible = computed(() => {
  const list = category.value === 'ALL' ? store.metrics : store.metrics.filter((m) => m.category === category.value);
  return [...list].sort(SORTS[sort.value].fn);
});
const categoryLabel = computed(() => CATEGORY_META[category.value]?.label.toLowerCase());
</script>

<template>
  <PageState>
    <div class="dashboard">
      <StatusOverview :now="now" />

      <div class="dashboard-grid">
        <section class="board" aria-labelledby="board-heading">
          <div class="board-toolbar">
            <h2 id="board-heading" class="visually-hidden">Metrics</h2>
            <div class="segmented" role="radiogroup" aria-label="Filter by category">
              <button
                v-for="c in ['ALL', ...CATEGORIES]"
                :key="c"
                type="button"
                role="radio"
                :aria-checked="category === c"
                @click="setQuery('category', c, 'ALL')"
              >
                <span v-if="c !== 'ALL'" class="dot" :style="{ '--dot': CATEGORY_META[c].color }" aria-hidden="true" />
                {{ c === 'ALL' ? 'All' : CATEGORY_META[c].label }}
                <span class="count">{{ store.categoryCounts[c] }}</span>
              </button>
            </div>

            <div class="board-toolbar-end">
              <label class="sort-control">
                <span>Sort</span>
                <select class="select" :value="sort" @change="setQuery('sort', $event.target.value, 'severity')">
                  <option v-for="(s, key) in SORTS" :key="key" :value="key">{{ s.label }}</option>
                </select>
              </label>
              <ToggleSwitch v-model="store.simulating" title="Writes small random value changes through the API every few seconds">
                <Sparkles :size="14" aria-hidden="true" />
                Simulate live changes
              </ToggleSwitch>
            </div>
          </div>

          <div v-if="store.phase === 'loading'" class="card-grid">
            <div v-for="i in 6" :key="i" class="metric-card" aria-hidden="true">
              <SkeletonBlock :width="140" :height="20" />
              <SkeletonBlock width="70%" :height="16" style="margin-top: 14px" />
              <SkeletonBlock width="45%" :height="30" style="margin-top: 14px" />
              <SkeletonBlock :height="40" style="margin-top: 14px" />
            </div>
          </div>

          <div v-else-if="!store.metrics.length" class="panel">
            <EmptyState :icon="ServerCrash" title="No metrics yet">
              The API is running but holds no metrics. Restarting the backend brings back the three seeded ones.
              <template #action>
                <button type="button" class="btn btn-primary" @click="editor.openCreate()">
                  <Plus :size="16" :stroke-width="2.5" /> Create the first metric
                </button>
              </template>
            </EmptyState>
          </div>

          <div v-else-if="!visible.length" class="panel">
            <EmptyState :icon="SearchX" :title="`No ${categoryLabel} metrics`">
              Nothing in this category is being tracked yet.
              <template #action>
                <div class="empty-actions">
                  <button type="button" class="btn" @click="setQuery('category', 'ALL', 'ALL')">Show all</button>
                  <button type="button" class="btn btn-primary" @click="editor.openCreate({ category })">
                    <Plus :size="16" :stroke-width="2.5" /> New {{ categoryLabel }} metric
                  </button>
                </div>
              </template>
            </EmptyState>
          </div>

          <TransitionGroup v-else tag="div" name="card" class="card-grid">
            <MetricCard
              v-for="metric in visible"
              :key="metric.id"
              :metric="metric"
              :series="store.seriesFor(metric.id)"
              :flash="store.flashes[metric.id]"
              :now="now"
              @edit="editor.openEdit"
            />
          </TransitionGroup>
        </section>

        <aside class="panel feed-panel" aria-labelledby="feed-heading">
          <div class="panel-head">
            <div>
              <h2 id="feed-heading" class="panel-title">Live activity</h2>
              <p class="panel-sub">Changes detected between polls</p>
            </div>
          </div>
          <div class="panel-body">
            <ActivityFeed :events="store.activity" :now="now" :limit="8" compact />
          </div>
        </aside>
      </div>
    </div>
  </PageState>
</template>
