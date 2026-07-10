<script setup>
import { computed, onMounted }  from 'vue';
import { useRoute, useRouter }  from 'vue-router';
import { useI18n }              from 'vue-i18n';
import useModerationStore       from '@/moderation/application/moderation.store.js';
import useWorkspaceStore        from '@/workspace/application/workspace.store.js';
import useAuthStore             from '@/iam/application/auth.store.js';
import { formatDateTime }       from '@/shared/utils/format-date.js';

const { t }  = useI18n();
const route  = useRoute();
const router = useRouter();
const moderationStore = useModerationStore();
const workspaceStore  = useWorkspaceStore();
const authStore       = useAuthStore();

const userId = computed(() => Number(route.params.userId));

const report = computed(() => {

  if (route.query.reportId) {
    return moderationStore.reports.find(r => r.id === Number(route.query.reportId)) ?? null;
  }
  return moderationStore.reports.find(r => r.reportedUserId === userId.value) ?? null;
});

const session = computed(() =>
    report.value?.sessionId
        ? workspaceStore.getSessionById(report.value.sessionId)
        : null
);

const sessionMessages = computed(() =>
    session.value ? workspaceStore.getMessagesBySessionId(session.value.id) : []
);

const userName = (id) => authStore.getUsername(id) || `Usuario #${id}`;

const caseDate = computed(() => report.value
    ? formatDateTime(report.value.reportedAt)
    : '—'
);

/** Sancionado / Desestimado / Pendiente, igual que en la lista de reportes */
const status = computed(() => {
  if (!report.value) return 'pending';
  if (!report.value.closed) return 'pending';
  const sanction = moderationStore.sanctions.find(s => s.reportId === report.value.id);
  if (sanction && sanction.type !== 'dismissed') return 'sanctioned';
  return 'dismissed';
});

onMounted(() => {
  if (moderationStore.reports.length === 0) moderationStore.fetchReports();
  moderationStore.fetchSanctions();
  if (!workspaceStore.sessionsLoaded)        workspaceStore.fetchSessions();
  if (!workspaceStore.messagesLoaded)        workspaceStore.fetchMessages();
  authStore.fetchAllUsers();
});

function statusLabel(s) {
  const map = {
    pending:    t('moderation.status-pending'),
    sanctioned: t('moderation.status-sanctioned'),
    dismissed:  t('moderation.status-dismissed')
  };
  return map[s] ?? s;
}

const navigateToSanction = () => {
  router.push({
    name:  'moderation-sanctions-new',
    query: {
      reportId:         report.value?.id,
      sanctionedUserId: userId.value,
    }
  });
};
</script>

<template>
  <div class="chat-page">

    <button class="back-btn" @click="router.push({ name: 'moderation-reports' })">
      <i class="pi pi-arrow-left"></i>
      {{ t('moderation.btn-back') }}
    </button>

    <!-- Info del reporte -->
    <div class="session-card">
      <div class="session-header">
        <div>
          <h2 class="session-title">{{ t('moderation.chat-title') }}</h2>
          <p class="session-subtitle">{{ t('moderation.chat-sub') }}</p>
        </div>
        <span class="chip" :class="{
          'chip-pending':    status === 'pending',
          'chip-sanctioned': status === 'sanctioned',
          'chip-dismissed':  status === 'dismissed'
        }">{{ statusLabel(status) }}</span>
      </div>

      <div class="session-meta">
        <div class="meta-item">
          <span class="meta-label">{{ t('moderation.chat-date') }}</span>
          <span class="meta-value">{{ caseDate }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">{{ t('moderation.chat-tutor') }}</span>
          <span class="meta-value">{{ userName(report?.reporterUserId) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">{{ t('moderation.chat-student') }}</span>
          <span class="meta-value">{{ userName(report?.reportedUserId) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Motivo</span>
          <span class="meta-value">{{ report?.reason ?? '—' }}</span>
        </div>
      </div>

      <!-- Botón sancionar -->
      <div class="sanction-row">
        <button class="btn-sanction" @click="navigateToSanction">
          <i class="pi pi-gavel" style="font-size:14px;"></i>
          Aplicar sanción al infractor
        </button>
      </div>
    </div>

    <!-- Mensajes de la sesión -->
    <div class="messages-card">
      <div class="messages-header">
        <h3 class="messages-title">{{ t('moderation.chat-messages') }}</h3>
        <span v-if="session" style="font-size:12px; color:#9ca3af;">
          Sesión #{{ session.id }} — {{ session.topic }}
        </span>
      </div>

      <div v-if="!workspaceStore.messagesLoaded" class="spinner-wrap">
        <i class="pi pi-spin pi-spinner" style="font-size:28px; color:#1e4d8c;"></i>
      </div>

      <div v-else-if="sessionMessages.length === 0" class="no-messages">
        <i class="pi pi-comments" style="font-size:36px; color:#d1d5db; display:block; margin-bottom:10px;"></i>
        {{ t('moderation.chat-no-messages') }}
      </div>

      <div v-else class="messages-list">
        <div v-for="msg in sessionMessages" :key="msg.id" class="message-row">
          <div class="avatar-circle">
            <i class="pi pi-user" style="font-size:12px;"/>
          </div>
          <div class="message-body">
            <div class="message-meta">
              <span class="sender-label">{{ userName(msg.senderId) }}</span>
              <span class="sent-time">{{ formatDateTime(msg.sentAt) }}</span>
            </div>
            <!-- Texto -->
            <div v-if="msg.content" class="bubble">{{ msg.content }}</div>
            <!-- Archivo adjunto -->
            <div v-if="msg.fileUrl" class="bubble file-bubble">
              <i class="pi pi-file mr-1"/>
              <a :href="msg.fileUrl" target="_blank" class="file-link">
                {{ msg.fileName || 'Archivo adjunto' }}
              </a>
            </div>
            <!-- Quiz compartido (evidencia, sin acción de click) -->
            <div v-if="msg.quizId" class="bubble quiz-bubble">
              <i class="pi pi-question-circle mr-1"/>
              <span>{{ t('moderation.chat-quiz-shared') }}: <strong>{{ msg.quizTitle }}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.chat-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  align-self: flex-start;
  font-family: inherit;
  transition: all 0.15s;
}
.back-btn:hover { background: #f3f4f6; border-color: #d1d5db; }

.session-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}
.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.session-title    { font-size: 20px; font-weight: 700; color: #1a2a40; margin: 0 0 4px; }
.session-subtitle { font-size: 13px; color: #9ca3af; margin: 0; }

.session-meta { display: flex; gap: 32px; flex-wrap: wrap; }
.meta-item    { display: flex; flex-direction: column; gap: 2px; }
.meta-label   { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
.meta-value   { font-size: 14px; font-weight: 600; color: #1a2a40; }

.messages-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
.messages-header { padding: 16px 20px; border-bottom: 1px solid #f1f3f5; }
.messages-title  { font-size: 15px; font-weight: 600; color: #1a2a40; margin: 0; }

.spinner-wrap { padding: 40px; text-align: center; }
.no-messages  { padding: 40px; text-align: center; color: #9ca3af; font-size: 14px; }

.messages-list { padding: 16px 20px; display: flex; flex-direction: column; gap: 16px; }

.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #1e4d8c;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-body { flex: 1; }

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}
.sender-label { font-size: 13px; font-weight: 600; color: #1a2a40; }
.sent-time    { font-size: 11px; color: #9ca3af; }

.bubble {
  display: inline-block;
  max-width: 100%;
  background: #f3f4f6;
  border-radius: 0 10px 10px 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
}

.chip            { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.chip-pending    { background: #fef9ee; color: #d97706; border: 1px solid #fde68a; }
.chip-sanctioned { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
.chip-dismissed  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

.sanction-row {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f3f5;
  display: flex;
  justify-content: flex-end;
}

.btn-sanction {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e53e4f;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.btn-sanction:hover { background: #d03544; }

.file-bubble { display: flex; align-items: center; gap: 4px; }
.file-link   { color: #1e4d8c; font-weight: 600; font-size: 13px; text-decoration: underline; }
.quiz-bubble {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0f4ff;
  color: #1e4d8c;
  border: 1px solid #c7d2fe;
}
</style>