import {onMounted, onUnmounted} from "vue";

/**
 * Vuelve a ejecutar `callback` cada `intervalMs` mientras el componente esté montado.
 * Se usa para mantener datos compartidos (mensajes, sesiones, sanciones, etc.) al día
 * sin depender de que el usuario navegue o recargue la página manualmente.
 *
 * @param {Function} callback
 * @param {number} intervalMs
 * @param {{immediate?: boolean}} options - `immediate: false` omite la primera
 *     ejecución al montar (útil cuando el propio componente ya hace esa carga inicial
 *     de otra forma, p. ej. mostrando un spinner que el poll silencioso no debe disparar).
 */
export function usePolling(callback, intervalMs, {immediate = true} = {}) {
  let handle = null;

  onMounted(() => {
    if (immediate) callback();
    handle = setInterval(callback, intervalMs);
  });

  onUnmounted(() => {
    if (handle) clearInterval(handle);
  });
}
