<script setup>
const model = defineModel({ type: Boolean, default: false });
defineProps({ title: { type: String, default: undefined } });
</script>

<template>
  <label class="switch" :title="title">
    <input v-model="model" type="checkbox" role="switch" />
    <span class="switch-track" aria-hidden="true" />
    <slot />
  </label>
</template>
