<script setup>
import { WifiOff } from 'lucide-vue-next';

defineProps({ error: { type: Object, required: true } });
defineEmits(['retry']);
</script>

<template>
  <div class="banner error" role="alert">
    <WifiOff :size="18" aria-hidden="true" />
    <p><strong>Live updates stopped.</strong> {{ error.message }} Showing the last data received.</p>
    <button type="button" class="btn btn-sm" @click="$emit('retry')">Retry now</button>
  </div>
</template>
