<script setup>
import { computed } from 'vue';
import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-vue-next';
import { STATUS_META } from '../lib/constants';

const props = defineProps({ status: { type: String, required: true } });
const icons = { ACTIVE: CheckCircle2, WARNING: AlertTriangle, CRITICAL: AlertOctagon };
const meta = computed(() => STATUS_META[props.status] || { label: props.status, tone: 'active' });
const icon = computed(() => icons[props.status] || CheckCircle2);
</script>

<template>
  <span class="badge" :class="meta.tone">
    <component :is="icon" :size="13" :stroke-width="2.4" aria-hidden="true" />
    {{ meta.label }}
  </span>
</template>
