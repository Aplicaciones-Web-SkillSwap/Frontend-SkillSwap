import {onMounted, onUnmounted} from "vue";

/**
 * Vuelve a ejecutar `callback` cada `intervalMs` mientras el componente esté montado,
 * además de una vez de inmediato al montar. Se usa para mantener datos compartidos
 * (mensajes, sesiones, sanciones, etc.) al día sin depender de que el usuario navegue
 * o recargue la página manualmente.
 */
export function usePolling(callback, intervalMs) {
  let handle = null;

  onMounted(() => {
    callback();
    handle = setInterval(callback, intervalMs);
  });

  onUnmounted(() => {
    if (handle) clearInterval(handle);
  });
}
