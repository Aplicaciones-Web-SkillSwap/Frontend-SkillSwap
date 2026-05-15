<script setup>
import { onMounted, computed } from 'vue';
import { useI18n }             from 'vue-i18n';
import { useRouter }           from 'vue-router';
import useLearningStore        from '@/learning/application/learning.store.js';

const { t }  = useI18n();
const router = useRouter();
const store  = useLearningStore();

const publishedQuizzes = computed(() => store.publishedQuizzes);
const draftQuizzes     = computed(() => store.draftQuizzes);

onMounted(() => { store.fetchQuizzes(); });

function publishQuiz(quiz) {
  const updated = { ...quiz, status: 'published', createdAt: quiz.createdAt.toISOString() };
  store.updateQuiz(updated);
}
</script>

<template>
  <div class="page-layout">

    <div class="col-left">
      <div class="page-header">
        <h1 class="page-title">{{ t('learning.quizzes-title') }}</h1>
        <p class="page-sub">{{ t('learning.quizzes-sub') }}</p>
      </div>

      <div class="table-card">
        <div class="table-header">
          <span class="table-title">
            {{ t('learning.table-quizzes') }}
            <span class="badge-count">{{ store.quizzes.length }}</span>
          </span>
          <button class="btn-primary" @click="router.push({ name: 'learning-quizzes-new' })">
            <i class="pi pi-plus" style="font-size:13px;"></i>
            {{ t('learning.btn-new-quiz') }}
          </button>
        </div>

        <div v-if="store.loading" class="spinner-wrap">
          <i class="pi pi-spin pi-spinner" style="font-size:28px; color:#1a2a40;"></i>
        </div>

        <pv-data-table v-else :value="store.quizzes" :rows="10" paginator row-hover striped-rows size="small">

          <pv-column header="#" style="width:52px;">
            <template #body="{ index }">
              <span style="color:#9ca3af; font-size:13px;">#{{ index + 1 }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('learning.col-title')" field="title">
            <template #body="{ data }">
              <span style="font-weight:600; color:#1a2a40;">{{ data.title }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('learning.col-course')" field="course">
            <template #body="{ data }">
              <span class="course-tag">{{ data.course }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('learning.col-questions')">
            <template #body="{ data }">
              <span style="color:#6b7280; font-size:13px;">{{ data.questionCount() }} {{ t('learning.questions-label') }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('learning.col-status')" field="status">
            <template #body="{ data }">
              <span class="chip" :class="data.isPublished() ? 'chip-published' : 'chip-draft'">
                {{ data.isPublished() ? t('learning.status-published') : t('learning.status-draft') }}
              </span>
            </template>
          </pv-column>

          <pv-column :header="t('learning.col-date')">
            <template #body="{ data }">
              <span style="color:#6b7280; font-size:13px;">{{ data.getFormattedCreatedAt() }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('learning.col-actions')" style="width:130px;">
            <template #body="{ data }">
              <div class="actions-wrap">
                <button class="action-icon" :title="t('learning.btn-edit')"
                        @click="router.push({ name: 'learning-quizzes-edit', params: { id: data.id } })">
                  <i class="pi pi-pencil" style="font-size:15px;"></i>
                </button>
                <button class="action-icon publish" :title="t('learning.btn-publish')"
                        :disabled="data.isPublished()" @click="publishQuiz(data)">
                  <i class="pi pi-check-circle" style="font-size:15px;"></i>
                </button>
                <button class="action-icon delete" :title="t('learning.btn-delete')"
                        @click="store.deleteQuiz(data.id)">
                  <i class="pi pi-trash" style="font-size:15px;"></i>
                </button>
              </div>
            </template>
          </pv-column>

          <template #empty>
            <p class="empty-msg">{{ t('learning.no-quizzes') }}</p>
          </template>
        </pv-data-table>
      </div>
    </div>

    <div class="col-right">
      <div class="summary-box">
        <div class="summary-header"><span class="summary-title">{{ t('learning.summary-title') }}</span></div>
        <div class="summary-stat"><span class="stat-label">{{ t('learning.summary-total') }}</span><span class="stat-value">{{ store.quizCount }}</span></div>
        <div class="summary-stat"><span class="stat-label">{{ t('learning.summary-published') }}</span><span class="stat-value published">{{ publishedQuizzes.length }}</span></div>
        <div class="summary-stat"><span class="stat-label">{{ t('learning.summary-draft') }}</span><span class="stat-value draft">{{ draftQuizzes.length }}</span></div>
      </div>

      <div class="published-box">
        <div class="resolved-header">
          <span class="resolved-title">{{ t('learning.published-title') }}</span>
          <span class="resolved-count">{{ publishedQuizzes.length }}</span>
        </div>
        <div v-for="q in publishedQuizzes" :key="q.id" class="resolved-item">
          <div class="resolved-top">
            <span class="resolved-name">{{ q.title }}</span>
            <button class="action-icon delete" @click="store.deleteQuiz(q.id)">
              <i class="pi pi-trash" style="font-size:13px;"></i>
            </button>
          </div>
          <div class="resolved-course">{{ q.course }}</div>
          <div class="resolved-meta">
            <span style="font-size:11px; color:#9ca3af;">{{ q.getFormattedCreatedAt() }}</span>
            <span style="font-size:11px; color:#6b7280;">{{ q.questionCount() }} {{ t('learning.questions-label') }}</span>
          </div>
        </div>
        <p v-if="publishedQuizzes.length === 0" class="resolved-empty">{{ t('learning.no-published') }}</p>
      </div>
    </div>

  </div>
</template>

<style scoped>
.page-layout  { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
.page-header  { margin-bottom: 20px; }
.page-title   { font-size: 24px; font-weight: 700; color: #1a2a40; margin: 0 0 4px; }
.page-sub     { font-size: 13px; color: #9ca3af; margin: 0; }
.table-card   { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
.table-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid #f1f3f5; }
.table-title  { font-size: 15px; font-weight: 600; color: #1a2a40; display: flex; align-items: center; gap: 8px; }
.badge-count  { background: #fef3c7; color: #d97706; font-size: 11px; font-weight: 700; border-radius: 20px; padding: 2px 8px; }
.spinner-wrap { padding: 32px; text-align: center; }
.course-tag   { background: #e0f2fe; color: #0284c7; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
.chip           { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.chip-published { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.chip-draft     { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
.actions-wrap { display: flex; align-items: center; gap: 4px; }
.action-icon  { width: 32px; height: 32px; border: none; background: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9ca3af; transition: all 0.15s; }
.action-icon:hover         { background: #f3f4f6; color: #1a2a40; }
.action-icon.publish:hover { background: #f0fdf4; color: #16a34a; }
.action-icon.delete:hover  { background: #fff1f0; color: #ef4444; }
.action-icon:disabled      { opacity: 0.35; cursor: not-allowed; }
.empty-msg { text-align: center; color: #9ca3af; font-size: 13px; padding: 32px; }
:deep(.p-datatable)                            { background: #ffffff !important; }
:deep(.p-datatable-table-container)            { background: #ffffff !important; }
:deep(.p-datatable-thead > tr > th)            { background: #f8f9fa !important; color: #374151 !important; border-color: #e5e7eb !important; }
:deep(.p-datatable-tbody > tr)                 { background: #ffffff !important; color: #374151 !important; }
:deep(.p-datatable-tbody > tr:nth-child(even)) { background: #f9fafb !important; }
:deep(.p-datatable-tbody > tr:hover)           { background: #f0f4ff !important; }
:deep(.p-paginator)                            { background: #ffffff !important; border-color: #e5e7eb !important; }
.summary-box    { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
.summary-header { padding: 14px 16px; border-bottom: 1px solid #f1f3f5; }
.summary-title  { font-size: 14px; font-weight: 600; color: #1a2a40; }
.summary-stat   { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid #f9fafb; }
.summary-stat:last-child { border-bottom: none; }
.stat-label  { font-size: 13px; color: #6b7280; }
.stat-value  { font-size: 15px; font-weight: 700; color: #1a2a40; }
.stat-value.published { color: #16a34a; }
.stat-value.draft     { color: #9ca3af; }
.published-box  { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.resolved-header { padding: 14px 16px; border-bottom: 1px solid #f1f3f5; display: flex; align-items: center; gap: 8px; }
.resolved-title  { font-size: 14px; font-weight: 600; color: #1a2a40; }
.resolved-count  { background: #f0fdf4; color: #16a34a; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
.resolved-item   { padding: 12px 16px; border-bottom: 1px solid #f1f3f5; transition: background 0.15s; }
.resolved-item:hover      { background: #f8f9fb; }
.resolved-item:last-child { border-bottom: none; }
.resolved-top    { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.resolved-name   { font-size: 13px; font-weight: 600; color: #1a2a40; }
.resolved-course { font-size: 12px; color: #0284c7; margin-bottom: 6px; }
.resolved-meta   { display: flex; justify-content: space-between; align-items: center; }
.resolved-empty  { text-align: center; color: #9ca3af; font-size: 13px; padding: 24px; }
.btn-primary { display: inline-flex; align-items: center; gap: 6px; background: #1a2a40; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit; }
.btn-primary:hover { background: #2d4a6e; }
</style>