<script setup>
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useWorkspaceStore from "@/workspace/application/workspace.store.js";
import {computed, onMounted, ref} from "vue";
import {Message} from "@/workspace/domain/model/message-entity.js";

const {t}    = useI18n();
const route  = useRoute();
const router = useRouter();
const store  = useWorkspaceStore();
const { fetchSessions, fetchMessages, addMessage, errors } = store;

const newMessageContent = ref('');
const CURRENT_USER_ID   = 1;

const session = computed(() => store.getSessionById(route.params.id));

const sessionMessages = computed(() => store.getMessagesBySessionId(route.params.id));

// US10 - Chat solo habilitado para sesiones 'scheduled'
const isChatEnabled = computed(() => session.value?.status === 'scheduled');

// US12 - Videollamada solo disponible si está 'scheduled'
const isVideoEnabled = computed(() => session.value?.status === 'scheduled');

// US18 - Botón de donación aparece solo cuando la sesión está 'completed'
const isCompleted = computed(() => session.value?.status === 'completed');

onMounted(() => {
  if (!store.sessionsLoaded) fetchSessions();
  if (!store.messagesLoaded) fetchMessages();
});

const sendMessage = () => {
  if (!newMessageContent.value.trim()) return;
  const message = new Message({
    sessionId: parseInt(route.params.id),
    senderId:  CURRENT_USER_ID,
    content:   newMessageContent.value.trim(),
    fileUrl:   null,
    fileName:  null,
    sentAt:    new Date().toISOString(),
  });
  addMessage(message);
  newMessageContent.value = '';
};

const startVideoCall = () => {
  if (!isVideoEnabled.value) return;
  alert(t('workspace.video-call-message'));
};

// US18 - Navega a nueva transacción con el receiverId del tutor ya prellenado
const navigateToDonation = () => {
  router.push({
    name:  'payment-transactions-new',
    query: {
      receiverId: session.value?.tutorId,
      walletId:   session.value?.tutorId,
    }
  });
};

const navigateBack = () => {
  router.push({name: 'workspace-sessions'});
};
</script>

<template>
  <div class="p-4 workspace-container">

    <!-- Header -->
    <div class="header-actions flex align-items-center justify-content-between mb-4">
      <div class="flex align-items-center gap-3">
        <pv-button icon="pi pi-arrow-left" text @click="navigateBack" class="action-btn-view"/>
        <div>
          <h2 class="page-title m-0">{{ t('workspace.title') }}</h2>
          <p v-if="session" class="subtitle m-0 mt-1">
            {{ t('workspace.topic') }}: <strong class="text-color">{{ session.topic }}</strong>
            <span class="mx-2 text-300">|</span>
            {{ t('workspace.status') }}:
            <span :class="'status-badge status-' + session.status">
              {{ session.status }}
            </span>
          </p>
        </div>
      </div>

      <div class="flex gap-2">
        <!-- US12: Botón videollamada - deshabilitado si no es 'scheduled' -->
        <pv-button
            :label="t('workspace.start-call')"
            icon="pi pi-video"
            :class="isVideoEnabled ? 'btn-call' : 'btn-call-disabled'"
            :disabled="!isVideoEnabled"
            :title="!isVideoEnabled ? t('workspace.call-locked') : ''"
            @click="startVideoCall"/>
      </div>
    </div>

    <!-- US10: Sesión pendiente → chat bloqueado -->
    <div v-if="session && session.status === 'pending'" class="locked-state">
      <div class="locked-card">
        <i class="pi pi-lock locked-icon"/>
        <h3 class="locked-title">{{ t('workspace.locked-title') }}</h3>
        <p class="locked-sub">{{ t('workspace.locked-sub') }}</p>
        <div class="status-flow">
          <span class="flow-step flow-active">Pending</span>
          <i class="pi pi-arrow-right flow-arrow"/>
          <span class="flow-step">Scheduled → Chat habilitado</span>
          <i class="pi pi-arrow-right flow-arrow"/>
          <span class="flow-step">Completed → Donación</span>
        </div>
      </div>
    </div>

    <!-- US10: Sesión rechazada o cancelada -->
    <div v-else-if="session && (session.status === 'rejected' || session.status === 'cancelled')" class="locked-state">
      <div class="locked-card locked-cancelled">
        <i class="pi pi-times-circle locked-icon locked-icon-red"/>
        <h3 class="locked-title">{{ t('workspace.session-' + session.status) }}</h3>
        <p class="locked-sub">{{ t('workspace.session-ended-sub') }}</p>
      </div>
    </div>

    <!-- US18: Sesión completada → Botón de donación -->
    <div v-else-if="isCompleted" class="donation-banner mb-4">
      <div class="donation-content">
        <div class="icon-wrapper">
          <i class="pi pi-heart donation-icon"/>
        </div>
        <div>
          <p class="donation-title">{{ t('workspace.donation-title') }}</p>
          <p class="donation-sub">{{ t('workspace.donation-sub') }}</p>
        </div>
      </div>
      <pv-button
          :label="t('workspace.btn-donate')"
          icon="pi pi-credit-card"
          class="btn-donate"
          @click="navigateToDonation"/>
    </div>

    <!-- US10: Chat habilitado solo si 'scheduled' o 'completed' -->
    <div v-if="session && (isChatEnabled || isCompleted)" class="table-card p-0">
      <div class="p-4">

        <div class="chat-box mb-4">
          <div v-if="sessionMessages.length === 0" class="empty-chat">
            <i class="pi pi-comments text-4xl mb-2 text-300"></i>
            <p class="m-0">{{ t('workspace.no-messages') }}</p>
          </div>

          <div
              v-for="msg in sessionMessages"
              :key="msg.id"
              class="message-row mb-3"
              :class="msg.senderId === CURRENT_USER_ID ? 'own-message' : 'other-message'">

            <div class="bubble p-3">
              <p class="m-0 msg-text">{{ msg.content }}</p>
              <small class="msg-time">{{ msg.sentAt }}</small>
            </div>

          </div>
        </div>

        <!-- Input de mensaje -->
        <div class="flex gap-3 align-items-center pt-2">
          <pv-input-text
              v-model="newMessageContent"
              :placeholder="isCompleted ? t('workspace.chat-completed') : t('workspace.message-placeholder')"
              class="flex-1 custom-input"
              :disabled="isCompleted"
              @keyup.enter="sendMessage"/>
          <pv-button
              icon="pi pi-send"
              :label="t('workspace.send')"
              class="btn-send"
              :disabled="isCompleted"
              @click="sendMessage"/>
        </div>

      </div>
    </div>

    <div v-if="errors.length" class="error-msg mt-4">
      <i class="pi pi-exclamation-circle mr-2"></i>
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

    <pv-toast/>
  </div>
</template>

<style scoped>
/* Contenedor principal */
.workspace-container {
  width: 100%;
  padding: 0 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Títulos y Header */
.page-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 2rem;
}

.subtitle {
  color: #718096;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
}

.text-color { color: #1a2a40; }

.action-btn-view { color: #1a2a40 !important; }
.action-btn-view:hover { background-color: #f8fafc !important; }

/* --- PÍLDORAS DE ESTADO --- */
.status-badge {
  padding: 0.35rem 0.9rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: capitalize;
  display: inline-block;
  margin-left: 0.5rem;
}

.status-scheduled { background-color: #e0f2fe; color: #0284c7; } /* Azul claro */
.status-pending   { background-color: #fef3c7; color: #d97706; } /* Amarillo */
.status-completed { background-color: #dcfce7; color: #16a34a; } /* Verde claro */
.status-cancelled,
.status-rejected  { background-color: #fee2e2; color: #dc2626; } /* Rojo */

/* --- TARJETA PRINCIPAL --- */
.table-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  border: 1px solid #f0f2f5;
}

/* Botón videollamada */
.btn-call {
  background-color: #e53e4f !important;
  border: none !important;
  color: white !important;
  border-radius: 8px;
  font-weight: 600;
  padding: 0.6rem 1.2rem;
}

.btn-call:hover { background-color: #d03544 !important; }

.btn-call-disabled {
  background-color: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #94a3b8 !important;
  border-radius: 8px;
  font-weight: 600;
  cursor: not-allowed !important;
}

/* Estado bloqueado */
.locked-state { margin-bottom: 1.5rem; }

.locked-card {
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
}

.locked-cancelled { border-color: #fecaca; background-color: #fef2f2; }

.locked-icon {
  font-size: 3rem;
  color: #94a3b8;
  display: block;
  margin-bottom: 1rem;
}

.locked-icon-red { color: #f87171; }

.locked-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
}

.locked-sub {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0 0 2rem 0;
}

/* Flujo de estados visual */
.status-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.flow-step {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.flow-active {
  background-color: #fef3c7;
  border-color: #fde68a;
  color: #d97706;
}

.flow-arrow { color: #cbd5e1; font-size: 0.9rem; }

/* Banner de donación */
.donation-banner {
  background: linear-gradient(135deg, #1a2a40 0%, #2d4a6e 100%);
  border-radius: 12px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 4px 15px rgba(26, 42, 64, 0.15);
}

.donation-content {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.icon-wrapper {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.8rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donation-icon {
  font-size: 1.8rem;
  color: #ff8a98;
}

.donation-title {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
  margin: 0 0 0.2rem 0;
}

.donation-sub {
  color: #cbd5e1;
  font-size: 0.9rem;
  margin: 0;
}

.btn-donate {
  background-color: #e53e4f !important;
  border: none !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  padding: 0.6rem 1.5rem;
  white-space: nowrap;
}

.btn-donate:hover { background-color: #d03544 !important; }

/* Chat */
.chat-box {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  padding: 1.5rem;
  background-color: #f8fafc;
}

.empty-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-weight: 500;
}

.message-row { display: flex; width: 100%; }
.own-message   { justify-content: flex-end; }
.other-message { justify-content: flex-start; }

.bubble {
  max-width: 75%;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.own-message .bubble {
  background-color: #1a2a40;
  color: #ffffff;
  border-bottom-right-radius: 2px;
}

.other-message .bubble {
  background-color: #ffffff;
  color: #1a2a40;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 2px;
}

.msg-time {
  display: block;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  text-align: right;
  opacity: 0.7;
}

.other-message .msg-time { text-align: left; opacity: 0.5; }

.custom-input {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 0.8rem 1rem;
}

.custom-input:focus { border-color: #1a2a40; box-shadow: none; }

.btn-send {
  background-color: #1a2a40 !important;
  border: none !important;
  color: white !important;
  border-radius: 8px;
  font-weight: 600;
  padding: 0.8rem 1.5rem;
}

.btn-send:hover { background-color: #2d4a6e !important; }

/* Mensaje de error */
.error-msg {
  font-weight: bold;
  background-color: #fee2e2;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  color: #dc2626;
}
</style>