<script setup>
import {useI18n}           from "vue-i18n";
import useReputationStore  from "@/reputation/application/reputation.store.js";
import {onMounted, toRefs} from "vue";

const {t}  = useI18n();
const store = useReputationStore();
const { reputations, reputationsLoaded, errors } = toRefs(store);
const { fetchReputations } = store;

onMounted(() => {
  if (!store.reputationsLoaded) {
    fetchReputations();
    console.log('fetching reputations');
  }
});

const scoreClass = (score) => {
  if (score >= 4)   return 'score-high';
  if (score >= 3)   return 'score-mid';
  return 'score-low';
};
</script>

<template>
  <div class="p-4 reputations-container">

    <div class="header-actions flex justify-content-between align-items-center mb-4">
      <h1 class="page-title m-0">{{ t('reputations.title') }}</h1>
    </div>

    <div class="table-card">
      <pv-data-table
          :loading="!reputationsLoaded"
          :rows="10"
          :rows-per-page-options="[10, 25]"
          :value="reputations"
          paginator
          striped-rows
          class="clean-table"
          table-style="min-width: 40rem">

        <pv-column :header="t('reputations.tutorId')" field="tutorId" sortable>
          <template #body="slotProps">
            <span class="text-id">#{{ slotProps.data.tutorId }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('reputations.averageScore')" field="averageScore" sortable>
          <template #body="slotProps">
            <div class="score-cell">
              <span :class="'score-value ' + scoreClass(slotProps.data.averageScore)">
                {{ slotProps.data.averageScore }}
              </span>
              <pv-rating :model-value="slotProps.data.averageScore" :stars="5" readonly :cancel="false"/>
            </div>
          </template>
        </pv-column>

        <pv-column :header="t('reputations.totalReviews')" field="totalReviews" sortable>
          <template #body="slotProps">
            <span class="text-neutral">{{ slotProps.data.totalReviews }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('reputations.publishedReviews')" field="publishedReviews" sortable>
          <template #body="slotProps">
            <span class="published-badge">{{ slotProps.data.publishedReviews }} {{ t('reputations.published') }}</span>
          </template>
        </pv-column>

      </pv-data-table>
    </div>

    <div v-if="errors.length" class="text-red-500 mt-3 error-msg">
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

  </div>
</template>

<style scoped>
.reputations-container { width: 100%; padding: 0 2rem; }
.page-title { color: #1a2a40; font-weight: 800; font-size: 2rem; }

.table-card { background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); padding: 1rem; border: 1px solid #f0f2f5; }

:deep(.clean-table .p-datatable-thead > tr > th) { background-color: #ffffff; color: #8c98a4; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f0f2f5; padding: 1.5rem 1rem; }
:deep(.clean-table .p-datatable-tbody > tr) { background-color: #ffffff; }
:deep(.clean-table .p-datatable-tbody > tr > td) { padding: 1.1rem 1rem; border-bottom: 1px solid #f0f2f5; }
:deep(.clean-table .p-datatable-tbody > tr:hover) { background-color: #fcfcfc; }

.text-id      { color: #a0aec0; font-weight: 700; }
.text-neutral { color: #4a5568; }

.score-cell   { display: flex; align-items: center; gap: 0.75rem; }
.score-value  { font-weight: 800; font-size: 1rem; min-width: 30px; }
.score-high   { color: #16a34a; }
.score-mid    { color: #d97706; }
.score-low    { color: #dc2626; }

.published-badge { background-color: #dcfce7; color: #16a34a; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 700; font-size: 0.78rem; }

.error-msg { font-weight: bold; }
</style>
