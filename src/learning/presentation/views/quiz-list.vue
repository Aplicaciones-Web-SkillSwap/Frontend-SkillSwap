<script setup>
import { onMounted, computed } from 'vue';
import { useI18n }             from 'vue-i18n';
import { useRouter }           from 'vue-router';
import useLearningStore        from '@/learning/application/learning.store.js';

const { t }  = useI18n();
const router = useRouter();
const store  = useLearningStore();

onMounted(() => { store.fetchQuizzes(); });

function confirmDelete(quiz) {
  if (confirm(t('learning.confirm-delete', { title: quiz.title }))) {
    store.deleteQuiz(quiz.id);
  }
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
              <span class="questions-chip" :class="{ 'questions-empty': data.questionCount() === 0 }">
                {{ data.questionCount() }} {{ t('learning.questions-label') }}
              </span>
            </template>
          </pv-column>

          <pv-column :header="t('learning.col-description')" field="description">
            <template #body="{ data }">
              <span style="color:#6b7280; font-size:13px;">{{ data.description }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('learning.col-actions')" style="width:140px;">
            <template #body="{ data }">
              <div class="actions-wrap">
                <button class="action-icon results" :title="t('learning.btn-results')"
                        @click="router.push({ name: 'learning-quizzes-results', params: { id: data.id } })">
                  <i class="pi pi-chart-bar" style="font-size:15px;"></i>
                </button>
                <button class="action-icon" :title="t('learning.btn-edit')"
                        @click="router.push({ name: 'learning-quizzes-edit', params: { id: data.id } })">
                  <i class="pi pi-pencil" style="font-size:15px;"></i>
                </button>
                <button class="action-icon delete" :title="t('learning.btn-delete')"
                        @click="confirmDelete(data)">
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
        <div class="summary-stat">
          <span class="stat-label">{{ t('learning.summary-total-questions') }}</span>
          <span class="stat-value">{{ store.quizzes.reduce((sum, q) => sum + q.questionCount(), 0) }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.page-layout  { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
.page-header  { margin-bottom: 20px; }
.page-title   { font-size: 24px; font-weight: 700; color: #1a2a40; margin: 0 0 4px; }
.page-sub     { font-size: 13px; color: #9ca3af; margin: 0; }
.table-card   { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
.table-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid #f1f3f5; }
.table-title  { font-size: 15px; font-weight: 600; color: #1a2a40; display: flex; align-items: center; gap: 8px; }
.badge-count  { background: #fef3c7; color: #d97706; font-size: 11px; font-weight: 700; border-radius: 20px; padding: 2px 8px; }
.spinner-wrap { padding: 32px; text-align: center; }
.course-tag   { background: #e0f2fe; color: #0284c7; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
.questions-chip       { background: #f0fdf4; color: #16a34a; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
.questions-chip.questions-empty { background: #fef3c7; color: #d97706; }
.actions-wrap { display: flex; align-items: center; gap: 4px; }
.action-icon  { width: 32px; height: 32px; border: none; background: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9ca3af; transition: all 0.15s; }
.action-icon:hover         { background: #f3f4f6; color: #1a2a40; }
.action-icon.delete:hover  { background: #fff1f0; color: #ef4444; }
.empty-msg { text-align: center; color: #9ca3af; font-size: 13px; padding: 32px; }
:deep(.p-datatable)                            { background: #ffffff !important; }
:deep(.p-datatable-table-container)            { background: #ffffff !important; }
:deep(.p-datatable-thead > tr > th)            { background: #f8f9fa !important; color: #374151 !important; border-color: #e5e7eb !important; }
:deep(.p-datatable-tbody > tr)                 { background: #ffffff !important; color: #374151 !important; }
:deep(.p-datatable-tbody > tr:nth-child(even)) { background: #f9fafb !important; }
:deep(.p-datatable-tbody > tr:hover)           { background: #f0f4ff !important; }
:deep(.p-paginator)                            { background: #ffffff !important; border-color: #e5e7eb !important; }
.summary-box    { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.summary-header { padding: 14px 16px; border-bottom: 1px solid #f1f3f5; }
.summary-title  { font-size: 14px; font-weight: 600; color: #1a2a40; }
.summary-stat   { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid #f9fafb; }
.summary-stat:last-child { border-bottom: none; }
.stat-label  { font-size: 13px; color: #6b7280; }
.stat-value  { font-size: 15px; font-weight: 700; color: #1a2a40; }
.btn-primary { display: inline-flex; align-items: center; gap: 6px; background: #1a2a40; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit; }
.btn-primary:hover { background: #2d4a6e; }
.action-icon.results:hover { background: #f0f4ff; color: #1e4d8c; }
</style>