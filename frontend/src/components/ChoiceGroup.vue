<script setup>
import FieldError from './FieldError.vue';

// Real radio inputs styled as a row of choices; v-model carries the value.
const model = defineModel({ type: String, default: '' });
defineProps({
  name: { type: String, required: true },
  label: { type: String, required: true },
  options: { type: Array, required: true },
  error: { type: Object, default: null },
  errorId: { type: String, required: true }
});
</script>

<template>
  <fieldset class="field choice-field" :aria-invalid="Boolean(error)" :aria-describedby="error ? errorId : undefined">
    <legend class="field-label">{{ label }}</legend>
    <div class="choices">
      <label v-for="option in options" :key="option" class="choice" :class="{ checked: model === option }">
        <input v-model="model" type="radio" :name="name" :value="option" />
        <slot :option="option" />
      </label>
    </div>
    <div :id="errorId"><FieldError :error="error" /></div>
  </fieldset>
</template>
