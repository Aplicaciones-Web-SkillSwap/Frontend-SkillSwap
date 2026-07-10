<script setup>
import { ref }     from 'vue';
import { useI18n } from 'vue-i18n';
import QuizList    from '@/learning/presentation/views/quiz-list.vue';
import ReportList  from '@/moderation/presentation/views/report-list.vue';

const { t } = useI18n();

const tabs = [
  { key: 'quizzes', label: 'coordinator.tab-quizzes', icon: 'pi pi-question-circle' },
  { key: 'reports', label: 'coordinator.tab-reports', icon: 'pi pi-flag' },
];
const activeTab = ref('quizzes');
</script>

<template>
  <div class="dashboard-container">

    <div class="admin-badge">
      <i class="pi pi-shield"/>
      <span>{{ t('coordinator.admin-mode') }}</span>
    </div>

    <div class="dashboard-header">
      <i class="pi pi-shield header-icon"/>
      <div>
        <h1 class="dashboard-title">{{ t('coordinator.title') }}</h1>
        <p class="dashboard-sub">{{ t('coordinator.sub') }}</p>
      </div>
    </div>

    <div class="tabs-bar">
      <div
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: tab.key === activeTab }"
          @click="activeTab = tab.key">
        <i :class="tab.icon"/>
        <span>{{ t(tab.label) }}</span>
      </div>
    </div>

    <div class="tab-content">
      <QuizList   v-if="activeTab === 'quizzes'"/>
      <ReportList v-else-if="activeTab === 'reports'"/>
    </div>

  </div>
</template>

<style scoped>
.dashboard-container { max-width: 1100px; margin: 0 auto; }

.admin-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: #fff7ed; color: #d97706; border: 1px solid #fed7aa;
  border-radius: 20px; padding: 0.4rem 1rem; font-size: 0.8rem; font-weight: 700;
  margin-bottom: 1.25rem;
}

.dashboard-header { display: flex; align-items: center; gap: 16px; margin-bottom: 1.75rem; }
.header-icon { font-size: 2.2rem; color: #1e4d8c; }
.dashboard-title { color: #1a2a40; font-weight: 800; font-size: 1.7rem; margin: 0; }
.dashboard-sub   { color: #9ca3af; font-size: 0.9rem; margin: 0.2rem 0 0; }

.tabs-bar {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #f0f2f5;
  margin-bottom: 1.5rem;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  color: #8c98a4;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab-item.active {
  color: #1a2a40;
  border-bottom-color: #1a2a40;
}
</style>
