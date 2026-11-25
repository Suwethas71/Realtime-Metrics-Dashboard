<script setup>
defineProps({
  icon: { type: [Object, Function], default: null },
  title: { type: String, required: true }
});
</script>

<template>
  <div class="empty">
    <div v-if="icon" class="empty-icon">
      <component :is="icon" :size="22" aria-hidden="true" />
    </div>
    <h3>{{ title }}</h3>
    <p v-if="$slots.default"><slot /></p>
    <slot name="action" />
  </div>
</template>
