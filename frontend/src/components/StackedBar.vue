<script setup>
import { computed } from 'vue';

const props = defineProps({
  parts: { type: Array, required: true }, // [{ key, label, value, color }]
  label: { type: String, required: true }
});
const total = computed(() => props.parts.reduce((sum, p) => sum + p.value, 0));
const pct = (v) => (total.value ? Math.round((v / total.value) * 100) : 0);
</script>

<template>
  <div class="stacked">
    <div class="stacked-bar" role="img" :aria-label="label">
      <span v-if="total === 0" class="stacked-empty" />
      <template v-else>
        <span
          v-for="p in parts.filter((p) => p.value > 0)"
          :key="p.key"
          :style="{ flexGrow: p.value, background: p.color }"
          :title="`${p.label}: ${p.value}`"
        />
      </template>
    </div>
    <ul class="stacked-legend">
      <li v-for="p in parts" :key="p.key">
        <span class="dot" :style="{ '--dot': p.color, borderRadius: '50%' }" aria-hidden="true" />
        <span class="legend-label">{{ p.label }}</span>
        <span class="legend-value">{{ p.value }}</span>
        <span class="legend-pct">{{ pct(p.value) }}%</span>
      </li>
    </ul>
  </div>
</template>
