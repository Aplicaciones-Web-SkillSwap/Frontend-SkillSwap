<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute }      from 'vue-router'
import { useI18n }                  from 'vue-i18n'
import { useToast }                 from 'primevue/usetoast'
import useReputationStore           from '@/reputation/application/reputation.store.js'
import { Review }                   from '@/reputation/domain/model/review-entity.js'

const { t }  = useI18n()
const router = useRouter()
const route  = useRoute()
const toast  = useToast()
const store  = useReputationStore()

const isEdit = computed(() => !!route.params.id)

const form = ref({
  tutorId:   null,
  studentId: null,
  sessionId: null,
  score:     0,
  comment:   '',
  status:    'PENDING',
  date:      new Date().toISOString(),
})

const statusOptions = ['PENDING', 'PUBLISHED', 'REMOVED']

onMounted(() => {
  if (isEdit.value) {
    if (!store.reviewsLoaded) store.fetchReviews()
    const existing = store.getReviewById(route.params.id)
    if (existing) form.value = { ...existing }
    else back()
  }
})

const save = () => {
  const review = new Review({
    id: isEdit.value ? parseInt(route.params.id) : null,
    ...form.value,
  })
  if (isEdit.value) store.updateReview(review)
  else store.addReview(review)

  toast.add({
    severity: 'success',
    summary: isEdit.value ? t('review.updated') : t('review.created'),
    life: 3000
  })
  back()
}

const back = () => router.push({ name: 'reputation-reviews' })
</script>

<template>
  <div style="max-width: 520px">
    <h1 class="text-2xl font-bold mb-4">
      {{ isEdit ? t('review.edit_title') : t('review.new_title') }}
    </h1>

    <div class="flex flex-column gap-4">
      <pv-float-label>
        <pv-input-number id="tutorId" v-model="form.tutorId" :use-grouping="false" class="w-full" />
        <label for="tutorId">{{ t('review.tutor_id') }}</label>
      </pv-float-label>

      <pv-float-label>
        <pv-input-number id="studentId" v-model="form.studentId" :use-grouping="false" class="w-full" />
        <label for="studentId">{{ t('review.student_id') }}</label>
      </pv-float-label>

      <pv-float-label>
        <pv-input-number id="sessionId" v-model="form.sessionId" :use-grouping="false" class="w-full" />
        <label for="sessionId">{{ t('review.session_id') }}</label>
      </pv-float-label>

      <div>
        <label class="block mb-2 font-medium">{{ t('review.score') }}</label>
        <pv-rating v-model="form.score" :stars="5" :cancel="false" />
      </div>

      <pv-float-label>
        <pv-textarea id="comment" v-model="form.comment" rows="4" class="w-full" />
        <label for="comment">{{ t('review.comment') }}</label>
      </pv-float-label>

      <div>
        <label class="block mb-2 font-medium">{{ t('review.status') }}</label>
        <pv-select v-model="form.status" :options="statusOptions" class="w-full" />
      </div>

      <div class="flex gap-2 mt-2">
        <pv-button :label="t('review.save')"   icon="pi pi-check" @click="save" />
        <pv-button :label="t('review.cancel')" icon="pi pi-times" severity="secondary" @click="back" />
      </div>
    </div>
  </div>
</template>