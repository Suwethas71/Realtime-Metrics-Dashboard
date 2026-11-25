<script setup>
import { computed } from 'vue';
import { CheckCircle2 } from 'lucide-vue-next';
import { useMetricsStore } from '../stores/metrics';
import { formatValue, relativeTime } from '../lib/format';
import SkeletonBlock from './SkeletonBlock.vue';
import StackedBar from './StackedBar.vue';
import StatusBadge from './StatusBadge.vue';

defineProps({ now: { type: Number, required: true } });
const store = useMetricsStore();

const parts = computed(() => [
  { key: 'active', label: 'Active', value: store.statusCounts.ACTIVE, color: 'var(--active)' },
  { key: 'warning', label: 'Warning', value: store.statusCounts.WARNING, color: 'var(--warning-mark)' },
  { key: 'critical', label: 'Critical', value: store.statusCounts.CRITICAL, color: 'var(--critical-mark)' }
]);
const lastEvent = computed(() => store.activity[0]);
</script>

<template>
  <section v-if="store.phase === 'loading'" class="panel overview" aria-busy="true">
    <div v-for="i in 3" :key="i" class="overview-cell">
      <SkeletonBlock :width="90" :height="12" />
      <SkeletonBlock width="60%" :height="28" />
    </div>
  </section>

  <section v-else class="panel overview" aria-label="Status overview">
    <div class="overview-cell">
      <h2 class="overview-label">Status of {{ store.metrics.length }} {{ store.metrics.length === 1 ? 'metric' : 'metrics' }}</h2>
      <StackedBar label="Metrics by status" :parts="parts" />
    </div>

    <div class="overview-cell">
      <h2 class="overview-label">Needs attention</h2>
      <p v-if="!store.needsAttention.length" class="all-clear">
        <CheckCircle2 :size="16" aria-hidden="true" /> Every metric is active
      </p>
      <ul v-else class="attention-list">
        <li v-for="m in store.needsAttention.slice(0, 3)" :key="m.id">
          <StatusBadge :status="m.status" />
          <RouterLink :to="{ name: 'metric', params: { id: m.id } }" class="attention-title">{{ m.title }}</RouterLink>
          <span class="attention-value">{{ formatValue(m.value) }}</span>
        </li>
        <li v-if="store.needsAttention.length > 3" class="attention-more">+{{ store.needsAttention.length - 3 }} more</li>
      </ul>
    </div>

    <div class="overview-cell">
      <h2 class="overview-label">This session</h2>
      <p class="session-stat">
        <span class="session-number">{{ store.activity.length }}</span>
        <span>{{ store.activity.length === 1 ? 'change detected' : 'changes detected' }}</span>
      </p>
      <p class="session-last">
        <template v-if="lastEvent">Last: <strong>{{ lastEvent.title }}</strong>, {{ relativeTime(lastEvent.at, now) }}</template>
        <template v-else>No changes since this page opened</template>
      </p>
    </div>
  </section>
</template>
