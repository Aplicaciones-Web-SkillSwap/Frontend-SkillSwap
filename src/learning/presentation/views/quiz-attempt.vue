<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n }                  from 'vue-i18n';
import { useRoute, useRouter }      from 'vue-router';
import useLearningStore             from '@/learning/application/learning.store.js';

const { t }  = useI18n();
const route  = useRoute();
const router = useRouter();
const store  = useLearningStore();

const CURRENT_USER_ID = 1; // estudiante actual

const loading      = ref(true);
const quiz         = ref(null);
const currentIndex = ref(0);
const selectedAnswers = ref([]);

const submitting = ref(false);
const result     = ref(null); // respuesta real del backend tras enviar
const submitError = ref('');

const sessionId = computed(() => route.query.sessionId ? Number(route.query.sessionId) : 0);

onMounted(async () => {
  const fetched = await store.fetchQuizById(route.params.id);
  if (!fetched || fetched.questions.length === 0) {
    router.push({ name: 'workspace-sessions' });
    return;
  }
  quiz.value = fetched;
  selectedAnswers.value = new Array(fetched.questions.length).fill(null);
  loading.value = false;
});

const currentQuestion = computed(() => quiz.value?.questions[currentIndex.value] ?? null);
const totalQuestions  = computed(() => quiz.value?.questions.length ?? 0);
const isLastQuestion  = computed(() => currentIndex.value === totalQuestions.value - 1);
const allAnswered     = computed(() => selectedAnswers.value.every(a => a !== null));
const progressPercent = computed(() => totalQuestions.value ? Math.round(((currentIndex.value + 1) / totalQuestions.value) * 100) : 0);

const selectAnswer = (optionIndex) => {
  selectedAnswers.value[currentIndex.value] = optionIndex;
};

const goNext = () => {
  if (selectedAnswers.value[currentIndex.value] === null) return;
  if (!isLastQuestion.value) currentIndex.value++;
};

const goPrevious = () => {
  if (currentIndex.value > 0) currentIndex.value--;
};

const submitQuiz = async () => {
  if (!allAnswered.value) return;
  submitting.value = true;
  submitError.value = '';

  const response = await store.submitAttempt(quiz.value.id, {
    learnerId:       CURRENT_USER_ID,
    sessionId:       sessionId.value,
    selectedAnswers: selectedAnswers.value,
  });

  submitting.value = false;

  if (response) {
    result.value = response;
  } else {
    submitError.value = t('learning.attempt-error');
  }
};

const navigateBack = () => {
  if (sessionId.value) {
    router.push({ name: 'workspace-sessions-view', params: { id: sessionId.value } });
  } else {
    router.push({ name: 'learning-quizzes' });
  }
};
</script>

<template>
  <div class="attempt-page">

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size:2rem; color:#1a2a40;"></i>
    </div>

    <!-- ── Resultado tras enviar ── -->
    <div v-else-if="result" class="result-card">
      <i class="pi pi-check-circle result-icon"/>
      <h2 class="result-title">{{ t('learning.attempt-done-title') }}</h2>
      <p class="result-score">{{ result.score }} / {{ result.total }}</p>
      <p class="result-sub">{{ t('learning.attempt-done-sub') }}</p>
      <button class="btn-primary" @click="navigateBack">
        {{ t('learning.btn-back-to-session') }}
      </button>
    </div>

    <!-- ── Error al enviar ── -->
    <div v-else-if="submitError" class="result-card">
      <i class="pi pi-times-circle result-icon result-icon-error"/>
      <h2 class="result-title">{{ t('learning.attempt-error-title') }}</h2>
      <p class="result-sub">{{ submitError }}</p>
      <button class="btn-primary" @click="submitError = ''">{{ t('learning.btn-try-again') }}</button>
    </div>

    <!-- ── Quiz en progreso ── -->
    <div v-else class="quiz-card-wrap">

      <div class="quiz-header">
        <button class="back-btn" @click="navigateBack">
          <i class="pi pi-arrow-left"></i>
        </button>
        <div class="quiz-header-info">
          <p class="quiz-course">{{ quiz.course }}</p>
          <h1 class="quiz-title">{{ quiz.title }}</h1>
        </div>
      </div>

      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"/>
      </div>
      <p class="progress-label">
        {{ t('learning.question-of', { current: currentIndex + 1, total: totalQuestions }) }}
      </p>

      <div class="question-card">
        <p class="question-text">{{ currentQuestion.questionString }}</p>

        <div class="answers-list">
          <div
              v-for="(answer, idx) in currentQuestion.answers"
              :key="idx"
              class="answer-option"
              :class="{ 'answer-selected': selectedAnswers[currentIndex] === idx }"
              @click="selectAnswer(idx)">
            <span class="answer-letter">{{ ['A','B','C','D'][idx] }}</span>
            <span class="answer-text">{{ answer }}</span>
          </div>
        </div>
      </div>

      <div class="nav-row">
        <button class="btn-secondary" :disabled="currentIndex === 0" @click="goPrevious">
          <i class="pi pi-arrow-left" style="font-size:13px;"></i>
          {{ t('learning.btn-previous') }}
        </button>

        <button
            v-if="!isLastQuestion"
            class="btn-primary"
            :disabled="selectedAnswers[currentIndex] === null"
            @click="goNext">
          {{ t('learning.btn-next') }}
          <i class="pi pi-arrow-right" style="font-size:13px;"></i>
        </button>

        <button
            v-else
            class="btn-submit"
            :disabled="!allAnswered || submitting"
            @click="submitQuiz">
          <i v-if="!submitting" class="pi pi-check" style="font-size:13px;"></i>
          <i v-else class="pi pi-spin pi-spinner" style="font-size:13px;"></i>
          {{ t('learning.btn-submit-quiz') }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.attempt-page { max-width: 640px; margin: 0 auto; padding: 2rem; }
.loading-state { text-align: center; padding: 4rem; }

.quiz-header { display: flex; align-items: center; gap: 14px; margin-bottom: 1.5rem; }
.back-btn {
  width: 36px; height: 36px; border: 1px solid #e5e7eb; border-radius: 8px;
  background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: #374151; flex-shrink: 0; transition: all 0.15s;
}
.back-btn:hover { background: #f3f4f6; }
.quiz-course { color: #1e4d8c; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
.quiz-title  { color: #1a2a40; font-weight: 800; font-size: 1.4rem; margin: 0.15rem 0 0; }

.progress-bar-wrap { height: 8px; background: #e5e7eb; border-radius: 20px; overflow: hidden; margin-bottom: 0.5rem; }
.progress-bar-fill { height: 100%; background: #1e4d8c; transition: width 0.3s ease; }
.progress-label { color: #9ca3af; font-size: 0.8rem; margin: 0 0 1.5rem; text-align: right; }

.question-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1.75rem; margin-bottom: 1.5rem; }
.question-text { color: #1a2a40; font-weight: 700; font-size: 1.1rem; margin: 0 0 1.25rem; line-height: 1.5; }

.answers-list { display: flex; flex-direction: column; gap: 0.6rem; }
.answer-option {
  display: flex; align-items: center; gap: 0.75rem;
  border: 2px solid #e5e7eb; border-radius: 10px; padding: 0.85rem 1rem;
  cursor: pointer; transition: all 0.15s;
}
.answer-option:hover { border-color: #c7d2fe; background: #f8fafc; }
.answer-selected { border-color: #1e4d8c !important; background: #f0f4ff !important; }

.answer-letter {
  width: 26px; height: 26px; border-radius: 50%; background: #f1f5f9; color: #64748b;
  font-size: 0.78rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.answer-selected .answer-letter { background: #1e4d8c; color: #fff; }
.answer-text { color: #374151; font-size: 0.95rem; }

.nav-row { display: flex; justify-content: space-between; align-items: center; }

.btn-primary, .btn-submit, .btn-secondary {
  display: inline-flex; align-items: center; gap: 6px;
  border: none; border-radius: 8px; padding: 0.7rem 1.4rem;
  font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.btn-primary { background: #1a2a40; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #2d4a6e; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-submit { background: #16a34a; color: #fff; }
.btn-submit:hover:not(:disabled) { background: #15803d; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary { background: #fff; color: #6b7280; border: 1px solid #e5e7eb !important; }
.btn-secondary:hover:not(:disabled) { border-color: #1a2a40 !important; color: #1a2a40; }
.btn-secondary:disabled { opacity: 0.3; cursor: not-allowed; }

/* Resultado */
.result-card { text-align: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 3rem 2rem; }
.result-icon { font-size: 3.5rem; color: #16a34a; display: block; margin-bottom: 1rem; }
.result-icon-error { color: #dc2626; }
.result-title { color: #1a2a40; font-weight: 800; font-size: 1.3rem; margin: 0 0 0.5rem; }
.result-score { color: #1e4d8c; font-weight: 800; font-size: 2.5rem; margin: 0 0 0.5rem; }
.result-sub   { color: #9ca3af; font-size: 0.9rem; margin: 0 0 1.5rem; }
</style>