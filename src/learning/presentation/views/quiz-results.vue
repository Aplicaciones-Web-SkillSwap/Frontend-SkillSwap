<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n }                  from 'vue-i18n';
import { useRoute, useRouter }      from 'vue-router';
import useLearningStore             from '@/learning/application/learning.store.js';
import useDiscoveryStore            from '@/discovery/application/discovery.store.js';
import { formatDateTime }           from '@/shared/utils/format-date.js';

const { t }  = useI18n();
const route  = useRoute();
const router = useRouter();
const store  = useLearningStore();
const discoveryStore = useDiscoveryStore();

const loading  = ref(true);
const quiz     = ref(null);
const attempts = ref([]);
const expandedId = ref(null);

onMounted(async () => {
  if (!discoveryStore.tutorsLoaded) await discoveryStore.fetchTutors();
  quiz.value     = await store.fetchQuizById(route.params.id);
  attempts.value = await store.getAttemptsByQuiz(route.params.id);
  loading.value  = false;
});

const learnerName = (id) => {
  const tutor = discoveryStore.tutors.find(t => t.userId === id);
  return tutor ? tutor.name : `Usuario #${id}`;
};

const averageScore = computed(() => {
  if (attempts.value.length === 0) return 0;
  const sum = attempts.value.reduce((acc, a) => acc + (a.score / a.total), 0);
  return Math.round((sum / attempts.value.length) * 100);
});

const toggleExpand = (attemptId) => {
  expandedId.value = expandedId.value === attemptId ? null : attemptId;
};

const isCorrect = (attempt, questionIndex) => {
  const question = quiz.value?.questions[questionIndex];
  if (!question) return false;
  return attempt.selectedAnswers[questionIndex] === question.correctAnswer;
};

const navigateBack = () => router.push({ name: 'learning-quizzes' });
</script>

<template>
  <div class="results-page">

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size:2rem; color:#1a2a40;"></i>
    </div>

    <template v-else>
      <div class="page-header">
        <button class="back-btn" @click="navigateBack">
          <i class="pi pi-arrow-left"></i>
        </button>
        <div>
          <p class="quiz-course-label">{{ quiz?.course }}</p>
          <h1 class="page-title">{{ quiz?.title }}</h1>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <p class="stat-label">{{ t('learning.results-total-attempts') }}</p>
          <p class="stat-value">{{ attempts.length }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">{{ t('learning.results-average') }}</p>
          <p class="stat-value" :class="averageScore >= 60 ? 'stat-good' : 'stat-bad'">{{ averageScore }}%</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">{{ t('learning.results-questions') }}</p>
          <p class="stat-value">{{ quiz?.questionCount() }}</p>
        </div>
      </div>

      <div v-if="attempts.length === 0" class="empty-state">
        <i class="pi pi-inbox" style="font-size:2.5rem; color:#cbd5e0; display:block; margin-bottom:0.75rem;"></i>
        <p>{{ t('learning.no-attempts') }}</p>
      </div>

      <div v-else class="attempts-list">
        <div v-for="attempt in attempts" :key="attempt.id" class="attempt-card">

          <div class="attempt-row" @click="toggleExpand(attempt.id)">
            <div class="attempt-info">
              <p class="attempt-learner">{{ learnerName(attempt.learnerId) }}</p>
              <p class="attempt-date">{{ formatDateTime(attempt.completedAt) }}</p>
            </div>
            <div class="attempt-score-wrap">
              <span class="attempt-score" :class="(attempt.score / attempt.total) >= 0.6 ? 'score-good' : 'score-bad'">
                {{ attempt.score }} / {{ attempt.total }}
              </span>
              <i class="pi" :class="expandedId === attempt.id ? 'pi-chevron-up' : 'pi-chevron-down'" style="color:#9ca3af;"/>
            </div>
          </div>

          <div v-if="expandedId === attempt.id" class="attempt-detail">
            <div v-for="(question, qIdx) in quiz.questions" :key="qIdx" class="detail-question">
              <p class="detail-question-text">
                <i class="pi" :class="isCorrect(attempt, qIdx) ? 'pi-check-circle detail-icon-ok' : 'pi-times-circle detail-icon-bad'"/>
                {{ question.questionString }}
              </p>
              <div class="detail-answers">
                <span
                    v-for="(answer, aIdx) in question.answers"
                    :key="aIdx"
                    class="detail-answer"
                    :class="{
                      'detail-answer-correct':  aIdx === question.correctAnswer,
                      'detail-answer-selected-wrong': aIdx === attempt.selectedAnswers[qIdx] && aIdx !== question.correctAnswer
                    }">
                  {{ ['A','B','C','D'][aIdx] }}. {{ answer }}
                  <i v-if="aIdx === question.correctAnswer" class="pi pi-check" style="font-size:11px; margin-left:4px;"/>
                  <i v-else-if="aIdx === attempt.selectedAnswers[qIdx]" class="pi pi-times" style="font-size:11px; margin-left:4px;"/>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.results-page { max-width: 760px; margin: 0 auto; padding: 2rem; }
.loading-state { text-align: center; padding: 4rem; }

.page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 1.5rem; }
.back-btn {
  width: 36px; height: 36px; border: 1px solid #e5e7eb; border-radius: 8px;
  background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: #374151; flex-shrink: 0; transition: all 0.15s;
}
.back-btn:hover { background: #f3f4f6; }
.quiz-course-label { color: #1e4d8c; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
.page-title { color: #1a2a40; font-weight: 800; font-size: 1.4rem; margin: 0.15rem 0 0; }

.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 1.5rem; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem 1.25rem; }
.stat-label { color: #9ca3af; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin: 0 0 0.3rem; }
.stat-value { color: #1a2a40; font-weight: 800; font-size: 1.6rem; margin: 0; }
.stat-good { color: #16a34a; }
.stat-bad  { color: #dc2626; }

.empty-state { text-align: center; padding: 3rem; color: #9ca3af; background: #fff; border-radius: 12px; border: 1px dashed #e5e7eb; }

.attempts-list { display: flex; flex-direction: column; gap: 10px; }
.attempt-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.attempt-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; cursor: pointer; transition: background 0.15s; }
.attempt-row:hover { background: #f8fafc; }

.attempt-learner { color: #1a2a40; font-weight: 700; font-size: 0.92rem; margin: 0; }
.attempt-date    { color: #9ca3af; font-size: 0.78rem; margin: 0.1rem 0 0; }

.attempt-score-wrap { display: flex; align-items: center; gap: 10px; }
.attempt-score { font-weight: 800; font-size: 1rem; padding: 0.3rem 0.8rem; border-radius: 20px; }
.score-good { background: #f0fdf4; color: #16a34a; }
.score-bad  { background: #fef2f2; color: #dc2626; }

.attempt-detail { border-top: 1px solid #f1f3f5; padding: 1rem 1.25rem; background: #fafbfc; display: flex; flex-direction: column; gap: 1rem; }
.detail-question { display: flex; flex-direction: column; gap: 0.5rem; }
.detail-question-text { color: #1a2a40; font-weight: 600; font-size: 0.88rem; margin: 0; display: flex; align-items: center; gap: 6px; }
.detail-icon-ok   { color: #16a34a; }
.detail-icon-bad  { color: #dc2626; }

.detail-answers { display: flex; flex-direction: column; gap: 4px; padding-left: 1.4rem; }
.detail-answer {
  font-size: 0.82rem; color: #6b7280; padding: 0.35rem 0.6rem; border-radius: 6px;
  display: flex; align-items: center;
}
.detail-answer-correct { background: #f0fdf4; color: #16a34a; font-weight: 600; }
.detail-answer-selected-wrong { background: #fef2f2; color: #dc2626; font-weight: 600; }
</style>