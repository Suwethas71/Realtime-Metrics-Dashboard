<script setup>
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue';
import { AlertCircle, Loader2, ShieldCheck, X } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useMetricsStore } from '../stores/metrics';
import { useEditorStore } from '../stores/editor';
import { useMetricForm } from '../composables/useMetricForm';
import { CATEGORIES, CATEGORY_META, STATUSES, STATUS_META, TITLE_MAX } from '../lib/constants';
import ChoiceGroup from './ChoiceGroup.vue';
import FieldError from './FieldError.vue';
import ToggleSwitch from './ToggleSwitch.vue';

const CLOSE_MS = 200;

const store = useMetricsStore();
const editor = useEditorStore();
const uid = useId();
const dialog = ref(null);
const titleInput = ref(null);
const closing = ref(false);

const isEdit = editor.mode === 'edit' && editor.metric;
const source = editor.metric;
const {
  form,
  errors,
  formError,
  lastResponse,
  browserChecks,
  submitting,
  payload,
  errorCount,
  serverRejected,
  setField,
  submit
} = useMetricForm(
  isEdit
    ? { title: source.title, value: String(source.value), category: source.category, status: source.status }
    : { title: '', value: '', category: editor.preset?.category || '', status: 'ACTIVE' }
);

// Clear a field's error as soon as the user changes it.
for (const field of ['title', 'value', 'category', 'status']) {
  watch(
    () => form[field],
    () => {
      delete errors[field];
    }
  );
}

const vanished = computed(() => isEdit && !store.byId.has(source.id));
const endpoint = isEdit ? `PUT /api/v1/dashboard/metrics/${source.id}` : 'POST /api/v1/dashboard/metrics';
const responseJson = computed(() =>
  lastResponse.value
    ? JSON.stringify(
        {
          success: false,
          message: lastResponse.value.message,
          ...(lastResponse.value.errors?.length ? { errors: lastResponse.value.errors } : {})
        },
        null,
        2
      )
    : ''
);

// The native <dialog> gives focus trapping, Esc and an inert background.
async function openDialog() {
  if (!dialog.value || dialog.value.open) return;
  dialog.value.showModal();
  await nextTick();
  titleInput.value?.focus();
}

onMounted(() => {
  if (editor.open) openDialog();
});

watch(
  () => editor.open,
  (open) => {
    if (open) return openDialog();
    if (!dialog.value?.open) return;
    closing.value = true;
    setTimeout(() => {
      dialog.value?.close();
      closing.value = false;
    }, CLOSE_MS);
  }
);

function requestClose() {
  if (!submitting.value) editor.close();
}

function onBackdrop(event) {
  if (event.target === dialog.value) requestClose();
}

async function onSubmit() {
  const ok = await submit(async (body) => {
    if (isEdit) {
      await store.updateMetric(source.id, body);
      toast.success('Metric updated', { description: form.title.trim() });
    } else {
      const created = await store.createMetric(body);
      toast.success('Metric created', { description: `${created.title} · ID ${created.id}` });
    }
  });
  if (ok) editor.close();
}

const ids = {
  heading: `${uid}-heading`,
  title: `${uid}-title`,
  value: `${uid}-value`,
  titleErr: `${uid}-title-err`,
  valueErr: `${uid}-value-err`,
  categoryErr: `${uid}-category-err`,
  statusErr: `${uid}-status-err`
};
</script>

<template>
  <dialog
    ref="dialog"
    class="drawer"
    :class="{ closing }"
    :aria-labelledby="ids.heading"
    @cancel.prevent="requestClose"
    @click="onBackdrop"
  >
    <form class="drawer-panel" novalidate @submit.prevent="onSubmit">
      <header class="drawer-head">
        <div>
          <h2 :id="ids.heading">{{ isEdit ? 'Edit metric' : 'New metric' }}</h2>
          <p v-if="isEdit">ID <span class="mono">{{ source.id }}</span> · changes are saved with a full update</p>
          <p v-else>Added to the live feed as soon as the API accepts it.</p>
        </div>
        <button type="button" class="btn btn-icon btn-ghost" aria-label="Close" @click="requestClose">
          <X :size="18" />
        </button>
      </header>

      <div class="drawer-body">
        <div v-if="vanished" class="banner info">
          <AlertCircle :size="18" aria-hidden="true" />
          <p>This metric was deleted elsewhere. Saving will return “not found”.</p>
        </div>

        <div v-if="serverRejected" class="banner error" role="alert">
          <ShieldCheck :size="18" aria-hidden="true" />
          <p>
            <strong>The API rejected this request.</strong>
            {{ errorCount }} {{ errorCount === 1 ? 'field needs' : 'fields need' }} attention.
          </p>
        </div>

        <div v-if="formError" class="banner error" role="alert">
          <AlertCircle :size="18" aria-hidden="true" />
          <p>{{ formError }}</p>
        </div>

        <div class="field">
          <label class="field-label" :for="ids.title">
            Title
            <span class="hint">{{ form.title.trim().length }}/{{ TITLE_MAX }}</span>
          </label>
          <input
            :id="ids.title"
            ref="titleInput"
            v-model="form.title"
            class="input"
            placeholder="e.g. Checkout Conversion Rate"
            autocomplete="off"
            :aria-invalid="Boolean(errors.title)"
            :aria-describedby="errors.title ? ids.titleErr : undefined"
          />
          <div :id="ids.titleErr"><FieldError :error="errors.title" /></div>
        </div>

        <div class="field">
          <label class="field-label" :for="ids.value">
            Value
            <span class="hint">Any number, decimals allowed</span>
          </label>
          <input
            :id="ids.value"
            v-model="form.value"
            class="input value-input"
            placeholder="e.g. 3.42"
            inputmode="decimal"
            autocomplete="off"
            :aria-invalid="Boolean(errors.value)"
            :aria-describedby="errors.value ? ids.valueErr : undefined"
          />
          <div :id="ids.valueErr"><FieldError :error="errors.value" /></div>
        </div>

        <ChoiceGroup
          v-model="form.category"
          :name="`${uid}-category`"
          label="Category"
          :options="CATEGORIES"
          :error="errors.category"
          :error-id="ids.categoryErr"
        >
          <template #default="{ option }">
            <span class="dot" :style="{ '--dot': CATEGORY_META[option].color }" aria-hidden="true" />
            {{ CATEGORY_META[option].label }}
          </template>
        </ChoiceGroup>

        <ChoiceGroup
          v-model="form.status"
          :name="`${uid}-status`"
          label="Status"
          :options="STATUSES"
          :error="errors.status"
          :error-id="ids.statusErr"
        >
          <template #default="{ option }">
            <span class="status-mark" :class="STATUS_META[option].tone" aria-hidden="true" />
            {{ STATUS_META[option].label }}
          </template>
        </ChoiceGroup>

        <div class="validation-mode">
          <ToggleSwitch v-model="browserChecks">Check in the browser before sending</ToggleSwitch>
          <p v-if="browserChecks">Mistakes are caught here first. The API still validates every request.</p>
          <p v-else>Requests go straight to the API, so you can see its own validation errors.</p>
        </div>

        <details class="request-preview">
          <summary>Request preview</summary>
          <div class="code-block">
            <div class="code-line mono">{{ endpoint }}</div>
            <pre class="mono">{{ JSON.stringify(payload, null, 2) }}</pre>
          </div>
          <div v-if="lastResponse" class="code-block response">
            <div class="code-line mono">Response {{ lastResponse.status || 'network error' }}</div>
            <pre class="mono">{{ responseJson }}</pre>
          </div>
        </details>
      </div>

      <footer class="drawer-foot">
        <button type="button" class="btn btn-ghost" :disabled="submitting" @click="requestClose">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          <Loader2 v-if="submitting" :size="16" class="spin" aria-hidden="true" />
          {{ submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create metric' }}
        </button>
      </footer>
    </form>
  </dialog>
</template>
