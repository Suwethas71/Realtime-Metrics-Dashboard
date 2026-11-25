<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Activity, BarChart3, LayoutDashboard, Pause, Play, Plus, RefreshCw, TableProperties } from 'lucide-vue-next';
import { useMetricsStore } from '../stores/metrics';
import { useEditorStore } from '../stores/editor';
import { POLL_OPTIONS } from '../lib/constants';
import { relativeTime } from '../lib/format';
import { useNow } from '../composables/useNow';

const route = useRoute();
const store = useMetricsStore();
const editor = useEditorStore();
const now = useNow(1000);

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/manage', label: 'Manage metrics', icon: TableProperties }
];

const healthState = computed(() =>
  store.health.online === null ? 'checking' : store.health.online ? 'online' : 'offline'
);
const healthLabel = computed(
  () => ({ checking: 'Checking API…', online: 'API online', offline: 'API unreachable' })[healthState.value]
);

const liveState = computed(() => {
  if (store.offline) return 'offline';
  if (store.paused || !store.tabVisible) return 'paused';
  return 'live';
});

const liveText = computed(() => {
  const synced = store.lastSyncedAt ? relativeTime(store.lastSyncedAt, now.value) : null;
  if (liveState.value === 'offline') return synced ? `Offline · last sync ${synced}` : 'Offline';
  if (store.paused) return 'Updates paused';
  if (!store.tabVisible) return 'Paused in background';
  return synced ? `Synced ${synced}` : 'Connecting…';
});
</script>

<template>
  <div class="shell">
    <aside class="rail">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true"><Activity :size="18" :stroke-width="2.4" /></span>
        <div>
          <div class="brand-name">Realtime Metrics</div>
          <div class="brand-sub">SKCET · Team 7</div>
        </div>
      </div>

      <nav class="nav" aria-label="Main">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :active-class="item.exact ? '' : 'active'"
          :exact-active-class="'active'"
        >
          <component :is="item.icon" :size="18" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="health" :class="healthState" role="status">
        <span class="health-dot" aria-hidden="true" />
        <div>
          <div class="health-label">{{ healthLabel }}</div>
          <div class="health-host mono">localhost:5000</div>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-heading">
          <h1>{{ route.meta.title }}</h1>
          <p v-if="route.meta.sub">{{ route.meta.sub }}</p>
        </div>
        <div class="topbar-actions">
          <div class="live-control">
            <div class="live-pill" :class="liveState" role="status" aria-live="polite">
              <span class="live-dot" aria-hidden="true" />
              <span class="live-word">{{ liveState === 'live' ? 'Live' : liveState === 'offline' ? 'Offline' : 'Paused' }}</span>
              <span class="live-text">{{ liveText }}</span>
            </div>
            <div class="segmented" role="radiogroup" aria-label="Refresh interval">
              <button
                v-for="option in POLL_OPTIONS"
                :key="option.value"
                type="button"
                role="radio"
                :aria-checked="store.pollMs === option.value"
                :title="`Refresh every ${option.label}`"
                @click="store.pollMs = option.value"
              >
                {{ option.label }}
              </button>
            </div>
            <button
              type="button"
              class="btn btn-icon btn-ghost"
              :aria-label="store.paused ? 'Resume live updates' : 'Pause live updates'"
              :title="store.paused ? 'Resume live updates' : 'Pause live updates'"
              @click="store.paused = !store.paused"
            >
              <Play v-if="store.paused" :size="16" />
              <Pause v-else :size="16" />
            </button>
            <button type="button" class="btn btn-icon btn-ghost" aria-label="Refresh now" title="Refresh now" @click="store.refresh()">
              <RefreshCw :size="16" />
            </button>
          </div>
          <button type="button" class="btn btn-primary" @click="editor.openCreate()">
            <Plus :size="16" :stroke-width="2.5" />
            New metric
          </button>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
