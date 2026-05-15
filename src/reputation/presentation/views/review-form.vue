<script setup>
import {useI18n}                  from "vue-i18n";
import {useRoute, useRouter}      from "vue-router";
import useReputationStore         from "@/reputation/application/reputation.store.js";
import {computed, onMounted, ref} from "vue";
import {Review}                   from "@/reputation/domain/model/review-entity.js";

const {t}    = useI18n();
const router = useRouter();
const route  = useRoute();
const store  = useReputationStore();
const { addReview, errors, updateReview } = store;

const isEdit = computed(() => !!route.params.id);

const form = ref({
  tutorId:   route.query.tutorId ? parseInt(route.query.tutorId) : null,
  studentId: null,
  sessionId: route.query.sessionId ? parseInt(route.query.sessionId) : null,
  score:     0,
  comment:   '',
  status:    'PENDING',
  date:      new Date().toISOString(),
});

const statusOptions = [
  { label: 'Pending',   value: 'PENDING'   },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Removed',   value: 'REMOVED'   },
];

onMounted(() => {
  console.log('route params:', route.params.id);
  if (isEdit.value) {
    if (!store.reviewsLoaded) store.fetchReviews();
    const existing = store.getReviewById(route.params.id);
    console.log('review found:', existing);
    if (existing) {
      form.value.tutorId   = existing.tutorId;
      form.value.studentId = existing.studentId;
      form.value.sessionId = existing.sessionId;
      form.value.score     = existing.score;
      form.value.comment   = existing.comment;
      form.value.status    = existing.status;
      form.value.date      = existing.date;
    } else {
      navigateBack();
    }
  }
});

const saveReview = () => {
  const review = new Review({
    id:        isEdit.value ? parseInt(route.params.id) : null,
    tutorId:   form.value.tutorId,
    studentId: form.value.studentId,
    sessionId: form.value.sessionId,
    score:     form.value.score,
    comment:   form.value.comment,
    status:    form.value.status,
    date:      form.value.date || new Date().toISOString(),
  });
  if (isEdit.value) updateReview(review); else addReview(review);
  navigateBack();
};

const navigateBack = () => router.push({ name: 'reputation-reviews' });
</script>

<template>
  <div class="p-4 form-container">

    <div class="flex align-items-center gap-3 mb-4">
      <pv-button icon="pi pi-arrow-left" text rounded class="btn-back" @click="navigateBack"/>
      <h1 class="page-title m-0">{{ isEdit ? t('review.edit-title') : t('review.new-title') }}</h1>
    </div>

    <div class="form-card">
      <form @submit.prevent="saveReview">
        <div class="form-grid">

          <div class="field">
            <label class="custom-label">{{ t('review.tutorId') }}</label>
            <pv-input-number v-model="form.tutorId" class="w-full" :min="1" :use-grouping="false" required/>
          </div>

          <div class="field">
            <label class="custom-label">{{ t('review.studentId') }}</label>
            <pv-input-number v-model="form.studentId" class="w-full" :min="1" :use-grouping="false" required/>
          </div>

          <div class="field">
            <label class="custom-label">{{ t('review.sessionId') }}</label>
            <pv-input-number v-model="form.sessionId" class="w-full" :min="1" :use-grouping="false"/>
          </div>

          <div class="field">
            <label class="custom-label">{{ t('review.status') }}</label>
            <pv-select v-model="form.status" :options="statusOptions" option-label="label" option-value="value" class="w-full"/>
          </div>

          <div class="field field-full">
            <label class="custom-label">{{ t('review.score') }}</label>
            <div class="rating-wrap">
              <pv-rating v-model="form.score" :stars="5" :cancel="false"/>
              <span class="score-number">{{ form.score }} / 5</span>
            </div>
          </div>

          <div class="field field-full">
            <label class="custom-label">{{ t('review.comment') }}</label>
            <pv-textarea v-model="form.comment" rows="4" class="w-full" required/>
          </div>

        </div>

        <div class="form-actions">
          <pv-button :label="t('review.cancel')" severity="secondary" @click="navigateBack"/>
          <pv-button :label="t('review.save')"   type="submit"        class="btn-save"/>
        </div>

      </form>
    </div>

    <div v-if="errors.length" class="text-red-500 mt-3 error-msg">
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

  </div>
</template>

<style scoped>
.form-container { width: 100%; padding: 0 2rem; }
.page-title { color: #1a2a40; font-weight: 800; font-size: 1.8rem; }
.btn-back { color: #1a2a40 !important; }

.form-card { background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); padding: 2rem; border: 1px solid #f0f2f5; max-width: 750px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
.field-full { grid-column: 1 / -1; }
.field { display: flex; flex-direction: column; gap: 0.5rem; }

.custom-label { color: #8c98a4; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }

.rating-wrap { display: flex; align-items: center; gap: 1rem; }
.score-number { color: #1a2a40; font-weight: 700; font-size: 1rem; }

.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #f0f2f5; }

.btn-save { background-color: #e53e4f !important; border: none !important; font-weight: bold; border-radius: 8px; }
.btn-save:hover { background-color: #d03544 !important; }

.error-msg { font-weight: bold; }
</style>
