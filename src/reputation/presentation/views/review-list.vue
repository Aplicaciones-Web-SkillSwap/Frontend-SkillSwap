<script lang="js" setup>
import {useI18n}              from "vue-i18n";
import {useRoute, useRouter}  from "vue-router";
import useReputationStore     from "@/reputation/application/reputation.store.js";
import useDiscoveryStore      from "@/discovery/application/discovery.store.js";
import useAuthStore           from "@/iam/application/auth.store.js";
import {computed, onMounted, ref, toRefs} from "vue";
import {formatDate}           from "@/shared/utils/format-date.js";

const {t}     = useI18n();
const route   = useRoute();
const router  = useRouter();
const store   = useReputationStore();
const discoveryStore = useDiscoveryStore();
const authStore = useAuthStore();
const { reviews, errors, reviewsLoaded } = toRefs(store);
const { fetchReviews }                   = store;

/** Búsqueda por nombre de tutor (pedido por el profesor) */
const searchQuery = ref('');

const filterTutorId = computed(() => route.query.tutorId || null);

/** Resuelve nombre de tutor por tutorId */
const tutorName = (tutorId) => {
  const idNum = Number(tutorId);
  const tutor = discoveryStore.tutors.find(t => t.userId === idNum);
  return tutor ? tutor.name : `Tutor #${tutorId}`;
};

const displayedReviews = computed(() => {
  let result;
  if (filterTutorId.value) {
    // Browsing a specific tutor's public reviews (e.g. from their profile) stays public.
    result = store.getReviewsByTutorId(filterTutorId.value);
  } else {
    // The general "Reviews" nav page is personal: reviews I wrote or reviews I received as a tutor.
    const userId = authStore.user?.id;
    result = reviews.value.filter(r => r.reviewerId === userId || r.tutorId === userId);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(r => tutorName(r.tutorId).toLowerCase().includes(q));
  }
  return result;
});

const pageTitle = computed(() =>
    filterTutorId.value
        ? t('reviews.title-filtered', { tutorName: tutorName(filterTutorId.value) })
        : t('reviews.title')
);

onMounted(() => {
  if (!store.reviewsLoaded) fetchReviews();
  if (!discoveryStore.tutorsLoaded) discoveryStore.fetchTutors();
});

const navigateBack  = () => {
  if (filterTutorId.value) {
    const tutor = discoveryStore.getTutorByUserId(filterTutorId.value);
    if (tutor) router.push({ name: 'discovery-profile', params: { id: tutor.id } });
    else router.push({ name: 'discovery-search' });
  } else {
    router.push({ name: 'home' });
  }
};
</script>

<template>
  <div class="p-4 reviews-container">

    <div class="header-actions flex justify-content-between align-items-center mb-4">
      <div class="flex align-items-center gap-3">
        <pv-button icon="pi pi-arrow-left" text class="btn-back" @click="navigateBack"/>
        <h1 class="page-title m-0">{{ pageTitle }}</h1>
      </div>
    </div>

    <!-- Vista pública de un tutor: mismas cards que el perfil, en grande -->
    <div v-if="filterTutorId" class="section-card">
      <div v-if="!reviewsLoaded" class="empty-reviews">
        <i class="pi pi-spin pi-spinner empty-icon"/>
      </div>
      <div v-else-if="displayedReviews.length === 0" class="empty-reviews">
        <i class="pi pi-star empty-icon"/>
        <p class="empty-title">{{ t('discovery.no-reviews') }}</p>
      </div>
      <div v-else class="reviews-list">
        <div v-for="review in displayedReviews" :key="review.id" class="review-card">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar">
                <i class="pi pi-user reviewer-avatar-icon"/>
              </div>
              <div>
                <p class="reviewer-name">{{ t('discovery.anonymous-student') }}</p>
                <p class="review-date">{{ formatDate(review.reviewedAt) }}</p>
              </div>
            </div>
            <div class="review-stars">
              <span v-for="n in Math.floor(review.rating)"       :key="'f'+n" class="star star-full">★</span>
              <span v-for="n in (5 - Math.floor(review.rating))" :key="'e'+n" class="star star-empty">★</span>
              <span class="score-badge">{{ review.rating }}</span>
            </div>
          </div>
          <p class="review-comment">{{ review.comment }}</p>
        </div>
      </div>
    </div>

    <!-- Vista personal: tabla con mis reseñas -->
    <template v-else>
      <!-- Búsqueda por nombre de tutor -->
      <div class="search-bar mb-3">
        <pv-icon-field>
          <pv-input-icon class="pi pi-search"/>
          <pv-input-text
              v-model="searchQuery"
              placeholder="Buscar por nombre de tutor..."
              class="w-full"
          />
        </pv-icon-field>
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

          <pv-column :header="t('reviews.tutorId')" field="tutorId" sortable>
            <template #body="slotProps">
              <span class="text-neutral font-semibold">{{ tutorName(slotProps.data.tutorId) }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('reviews.reviewerId')" field="reviewerId" sortable>
            <template #body="slotProps">
              <span class="text-neutral">Usuario #{{ slotProps.data.reviewerId }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('reviews.score')" field="rating" sortable>
            <template #body="slotProps">
              <span class="text-score">
                {{ slotProps.data.rating }}
                <i class="pi pi-star-fill text-yellow-500 ml-1" style="font-size: 0.9rem;"></i>
              </span>
            </template>
          </pv-column>

          <pv-column :header="t('reviews.comment')" field="comment">
            <template #body="slotProps">
              <span class="text-comment">{{ slotProps.data.comment }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('reviews.date')" field="reviewedAt" sortable>
            <template #body="slotProps">
              <span class="text-date">
                <i class="pi pi-calendar icon-cal"/>
                {{ formatDate(slotProps.data.reviewedAt) }}
              </span>
            </template>
          </pv-column>

          <pv-column :header="t('reviews.status')">
            <template #body>
              <span class="status-badge status-published">Published</span>
            </template>
          </pv-column>

        </pv-data-table>
      </div>
    </template>

    <div v-if="errors.length" class="text-red-500 mt-3 error-msg">
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

  </div>
</template>

<style scoped>
.reviews-container { width: 100%; padding: 0 2rem; }
.page-title { color: #1e293b; font-weight: 800; font-size: 2rem; }

.btn-back { color: #1a2a40 !important; }

.btn-new {
  background-color: #e53e4f !important;
  border: none !important;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
}
.btn-new:hover { background-color: #d03544 !important; }


.table-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  padding: 0;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}


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


.text-id      { color: #3b82f6; font-weight: 700; font-size: 0.9rem; }
.text-neutral { color: #475569; font-size: 0.95rem; }
.text-score   { color: #0f172a; font-weight: 800; font-size: 1.05rem; }
.text-comment { color: #64748b; font-size: 0.9rem; max-width: 250px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.text-date    { color: #64748b; display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; font-weight: 500; }
.icon-cal     { color: #94a3b8; }


.status-badge     { padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; letter-spacing: 0.3px; }
.status-published { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }


.error-msg { font-weight: bold; }

.search-bar { max-width: 380px; }

/* Vista pública de tutor: mismas cards del perfil, más grandes */
.section-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #f0f2f5;
  max-width: 850px;
}

.reviews-list { display: flex; flex-direction: column; gap: 1.5rem; }

.review-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #f0f2f5;
}

.review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }

.reviewer-info { display: flex; align-items: center; gap: 1rem; }

.reviewer-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reviewer-avatar-icon { color: #718096; font-size: 1.4rem; }
.reviewer-name { color: #1a2a40; font-weight: 700; font-size: 1.05rem; margin: 0; }
.review-date   { color: #a0aec0; font-size: 0.85rem; margin: 0.15rem 0 0; }

.review-stars  { display: flex; align-items: center; gap: 0.15rem; flex-shrink: 0; }

.star       { font-size: 1.3rem; }
.star-full  { color: #f5a623; }
.star-empty { color: #e2e8f0; }

.score-badge {
  background-color: #fef3c7;
  color: #d97706;
  padding: 0.2rem 0.7rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  margin-left: 0.4rem;
}

.review-comment { color: #4a5568; font-size: 1rem; margin: 0; line-height: 1.7; }

.empty-reviews { text-align: center; padding: 3rem; }
.empty-icon    { font-size: 3rem; color: #cbd5e0; display: block; margin-bottom: 1rem; }
.empty-title   { color: #a0aec0; font-size: 1rem; margin: 0; }
</style>