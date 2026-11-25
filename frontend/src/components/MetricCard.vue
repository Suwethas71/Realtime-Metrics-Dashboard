<script setup>
import { computed } from 'vue';
import { ArrowDownRight, ArrowUpRight, Pencil } from 'lucide-vue-next';
import { CATEGORY_META } from '../lib/constants';
import { formatDelta, formatValue, fullDate, relativeTime } from '../lib/format';
import CategoryTag from './CategoryTag.vue';
import StatusBadge from './StatusBadge.vue';
import SparkLine from './SparkLine.vue';

const props = defineProps({
  metric: { type: Object, required: true },
  series: { type: Array, default: () => [] },
  flash: { type: Object, default: null },
  now: { type: Number, required: true }
});
defineEmits(['edit']);

const color = computed(() => CATEGORY_META[props.metric.category]?.color);
const changes = computed(() => Math.max(props.series.length - 1, 0));
const delta = computed(() => props.flash?.delta);
</script>

<template>
  <article class="metric-card" :class="[`status-${metric.status.toLowerCase()}`, { changed: flash }]">
    <header class="metric-head">
      <div class="metric-meta">
        <CategoryTag :category="metric.category" />
        <StatusBadge :status="metric.status" />
      </div>
      <button
        type="button"
        class="btn btn-icon btn-ghost metric-edit"
        :aria-label="`Edit ${metric.title}`"
        title="Edit"
        @click="$emit('edit', metric)"
      >
        <Pencil :size="15" />
      </button>
    </header>

    <h3 class="metric-title" :title="metric.title">
      <RouterLink :to="{ name: 'metric', params: { id: metric.id } }" class="metric-link">{{ metric.title }}</RouterLink>
    </h3>

    <div class="metric-value-row">
      <span :key="metric.value" class="metric-value">{{ formatValue(metric.value) }}</span>
      <span v-if="flash && delta" class="delta-chip">
        <ArrowUpRight v-if="delta > 0" :size="14" :stroke-width="2.5" aria-hidden="true" />
        <ArrowDownRight v-else :size="14" :stroke-width="2.5" aria-hidden="true" />
        {{ formatDelta(delta) }}
      </span>
      <span v-else-if="flash" class="delta-chip new">New</span>
    </div>

    <div class="metric-spark">
      <SparkLine :series="series" :color="color" :now="now" />
    </div>

    <footer class="metric-foot">
      <time :datetime="metric.updatedAt" :title="fullDate(metric.updatedAt)">Updated {{ relativeTime(metric.updatedAt, now) }}</time>
      <span>{{ changes === 0 ? 'No changes seen yet' : `${changes} ${changes === 1 ? 'change' : 'changes'} seen` }}</span>
    </footer>
  </article>
</template>
