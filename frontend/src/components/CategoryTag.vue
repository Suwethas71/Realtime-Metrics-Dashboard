<script setup>
import { computed } from 'vue';
import { CATEGORY_META } from '../lib/constants';

const props = defineProps({ category: { type: String, required: true } });
const meta = computed(() => CATEGORY_META[props.category] || { label: props.category, color: 'var(--text-3)' });
</script>

<template>
  <span class="cat-tag">
    <span class="dot" :style="{ '--dot': meta.color }" aria-hidden="true" />
    {{ meta.label }}
  </span>
</template>
