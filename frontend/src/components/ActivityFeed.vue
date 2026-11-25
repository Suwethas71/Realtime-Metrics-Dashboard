<script setup>
import { computed } from 'vue';
import { ArrowRight, CirclePlus, PenLine, RefreshCcw, Trash2, Zap } from 'lucide-vue-next';
import { STATUS_META } from '../lib/constants';
import { clockTime, formatValue, relativeTime } from '../lib/format';
import EmptyState from './EmptyState.vue';

const props = defineProps({
  events: { type: Array, required: true },
  now: { type: Number, required: true },
  limit: { type: Number, default: 0 },
  compact: { type: Boolean, default: false },
  emptyText: {
    type: String,
    default: 'Changes appear here the moment a poll detects them: edits from this browser, other clients, or the simulator.'
  }
});

const TYPES = {
  created: { icon: CirclePlus, tone: 'created' },
  value: { icon: RefreshCcw, tone: 'value' },
  status: { icon: Zap, tone: 'status' },
  details: { icon: PenLine, tone: 'details' },
  deleted: { icon: Trash2, tone: 'deleted' }
};
const SOURCE_LABEL = { you: 'You', simulator: 'Simulator', api: 'API' };
const SOURCE_TITLE = {
  you: 'Made from this browser',
  simulator: 'Written by the demo simulator',
  api: 'Detected by polling: made from another client'
};

const list = computed(() => (props.limit ? props.events.slice(0, props.limit) : props.events));
</script>

<template>
  <EmptyState v-if="!list.length" :icon="RefreshCcw" title="Waiting for changes">{{ emptyText }}</EmptyState>
  <ol v-else class="activity" :class="{ compact }">
    <li v-for="event in list" :key="event.key" class="activity-item">
      <span class="activity-icon" :class="(TYPES[event.type] || TYPES.value).tone" aria-hidden="true">
        <component :is="(TYPES[event.type] || TYPES.value).icon" :size="14" :stroke-width="2.3" />
      </span>
      <div class="activity-text">
        <p>
          <RouterLink
            v-if="event.type !== 'deleted'"
            :to="{ name: 'metric', params: { id: event.metricId } }"
            class="activity-title"
            >{{ event.title }}</RouterLink
          >
          <strong v-else>{{ event.title }}</strong>
          <template v-if="event.type === 'created'"> was created at <span class="num">{{ formatValue(event.to) }}</span></template>
          <template v-else-if="event.type === 'value'">
            {{ ' ' }}<span class="num">{{ formatValue(event.from) }}</span>
            <ArrowRight :size="13" class="arrow" aria-label="to" />
            <span class="num">{{ formatValue(event.to) }}</span>
          </template>
          <template v-else-if="event.type === 'status'">
            {{ ' ' }}is now
            <span class="status-word" :class="STATUS_META[event.to]?.tone">{{ STATUS_META[event.to]?.label || event.to }}</span>
          </template>
          <template v-else-if="event.type === 'details'"> details were edited</template>
          <template v-else-if="event.type === 'deleted'"> was deleted</template>
        </p>
        <div class="activity-meta">
          <span class="source" :class="event.source" :title="SOURCE_TITLE[event.source]">{{ SOURCE_LABEL[event.source] || 'API' }}</span>
          <time :title="clockTime(event.at)">{{ relativeTime(event.at, now) }}</time>
        </div>
      </div>
    </li>
  </ol>
</template>
