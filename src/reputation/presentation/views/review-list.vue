<script setup>
import {useI18n}           from "vue-i18n";
import {useRoute, useRouter}         from "vue-router";
import {useConfirm}        from "primevue";
import useReputationStore  from "@/reputation/application/reputation.store.js";
import {computed, onMounted, toRefs} from "vue";

const {t}     = useI18n();
const route   = useRoute();
const router  = useRouter();
const confirm = useConfirm();
const store   = useReputationStore();
const { reviews, errors, reviewsLoaded } = toRefs(store);
const { fetchReviews, deleteReview }     = store;

// Si viene desde perfil del tutor con ?tutorId=X, filtra
const filterTutorId = computed(() => route.query.tutorId || null);

const displayedReviews = computed(() => {
  if (!filterTutorId.value) return reviews.value;
  return store.getReviewsByTutorId(filterTutorId.value);
});

const pageTitle = computed(() =>
    filterTutorId.value
        ? t('reviews.title-filtered', { tutorId: filterTutorId.value })
        : t('reviews.title')
);

onMounted(() => {
  if (!store.reviewsLoaded) {
    fetchReviews();
    console.log('fetching reviews');
    reviewsLoaded.value = store.reviewsLoaded;
  }
});

const navigateToNew  = ()   => router.push({ name: 'reputation-reviews-new', query: filterTutorId.value ? { tutorId: filterTutorId.value } : {} });
const navigateToEdit = (id) => router.push({ name: 'reputation-reviews-edit', params: { id } });

const navigateBack = () => {
  if (filterTutorId.value) {
    router.push({ name: 'discovery-search' });
  } else {
    router.push({ name: 'reputation-reputations' });
  }
};

const confirmDelete = (review) => {
  confirm.require({
    message: t('reviews.confirm-delete', { id: review.id }),
    header:  t('reviews.delete-header'),
    icon:    'pi pi-exclamation-triangle',
    accept:  () => { deleteReview(review); },
  });
};

const statusClass = (status) => {
  const map = {
    PUBLISHED: 'status-badge status-published',
    PENDING:   'status-badge status-pending',
    REMOVED:   'status-badge status-removed',
  };
  return map[status] || 'status-badge';
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
</script>

<template>
  <div class="p-4 reviews-container">

    <div class="header-actions flex justify-content-between align-items-center mb-4">
      <div class="flex align-items-center gap-3">
        <pv-button icon="pi pi-arrow-left" text class="btn-back" @click="navigateBack"/>
        <div>
          <h1 class="page-title m-0">{{ pageTitle }}</h1>
          <p v-if="filterTutorId" class="m-0 subtitle">
            {{ t('reviews.filter-label') }}
            <span class="tutor-chip">#{{ filterTutorId }}</span>
          </p>
        </div>
      </div>
      <pv-button :label="t('reviews.new')" icon="pi pi-plus" class="btn-new" @click="navigateToNew"/>
    </div>

    <div class="table-card">
      <pv-data-table
          :loading="!reviewsLoaded"
          :rows="10"
          :rows-per-page-options="[10, 25, 50]"
          :value="displayedReviews"
          paginator
          class="clean-table"
          table-style="min-width: 55rem">

        <pv-column :header="t('reviews.id')" field="id" sortable>
          <template #body="slotProps">
            <span class="text-id">#{{ slotProps.data.id }}</span>
          </template>
        </pv-column>

        <pv-column v-if="!filterTutorId" :header="t('reviews.tutorId')" field="tutorId" sortable>
          <template #body="slotProps">
            <span class="text-neutral font-semibold">{{ slotProps.data.tutorId }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('reviews.studentId')" field="studentId" sortable>
          <template #body="slotProps">
            <span class="text-neutral">{{ slotProps.data.studentId }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('reviews.score')" field="score" sortable>
          <template #body="slotProps">
            <span class="text-score">
              {{ slotProps.data.score }}
              <i class="pi pi-star-fill text-yellow-500 ml-1" style="font-size: 0.9rem;"></i>
            </span>
          </template>
        </pv-column>

        <pv-column :header="t('reviews.comment')" field="comment">
          <template #body="slotProps">
            <span class="text-comment">{{ slotProps.data.comment }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('reviews.status')" field="status" sortable>
          <template #body="slotProps">
            <span :class="statusClass(slotProps.data.status)">{{ slotProps.data.status }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('reviews.date')" field="date" sortable>
          <template #body="slotProps">
            <span class="text-date">
              <i class="pi pi-calendar icon-cal"/>
              {{ formatDate(slotProps.data.date) }}
            </span>
          </template>
        </pv-column>

        <pv-column :header="t('reviews.actions')">
          <template #body="slotProps">
            <div class="actions-cell">
              <pv-button icon="pi pi-pencil" rounded text class="action-btn-edit"   @click="navigateToEdit(slotProps.data.id)"/>
              <pv-button icon="pi pi-trash"  rounded text class="action-btn-delete" @click="confirmDelete(slotProps.data)"/>
            </div>
          </template>
        </pv-column>

      </pv-data-table>
    </div>

    <div v-if="errors.length" class="text-red-500 mt-3 error-msg">
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

    <pv-confirm-dialog/>
  </div>
</template>

<style scoped>
.reviews-container { width: 100%; padding: 0 2rem; }
.page-title { color: #1e293b; font-weight: 800; font-size: 2rem; }

.subtitle { color: #718096; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; margin-top: 0.2rem; }

.tutor-chip {
  background-color: #e0f2fe;
  color: #0284c7;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.8rem;
}

.btn-back { color: #1a2a40 !important; }

.btn-new {
  background-color: #e53e4f !important;
  border: none !important;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
}
.btn-new:hover { background-color: #d03544 !important; }

/* Contenedor de la tabla */
.table-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  padding: 0;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

/* FORZAR BLANCO EN LA TABLA (Anti-Tema Oscuro) */
:deep(.clean-table .p-datatable-thead > tr > th) {
  background-color: #f8fafc !important;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e2e8f0;
  padding: 1.2rem 1rem;
}

:deep(.clean-table .p-datatable-tbody > tr) {
  background-color: #ffffff !important;
}
:deep(.clean-table .p-datatable-tbody > tr > td) {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
}
:deep(.clean-table .p-datatable-tbody > tr:hover) {
  background-color: #f8fafc !important;
}
:deep(.clean-table .p-paginator) {
  background-color: #ffffff !important;
  border-top: 1px solid #f1f5f9;
}

/* Tipografías */
.text-id      { color: #3b82f6; font-weight: 700; font-size: 0.9rem; }
.text-neutral { color: #475569; font-size: 0.95rem; }
.text-score   { color: #0f172a; font-weight: 800; font-size: 1.05rem; }
.text-comment { color: #64748b; font-size: 0.9rem; max-width: 250px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.text-date    { color: #64748b; display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; font-weight: 500; }
.icon-cal     { color: #94a3b8; }

/* Badges de estado */
.status-badge     { padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; letter-spacing: 0.3px; }
.status-published { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.status-pending   { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
.status-removed   { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

/* Botones de acción */
.actions-cell { display: flex; align-items: center; gap: 0.2rem; }
.action-btn-edit   { color: #94a3b8 !important; }
.action-btn-edit:hover { color: #3b82f6 !important; background-color: #eff6ff !important; }

.action-btn-delete { color: #f87171 !important; }
.action-btn-delete:hover { color: #ef4444 !important; background-color: #fef2f2 !important; }

.error-msg { font-weight: bold; }
</style>