<script setup>
import { useMetricsStore } from '../stores/metrics';
import ApiDownState from './ApiDownState.vue';
import StaleBanner from './StaleBanner.vue';

// Wraps a view: full-page error before the first load, a banner over stale
// data when polling fails later, otherwise just the view.
const store = useMetricsStore();
</script>

<template>
  <ApiDownState v-if="store.phase === 'error'" :error="store.error" @retry="store.refresh()" />
  <template v-else>
    <StaleBanner v-if="store.error" :error="store.error" @retry="store.refresh()" />
    <slot />
  </template>
</template>
