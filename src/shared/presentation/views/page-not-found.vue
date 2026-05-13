<script setup>
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";

const { t }  = useI18n();
const route  = useRoute();
const router = useRouter();
</script>

<template>
  <div class="align-content-start justify-content-start m-4">
    <h1>{{ t('page-not-found.title') }}</h1>
    <p>{{ t('page-not-found.content', { 'unavailable-route': route.path }) }}</p>
    <pv-button :label="t('page-not-found.go-home')" @click="router.push('/home')" icon="pi pi-home"/>
  </div>
</template>

<style scoped>

</style>
