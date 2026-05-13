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
  alert(t('workspace.video-call-message'));
};

const navigateBack = () => {
  router.push({name: 'workspace-sessions'});
};
</script>

<template>
  <div class="p-4 workspace-container">

    <div class="flex align-items-center gap-3 mb-4">
      <pv-button icon="pi pi-arrow-left" text @click="navigateBack" class="back-btn"/>
      <div>
        <h2 class="m-0 title-text">{{ t('workspace.title') }}</h2>
        <p v-if="session" class="m-0 text-600 session-info">
          {{ t('workspace.topic') }}: <strong>{{ session.topic }}</strong>
          &mdash;
          {{ t('workspace.status') }}:
          <span :class="{
            'status-pending': session.status === 'pending',
            'status-scheduled':  session.status === 'scheduled',
            'status-completed':   session.status === 'completed',
            'status-cancelled':    session.status === 'cancelled' || session.status === 'rejected',
          }">{{ session.status }}</span>
        </p>
      </div>
      <div class="ml-auto">
        <pv-button
            :label="t('workspace.start-call')"
            icon="pi pi-video"
            class="btn-call"
            @click="startVideoCall"/>
      </div>
    </div>

    <pv-card v-if="session" class="chat-card">
      <template #content>

        <div class="chat-box mb-4">
          <div v-if="sessionMessages.length === 0" class="text-center empty-chat">
            {{ t('workspace.no-messages') }}
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

        <div class="flex gap-2 align-items-center">
          <pv-input-text
              v-model="newMessageContent"
              :placeholder="t('workspace.message-placeholder')"
              class="flex-1 custom-input"
              @keyup.enter="sendMessage"/>
          <pv-button
              icon="pi pi-send"
              :label="t('workspace.send')"
              class="btn-send"
              @click="sendMessage"/>
        </div>

      </template>
    </pv-card>

    <div v-if="errors.length" class="error-msg mt-3">
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

    <pv-toast/>
  </div>
</template>

<style scoped>
/* Contenedor general para limitar el ancho si la pantalla es muy grande */
.workspace-container {
  width: 100%;
  padding: 0 2rem;
}

/* Tipografía del Header */
.title-text {
  color: #1a2a40;
  font-weight: 700;
}

.session-info {
  font-size: 0.9rem;
  margin-top: 0.2rem !important;
}

/* Colores de estado más limpios */
.status-pending { color: #f59e0b; font-weight: bold; }
.status-scheduled { color: #10b981; font-weight: bold; }
.status-completed { color: #3b82f6; font-weight: bold; }
.status-cancelled { color: #e53e4f; font-weight: bold; }

/* Botones personalizados */
.back-btn {
  color: #1a2a40 !important;
}

.btn-call {
  background-color: #e53e4f !important; /* Rojo del acento */
  border: none !important;
  color: white !important;
  border-radius: 8px;
  font-weight: 600;
}

.btn-call:hover {
  background-color: #d03544 !important;
}

.btn-send {
  background-color: #1a2a40 !important; /* Azul principal */
  border: none !important;
  color: white !important;
  border-radius: 8px;
  font-weight: 600;
}

.btn-send:hover {
  background-color: #111d2e !important;
}

/* Estilos de la tarjeta y caja de chat */
.chat-card {
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}

.chat-box {
  height: 450px;
  overflow-y: auto;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 1.5rem;
  background-color: #fcfcfc;
}

.empty-chat {
  color: #999;
  font-style: italic;
  padding-top: 2rem;
}

/* Disposición de los mensajes */
.message-row {
  display: flex;
  width: 100%;
}

.own-message {
  justify-content: flex-end;
}

.other-message {
  justify-content: flex-start;
}

/* Burbujas de chat modernas */
.bubble {
  max-width: 70%;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.own-message .bubble {
  background-color: #1a2a40; /* Azul principal */
  color: #ffffff;
  border-bottom-right-radius: 4px; /* Punta hacia la derecha */
}

.other-message .bubble {
  background-color: #ffffff; /* Blanco */
  color: #1a2a40;
  border: 1px solid #eaeaea;
  border-bottom-left-radius: 4px; /* Punta hacia la izquierda */
}

/* Texto de la hora */
.msg-time {
  display: block;
  font-size: 0.7rem;
  margin-top: 0.4rem;
  text-align: right;
  opacity: 0.7; /* Ligeramente transparente para no resaltar demasiado */
}

.other-message .msg-time {
  text-align: left;
}

/* Input text limpio */
.custom-input {
  border-radius: 8px;
  border: 1px solid #eaeaea;
  padding: 0.8rem;
}

.error-msg {
  font-weight: bold;
}
</style>