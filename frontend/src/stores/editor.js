import { defineStore } from 'pinia';
import { ref } from 'vue';

/** Opens the single create/edit drawer from anywhere in the app. */
export const useEditorStore = defineStore('editor', () => {
  const open = ref(false);
  const mode = ref('create'); // create | edit
  const metric = ref(null);
  const preset = ref(null);
  const session = ref(0); // bumps on every open so the form remounts fresh

  function openCreate(defaults = null) {
    mode.value = 'create';
    metric.value = null;
    preset.value = defaults;
    session.value += 1;
    open.value = true;
  }

  function openEdit(target) {
    mode.value = 'edit';
    metric.value = { ...target };
    preset.value = null;
    session.value += 1;
    open.value = true;
  }

  function close() {
    open.value = false;
  }

  return { open, mode, metric, preset, session, openCreate, openEdit, close };
});
