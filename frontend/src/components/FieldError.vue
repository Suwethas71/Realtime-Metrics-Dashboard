<script setup>
import { AlertCircle } from 'lucide-vue-next';

defineProps({ error: { type: Object, default: null } });
</script>

<template>
  <p v-if="error" class="field-error" role="alert">
    <AlertCircle :size="14" aria-hidden="true" />
    <span>{{ error.message }}</span>
    <span class="source-tag" :class="error.source">{{ error.source === 'server' ? 'From API' : 'Browser check' }}</span>
  </p>
</template>
