import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { api } from '../api/client';
import { ACTIVITY_LIMIT, CATEGORIES, DEFAULT_POLL_MS, HISTORY_LIMIT, STATUSES, STATUS_RANK } from '../lib/constants';

const SESSION_KEY = 'rmd-session-v1';
const HEALTH_MS = 15000;
const SIMULATOR_MS = 2500;
const FLASH_MS = 2400;

// History and the change log live only in this browser (the API keeps no
// history), so they are kept in sessionStorage to survive a page reload.
function loadSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (saved && typeof saved.history === 'object' && Array.isArray(saved.activity)) return saved;
  } catch {
    // Corrupt or unavailable storage: start fresh.
  }
  return { history: {}, activity: [] };
}

/**
 * Compares two snapshots of the metric list and describes what changed.
 * The backend has no change feed, so every update the UI reports is
 * detected here, between consecutive polls.
 */
function diffSnapshots(prevById, nextList, sourceFor, makeEvent) {
  const events = [];
  const seen = new Set();

  for (const metric of nextList) {
    seen.add(metric.id);
    const prev = prevById.get(metric.id);
    const base = { metricId: metric.id, title: metric.title, source: sourceFor(metric.id) };
    if (!prev) {
      events.push(makeEvent({ ...base, type: 'created', to: metric.value }));
      continue;
    }
    if (prev.value !== metric.value) events.push(makeEvent({ ...base, type: 'value', from: prev.value, to: metric.value }));
    if (prev.status !== metric.status) events.push(makeEvent({ ...base, type: 'status', from: prev.status, to: metric.status }));
    if (prev.title !== metric.title || prev.category !== metric.category) {
      events.push(makeEvent({ ...base, type: 'details', from: prev.title, to: metric.title }));
    }
  }

  for (const [id, prev] of prevById) {
    if (!seen.has(id)) {
      events.push(makeEvent({ type: 'deleted', metricId: id, title: prev.title, from: prev.value, source: sourceFor(id) }));
    }
  }
  return events;
}

/**
 * Central metrics store (Pinia, setup syntax). Owns the live polling loop,
 * the client-side value history, the change log, API health and every
 * create/update/delete call, so all views read one reactive source.
 */
export const useMetricsStore = defineStore('metrics', () => {
  const session = loadSession();
  let eventSeq = session.activity.reduce((max, e) => Math.max(max, e.key || 0), 0);
  const makeEvent = (event) => ({ key: ++eventSeq, at: Date.now(), ...event });

  // ---------- state ----------
  const metrics = ref([]);
  const phase = ref('loading'); // loading | ready | error (error only before the first success)
  const error = ref(null); // latest poll failure, cleared on success
  const lastSyncedAt = ref(null);
  const history = ref(session.history); // { [id]: [{ t, v }] } values seen by this browser
  const flashes = ref({}); // { [id]: { at, delta } } recent changes to highlight
  const activity = ref(session.activity);
  const pollMs = ref(DEFAULT_POLL_MS);
  const paused = ref(false);
  const tabVisible = ref(document.visibilityState !== 'hidden');
  const simulating = ref(false);
  const health = ref({ online: null, checkedAt: null });

  let snapshot = null; // Map<id, metric> from the last successful poll
  const intents = new Map(); // id -> source of a write made from this tab
  let inFlight = null;

  // ---------- getters ----------
  const live = computed(() => !paused.value && tabVisible.value);
  const byId = computed(() => new Map(metrics.value.map((m) => [m.id, m])));
  const statusCounts = computed(() =>
    Object.fromEntries(STATUSES.map((s) => [s, metrics.value.filter((m) => m.status === s).length]))
  );
  const categoryCounts = computed(() => {
    const counts = { ALL: metrics.value.length };
    for (const c of CATEGORIES) counts[c] = metrics.value.filter((m) => m.category === c).length;
    return counts;
  });
  const needsAttention = computed(() =>
    metrics.value.filter((m) => m.status !== 'ACTIVE').sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])
  );
  const offline = computed(() => Boolean(error.value) && phase.value !== 'loading');

  function seriesFor(id) {
    return history.value[id] || [];
  }

  function eventsFor(id) {
    return activity.value.filter((e) => e.metricId === id);
  }

  // ---------- polling ----------
  function sourceFor(id) {
    const source = intents.get(id);
    intents.delete(id);
    return source || 'api';
  }

  async function refresh() {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const { data } = await api.listMetrics();
        const now = Date.now();

        if (snapshot) {
          const events = diffSnapshots(snapshot, data, sourceFor, makeEvent);
          if (events.length) {
            activity.value = [...events.reverse(), ...activity.value].slice(0, ACTIVITY_LIMIT);
            const next = { ...flashes.value };
            for (const e of events) {
              if (e.type === 'value') next[e.metricId] = { at: now, delta: e.to - e.from };
              if (e.type === 'created') next[e.metricId] = { at: now, delta: null };
            }
            flashes.value = next;
          }
        }

        const nextHistory = {};
        for (const metric of data) {
          const series = history.value[metric.id] || [];
          const last = series[series.length - 1];
          nextHistory[metric.id] =
            last && last.v === metric.value ? series : [...series, { t: now, v: metric.value }].slice(-HISTORY_LIMIT);
        }
        history.value = nextHistory;

        snapshot = new Map(data.map((m) => [m.id, m]));
        metrics.value = data;
        lastSyncedAt.value = now;
        error.value = null;
        phase.value = 'ready';
        health.value = { online: true, checkedAt: now };
      } catch (err) {
        error.value = err;
        if (phase.value !== 'ready') phase.value = 'error';
        if (err.isNetwork || err.status >= 500) health.value = { online: false, checkedAt: Date.now() };
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  }

  let pollTimer = null;
  let healthTimer = null;
  let flashTimer = null;
  let simTimer = null;

  function schedulePolling() {
    clearInterval(pollTimer);
    pollTimer = null;
    if (live.value) pollTimer = setInterval(refresh, pollMs.value);
  }

  async function checkHealth() {
    try {
      await api.health();
      health.value = { online: true, checkedAt: Date.now() };
    } catch {
      health.value = { online: false, checkedAt: Date.now() };
    }
  }

  const onVisibility = () => {
    tabVisible.value = document.visibilityState !== 'hidden';
  };

  /** Starts polling, health checks and visibility tracking. Called once by App. */
  function start() {
    refresh();
    schedulePolling();
    checkHealth();
    healthTimer = setInterval(checkHealth, HEALTH_MS);
    document.addEventListener('visibilitychange', onVisibility);
  }

  function stop() {
    clearInterval(pollTimer);
    clearInterval(healthTimer);
    clearInterval(simTimer);
    clearTimeout(flashTimer);
    document.removeEventListener('visibilitychange', onVisibility);
  }

  // Reactivity drives the loop: changing the interval, pausing, or hiding
  // the tab reschedules polling; resuming fetches immediately.
  watch([pollMs, live], ([, isLive], [, wasLive]) => {
    if (isLive && !wasLive) refresh();
    schedulePolling();
  });

  watch(flashes, (map) => {
    clearTimeout(flashTimer);
    if (!Object.keys(map).length) return;
    flashTimer = setTimeout(() => {
      const cutoff = Date.now() - FLASH_MS;
      flashes.value = Object.fromEntries(Object.entries(flashes.value).filter(([, f]) => f.at > cutoff));
    }, FLASH_MS);
  });

  watch(
    [history, activity],
    () => {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ history: history.value, activity: activity.value }));
      } catch {
        // Storage full or blocked: the session just won't survive a reload.
      }
    },
    { deep: false }
  );

  // Demo simulator: writes small random changes through the real API so the
  // live feed has something to show. Off by default.
  watch(simulating, (on) => {
    clearInterval(simTimer);
    if (!on) return;
    simTimer = setInterval(async () => {
      const list = metrics.value;
      if (!list.length) return;
      const metric = list[Math.floor(Math.random() * list.length)];
      const drift = 1 + (Math.random() * 0.08 - 0.04);
      const value = Math.round(metric.value * drift * 100) / 100 || Math.round(Math.random() * 100);
      intents.set(metric.id, 'simulator');
      try {
        await api.updateMetric(metric.id, { title: metric.title, value, category: metric.category, status: metric.status });
      } catch {
        intents.delete(metric.id);
      }
      refresh();
    }, SIMULATOR_MS);
  });

  // ---------- actions ----------
  async function createMetric(payload) {
    const { data } = await api.createMetric(payload);
    intents.set(data.id, 'you');
    await refresh();
    return data;
  }

  async function updateMetric(id, payload) {
    intents.set(id, 'you');
    try {
      const { data } = await api.updateMetric(id, payload);
      await refresh();
      return data;
    } catch (err) {
      intents.delete(id);
      throw err;
    }
  }

  async function deleteMetric(id) {
    intents.set(id, 'you');
    try {
      const { data } = await api.deleteMetric(id);
      await refresh();
      return data;
    } catch (err) {
      intents.delete(id);
      if (err.status === 404) await refresh();
      throw err;
    }
  }

  return {
    // state
    metrics,
    phase,
    error,
    lastSyncedAt,
    history,
    flashes,
    activity,
    pollMs,
    paused,
    tabVisible,
    simulating,
    health,
    // getters
    live,
    byId,
    statusCounts,
    categoryCounts,
    needsAttention,
    offline,
    seriesFor,
    eventsFor,
    // actions
    start,
    stop,
    refresh,
    createMetric,
    updateMetric,
    deleteMetric
  };
});
