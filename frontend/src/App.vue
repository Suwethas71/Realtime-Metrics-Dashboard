<script setup>
import { onBeforeUnmount, onMounted } from 'vue';
import { Toaster } from 'vue-sonner';
import AppLayout from './components/AppLayout.vue';
import MetricDrawer from './components/MetricDrawer.vue';
import { useMetricsStore } from './stores/metrics';
import { useEditorStore } from './stores/editor';

const metrics = useMetricsStore();
const editor = useEditorStore();

onMounted(() => metrics.start());
onBeforeUnmount(() => metrics.stop());
</script>

<template>
  <AppLayout />
  <MetricDrawer :key="editor.session" />
  <Toaster position="bottom-right" rich-colors close-button :duration="3500" />
</template>
