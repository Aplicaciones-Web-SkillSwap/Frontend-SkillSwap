<script setup>
import { ref, onMounted }      from 'vue';
import { useI18n }             from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import useLearningStore        from '@/learning/application/learning.store.js';
import { Quiz }                from '@/learning/domain/model/quiz-entity.js';

const { t }  = useI18n();
const router = useRouter();
const route  = useRoute();
const store  = useLearningStore();

const isEdit = ref(false);
const quizId = ref(null);

const form = ref({ tutorId: 1, course: '', title: '', description: '', status: 'draft' });
const questions = ref([]);
const errors = ref({ title: '', course: '', questions: '' });

const statusOptions = [
  { value: 'draft',     label: 'learning.status-draft'     },
  { value: 'published', label: 'learning.status-published' }
];

onMounted(() => {
  store.fetchQuizzes();
  const id = route.params.id;
  if (id) {
    quizId.value = parseInt(id);
    isEdit.value = true;
    const existing = store.getQuizById(id);
    if (existing) {
      form.value.tutorId     = existing.tutorId;
      form.value.course      = existing.course;
      form.value.title       = existing.title;
      form.value.description = existing.description;
      form.value.status      = existing.status;
      questions.value        = existing.questions.map(q => ({ ...q, options: [...q.options] }));
    }
  }
});

function addQuestion() {
  questions.value.push({ text: '', options: ['', '', '', ''], correctIndex: 0 });
}

function removeQuestion(index) {
  questions.value.splice(index, 1);
}

function updateOption(qIndex, oIndex, value) {
  questions.value[qIndex].options[oIndex] = value;
}

function validate() {
  errors.value.title     = !form.value.title.trim()  ? t('learning.err-title')  : '';
  errors.value.course    = !form.value.course.trim() ? t('learning.err-course') : '';
  const invalidQ = questions.value.some(q => !q.text.trim() || q.options.some(o => !o.trim()));
  errors.value.questions = questions.value.length === 0
      ? t('learning.err-no-questions')
      : invalidQ ? t('learning.err-incomplete-question') : '';
  return !errors.value.title && !errors.value.course && !errors.value.questions;
}

function submit() {
  if (!validate()) return;
  const quiz = new Quiz({
    id:          quizId.value ?? 0,
    tutorId:     Number(form.value.tutorId),
    course:      form.value.course.trim(),
    title:       form.value.title.trim(),
    description: form.value.description.trim(),
    questions:   questions.value.map(q => ({
      text: q.text.trim(), options: q.options.map(o => o.trim()), correctIndex: q.correctIndex
    })),
    status:    form.value.status,
    createdAt: new Date().toISOString()
  });
  if (isEdit.value) { store.updateQuiz(quiz); }
  else              { store.addQuiz(quiz);    }
  router.push({ name: 'learning-quizzes' });
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? t('learning.quiz-edit-title') : t('learning.quiz-new-title') }}</h1>
      <p class="page-sub">{{ isEdit ? t('learning.quiz-edit-sub') : t('learning.quiz-new-sub') }}</p>
    </div>

    <form class="form-layout" @submit.prevent="submit">

      <div class="form-card">
        <h2 class="card-section-title">{{ t('learning.section-general') }}</h2>
        <div class="fields-grid">
          <div class="field-group">
            <label class="field-label">{{ t('learning.field-title') }}</label>
            <pv-input-text v-model="form.title" :placeholder="t('learning.field-title-ph')" fluid :invalid="!!errors.title"/>
            <small v-if="errors.title" class="field-error">{{ errors.title }}</small>
          </div>
          <div class="field-group">
            <label class="field-label">{{ t('learning.field-course') }}</label>
            <pv-input-text v-model="form.course" :placeholder="t('learning.field-course-ph')" fluid :invalid="!!errors.course"/>
            <small v-if="errors.course" class="field-error">{{ errors.course }}</small>
          </div>
          <div class="field-group field-full">
            <label class="field-label">{{ t('learning.field-description') }}</label>
            <pv-input-text v-model="form.description" :placeholder="t('learning.field-description-ph')" fluid/>
          </div>
          <div class="field-group">
            <label class="field-label">{{ t('learning.field-status') }}</label>
            <pv-select v-model="form.status" :options="statusOptions" option-label="label" option-value="value" fluid>
              <template #option="{ option }">{{ t(option.label) }}</template>
              <template #value="{ value }">{{ t(statusOptions.find(s => s.value === value)?.label ?? '') }}</template>
            </pv-select>
          </div>
        </div>
      </div>

      <div class="form-card">
        <div class="questions-header">
          <h2 class="card-section-title" style="margin:0;">
            {{ t('learning.section-questions') }}
            <span class="badge-count">{{ questions.length }}</span>
          </h2>
          <button type="button" class="btn-add-question" @click="addQuestion">
            <i class="pi pi-plus" style="font-size:13px;"></i>
            {{ t('learning.btn-add-question') }}
          </button>
        </div>
        <small v-if="errors.questions" class="field-error" style="display:block; margin-top:8px;">{{ errors.questions }}</small>

        <div v-if="questions.length === 0" class="empty-questions">
          <i class="pi pi-list" style="font-size:2rem; color:#cbd5e0; display:block; margin-bottom:8px;"></i>
          <p>{{ t('learning.no-questions-yet') }}</p>
        </div>

        <div class="questions-list">
          <div v-for="(q, qIdx) in questions" :key="qIdx" class="question-card">
            <div class="question-header">
              <span class="question-num">{{ t('learning.question-label') }} {{ qIdx + 1 }}</span>
              <button type="button" class="action-icon delete" @click="removeQuestion(qIdx)">
                <i class="pi pi-trash" style="font-size:14px;"></i>
              </button>
            </div>
            <div class="field-group" style="margin-bottom:14px;">
              <label class="field-label">{{ t('learning.field-question-text') }}</label>
              <pv-input-text v-model="q.text" :placeholder="t('learning.field-question-ph')" fluid/>
            </div>
            <div class="options-grid">
              <div v-for="(opt, oIdx) in q.options" :key="oIdx" class="option-row" :class="{ 'option-correct': q.correctIndex === oIdx }">
                <input type="radio" :name="`correct-${qIdx}`" :value="oIdx" v-model="q.correctIndex" class="radio-correct" :title="t('learning.mark-correct')"/>
                <span class="option-letter">{{ ['A','B','C','D'][oIdx] }}</span>
                <pv-input-text :model-value="opt" :placeholder="`${t('learning.option-placeholder')} ${['A','B','C','D'][oIdx]}`" class="option-input" fluid @update:model-value="val => updateOption(qIdx, oIdx, val)"/>
              </div>
            </div>
            <small class="correct-hint">
              <i class="pi pi-info-circle" style="font-size:11px;"></i>
              {{ t('learning.correct-hint') }}
            </small>
          </div>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn-primary" type="submit">
          <i class="pi pi-save" style="font-size:14px;"></i>
          {{ isEdit ? t('learning.btn-update') : t('learning.btn-create-quiz') }}
        </button>
        <button class="btn-secondary" type="button" @click="router.push({ name: 'learning-quizzes' })">
          {{ t('learning.btn-cancel') }}
        </button>
      </div>

    </form>
  </div>
</template>

<style scoped>
.form-page   { max-width: 780px; }
.page-header { margin-bottom: 24px; }
.page-title  { font-size: 22px; font-weight: 700; color: #1a2a40; margin: 0 0 4px; }
.page-sub    { font-size: 13px; color: #9ca3af; margin: 0; }
.form-layout { display: flex; flex-direction: column; gap: 20px; }
.form-card   { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
.card-section-title { font-size: 15px; font-weight: 700; color: #1a2a40; margin: 0 0 18px; }
.fields-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field-full   { grid-column: 1 / -1; }
.field-group  { display: flex; flex-direction: column; gap: 6px; }
.field-label  { font-size: 13px; font-weight: 600; color: #374151; }
.field-error  { font-size: 12px; color: #e53e4f; }
.questions-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.badge-count { background: #fef3c7; color: #d97706; font-size: 11px; font-weight: 700; border-radius: 20px; padding: 2px 8px; margin-left: 8px; }
.btn-add-question { display: inline-flex; align-items: center; gap: 6px; background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.btn-add-question:hover { background: #e0f2fe; }
.empty-questions { text-align: center; padding: 32px; color: #9ca3af; font-size: 13px; }
.questions-list { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
.question-card  { border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; background: #fafafa; transition: border-color 0.15s; }
.question-card:hover { border-color: #bae6fd; }
.question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.question-num    { font-size: 13px; font-weight: 700; color: #1a2a40; }
.options-grid { display: flex; flex-direction: column; gap: 8px; }
.option-row   { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; transition: border-color 0.15s; }
.option-correct { border-color: #16a34a; background: #f0fdf4; }
.radio-correct  { width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; accent-color: #16a34a; }
.option-letter  { font-size: 12px; font-weight: 700; color: #6b7280; width: 16px; flex-shrink: 0; }
.option-input   { flex: 1; }
:deep(.option-input .p-inputtext) { border: none !important; background: transparent !important; padding: 0 !important; font-size: 14px; }
:deep(.option-input .p-inputtext:focus) { box-shadow: none !important; }
.correct-hint { font-size: 11px; color: #9ca3af; display: flex; align-items: center; gap: 4px; margin-top: 10px; }
.action-icon  { width: 30px; height: 30px; border: none; background: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9ca3af; transition: all 0.15s; }
.action-icon.delete:hover { background: #fff1f0; color: #ef4444; }
.btn-row { display: flex; gap: 12px; }
.btn-primary   { display: inline-flex; align-items: center; gap: 6px; background: #1a2a40; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit; }
.btn-primary:hover { background: #2d4a6e; }
.btn-secondary { display: inline-flex; align-items: center; background: none; color: #6b7280; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.btn-secondary:hover { border-color: #1a2a40; color: #1a2a40; }
</style>