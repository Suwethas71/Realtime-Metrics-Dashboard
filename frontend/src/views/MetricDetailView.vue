<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, ChevronLeft, ChevronRight, FileQuestion, Loader2, Pencil, Trash2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { api } from '../api/client';
import { useMetricsStore } from '../stores/metrics';
import { useEditorStore } from '../stores/editor';
import { CATEGORY_META } from '../lib/constants';
import { clockTime, formatValue, fullDate, relativeTime } from '../lib/format';
import { useNow } from '../composables/useNow';
import ActivityFeed from '../components/ActivityFeed.vue';
import CategoryTag from '../components/CategoryTag.vue';
import EmptyState from '../components/EmptyState.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';
import StatusBadge from '../components/StatusBadge.vue';
import TrendChart from '../components/TrendChart.vue';

// `id` comes from the dynamic segment /metrics/:id(\d+) via route props.
const props = defineProps({ id: { type: Number, required: true } });

const store = useMetricsStore();
const editor = useEditorStore();
const router = useRouter();
const now = useNow(1000);

const loading = ref(true);
const loadError = ref(null);
const fetched = ref(null);

// The same component instance is reused when only the :id changes (e.g. the
// previous/next links), so the fetch is driven by a watcher on the prop.
watch(
  () => props.id,
  async (id) => {
    loading.value = true;
    loadError.value = null;
    fetched.value = null;
    try {
      const { data } = await api.getMetric(id);
      if (id === props.id) fetched.value = data;
    } catch (err) {
      if (id === props.id) loadError.value = err;
    } finally {
      if (id === props.id) loading.value = false;
    }
  },
  { immediate: true }
);

// Once loaded, follow the live store so the page updates with each poll.
const live = computed(() => store.byId.get(props.id));
const metric = computed(() => live.value || fetched.value);
const deletedLive = computed(() => !loading.value && fetched.value && store.phase === 'ready' && !live.value);

const series = computed(() => store.seriesFor(props.id));
const events = computed(() => store.eventsFor(props.id));

const ordered = computed(() => [...store.metrics].sort((a, b) => a.id - b.id));
const position = computed(() => ordered.value.findIndex((m) => m.id === props.id));
const prev = computed(() => (position.value > 0 ? ordered.value[position.value - 1] : null));
const next = computed(() => (position.value >= 0 ? ordered.value[position.value + 1] || null : null));

const confirming = ref(false);
const deleting = ref(false);
async function remove() {
  deleting.value = true;
  const title = metric.value.title;
  try {
    await store.deleteMetric(props.id);
    toast.success('Metric deleted', { description: title });
    router.push({ name: 'manage' });
  } catch (err) {
    toast.error('Could not delete metric', { description: err.message });
    deleting.value = false;
    confirming.value = false;
  }
}

watch(
  () => props.id,
  () => {
    confirming.value = false;
  }
);
</script>

<template>
  <div class="detail">
    <div class="detail-nav">
      <RouterLink :to="{ name: 'manage' }" class="btn btn-ghost btn-sm"><ArrowLeft :size="15" /> All metrics</RouterLink>
      <div class="detail-pager">
        <RouterLink v-if="prev" :to="{ name: 'metric', params: { id: prev.id } }" class="btn btn-sm" :title="prev.title">
          <ChevronLeft :size="15" /> Previous
        </RouterLink>
        <RouterLink v-if="next" :to="{ name: 'metric', params: { id: next.id } }" class="btn btn-sm" :title="next.title">
          Next <ChevronRight :size="15" />
        </RouterLink>
      </div>
    </div>

    <section v-if="loading" class="panel detail-hero" aria-busy="true">
      <SkeletonBlock :width="160" :height="20" />
      <SkeletonBlock width="50%" :height="28" />
      <SkeletonBlock :width="200" :height="44" />
    </section>

    <div v-else-if="loadError" class="panel">
      <EmptyState :icon="FileQuestion" :title="loadError.status === 404 ? 'Metric not found' : 'Could not load this metric'">
        <span class="mono http-inline">{{ loadError.status || 'ERR' }}</span> {{ loadError.message }}
        <template #action>
          <RouterLink :to="{ name: 'manage' }" class="btn btn-primary">Back to all metrics</RouterLink>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="deletedLive" class="panel">
      <EmptyState :icon="Trash2" title="This metric was deleted">
        It disappeared from the API while this page was open.
        <template #action>
          <RouterLink :to="{ name: 'manage' }" class="btn btn-primary">Back to all metrics</RouterLink>
        </template>
      </EmptyState>
    </div>

    <template v-else-if="metric">
      <section class="panel detail-hero" :class="{ changed: store.flashes[metric.id] }">
        <div class="detail-hero-main">
          <div class="metric-meta">
            <span class="detail-id mono">#{{ metric.id }}</span>
            <CategoryTag :category="metric.category" />
            <StatusBadge :status="metric.status" />
          </div>
          <h2 class="detail-title">{{ metric.title }}</h2>
          <p :key="metric.value" class="detail-value">{{ formatValue(metric.value) }}</p>
          <p class="detail-updated">
            Updated <time :datetime="metric.updatedAt" :title="fullDate(metric.updatedAt)">{{ relativeTime(metric.updatedAt, now) }}</time>
            · {{ fullDate(metric.updatedAt) }}
          </p>
        </div>
        <div class="detail-actions">
          <template v-if="confirming">
            <span class="confirm-text">Delete this metric?</span>
            <button type="button" class="btn" :disabled="deleting" @click="confirming = false">Cancel</button>
            <button type="button" class="btn btn-danger" :disabled="deleting" @click="remove">
              <Loader2 v-if="deleting" :size="16" class="spin" aria-hidden="true" />
              <Trash2 v-else :size="16" aria-hidden="true" />
              Delete
            </button>
          </template>
          <template v-else>
            <button type="button" class="btn" @click="editor.openEdit(metric)"><Pencil :size="16" /> Edit</button>
            <button type="button" class="btn danger-ghost" @click="confirming = true"><Trash2 :size="16" /> Delete</button>
          </template>
        </div>
      </section>

      <div class="analytics-row">
        <section class="panel" aria-labelledby="detail-trend">
          <div class="panel-head">
            <div>
              <h2 id="detail-trend" class="panel-title">Value over this session</h2>
              <p class="panel-sub">
                {{ Math.max(series.length - 1, 0) }} changes seen{{ series[0] ? ` since ${clockTime(series[0].t)}` : '' }}
              </p>
            </div>
          </div>
          <div class="panel-body">
            <TrendChart
              v-if="series.length"
              :series="series"
              :color="CATEGORY_META[metric.category].color"
              :now="now"
              :height="series.length > 1 ? 240 : 180"
            />
            <p v-else class="trend-note">Waiting for the first poll.</p>
          </div>
        </section>

        <section class="panel" aria-labelledby="detail-log">
          <div class="panel-head">
            <div>
              <h2 id="detail-log" class="panel-title">Changes to this metric</h2>
              <p class="panel-sub">Detected between polls</p>
            </div>
          </div>
          <div class="panel-body log-body">
            <ActivityFeed :events="events" :now="now" empty-text="Edit this metric, or turn on the simulator, and its changes appear here." />
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
