import { computed, reactive, ref } from 'vue';
import { toPayload, validateMetric } from '../lib/validate';

const FIELDS = ['title', 'value', 'category', 'status'];

/**
 * Form state and validation for creating or editing a metric.
 * Client-side rules run first (optional); the API's field errors are mapped
 * back onto the same fields, tagged with where they came from.
 */
export function useMetricForm(initial) {
  const form = reactive({ ...initial });
  const errors = reactive({}); // field -> { message, source: 'browser' | 'server' }
  const formError = ref(null);
  const lastResponse = ref(null);
  const browserChecks = ref(true);
  const submitting = ref(false);

  const payload = computed(() => toPayload(form));
  const errorCount = computed(() => Object.keys(errors).length);
  const serverRejected = computed(() => Object.values(errors).some((e) => e.source === 'server'));

  function clearErrors() {
    for (const key of Object.keys(errors)) delete errors[key];
  }

  function setField(field, value) {
    form[field] = value;
    delete errors[field];
  }

  /** Runs the browser checks. Returns true when the form may be sent. */
  function validate() {
    clearErrors();
    formError.value = null;
    if (!browserChecks.value) return true;
    const local = validateMetric(form);
    for (const [field, message] of Object.entries(local)) errors[field] = { message, source: 'browser' };
    if (Object.keys(local).length) lastResponse.value = null;
    return Object.keys(local).length === 0;
  }

  /** Maps an ApiError onto fields or the form-level message. */
  function applyServerError(err) {
    lastResponse.value = { status: err.status, message: err.message, errors: err.fieldErrors };
    if (err.isValidation) {
      for (const [field, message] of Object.entries(err.fieldMap())) errors[field] = { message, source: 'server' };
      const unmapped = err.fieldErrors.filter((e) => !FIELDS.includes(e.field));
      formError.value = unmapped.length ? unmapped.map((e) => e.issue).join(' ') : null;
    } else {
      formError.value = err.message;
    }
  }

  async function submit(send) {
    if (!validate()) return false;
    submitting.value = true;
    try {
      await send(payload.value);
      clearErrors();
      return true;
    } catch (err) {
      applyServerError(err);
      return false;
    } finally {
      submitting.value = false;
    }
  }

  return {
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
  };
}
