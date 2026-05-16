<script lang="js" setup>
import {useI18n} from "vue-i18n";

/**
 * Localization and language switching control component.
 *
 * @remarks
 * Interacts directly with the `vue-i18n` context to track and mutate the application's
 * active locale state dynamically via an interactive selection button array.
 */

const {locale, availableLocales} = useI18n();

/** @type {import('vue').WritableComputedRef<string>} Active locale language code key mapping */
const activeLocale = locale;

/** @type {string[]} Collection of supported locale language strings compiled in config settings */
const localesList = availableLocales;
</script>

<template>
  <pv-select-button v-model="locale" :options="availableLocales">
    <template #option="slotProps">
      <span>{{ slotProps.option.toUpperCase() }}</span>
    </template>
  </pv-select-button>
</template>

<style scoped>

</style>