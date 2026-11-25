<script setup>
import { computed, ref } from 'vue';
import { extent, niceScale, stepPath, timeTicks } from '../lib/chart';
import { clockTime, formatCompact, formatValue } from '../lib/format';

const props = defineProps({
  series: { type: Array, required: true },
  color: { type: String, default: 'var(--accent)' },
  now: { type: Number, required: true },
  height: { type: Number, default: 260 }
});

const width = 760;
const pad = { top: 16, right: 16, bottom: 28, left: 64 };
const hover = ref(null);

const model = computed(() => {
  const series = props.series;
  if (!series.length) return null;
  const innerW = width - pad.left - pad.right;
  const innerH = props.height - pad.top - pad.bottom;
  const start = series[0].t;
  const end = Math.max(props.now, series[series.length - 1].t + 1000);
  const [rawMin, rawMax] = extent(series.map((p) => p.v));
  const { lo, hi, ticks } = niceScale(rawMin, rawMax);
  const x = (t) => pad.left + ((t - start) / (end - start)) * innerW;
  const y = (v) => pad.top + innerH - ((v - lo) / (hi - lo)) * innerH;
  return { x, y, ticks, times: timeTicks(start, end), d: stepPath(series, x, y, x(end)), innerH };
});

function onMove(event) {
  if (!model.value) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const px = ((event.clientX - rect.left) / rect.width) * width;
  let nearest = props.series[0];
  for (const point of props.series) if (model.value.x(point.t) <= px) nearest = point;
  hover.value = nearest;
}
</script>

<template>
  <div v-if="model" class="trend-chart">
    <svg
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="`Step chart of ${series.length} observed values`"
      @mousemove="onMove"
      @mouseleave="hover = null"
    >
      <g v-for="tick in model.ticks" :key="tick">
        <line :x1="pad.left" :x2="width - pad.right" :y1="model.y(tick)" :y2="model.y(tick)" class="grid-line" />
        <text :x="pad.left - 10" :y="model.y(tick)" class="axis-label" text-anchor="end" dominant-baseline="middle">
          {{ formatCompact(tick) }}
        </text>
      </g>
      <text
        v-for="(tick, i) in model.times"
        :key="tick"
        :x="model.x(tick)"
        :y="height - 8"
        class="axis-label"
        :text-anchor="i === 0 ? 'start' : i === model.times.length - 1 ? 'end' : 'middle'"
      >
        {{ clockTime(tick) }}
      </text>
      <path :d="model.d" fill="none" :stroke="color" stroke-width="2" stroke-linejoin="round" />
      <circle
        v-for="point in series"
        :key="point.t"
        :cx="model.x(point.t)"
        :cy="model.y(point.v)"
        r="3.5"
        fill="var(--surface)"
        :stroke="color"
        stroke-width="2"
      />
      <g v-if="hover">
        <line :x1="model.x(hover.t)" :x2="model.x(hover.t)" :y1="pad.top" :y2="pad.top + model.innerH" class="hover-line" />
        <circle :cx="model.x(hover.t)" :cy="model.y(hover.v)" r="5" :fill="color" />
      </g>
    </svg>
    <div class="trend-readout" aria-live="polite">
      <template v-if="hover"><strong>{{ formatValue(hover.v) }}</strong> at {{ clockTime(hover.t) }}</template>
      <template v-else>Hover the chart to read a value</template>
    </div>
  </div>
</template>
