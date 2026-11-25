<script setup>
defineProps({
  width: { type: [String, Number], default: '100%' },
  height: { type: [String, Number], default: 14 },
  radius: { type: [String, Number], default: null }
});
const px = (v) => (typeof v === 'number' ? `${v}px` : v);
</script>

<template>
  <div
    class="skeleton"
    aria-hidden="true"
    :style="{ width: px(width), height: px(height), ...(radius !== null ? { borderRadius: px(radius) } : {}) }"
  />
</template>
