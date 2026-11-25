<script setup>
import { computed, useId } from 'vue';
import { extent, stepPath } from '../lib/chart';

const props = defineProps({
  series: { type: Array, default: () => [] },
  color: { type: String, default: 'var(--accent)' },
  now: { type: Number, required: true },
  height: { type: Number, default: 40 }
});

const width = 240;
const gradientId = `spark-${useId()}`;

const paths = computed(() => {
  const points = props.series;
  if (!points.length) return null;
  const start = points[0].t;
  const end = Math.max(props.now, points[points.length - 1].t + 1);
  const [min, max] = extent(points.map((p) => p.v));
  const x = (t) => ((t - start) / (end - start || 1)) * width;
  const y = (v) => props.height - 4 - ((v - min) / (max - min)) * (props.height - 8);
  const line = stepPath(points, x, y, width);
  return { line, area: `${line} V${props.height} H0 Z` };
});
</script>

<template>
  <svg
    v-if="paths"
    class="sparkline"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    :height="height"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.16" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path :d="paths.area" :fill="`url(#${gradientId})`" />
    <path :d="paths.line" fill="none" :stroke="color" stroke-width="1.75" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
  </svg>
  <div v-else :style="{ height: `${height}px` }" />
</template>
