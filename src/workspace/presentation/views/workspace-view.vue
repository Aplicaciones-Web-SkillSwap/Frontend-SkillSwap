<script setup>
import {useI18n}                from "vue-i18n";
import {useRoute, useRouter}    from "vue-router";
import useWorkspaceStore        from "@/workspace/application/workspace.store.js";
import useLearningStore         from "@/learning/application/learning.store.js";
import useReputationStore       from "@/reputation/application/reputation.store.js";
import {uploadFile, validateFile} from "@/workspace/infrastructure/cloudinary-service.js";
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import {Message}                from "@/workspace/domain/model/message-entity.js";
import {formatDateTime}         from "@/shared/utils/format-date.js";
import { Session } from "@/workspace/domain/model/session-entity.js";
import { Review }  from "@/reputation/domain/model/review-entity.js";
import useAuthStore from "@/iam/application/auth.store.js";

const {t}    = useI18n();
const route  = useRoute();
const router = useRouter();
const store  = useWorkspaceStore();
const learningStore = useLearningStore();
const reputationStore = useReputationStore();
const authStore = useAuthStore();
const { fetchSessions, fetchMessages, addMessage, addFileMessage, errors } = store;

const newMessageContent = ref('');
const isUploading       = ref(false);
const uploadError       = ref('');
const CURRENT_USER_ID   = computed(() => authStore.user?.id);

const showQuizPicker = ref(false);
const quizSearch      = ref('');
const sharingQuiz      = ref(false);

const session        = computed(() => store.getSessionById(route.params.id));
const sessionMessages = computed(() => store.getMessagesBySessionId(route.params.id));
const isChatEnabled  = computed(() => ['scheduled', 'in_progress'].includes(session.value?.status));
const isVideoEnabled = computed(() => session.value?.status === 'scheduled');
const isCallActive   = computed(() => session.value?.status === 'in_progress');
const isCompleted    = computed(() => session.value?.status === 'completed');
const isLearner      = computed(() => session.value?.learnerId === authStore.user?.id);

/** Nombre de la otra persona en la sesión (tutor si soy aprendiz, aprendiz si soy tutor) */
const counterpartId = computed(() => {
  if (!session.value) return null;
  return isLearner.value ? session.value.tutorId : session.value.learnerId;
});
const counterpartName = computed(() =>
    counterpartId.value ? (authStore.getUsername(counterpartId.value) || `Usuario #${counterpartId.value}`) : ''
);

const MESSAGES_POLL_INTERVAL_MS = 4000;
let messagesPollHandle = null;

onMounted(() => {
  if (!store.sessionsLoaded) fetchSessions();
  fetchMessages();
  if (!authStore.usersDirectoryLoaded) authStore.fetchAllUsers();
  if (!learningStore.quizzes.length) learningStore.fetchQuizzes();
  if (!reputationStore.reviewsLoaded) reputationStore.fetchReviews();

  messagesPollHandle = setInterval(fetchMessages, MESSAGES_POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (messagesPollHandle) clearInterval(messagesPollHandle);
});

/** La reseña que YO ya dejé para esta sesión, si existe (evita volver a calificar) */
const myReview = computed(() =>
    reputationStore.reviews.find(r => r.sessionId === parseInt(route.params.id) && r.reviewerId === CURRENT_USER_ID.value)
);

/** Intentos de los quizzes compartidos en esta sesión, para mostrar el resultado directo en el chat */
const quizAttempts = ref([]);

async function loadQuizAttempts() {
  const quizIds = [...new Set(sessionMessages.value.filter(m => m.quizId).map(m => m.quizId))];
  if (quizIds.length === 0) { quizAttempts.value = []; return; }
  const results = await Promise.all(quizIds.map(id => learningStore.getAttemptsByQuiz(id)));
  quizAttempts.value = results.flat();
}

watch(() => store.messagesLoaded, (loaded) => { if (loaded) loadQuizAttempts(); }, { immediate: true });

const attemptFor = (quizId) =>
    quizAttempts.value.find(a => a.quizId === quizId && a.sessionId === parseInt(route.params.id));

const sendMessage = () => {
  if (!newMessageContent.value.trim()) return;
  const message = new Message({
    sessionId: parseInt(route.params.id),
    senderId:  CURRENT_USER_ID.value,
    content:   newMessageContent.value.trim(),
    fileUrl:   null,
    fileName:  null,
    sentAt:    new Date().toISOString(),
  });
  addMessage(message);
  newMessageContent.value = '';
};

/** US11 — Subir archivo al chat via Cloudinary */
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const validation = validateFile(file);
  if (!validation.valid) {
    uploadError.value = validation.error;
    event.target.value = '';
    return;
  }

  uploadError.value = '';
  isUploading.value = true;

  try {
    const { fileUrl, fileName } = await uploadFile(file);
    addFileMessage(route.params.id, CURRENT_USER_ID.value, fileUrl, fileName);
  } catch (err) {
    uploadError.value = err.message;
  } finally {
    isUploading.value = false;
    event.target.value = '';
  }
};

const triggerFileInput = () => {
  document.getElementById('chat-file-input').click();
};

/** Quizzes disponibles para compartir, filtrados por búsqueda libre */
const filteredQuizzes = computed(() => {
  if (!quizSearch.value.trim()) return learningStore.quizzes;
  const q = quizSearch.value.toLowerCase().trim();
  return learningStore.quizzes.filter(quiz =>
      quiz.title.toLowerCase().includes(q) || quiz.course.toLowerCase().includes(q)
  );
});

const openQuizPicker  = () => { showQuizPicker.value = true; };
const closeQuizPicker = () => { showQuizPicker.value = false; quizSearch.value = ''; };

/** Comparte un quiz como mensaje especial en el chat */
const shareQuiz = async (quiz) => {
  sharingQuiz.value = true;
  await store.addMessage({
    sessionId: parseInt(route.params.id),
    senderId:  CURRENT_USER_ID.value,
    content:   '',
    fileUrl:   '',
    fileName:  '',
    quizId:    quiz.id,
    quizTitle: quiz.title,
    sentAt:    new Date().toISOString(),
  });
  sharingQuiz.value = false;
  closeQuizPicker();
};

const goToQuiz = (msg) => {
  router.push({ name: 'learning-quizzes-attempt', params: { id: msg.quizId }, query: { sessionId: route.params.id } });
};

const startVideoCall = async () => {
  if (!isVideoEnabled.value) return;
  const current = session.value;
  if (current && current.status === 'scheduled') {
    const updated = new Session({ ...current, status: 'in_progress' });
    await store.updateSession(updated);
  }
};

const endVideoCall = async () => {
  const current = session.value;
  if (current && current.status === 'in_progress') {
    const updated = new Session({ ...current, status: 'completed' });
    await store.updateSession(updated);
  }
};
const navigateToDonation = () => { router.push({ name: 'payment-transactions-new', query: { tutorId: session.value?.tutorId, tutorName: session.value?.tutorId } }); };
const navigateBack       = () => { router.push({ name: 'workspace-sessions' }); };

/** Reseña: se deja sin salir del workspace, como un diálogo encima */
const showReviewDialog = ref(false);
const reviewRating     = ref(0);
const reviewComment    = ref('');
const reviewSubmitting = ref(false);

const openReviewDialog  = () => { if (!myReview.value) showReviewDialog.value = true; };
const closeReviewDialog = () => {
  showReviewDialog.value = false;
  reviewRating.value  = 0;
  reviewComment.value = '';
};

const submitReview = async () => {
  if (!reviewRating.value || !session.value || myReview.value) return;
  reviewSubmitting.value = true;
  await reputationStore.addReview(new Review({
    tutorId:    session.value.tutorId,
    reviewerId: CURRENT_USER_ID.value,
    sessionId:  parseInt(route.params.id),
    rating:     reviewRating.value,
    comment:    reviewComment.value.trim(),
  }));
  reviewSubmitting.value = false;
  closeReviewDialog();
};
const navigateToReport = () => {
  router.push({
    name:  'moderation-reports-new',
    query: {
      sessionId:      route.params.id,
      reportedUserId: counterpartId.value,
    }
  });
};
</script>

<template>
  <div class="p-4 workspace-container">

    <div class="header-actions flex align-items-center justify-content-between mb-4">
      <div class="flex align-items-center gap-3">
        <pv-button icon="pi pi-arrow-left" text @click="navigateBack" class="action-btn-view"/>
        <div>
          <h2 class="page-title m-0">{{ counterpartName || t('workspace.title') }}</h2>
          <p v-if="session" class="subtitle m-0 mt-1">
            {{ t('workspace.topic') }}: <strong class="text-color">{{ session.topic }}</strong>
            <span class="mx-2 text-300">|</span>
            {{ t('workspace.status') }}:
            <span :class="'status-badge status-' + session.status">
              {{ t('sessions.status-' + session.status) }}
            </span>
          </p>
        </div>
      </div>

      <div class="flex gap-2">
        <pv-button
            :label="t('workspace.report')"
            icon="pi pi-flag"
            class="btn-report"
            :disabled="!session"
            @click="navigateToReport"/>
        <pv-button
            :label="t('workspace.start-call')"
            icon="pi pi-video"
            :class="isVideoEnabled ? 'btn-call' : 'btn-call-disabled'"
            :disabled="!isVideoEnabled"
            :title="!isVideoEnabled ? t('workspace.call-locked') : ''"
            @click="startVideoCall"/>
      </div>
    </div>

    <div v-if="isCallActive" class="video-call-box mb-4">
      <div class="video-call-screen">
        <i class="pi pi-video video-placeholder-icon"/>
        <p class="video-placeholder-text">{{ t('workspace.video-call-message') }}</p>
      </div>
      <div class="video-call-controls">
        <pv-button icon="pi pi-phone" :label="t('workspace.end-call')" class="btn-hangup" @click="endVideoCall"/>
      </div>
    </div>

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

    <div v-else-if="session && (session.status === 'rejected' || session.status === 'cancelled')" class="locked-state">
      <div class="locked-card locked-cancelled">
        <i class="pi pi-times-circle locked-icon locked-icon-red"/>
        <h3 class="locked-title">{{ t('workspace.session-' + session.status) }}</h3>
        <p class="locked-sub">{{ t('workspace.session-ended-sub') }}</p>
      </div>
    </div>

    <div v-else-if="isCompleted" class="completed-actions mb-4">

      <div v-if="myReview" class="action-banner review-banner review-banner-done">
        <div class="banner-content">
          <div class="icon-wrapper">
            <i class="pi pi-check-circle banner-icon review-icon"/>
          </div>
          <div>
            <p class="banner-title">{{ t('workspace.review-already-title') }}</p>
            <p class="banner-sub">
              <span class="mini-stars">
                <i v-for="n in 5" :key="n" class="pi" :class="n <= myReview.rating ? 'pi-star-fill' : 'pi-star'"/>
              </span>
              {{ myReview.rating }} / 5
            </p>
          </div>
        </div>
      </div>

      <div v-else class="action-banner review-banner">
        <div class="banner-content">
          <div class="icon-wrapper">
            <i class="pi pi-star-fill banner-icon review-icon"/>
          </div>
          <div>
            <p class="banner-title">{{ t(isLearner ? 'workspace.review-title' : 'workspace.review-title-tutor') }}</p>
            <p class="banner-sub">{{ t(isLearner ? 'workspace.review-sub' : 'workspace.review-sub-tutor') }}</p>
          </div>
        </div>
        <pv-button
            :label="t('workspace.btn-review')"
            icon="pi pi-star"
            class="btn-action btn-review"
            @click="openReviewDialog"/>
      </div>

      <div v-if="isLearner" class="action-banner donation-banner">
        <div class="banner-content">
          <div class="icon-wrapper">
            <i class="pi pi-heart banner-icon donation-icon"/>
          </div>
          <div>
            <p class="banner-title">{{ t('workspace.donation-title') }}</p>
            <p class="banner-sub">{{ t('workspace.donation-sub') }}</p>
          </div>
        </div>
        <pv-button
            :label="t('workspace.btn-donate')"
            icon="pi pi-credit-card"
            class="btn-action btn-donate"
            @click="navigateToDonation"/>
      </div>

    </div>

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

            <div v-if="msg.quizId" class="quiz-card" :class="{ 'quiz-card-done': attemptFor(msg.quizId) }" @click="goToQuiz(msg)">
              <div class="quiz-card-icon">
                <i :class="attemptFor(msg.quizId) ? 'pi pi-check-circle' : 'pi pi-question-circle'"/>
              </div>
              <div class="quiz-card-body">
                <template v-if="attemptFor(msg.quizId)">
                  <p class="quiz-card-label">{{ t('workspace.quiz-completed') }}</p>
                  <p class="quiz-card-title">
                    {{ msg.quizTitle }} — {{ attemptFor(msg.quizId).score }}/{{ attemptFor(msg.quizId).total }}
                  </p>
                </template>
                <template v-else>
                  <p class="quiz-card-label">{{ t('workspace.quiz-shared') }}</p>
                  <p class="quiz-card-title">{{ msg.quizTitle }}</p>
                </template>
              </div>
              <i class="pi pi-chevron-right quiz-card-arrow"/>
            </div>

            <!-- Mensaje normal de texto/archivo -->
            <div v-else class="bubble p-3">
              <p v-if="msg.content" class="m-0 msg-text">{{ msg.content }}</p>
              <div v-if="msg.fileUrl" class="file-attachment">
                <i class="pi pi-file attachment-icon"/>
                <a :href="msg.fileUrl" target="_blank" class="attachment-link">
                  {{ msg.fileName || 'Archivo adjunto' }}
                </a>
              </div>
              <small class="msg-time">{{ formatDateTime(msg.sentAt) }}</small>
            </div>

          </div>
        </div>

        <div class="chat-input-row">
          <!-- Input oculto para archivos -->
          <input
              id="chat-file-input"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              style="display:none"
              @change="handleFileUpload"
          />

          <!-- Botón adjuntar -->
          <pv-button
              icon="pi pi-paperclip"
              class="btn-attach"
              :disabled="isCompleted || isUploading"
              :title="t('workspace.attach-file')"
              @click="triggerFileInput"/>

          <pv-button
              v-if="!isLearner"
              icon="pi pi-question-circle"
              class="btn-quiz"
              :disabled="isCompleted"
              :title="t('workspace.share-quiz')"
              @click="openQuizPicker"/>

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

        <!-- Error de upload -->
        <div v-if="uploadError" class="upload-error mt-2">
          <i class="pi pi-exclamation-triangle mr-1"/>
          {{ uploadError }}
        </div>

        <!-- Uploading indicator -->
        <div v-if="isUploading" class="upload-loading mt-2">
          <i class="pi pi-spin pi-spinner mr-1"/>
          Subiendo archivo...
        </div>

      </div>
    </div>

    <div v-if="errors.length" class="error-msg mt-4">
      <i class="pi pi-exclamation-circle mr-2"></i>
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

    <pv-dialog v-model:visible="showQuizPicker" modal :header="t('workspace.pick-quiz-title')" style="width: 480px;">
      <div class="quiz-picker">
        <pv-input-text
            v-model="quizSearch"
            :placeholder="t('workspace.pick-quiz-search')"
            class="w-full mb-3"/>

        <div v-if="learningStore.loading" class="quiz-picker-loading">
          <i class="pi pi-spin pi-spinner"/>
        </div>

        <div v-else-if="filteredQuizzes.length === 0" class="quiz-picker-empty">
          {{ t('workspace.pick-quiz-empty') }}
        </div>

        <div v-else class="quiz-picker-list">
          <div
              v-for="quiz in filteredQuizzes"
              :key="quiz.id"
              class="quiz-picker-item"
              @click="!sharingQuiz && shareQuiz(quiz)">
            <div class="quiz-picker-info">
              <p class="quiz-picker-title">{{ quiz.title }}</p>
              <p class="quiz-picker-meta">{{ quiz.course }} · {{ quiz.questionCount() }} {{ t('learning.questions-label') }}</p>
            </div>
            <i class="pi pi-send" style="color:#1e4d8c;"/>
          </div>
        </div>
      </div>
    </pv-dialog>

    <pv-dialog v-model:visible="showReviewDialog" modal :header="t('workspace.btn-review')" style="width: 420px;" @hide="closeReviewDialog">
      <div class="review-dialog-body">
        <div class="field">
          <label class="custom-label">{{ t(isLearner ? 'review.tutorId' : 'review.studentId') }}</label>
          <div class="readonly-value">{{ counterpartName }}</div>
        </div>

        <div class="field">
          <label class="custom-label">{{ t('review.score') }}</label>
          <div class="rating-wrap">
            <pv-rating v-model="reviewRating" :stars="5" :cancel="false"/>
            <span class="score-number">{{ reviewRating }} / 5</span>
          </div>
        </div>

        <div class="field">
          <label class="custom-label">
            {{ t('review.comment') }}
            <span class="optional-tag">({{ t('session.optional') }})</span>
          </label>
          <pv-textarea v-model="reviewComment" rows="3" class="w-full"/>
        </div>
      </div>
      <template #footer>
        <pv-button :label="t('session.cancel')" text @click="closeReviewDialog"/>
        <pv-button :label="t('review.save')" class="btn-save" :loading="reviewSubmitting" :disabled="!reviewRating || reviewSubmitting" @click="submitReview"/>
      </template>
    </pv-dialog>

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

/* Título y subtítulo */
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

/* Estados en cabecera */
.status-badge {
  padding: 0.35rem 0.9rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: capitalize;
  display: inline-block;
  margin-left: 0.5rem;
}

.status-scheduled  { background-color: #e0f2fe; color: #0284c7; }
.status-pending    { background-color: #fef3c7; color: #d97706; }
.status-completed  { background-color: #dcfce7; color: #16a34a; }
.status-in_progress { background-color: #ede9fe; color: #7c3aed; }
.status-cancelled,
.status-rejected  { background-color: #fee2e2; color: #dc2626; }

/* Simulación de videollamada */
.video-call-box {
  background: #0f172a;
  border-radius: 14px;
  overflow: hidden;
}

.video-call-screen {
  aspect-ratio: 16 / 9;
  max-height: 420px;
  background: #000000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.video-placeholder-icon { font-size: 2.5rem; color: #4b5563; }
.video-placeholder-text { color: #6b7280; font-size: 0.9rem; margin: 0; }

.video-call-controls {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.btn-hangup {
  background-color: #dc2626 !important;
  border: none !important;
  color: #ffffff !important;
  font-weight: 700;
  border-radius: 30px;
  padding: 0.6rem 1.8rem;
}
.btn-hangup:hover { background-color: #b91c1c !important; }

/* Tarjeta base */
.table-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  border: 1px solid #f0f2f5;
}

/* Botón de llamada */
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

/* Flujo del estado */
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

/* Banners del estado completado */
.completed-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-banner {
  border-radius: 12px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 4px 15px rgba(26, 42, 64, 0.15);
}

.banner-content {
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

.banner-icon { font-size: 1.8rem; }
.donation-icon { color: #ff8a98; }
.review-icon { color: #fbbf24; }

.banner-title {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
  margin: 0 0 0.2rem 0;
}

.banner-sub {
  color: #cbd5e1;
  font-size: 0.9rem;
  margin: 0;
}

.donation-banner { background: linear-gradient(135deg, #1a2a40 0%, #2d4a6e 100%); }
.review-banner   { background: linear-gradient(135deg, #1a4731 0%, #166534 100%); }
.review-banner-done { background: linear-gradient(135deg, #374151 0%, #4b5563 100%); }
.mini-stars { display: inline-flex; gap: 2px; margin-right: 0.4rem; color: #fbbf24; font-size: 0.85rem; }

.btn-action {
  border: none !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  padding: 0.6rem 1.5rem;
  white-space: nowrap;
}

.btn-donate {
  background-color: #e53e4f !important;
  color: #ffffff !important;
}
.btn-donate:hover { background-color: #d03544 !important; }

.btn-review {
  background-color: #fbbf24 !important;
  color: #1a2a40 !important;
}
.btn-review:hover { background-color: #f59e0b !important; }

/* Entorno de chat */
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

/* Alertas de error */
.error-msg {
  font-weight: bold;
  background-color: #fee2e2;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  color: #dc2626;
}
/* Chat input row con botón adjuntar */
.chat-input-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding-top: 0.5rem;
}

/* Botón adjuntar archivo */
.btn-attach {
  background-color: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #1a2a40 !important;
  border-radius: 8px !important;
  padding: 0.8rem !important;
}
.btn-attach:hover { background-color: #e2e8f0 !important; }

/* Archivo adjunto en bubble */
.file-attachment {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  margin-bottom: 0.3rem;
}
.attachment-icon { font-size: 1rem; }
.attachment-link {
  color: inherit;
  font-weight: 600;
  font-size: 0.85rem;
  text-decoration: underline;
  word-break: break-all;
}

/* Upload feedback */
.upload-error   { color: #dc2626; font-size: 0.85rem; display: flex; align-items: center; }
.upload-loading { color: #1e4d8c; font-size: 0.85rem; display: flex; align-items: center; }
.status-readonly {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #64748b;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
}
.btn-report {
  background-color: #ffffff !important;
  border: 1px solid #e53e4f !important;
  color: #e53e4f !important;
  border-radius: 8px;
  font-weight: 600;
  padding: 0.6rem 1.2rem;
}
.btn-report:hover { background-color: #fef2f2 !important; }

/* Botón compartir quiz */
.btn-quiz {
  background-color: #f0f4ff !important;
  border: 1px solid #c7d2fe !important;
  color: #1e4d8c !important;
  border-radius: 8px !important;
  padding: 0.8rem !important;
}
.btn-quiz:hover { background-color: #e0e7ff !important; }

/* Quiz card en el chat */
.quiz-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #1e4d8c 0%, #2d4a6e 100%);
  border-radius: 12px;
  padding: 0.9rem 1rem;
  cursor: pointer;
  max-width: 280px;
  transition: transform 0.15s;
}
.quiz-card:hover { transform: translateY(-1px); }

.quiz-card-done { background: linear-gradient(135deg, #15803d 0%, #16a34a 100%); }

.quiz-card-icon {
  background: rgba(255,255,255,0.15);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fbbf24;
  font-size: 1.1rem;
}

.quiz-card-done .quiz-card-icon { color: #ffffff; }

.quiz-card-body { flex: 1; min-width: 0; }
.quiz-card-label { color: #cbd5e1; font-size: 0.7rem; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
.quiz-card-title { color: #ffffff; font-size: 0.9rem; font-weight: 700; margin: 0.15rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.quiz-card-arrow { color: #cbd5e1; flex-shrink: 0; }

/* Quiz picker modal */
.quiz-picker-loading,
.quiz-picker-empty { text-align: center; padding: 2rem; color: #94a3b8; }
.quiz-picker-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 320px; overflow-y: auto; }
.quiz-picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.quiz-picker-item:hover { background: #f0f4ff; border-color: #c7d2fe; }
.quiz-picker-title { color: #1a2a40; font-weight: 700; font-size: 0.9rem; margin: 0; }
.quiz-picker-meta  { color: #94a3b8; font-size: 0.78rem; margin: 0.15rem 0 0; }

/* Diálogo de reseña */
.review-dialog-body { display: flex; flex-direction: column; gap: 1.25rem; }
.field { display: flex; flex-direction: column; gap: 0.5rem; }
.custom-label { color: #8c98a4; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
.optional-tag { color: #a0aec0; font-weight: 500; font-size: 0.75rem; text-transform: none; letter-spacing: normal; }
.readonly-value {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.65rem 0.9rem;
  color: #1a2a40;
  font-weight: 600;
  font-size: 0.95rem;
}
.rating-wrap { display: flex; align-items: center; gap: 1rem; }
.score-number { color: #1a2a40; font-weight: 700; font-size: 1rem; }
.btn-save { background-color: #e53e4f !important; border: none !important; font-weight: bold; border-radius: 8px; }
.btn-save:hover:not(:disabled) { background-color: #d03544 !important; }
</style>