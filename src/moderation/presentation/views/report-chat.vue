<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter }      from 'vue-router';
import { useI18n }                  from 'vue-i18n';
import useModerationStore           from '@/moderation/application/moderation.store.js';
import { ModerationApi }            from '@/moderation/infrastructure/moderation-api.js';

const { t }  = useI18n();
const route  = useRoute();
const router = useRouter();
const store  = useModerationStore();
const api    = new ModerationApi();

const messages = ref([]);
const loading  = ref(false);

const userId = computed(() => Number(route.params.userId));

const report = computed(() =>
    store.reports.find(r => r.reportedUserId === userId.value) ?? null
);

const tutorId   = computed(() => report.value?.reporterUserId ?? '—');
const studentId = computed(() => report.value?.reportedUserId ?? '—');
const caseDate  = computed(() => report.value?.getFormattedCreatedAt() ?? '—');
const status    = computed(() => report.value?.status ?? '—');

onMounted(async () => {
    if (store.reports.length === 0) await store.fetchReports();
    loading.value = true;
    try {
        messages.value = await api.getMessagesByUser(userId.value);
    } catch (e) {
        console.error('Error loading messages', e);
    } finally {
        loading.value = false;
    }
});

function formatTime(sentAt) {
    if (!sentAt) return '';
    return new Date(sentAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function statusLabel(s) {
    const map = {
        pending:   t('moderation.status-pending'),
        warning:   t('moderation.status-warning'),
        dismissed: t('moderation.status-dismissed'),
        resolved:  t('moderation.status-resolved')
    };
    return map[s] ?? s;
}
</script>

<template>
  <div class="chat-page">

    <!-- Back button -->
    <button class="back-btn" @click="router.push({ name: 'moderation-reports' })">
      <i class="pi pi-arrow-left"></i>
      {{ t('moderation.btn-back') }}
    </button>

    <!-- ── Session Card ── -->
    <div class="session-card">
      <div class="session-header">
        <div>
          <h2 class="session-title">{{ t('moderation.chat-title') }}</h2>
          <p class="session-subtitle">{{ t('moderation.chat-sub') }}</p>
        </div>
        <span class="chip" :class="{
          'chip-pending':   status === 'pending',
          'chip-warning':   status === 'warning',
          'chip-dismissed': status === 'dismissed',
          'chip-resolved':  status === 'resolved'
        }">{{ statusLabel(status) }}</span>
      </div>

      <div class="session-meta">
        <div class="meta-item">
          <span class="meta-label">{{ t('moderation.chat-date') }}</span>
          <span class="meta-value">{{ caseDate }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">{{ t('moderation.chat-tutor') }}</span>
          <span class="meta-value">User #{{ tutorId }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">{{ t('moderation.chat-student') }}</span>
          <span class="meta-value">User #{{ studentId }}</span>
        </div>
      </div>
    </div>

    <!-- ── Messages Card ── -->
    <div class="messages-card">
      <div class="messages-header">
        <h3 class="messages-title">{{ t('moderation.chat-messages') }}</h3>
      </div>

      <div v-if="loading" class="spinner-wrap">
        <i class="pi pi-spin pi-spinner" style="font-size:28px; color:#1e4d8c;"></i>
      </div>

      <div v-else-if="messages.length === 0" class="no-messages">
        <i class="pi pi-comments" style="font-size:36px; color:#d1d5db; display:block; margin-bottom:10px;"></i>
        {{ t('moderation.chat-no-messages') }}
      </div>

      <div v-else class="messages-list">
        <div v-for="msg in messages" :key="msg.id" class="message-row">
          <div class="avatar-circle">{{ msg.senderId }}</div>
          <div class="message-body">
            <div class="message-meta">
              <span class="sender-label">User #{{ msg.senderId }}</span>
              <span class="sent-time">{{ formatTime(msg.sentAt) }}</span>
            </div>
            <div class="bubble">{{ msg.message }}</div>
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

/* ── Back button ── */
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

/* ── Session card ── */
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

/* ── Messages card ── */
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

/* ── Status chips ── */
.chip           { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.chip-pending   { background: #fef9ee; color: #d97706; border: 1px solid #fde68a; }
.chip-warning   { background: #fff1f0; color: #ef4444; border: 1px solid #fecaca; }
.chip-dismissed { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
.chip-resolved  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
</style>
