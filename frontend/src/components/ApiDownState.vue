<script setup>
import { RefreshCw, ServerCrash } from 'lucide-vue-next';

defineProps({ error: { type: Object, default: null } });
defineEmits(['retry']);
</script>

<template>
  <div class="panel api-down">
    <div class="empty">
      <div class="empty-icon"><ServerCrash :size="22" aria-hidden="true" /></div>
      <h3>Can’t reach the metrics API</h3>
      <p>{{ error?.message || 'The backend did not respond.' }}</p>
      <div class="api-steps">
        <p>Start it from the project root:</p>
        <pre class="mono">cd backend
npm run dev</pre>
      </div>
      <button type="button" class="btn btn-primary" @click="$emit('retry')">
        <RefreshCw :size="16" /> Try again
      </button>
    </div>
  </div>
</template>
