<script setup>
import {useI18n}              from "vue-i18n";
import {useRoute, useRouter}  from "vue-router";
import useDiscoveryStore      from "@/discovery/application/discovery.store.js";
import useReputationStore     from "@/reputation/application/reputation.store.js";
import {computed, onMounted}  from "vue";

const {t}    = useI18n();
const route  = useRoute();
const router = useRouter();

const discoveryStore   = useDiscoveryStore();
const reputationStore  = useReputationStore();

const { fetchTutors }     = discoveryStore;
const { fetchReviews }    = reputationStore;

const tutor = computed(() => discoveryStore.getTutorById(route.params.id));

// US07 — Reseñas reales del reputation store filtradas por tutorId
const tutorReviews = computed(() => {
  if (!tutor.value) return [];
  return reputationStore
      .getReviewsByTutorId(tutor.value.userId)
      .filter(r => r.isPublished())
      .slice(0, 3);
});

const hasReviews = computed(() => tutorReviews.value.length > 0);

// Reputación real del tutor
const tutorReputation = computed(() =>
    reputationStore.getReputationByTutorId(tutor.value?.userId)
);

const averageScore = computed(() =>
    tutorReputation.value?.averageScore ?? tutor.value?.rating ?? 0
);

const reviewCount = computed(() =>
    tutorReputation.value?.publishedReviews ?? tutor.value?.reviewCount ?? 0
);

onMounted(() => {
  if (!discoveryStore.tutorsLoaded)       fetchTutors();
  if (!reputationStore.reviewsLoaded)     fetchReviews();
  if (!reputationStore.reputationsLoaded) reputationStore.fetchReputations();
});

const renderStars = (rating) => {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

// US08 — Enviar solicitud de tutoría
const sendRequest = () => {
  router.push({
    name:  'workspace-sessions-new',
    query: { tutorId: tutor.value?.userId }
  });
};

// Ver todas las reseñas del tutor → review-list filtrado
const navigateToAllReviews = () => {
  router.push({
    name:  'reputation-reviews',
    query: { tutorId: tutor.value?.userId }
  });
};

const navigateBack = () => {
  router.push({ name: 'discovery-search' });
};
</script>

<template>
  <div class="profile-container">

    <div class="flex align-items-center gap-3 mb-4">
      <pv-button icon="pi pi-arrow-left" text class="btn-back" @click="navigateBack"/>
      <h1 class="page-title m-0">{{ t('discovery.profile-title') }}</h1>
    </div>

    <div v-if="tutor" class="profile-grid">

      <!-- ── COLUMNA IZQUIERDA: Card del tutor ── -->
      <aside class="profile-sidebar">

        <div class="profile-card">

          <!-- Avatar + online -->
          <div class="profile-avatar-wrap">
            <div class="profile-avatar">
              <i class="pi pi-user profile-avatar-icon"/>
            </div>
            <span v-if="tutor.online" class="online-dot"/>
          </div>

          <!-- Nombre + verificado -->
          <div class="profile-name-row">
            <h2 class="profile-name">{{ tutor.name }}</h2>
            <span v-if="tutor.verified" class="verified-badge">
              <i class="pi pi-check-circle"/> {{ t('discovery.verified') }}
            </span>
          </div>

          <!-- Carrera y universidad -->
          <p class="profile-career">{{ tutor.career }}</p>
          <p class="profile-university">
            <i class="pi pi-building"/> {{ tutor.university }}
          </p>

          <!-- Rating real desde reputation store -->
          <div class="rating-row">
            <span v-for="n in renderStars(averageScore).full"  :key="'f'+n" class="star star-full">★</span>
            <span v-for="n in renderStars(averageScore).half"  :key="'h'+n" class="star star-half">★</span>
            <span v-for="n in renderStars(averageScore).empty" :key="'e'+n" class="star star-empty">★</span>
            <span class="rating-number">{{ Number(averageScore).toFixed(1) }}</span>
            <span class="review-count">({{ reviewCount }} {{ t('discovery.reviews') }})</span>
          </div>

          <!-- Skills -->
          <div class="skills-section">
            <p class="skills-label">{{ t('discovery.skills') }}</p>
            <div class="skills-row">
              <span v-for="skill in tutor.skills" :key="skill" class="skill-tag">{{ skill }}</span>
            </div>
          </div>

          <!-- US08 — Botón principal: Enviar solicitud -->
          <pv-button
              :label="t('discovery.send-request')"
              icon="pi pi-send"
              class="btn-send-request w-full"
              @click="sendRequest"/>

          <p class="request-note">{{ t('discovery.request-note') }}</p>

        </div>

      </aside>

      <!-- ── COLUMNA DERECHA: Bio + Reseñas reales ── -->
      <main class="profile-main">

        <!-- Biografía -->
        <div class="section-card">
          <h3 class="section-title">{{ t('discovery.bio') }}</h3>
          <p class="bio-text">{{ tutor.bio || t('discovery.no-bio') }}</p>
        </div>

        <!-- Reseñas reales (US07) -->
        <div class="section-card">
          <div class="reviews-header-row">
            <h3 class="section-title m-0">{{ t('discovery.reviews-title') }}</h3>
            <span
                v-if="hasReviews"
                class="see-all-link"
                @click="navigateToAllReviews">
              {{ t('discovery.see-all-reviews') }}
              <i class="pi pi-external-link"/>
            </span>
          </div>

          <!-- Sin reseñas (US07 Scenario 2) -->
          <div v-if="!hasReviews" class="empty-reviews">
            <i class="pi pi-star empty-icon"/>
            <p class="empty-title">{{ t('discovery.no-reviews') }}</p>
          </div>

          <!-- Con reseñas reales (US07 Scenario 1) -->
          <div v-else class="reviews-list">
            <div
                v-for="review in tutorReviews"
                :key="review.id"
                class="review-card">
              <div class="review-header">
                <div class="reviewer-info">
                  <div class="reviewer-avatar">
                    <i class="pi pi-user reviewer-avatar-icon"/>
                  </div>
                  <div>
                    <p class="reviewer-name">{{ t('discovery.student') }} #{{ review.studentId }}</p>
                    <p class="review-date">{{ formatDate(review.date) }}</p>
                  </div>
                </div>
                <div class="review-stars">
                  <span v-for="n in Math.floor(review.score)"       :key="'f'+n" class="star star-full">★</span>
                  <span v-for="n in (5 - Math.floor(review.score))" :key="'e'+n" class="star star-empty">★</span>
                  <span class="score-badge">{{ review.score }}</span>
                </div>
              </div>
              <p class="review-comment">{{ review.comment }}</p>
            </div>

            <!-- Ver todas -->
            <div class="see-all-row">
              <pv-button
                  :label="t('discovery.see-all-reviews')"
                  link
                  icon="pi pi-external-link"
                  icon-pos="right"
                  class="see-all-btn"
                  @click="navigateToAllReviews"/>
            </div>
          </div>
        </div>

      </main>

    </div>

    <!-- Tutor no encontrado -->
    <div v-else-if="discoveryStore.tutorsLoaded" class="empty-state">
      <i class="pi pi-user-minus empty-icon"/>
      <p class="empty-title">{{ t('discovery.tutor-not-found') }}</p>
      <pv-button :label="t('discovery.back-to-search')" class="btn-back-search" @click="navigateBack"/>
    </div>

  </div>
</template>

<style scoped>
.profile-container {
  width: 100%;
  padding: 1.5rem 2rem;
  background-color: #f3f4f6;
  min-height: 100vh;
}

.page-title { color: #1a2a40; font-weight: 800; font-size: 1.8rem; }
.btn-back { color: #1a2a40 !important; }

/* Grid */
.profile-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  max-width: 1100px;
}

/* Sidebar */
.profile-sidebar { display: flex; flex-direction: column; gap: 1rem; }

.profile-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.75rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #f0f2f5;
  text-align: center;
}

.profile-avatar-wrap { position: relative; display: inline-block; margin-bottom: 1rem; }

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.profile-avatar-icon { color: #718096; font-size: 2rem; }

.online-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  background-color: #16a34a;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.profile-name-row { margin-bottom: 0.3rem; }

.profile-name {
  color: #1a2a40;
  font-weight: 800;
  font-size: 1.2rem;
  margin: 0 0 0.4rem 0;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background-color: #e0f2fe;
  color: #0284c7;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
}

.profile-career     { color: #4a5568; font-size: 0.9rem; margin: 0 0 0.25rem 0; }
.profile-university { color: #718096; font-size: 0.85rem; margin: 0 0 1rem 0; display: flex; align-items: center; justify-content: center; gap: 0.3rem; }

/* Estrellas */
.rating-row    { display: flex; align-items: center; justify-content: center; gap: 0.15rem; margin-bottom: 1rem; }
.star          { font-size: 1rem; }
.star-full     { color: #f5a623; }
.star-half     { color: #f5a623; opacity: 0.6; }
.star-empty    { color: #e2e8f0; }
.rating-number { color: #1a2a40; font-weight: 700; font-size: 0.9rem; margin-left: 0.25rem; }
.review-count  { color: #a0aec0; font-size: 0.8rem; }

/* Skills */
.skills-section { text-align: left; margin-bottom: 1.25rem; }
.skills-label   { color: #8c98a4; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; margin: 0 0 0.5rem 0; }
.skills-row     { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.skill-tag      { background-color: #f0f2f5; color: #4a5568; padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }

/* Botón solicitud (US08) */
.btn-send-request {
  background-color: #e53e4f !important;
  border: none !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  padding: 0.8rem !important;
  font-size: 0.95rem !important;
}
.btn-send-request:hover { background-color: #d03544 !important; }
.request-note { color: #a0aec0; font-size: 0.75rem; margin: 0.5rem 0 0 0; }
.w-full { width: 100%; }

/* Columna principal */
.profile-main { display: flex; flex-direction: column; gap: 1rem; }

.section-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #f0f2f5;
}

.section-title { color: #1a2a40; font-weight: 800; font-size: 1.05rem; margin: 0 0 1rem 0; }
.bio-text      { color: #4a5568; line-height: 1.7; margin: 0; }

/* Header de reseñas con link ver todas */
.reviews-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.see-all-link {
  color: #e53e4f;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.see-all-link:hover { text-decoration: underline; }

/* Reseñas */
.reviews-list { display: flex; flex-direction: column; gap: 1rem; }

.review-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #f0f2f5;
}

.review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }

.reviewer-info { display: flex; align-items: center; gap: 0.75rem; }

.reviewer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reviewer-avatar-icon { color: #718096; font-size: 0.9rem; }
.reviewer-name { color: #1a2a40; font-weight: 700; font-size: 0.9rem; margin: 0; }
.review-date   { color: #a0aec0; font-size: 0.75rem; margin: 0; }

.review-stars  { display: flex; align-items: center; gap: 0.1rem; }

.score-badge {
  background-color: #fef3c7;
  color: #d97706;
  padding: 0.1rem 0.5rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-left: 0.3rem;
}

.review-comment { color: #4a5568; font-size: 0.88rem; margin: 0; line-height: 1.6; }

/* Empty */
.empty-reviews { text-align: center; padding: 2rem; }
.empty-icon    { font-size: 2.5rem; color: #cbd5e0; display: block; margin-bottom: 0.75rem; }
.empty-title   { color: #a0aec0; font-size: 0.9rem; margin: 0; }

/* Ver todas */
.see-all-row { display: flex; justify-content: flex-end; }
.see-all-btn { color: #e53e4f !important; font-weight: 600 !important; }

/* No encontrado */
.empty-state     { text-align: center; padding: 4rem; }
.btn-back-search { background-color: #1a2a40 !important; border: none !important; border-radius: 8px !important; margin-top: 1rem; }
</style>