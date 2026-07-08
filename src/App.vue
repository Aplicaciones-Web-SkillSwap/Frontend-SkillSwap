<script setup>

import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import Layout from "@/shared/presentation/components/layout.vue";

/**
 * Internationalization utility to handle translations within the component.
 * @type {Object}
 */
const { t } = useI18n();
const route = useRoute();
</script>

<template>
  <layout v-if="!route.meta.public"/>
  <router-view v-else/>
</template>

<style scoped>

</style>