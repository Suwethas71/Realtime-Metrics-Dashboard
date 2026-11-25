<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Pencil, Plus, Search, SearchX, Trash2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useMetricsStore } from '../stores/metrics';
import { useEditorStore } from '../stores/editor';
import { CATEGORIES, CATEGORY_META, STATUSES, STATUS_META, STATUS_RANK } from '../lib/constants';
import { formatValue, fullDate, relativeTime } from '../lib/format';
import { useNow } from '../composables/useNow';
import CategoryTag from '../components/CategoryTag.vue';
import EmptyState from '../components/EmptyState.vue';
import PageState from '../components/PageState.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';
import StatusBadge from '../components/StatusBadge.vue';

const store = useMetricsStore();
const editor = useEditorStore();
const router = useRouter();
const now = useNow(5000);

const COLUMNS = [
  { key: 'id', label: 'ID', numeric: true },
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category' },
  { key: 'value', label: 'Value', numeric: true },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Updated' }
];
const compare = {
  id: (a, b) => a.id - b.id,
  title: (a, b) => a.title.localeCompare(b.title),
  category: (a, b) => a.category.localeCompare(b.category),
  value: (a, b) => a.value - b.value,
  status: (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  updatedAt: (a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt)
};

const filters = reactive({ query: '', category: 'ALL', status: 'ALL' });
const sort = reactive({ key: 'id', dir: 'asc' });

const rows = computed(() => {
  const q = filters.query.trim().toLowerCase();
  const fn = compare[sort.key];
  return store.metrics
    .filter(
      (m) =>
        (filters.category === 'ALL' || m.category === filters.category) &&
        (filters.status === 'ALL' || m.status === filters.status) &&
        (!q || m.title.toLowerCase().includes(q) || String(m.id) === q)
    )
    .sort((a, b) => (sort.dir === 'asc' ? fn(a, b) : fn(b, a)));
});

function toggleSort(key) {
  if (sort.key === key) sort.dir = sort.dir === 'asc' ? 'desc' : 'asc';
  else Object.assign(sort, { key, dir: key === 'updatedAt' ? 'desc' : 'asc' });
}
const ariaSort = (key) => (sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');
const sortIcon = (key) => (sort.key !== key ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown);

function clearFilters() {
  Object.assign(filters, { query: '', category: 'ALL', status: 'ALL' });
}

// Inline delete confirmation: one row at a time.
const confirmingId = ref(null);
const deletingId = ref(null);

async function confirmDelete(metric) {
  deletingId.value = metric.id;
  try {
    await store.deleteMetric(metric.id);
    toast.success('Metric deleted', { description: metric.title });
  } catch (err) {
    toast.error('Could not delete metric', { description: err.message });
  } finally {
    deletingId.value = null;
    confirmingId.value = null;
  }
}

// Look up by ID: navigates to the dynamic route, which validates the ID.
const lookupId = ref('');
function lookup() {
  const id = lookupId.value.trim();
  router.push(/^\d+$/.test(id) && Number(id) > 0 ? { name: 'metric', params: { id } } : `/metrics/${encodeURIComponent(id || ' ')}`);
}
</script>

<template>
  <PageState>
    <div class="manage">
      <section class="panel table-panel" aria-labelledby="table-heading">
        <h2 id="table-heading" class="visually-hidden">All metrics</h2>
        <div class="table-toolbar">
          <div class="search">
            <Search :size="16" aria-hidden="true" />
            <label class="visually-hidden" for="metric-search">Search metrics</label>
            <input id="metric-search" v-model="filters.query" class="input" type="search" placeholder="Search by title or ID" />
          </div>
          <label class="filter">
            <span class="visually-hidden">Category</span>
            <select v-model="filters.category" class="select">
              <option value="ALL">All categories</option>
              <option v-for="c in CATEGORIES" :key="c" :value="c">{{ CATEGORY_META[c].label }}</option>
            </select>
          </label>
          <label class="filter">
            <span class="visually-hidden">Status</span>
            <select v-model="filters.status" class="select">
              <option value="ALL">All statuses</option>
              <option v-for="s in STATUSES" :key="s" :value="s">{{ STATUS_META[s].label }}</option>
            </select>
          </label>
          <p class="table-count">{{ store.phase === 'loading' ? 'Loading…' : `${rows.length} of ${store.metrics.length}` }}</p>
        </div>

        <div class="table-scroll">
          <table class="metrics-table">
            <thead>
              <tr>
                <th v-for="col in COLUMNS" :key="col.key" scope="col" :class="{ num: col.numeric }" :aria-sort="ariaSort(col.key)">
                  <button type="button" class="sort-btn" :class="{ active: sort.key === col.key }" @click="toggleSort(col.key)">
                    {{ col.label }}
                    <component :is="sortIcon(col.key)" :size="13" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" class="actions-col"><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="store.phase === 'loading'">
                <tr v-for="i in 4" :key="i">
                  <td v-for="col in COLUMNS" :key="col.key"><SkeletonBlock :width="col.key === 'title' ? '80%' : 48" /></td>
                  <td />
                </tr>
              </template>
              <template v-else>
              <tr v-for="m in rows" :key="m.id" :class="{ 'row-changed': store.flashes[m.id] }">
                <td class="num id-cell">{{ m.id }}</td>
                <td class="title-cell">
                  <RouterLink :to="{ name: 'metric', params: { id: m.id } }" class="row-link">{{ m.title }}</RouterLink>
                </td>
                <td><CategoryTag :category="m.category" /></td>
                <td class="num value-cell">{{ formatValue(m.value) }}</td>
                <td><StatusBadge :status="m.status" /></td>
                <td class="updated-cell">
                  <time :datetime="m.updatedAt" :title="fullDate(m.updatedAt)">{{ relativeTime(m.updatedAt, now) }}</time>
                </td>
                <td class="actions-col">
                  <div v-if="confirmingId === m.id" class="row-confirm" role="group" :aria-label="`Confirm deleting ${m.title}`">
                    <span>Delete?</span>
                    <button type="button" class="btn btn-sm btn-ghost" :disabled="deletingId === m.id" @click="confirmingId = null">
                      Cancel
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" :disabled="deletingId === m.id" @click="confirmDelete(m)">
                      <Loader2 v-if="deletingId === m.id" :size="14" class="spin" aria-hidden="true" />
                      <Trash2 v-else :size="14" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                  <div v-else class="row-actions">
                    <button type="button" class="btn btn-sm btn-ghost" :aria-label="`Edit ${m.title}`" @click="editor.openEdit(m)">
                      <Pencil :size="14" aria-hidden="true" /> Edit
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-ghost danger-ghost"
                      :aria-label="`Delete ${m.title}`"
                      @click="confirmingId = m.id"
                    >
                      <Trash2 :size="14" aria-hidden="true" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
              </template>
            </tbody>
          </table>

          <EmptyState
            v-if="store.phase === 'ready' && !rows.length"
            :icon="SearchX"
            :title="store.metrics.length ? 'No metrics match these filters' : 'No metrics yet'"
          >
            {{ store.metrics.length ? 'Try another search term, category or status.' : 'Create a metric to see it here.' }}
            <template #action>
              <button v-if="store.metrics.length" type="button" class="btn" @click="clearFilters">Clear filters</button>
              <button v-else type="button" class="btn btn-primary" @click="editor.openCreate()">
                <Plus :size="16" :stroke-width="2.5" /> Create the first metric
              </button>
            </template>
          </EmptyState>
        </div>
      </section>

      <section class="panel" aria-labelledby="lookup-heading">
        <div class="panel-head">
          <div>
            <h2 id="lookup-heading" class="panel-title">Open a metric by ID</h2>
            <p class="panel-sub">
              Opens <span class="mono">/metrics/:id</span>, which loads it with
              <span class="mono">GET /api/v1/dashboard/metrics/:id</span>. Try a missing ID to see the API’s answer.
            </p>
          </div>
        </div>
        <div class="panel-body lookup">
          <form class="lookup-form" @submit.prevent="lookup">
            <label class="visually-hidden" for="lookup-id">Metric ID</label>
            <input id="lookup-id" v-model="lookupId" class="input" placeholder="e.g. 2" autocomplete="off" inputmode="numeric" />
            <button type="submit" class="btn"><Search :size="16" /> Open</button>
          </form>
        </div>
      </section>
    </div>
  </PageState>
</template>
