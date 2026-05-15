<script setup>
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useDiscoveryStore from "@/discovery/application/discovery.store.js";
import {onMounted, toRefs} from "vue";

const {t}    = useI18n();
const router = useRouter();
const store  = useDiscoveryStore();
const { filteredTutors, tutorsLoaded, errors, searchQuery, filterMinRating, filterUniversity, universities } = toRefs(store);
const { fetchTutors, clearFilters } = store;

onMounted(() => {
  if (!store.tutorsLoaded) {
    fetchTutors();
    console.log('fetching tutors');
  }
});

const ratingOptions = [
  { label: t('discovery.filter-all-ratings'), value: 0   },
  { label: '4+ ★',                            value: 4   },
  { label: '4.5+ ★',                          value: 4.5 },
  { label: '5 ★',                             value: 5   },
];

const navigateToProfile = (id) => {
  router.push({ name: 'discovery-profile', params: { id } });
};

const renderStars = (rating) => {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
};
</script>

<template>
  <div class="search-container">

    <!-- Hero de búsqueda (US05) -->
    <div class="search-hero">
      <h1 class="hero-title">{{ t('discovery.hero-title') }}</h1>
      <p class="hero-sub">{{ t('discovery.hero-sub') }}</p>

      <div class="search-bar-wrap">
        <i class="pi pi-search search-icon"/>
        <pv-input-text
            v-model="searchQuery"
            :placeholder="t('discovery.search-placeholder')"
            class="search-input"/>
        <pv-button
            v-if="searchQuery"
            icon="pi pi-times"
            text
            class="clear-btn"
            @click="searchQuery = ''"/>
      </div>
    </div>

    <div class="content-grid">

      <!-- ── FILTROS (US06) ── -->
      <aside class="filters-panel">
        <div class="filters-header">
          <h3 class="filters-title">{{ t('discovery.filters-title') }}</h3>
          <span class="clear-filters-link" @click="clearFilters">{{ t('discovery.clear-filters') }}</span>
        </div>

        <!-- Filtro por rating mínimo -->
        <div class="filter-group">
          <label class="filter-label">{{ t('discovery.filter-rating') }}</label>
          <div class="rating-options">
            <div
                v-for="opt in ratingOptions"
                :key="opt.value"
                class="rating-option"
                :class="{ active: filterMinRating === opt.value }"
                @click="filterMinRating = opt.value">
              {{ opt.label }}
            </div>
          </div>
        </div>

        <!-- Filtro por universidad -->
        <div class="filter-group">
          <label class="filter-label">{{ t('discovery.filter-university') }}</label>
          <pv-select
              v-model="filterUniversity"
              :options="[{ label: t('discovery.filter-all-universities'), value: '' }, ...universities.map(u => ({ label: u, value: u }))]"
              option-label="label"
              option-value="value"
              class="w-full filter-select"/>
        </div>
      </aside>

      <!-- ── RESULTADOS ── -->
      <main class="results-area">

        <!-- Contador de resultados -->
        <div class="results-meta">
          <p class="results-count">
            <strong>{{ filteredTutors.length }}</strong> {{ t('discovery.results-found') }}
            <span v-if="searchQuery" class="query-tag">"{{ searchQuery }}"</span>
          </p>
        </div>

        <!-- Loading -->
        <div v-if="!tutorsLoaded" class="loading-state">
          <i class="pi pi-spin pi-spinner loading-icon"/>
          <p>{{ t('discovery.loading') }}</p>
        </div>

        <!-- Estado vacío (US05 Scenario 2 + US06 Scenario 2) -->
        <div v-else-if="filteredTutors.length === 0" class="empty-state">
          <i class="pi pi-search empty-icon"/>
          <p class="empty-title">{{ t('discovery.no-results-title') }}</p>
          <p class="empty-sub">{{ t('discovery.no-results-sub') }}</p>
          <pv-button :label="t('discovery.clear-filters')" class="btn-clear" @click="clearFilters"/>
        </div>

        <!-- Grid de tarjetas de tutores (US05 Scenario 1) -->
        <div v-else class="tutors-grid">
          <div
              v-for="tutor in filteredTutors"
              :key="tutor.id"
              class="tutor-card"
              @click="navigateToProfile(tutor.id)">

            <!-- Avatar + online dot -->
            <div class="tutor-avatar-wrap">
              <div class="tutor-avatar">
                <i class="pi pi-user tutor-avatar-icon"/>
              </div>
              <span v-if="tutor.online" class="online-dot"/>
            </div>

            <!-- Info principal -->
            <div class="tutor-main">
              <div class="tutor-name-row">
                <h3 class="tutor-name">{{ tutor.name }}</h3>
                <i v-if="tutor.verified" class="pi pi-check-circle verified-icon" :title="t('discovery.verified')"/>
              </div>
              <p class="tutor-career">{{ tutor.career }} · {{ tutor.university }}</p>

              <!-- Rating (US07 preview) -->
              <div class="rating-row">
                <span v-for="n in renderStars(tutor.rating).full"  :key="'f'+n" class="star star-full">★</span>
                <span v-for="n in renderStars(tutor.rating).half"  :key="'h'+n" class="star star-half">★</span>
                <span v-for="n in renderStars(tutor.rating).empty" :key="'e'+n" class="star star-empty">★</span>
                <span class="rating-number">{{ tutor.rating.toFixed(1) }}</span>
                <span class="review-count">({{ tutor.reviewCount }} {{ t('discovery.reviews') }})</span>
              </div>

              <!-- Skills/Tags -->
              <div class="skills-row">
                <span
                    v-for="skill in tutor.skills.slice(0, 3)"
                    :key="skill"
                    class="skill-tag">
                  {{ skill }}
                </span>
                <span v-if="tutor.skills.length > 3" class="skill-tag skill-more">
                  +{{ tutor.skills.length - 3 }}
                </span>
              </div>
            </div>

            <!-- CTA -->
            <div class="tutor-cta">
              <pv-button
                  :label="t('discovery.view-profile')"
                  class="btn-profile"
                  @click.stop="navigateToProfile(tutor.id)"/>
            </div>

          </div>
        </div>

      </main>
    </div>

    <div v-if="errors.length" class="text-red-500 mt-3 error-msg">
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

  </div>
</template>

<style scoped>
/* Layout general */
.search-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f3f4f6;
}

/* Hero */
.search-hero {
  background: linear-gradient(135deg, #1a2a40 0%, #2d4a6e 100%);
  padding: 3rem 2rem;
  text-align: center;
}

.hero-title {
  color: #ffffff;
  font-weight: 800;
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
}

.hero-sub {
  color: #a0aec0;
  font-size: 1rem;
  margin: 0 0 1.5rem 0;
}

.search-bar-wrap {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #a0aec0;
  font-size: 1rem;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.9rem 3rem !important;
  border-radius: 12px !important;
  border: none !important;
  font-size: 1rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.clear-btn {
  position: absolute;
  right: 0.5rem;
  color: #a0aec0 !important;
}

/* Grid contenido */
.content-grid {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Filtros */
.filters-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  height: fit-content;
  position: sticky;
  top: 80px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.filters-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 1rem;
  margin: 0;
}

.clear-filters-link {
  color: #e53e4f;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.clear-filters-link:hover { text-decoration: underline; }

.filter-group { margin-bottom: 1.25rem; }

.filter-label {
  color: #8c98a4;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
  display: block;
  margin-bottom: 0.6rem;
}

.rating-options { display: flex; flex-direction: column; gap: 0.4rem; }

.rating-option {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.88rem;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.rating-option:hover { background-color: #f0f2f5; }

.rating-option.active {
  background-color: #e0f2fe;
  color: #0284c7;
  border-color: #bae6fd;
  font-weight: 700;
}

.filter-select { border-radius: 8px !important; }
.w-full { width: 100%; }

/* Resultados */
.results-area { min-height: 400px; }

.results-meta { margin-bottom: 1rem; }

.results-count { color: #4a5568; font-size: 0.9rem; margin: 0; display: flex; align-items: center; gap: 0.5rem; }

.query-tag {
  background-color: #e0f2fe;
  color: #0284c7;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
}

/* Loading */
.loading-state { text-align: center; padding: 3rem; color: #718096; }
.loading-icon  { font-size: 2rem; display: block; margin-bottom: 0.75rem; }

/* Empty state */
.empty-state { background: #ffffff; border-radius: 12px; border: 1px dashed #e2e8f0; padding: 3rem 2rem; text-align: center; }
.empty-icon  { font-size: 3rem; color: #cbd5e0; display: block; margin-bottom: 1rem; }
.empty-title { color: #4a5568; font-weight: 700; font-size: 1rem; margin: 0 0 0.5rem 0; }
.empty-sub   { color: #a0aec0; font-size: 0.85rem; margin: 0 0 1rem 0; }
.btn-clear   { background-color: #1a2a40 !important; border: none !important; border-radius: 8px !important; }

/* Grid de tarjetas */
.tutors-grid { display: flex; flex-direction: column; gap: 1rem; }

.tutor-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid #f0f2f5;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tutor-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
  border-color: #e0f2fe;
}

/* Avatar */
.tutor-avatar-wrap { position: relative; flex-shrink: 0; }

.tutor-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tutor-avatar-icon { color: #718096; font-size: 1.5rem; }

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #16a34a;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

/* Info */
.tutor-main { flex: 1; min-width: 0; }

.tutor-name-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem; }

.tutor-name { color: #1a2a40; font-weight: 800; font-size: 1rem; margin: 0; }

.verified-icon { color: #0284c7; font-size: 0.9rem; }

.tutor-career { color: #718096; font-size: 0.85rem; margin: 0 0 0.5rem 0; }

/* Estrellas */
.rating-row { display: flex; align-items: center; gap: 0.15rem; margin-bottom: 0.5rem; }
.star       { font-size: 0.9rem; }
.star-full  { color: #f5a623; }
.star-half  { color: #f5a623; opacity: 0.6; }
.star-empty { color: #e2e8f0; }
.rating-number { color: #1a2a40; font-weight: 700; font-size: 0.85rem; margin-left: 0.25rem; }
.review-count  { color: #a0aec0; font-size: 0.8rem; }

/* Skills */
.skills-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }

.skill-tag {
  background-color: #f0f2f5;
  color: #4a5568;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.skill-more { background-color: #e0f2fe; color: #0284c7; }

/* CTA */
.tutor-cta { flex-shrink: 0; }

.btn-profile {
  background-color: #1a2a40 !important;
  border: none !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  white-space: nowrap;
}

.btn-profile:hover { background-color: #2d4a6e !important; }

.error-msg { font-weight: bold; padding: 0 2rem; }
</style>
