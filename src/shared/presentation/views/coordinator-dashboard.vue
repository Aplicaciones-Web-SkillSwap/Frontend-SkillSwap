<script setup>
import { useI18n }           from 'vue-i18n';
import { useRouter }         from 'vue-router';
import { computed, onMounted } from 'vue';
import useWorkspaceStore     from '@/workspace/application/workspace.store.js';
import useModerationStore    from '@/moderation/application/moderation.store.js';
import useDiscoveryStore     from '@/discovery/application/discovery.store.js';
import useLearningStore      from '@/learning/application/learning.store.js';

const { t }  = useI18n();
const router = useRouter();

const workspaceStore  = useWorkspaceStore();
const moderationStore = useModerationStore();
const discoveryStore  = useDiscoveryStore();
const learningStore   = useLearningStore();

onMounted(() => {
  if (!workspaceStore.sessionsLoaded) workspaceStore.fetchSessions();
  moderationStore.fetchReports();
  if (!discoveryStore.tutorsLoaded) discoveryStore.fetchTutors();
  if (!learningStore.quizzes.length) learningStore.fetchQuizzes();
});

const activeSessions = computed(() =>
    workspaceStore.sessions.filter(s => s.status === 'scheduled').length
);
const pendingSessions = computed(() =>
    workspaceStore.sessions.filter(s => s.status === 'pending').length
);
const pendingReportsCount  = computed(() => moderationStore.activeReports.length);
const resolvedReportsCount = computed(() => moderationStore.resolvedReports.length);
const totalTutors      = computed(() => discoveryStore.tutors.length);
const verifiedTutors    = computed(() => discoveryStore.tutors.filter(t => t.verified).length);
const totalQuizzes     = computed(() => learningStore.quizzes.length);

const navigateToReports = () => router.push({ name: 'moderation-reports' });
const navigateToTutors  = () => router.push({ name: 'discovery-search' });
const navigateToQuizzes = () => router.push({ name: 'learning-quizzes' });
</script>

<template>
  <div class="dashboard-container">

    <div class="dashboard-header">
      <i class="pi pi-shield header-icon"/>
      <div>
        <h1 class="dashboard-title">{{ t('coordinator.title') }}</h1>
        <p class="dashboard-sub">{{ t('coordinator.sub') }}</p>
      </div>
    </div>

    <!-- Sesiones -->
    <div class="section-block">
      <h2 class="section-label">{{ t('coordinator.section-sessions') }}</h2>
      <div class="cards-row">
        <div class="metric-card">
          <i class="pi pi-calendar-check metric-icon metric-icon-blue"/>
          <p class="metric-value">{{ activeSessions }}</p>
          <p class="metric-label">{{ t('coordinator.metric-active-sessions') }}</p>
        </div>
        <div class="metric-card">
          <i class="pi pi-clock metric-icon metric-icon-orange"/>
          <p class="metric-value">{{ pendingSessions }}</p>
          <p class="metric-label">{{ t('coordinator.metric-pending-sessions') }}</p>
        </div>
      </div>
    </div>

    <!-- Moderación -->
    <div class="section-block">
      <h2 class="section-label">{{ t('coordinator.section-moderation') }}</h2>
      <div class="cards-row">
        <div class="metric-card metric-card-clickable" @click="navigateToReports">
          <i class="pi pi-exclamation-triangle metric-icon metric-icon-red"/>
          <p class="metric-value">{{ pendingReportsCount }}</p>
          <p class="metric-label">{{ t('coordinator.metric-pending-reports') }}</p>
        </div>
        <div class="metric-card metric-card-clickable" @click="navigateToReports">
          <i class="pi pi-check-circle metric-icon metric-icon-green"/>
          <p class="metric-value">{{ resolvedReportsCount }}</p>
          <p class="metric-label">{{ t('coordinator.metric-resolved-reports') }}</p>
        </div>
      </div>
    </div>

    <!-- Comunidad académica -->
    <div class="section-block">
      <h2 class="section-label">{{ t('coordinator.section-community') }}</h2>
      <div class="cards-row">
        <div class="metric-card metric-card-clickable" @click="navigateToTutors">
          <i class="pi pi-users metric-icon metric-icon-blue"/>
          <p class="metric-value">{{ totalTutors }}</p>
          <p class="metric-label">{{ t('coordinator.metric-total-tutors') }}</p>
        </div>
        <div class="metric-card metric-card-clickable" @click="navigateToTutors">
          <i class="pi pi-verified metric-icon metric-icon-green"/>
          <p class="metric-value">{{ verifiedTutors }}</p>
          <p class="metric-label">{{ t('coordinator.metric-verified-tutors') }}</p>
        </div>
        <div class="metric-card metric-card-clickable" @click="navigateToQuizzes">
          <i class="pi pi-book metric-icon metric-icon-purple"/>
          <p class="metric-value">{{ totalQuizzes }}</p>
          <p class="metric-label">{{ t('coordinator.metric-total-quizzes') }}</p>
        </div>
      </div>
    </div>

    <!-- Acceso a moderación detallada -->
    <button class="btn-reports" @click="navigateToReports">
      <i class="pi pi-shield" style="font-size:14px;"></i>
      {{ t('coordinator.btn-go-reports') }}
    </button>

  </div>
</template>

<style scoped>
.dashboard-container { max-width: 920px; margin: 0 auto; }

.dashboard-header { display: flex; align-items: center; gap: 16px; margin-bottom: 2rem; }
.header-icon { font-size: 2.2rem; color: #1e4d8c; }
.dashboard-title { color: #1a2a40; font-weight: 800; font-size: 1.7rem; margin: 0; }
.dashboard-sub   { color: #9ca3af; font-size: 0.9rem; margin: 0.2rem 0 0; }

.section-block { margin-bottom: 1.75rem; }
.section-label {
  color: #8c98a4; font-size: 0.78rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 0.75rem;
}

.cards-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }

.metric-card {
  background: #fff; border: 1px solid #f0f2f5; border-radius: 14px;
  padding: 1.5rem; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: all 0.15s;
}
.metric-card-clickable { cursor: pointer; }
.metric-card-clickable:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.08); }

.metric-icon { font-size: 1.6rem; display: block; margin-bottom: 0.5rem; }
.metric-icon-blue   { color: #1e4d8c; }
.metric-icon-orange { color: #d97706; }
.metric-icon-red    { color: #dc2626; }
.metric-icon-green  { color: #16a34a; }
.metric-icon-purple { color: #7c3aed; }

.metric-value { color: #1a2a40; font-weight: 800; font-size: 1.9rem; margin: 0; }
.metric-label { color: #6b7280; font-size: 0.82rem; margin: 0.3rem 0 0; }

.btn-reports {
  display: inline-flex; align-items: center; gap: 8px;
  background: #1a2a40; color: #fff; border: none; border-radius: 10px;
  padding: 0.8rem 1.6rem; font-size: 0.92rem; font-weight: 700;
  cursor: pointer; transition: background 0.15s; font-family: inherit; margin-top: 0.5rem;
}
.btn-reports:hover { background: #2d4a6e; }
</style>