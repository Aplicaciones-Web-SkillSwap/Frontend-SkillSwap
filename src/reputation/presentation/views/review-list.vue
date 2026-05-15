<script setup>
import { onMounted, toRefs }  from 'vue'
import { useRouter }          from 'vue-router'
import { useI18n }            from 'vue-i18n'
import { useConfirm }         from 'primevue/useconfirm'
import { useToast }           from 'primevue/usetoast'
import useReputationStore     from '@/reputation/application/reputation.store.js'

const { t }   = useI18n()
const router  = useRouter()
const confirm = useConfirm()
const toast   = useToast()
const store   = useReputationStore()

const { reviews, reviewsLoaded } = toRefs(store)

onMounted(() => { if (!store.reviewsLoaded) store.fetchReviews() })

const goNew  = ()   => router.push({ name: 'reputation-reviews-new' })
const goEdit = (id) => router.push({ name: 'reputation-reviews-edit', params: { id } })

const confirmDelete = (review) => {
  confirm.require({
    message: t('review.confirm_delete', { id: review.id }),
    header:  t('review.delete_header'),
    icon:    'pi pi-exclamation-triangle',
    accept:  () => {
      store.deleteReview(review)
      toast.add({ severity: 'success', summary: t('review.deleted'), life: 3000 })
    }
  })
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—'
</script>

<template>
  <div class="reviews-container">
    <!-- Header -->
    <div class="reviews-header">
      <h2 class="reviews-title">{{ t('reviews.title') }}</h2>
      <pv-button :label="t('reviews.add')" icon="pi pi-plus" size="small" @click="goNew" />
    </div>

    <!-- Desktop table -->
    <div class="table-wrapper">
      <pv-data-table
          :value="reviews"
          :loading="!reviewsLoaded"
          :rows="10"
          :rows-per-page-options="[10, 25, 50]"
          paginator
          striped-rows
          removable-sort
          scrollable
          scroll-height="flex"
      >
        <pv-column field="id"        :header="t('reviews.id')"         sortable style="min-width:60px" />
        <pv-column field="tutorId"   :header="t('reviews.tutor_id')"   sortable style="min-width:80px" />
        <pv-column field="studentId" :header="t('reviews.student_id')" sortable style="min-width:90px" />
        <pv-column field="sessionId" :header="t('reviews.session_id')" sortable style="min-width:90px" />
        <pv-column field="score"     :header="t('reviews.score')"      sortable style="min-width:80px">
          <template #body="{ data }">{{ data.score }} ⭐</template>
        </pv-column>
        <pv-column field="comment" :header="t('reviews.comment')" style="min-width:200px" />
        <pv-column field="status"  :header="t('reviews.status')"  sortable style="min-width:100px" />
        <pv-column field="date"    :header="t('reviews.date')"    sortable style="min-width:100px">
          <template #body="{ data }">{{ formatDate(data.date) }}</template>
        </pv-column>
        <pv-column :header="t('reviews.actions')" style="min-width:120px">
          <template #body="{ data }">
            <pv-button :label="t('reviews.edit')"   size="small" text @click="goEdit(data.id)" />
            <pv-button :label="t('reviews.delete')" size="small" text severity="danger" @click="confirmDelete(data)" />
          </template>
        </pv-column>
      </pv-data-table>
    </div>

    <!-- Mobile cards (se muestra solo en pantallas pequeñas) -->
    <div class="mobile-cards">
      <div v-if="!reviewsLoaded" class="mobile-loading">
        <i class="pi pi-spin pi-spinner"></i>
      </div>
      <div
          v-for="review in reviews"
          :key="review.id"
          class="mobile-card"
      >
        <div class="mobile-card__header">
          <span class="mobile-card__id">#{{ review.id }}</span>
          <span class="mobile-card__status">{{ review.status }}</span>
        </div>
        <div class="mobile-card__score">{{ review.score }} ⭐</div>
        <p class="mobile-card__comment">{{ review.comment }}</p>
        <div class="mobile-card__meta">
          <span>Tutor: {{ review.tutorId }}</span>
          <span>Student: {{ review.studentId }}</span>
          <span>Session: {{ review.sessionId }}</span>
          <span>{{ formatDate(review.date) }}</span>
        </div>
        <div class="mobile-card__actions">
          <pv-button :label="t('reviews.edit')"   size="small" text @click="goEdit(review.id)" />
          <pv-button :label="t('reviews.delete')" size="small" text severity="danger" @click="confirmDelete(review)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reviews-container {
  width: 100%;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 12px;
}

.reviews-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

/* Desktop: muestra tabla, oculta cards */
.table-wrapper { display: block; }
.mobile-cards  { display: none; }

/* Mobile: oculta tabla, muestra cards */
@media (max-width: 768px) {
  .table-wrapper { display: none; }
  .mobile-cards  { display: flex; flex-direction: column; gap: 12px; }
}

/* Mobile card styles */
.mobile-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
}

.mobile-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-card__id {
  font-weight: 700;
  font-size: 0.9rem;
  color: #64748b;
}

.mobile-card__status {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #475569;
}

.mobile-card__score {
  font-size: 1rem;
  font-weight: 600;
}

.mobile-card__comment {
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.5;
  margin: 0;
}

.mobile-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.8rem;
  color: #94a3b8;
}

.mobile-card__actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.mobile-loading {
  text-align: center;
  padding: 32px;
  color: #94a3b8;
  font-size: 1.5rem;
}
</style>