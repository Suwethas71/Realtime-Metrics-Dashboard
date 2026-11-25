import { onBeforeUnmount, onMounted, ref } from 'vue';

/** A reactive clock so relative times ("12s ago") stay current. */
export function useNow(ms = 1000) {
  const now = ref(Date.now());
  let timer = null;
  onMounted(() => {
    timer = setInterval(() => {
      now.value = Date.now();
    }, ms);
  });
  onBeforeUnmount(() => clearInterval(timer));
  return now;
}
