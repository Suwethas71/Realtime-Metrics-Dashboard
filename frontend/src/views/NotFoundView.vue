<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Compass } from 'lucide-vue-next';
import EmptyState from '../components/EmptyState.vue';

const route = useRoute();
// /metrics/<something that is not a positive integer> lands here because the
// dynamic route only matches digits.
const badMetricId = computed(() => route.path.startsWith('/metrics/'));
</script>

<template>
  <div class="panel">
    <EmptyState :icon="Compass" :title="badMetricId ? 'That is not a valid metric ID' : 'This page doesn’t exist'">
      <template v-if="badMetricId">Metric IDs are positive whole numbers, like <span class="mono">/metrics/2</span>.</template>
      <template v-else>Use the navigation to open the dashboard, analytics or the metrics list.</template>
      <template #action>
        <RouterLink :to="badMetricId ? '/manage' : '/'" class="btn btn-primary">
          {{ badMetricId ? 'Back to all metrics' : 'Back to the dashboard' }}
        </RouterLink>
      </template>
    </EmptyState>
  </div>
</template>
