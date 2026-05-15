<script setup>
import { onMounted, toRefs } from 'vue'
import { useI18n }           from 'vue-i18n'
import useReputationStore    from '@/reputation/application/reputation.store.js'

const { t }  = useI18n()
const store  = useReputationStore()
const { reputations, reputationsLoaded } = toRefs(store)

onMounted(() => { if (!store.reputationsLoaded) store.fetchReputations() })

const scoreClass = (s) => s >= 4 ? 'text-green-500 font-bold' : s >= 3 ? 'text-yellow-500 font-bold' : 'text-red-500 font-bold'
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">{{ t('reputations.title') }}</h1>

    <pv-data-table
        :value="reputations"
        :loading="!reputationsLoaded"
        :rows="10"
        :rows-per-page-options="[10, 25]"
        paginator
        striped-rows
    >
      <pv-column field="tutorId"          :header="t('reputations.tutor_id')"         sortable />
      <pv-column field="averageScore"      :header="t('reputations.average_score')"    sortable>
        <template #body="{ data }">
          <span :class="scoreClass(data.averageScore)">{{ data.averageScore }}</span>
          <pv-rating :model-value="data.averageScore" :stars="5" readonly :cancel="false" class="ml-2" />
        </template>
      </pv-column>
      <pv-column field="totalReviews"     :header="t('reputations.total_reviews')"    sortable />
      <pv-column field="publishedReviews" :header="t('reputations.published_reviews')" sortable />
    </pv-data-table>
  </div>
</template>