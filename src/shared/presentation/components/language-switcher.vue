<script lang="js" setup>
import { useI18n } from "vue-i18n";

const { locale, availableLocales } = useI18n();

const LOCALE_KEY = 'skillswap_locale';

const setLocale = (lang) => {
  if (locale.value !== lang) locale.value = lang;
  localStorage.setItem(LOCALE_KEY, lang);
};
</script>

<template>
  <div class="lang-switcher">
    <button
        v-for="lang in availableLocales"
        :key="lang"
        class="lang-btn"
        :class="{ 'lang-btn-active': locale === lang }"
        @click="setLocale(lang)">
      {{ lang.toUpperCase() }}
    </button>
  </div>
</template>

<style scoped>
.lang-switcher {
  display: flex;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.lang-btn {
  background: #fff;
  border: none;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.lang-btn:hover { background: #f1f5f9; color: #1a2a40; }

.lang-btn-active {
  background: #1a2a40 !important;
  color: #ffffff !important;
}
</style>