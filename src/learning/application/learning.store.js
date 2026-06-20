import { defineStore }   from 'pinia';
import { ref, computed } from 'vue';
import { LearningApi }   from '@/learning/infrastructure/learning-api.js';
import { QuizAssembler } from '@/learning/infrastructure/quiz-assembler.js';
import { Quiz, Question } from '@/learning/domain/model/quiz-entity.js';

const learningApi = new LearningApi();

const useLearningStore = defineStore('learning', () => {

    const quizzes = ref([]);
    const loading = ref(false);
    const error   = ref(null);

    const quizCount = computed(() => quizzes.value.length);

    function fetchQuizzes() {
        loading.value = true;
        return learningApi.getQuizzes()
            .then(response => {
                quizzes.value = QuizAssembler.toEntitiesFromResponse(response);
                loading.value = false;
            })
            .catch(err => {
                error.value   = err.message || 'Failed to load quizzes';
                loading.value = false;
                console.error('Error fetching quizzes:', err);
            });
    }

    function fetchQuizById(id) {
        return learningApi.getQuizById(id)
            .then(response => {
                const quiz = QuizAssembler.toEntityFromResource(response.data);
                const index = quizzes.value.findIndex(q => q.id === quiz.id);
                if (index !== -1) quizzes.value[index] = quiz; else quizzes.value.push(quiz);
                return quiz;
            })
            .catch(err => { error.value = err.message; return null; });
    }

    /** POST /Quizzes — crea el quiz base, sin preguntas */
    function addQuiz(quiz) {
        const resource = QuizAssembler.toCreateResource(quiz);
        return learningApi.createQuiz(resource)
            .then(response => {
                const newQuiz = QuizAssembler.toEntityFromResource(response.data);
                quizzes.value.push(newQuiz);
                return newQuiz;
            })
            .catch(err => { error.value = err.message; return null; });
    }

    /** PUT /Quizzes/{id} — actualiza datos básicos + preguntas completas */
    function updateQuiz(quiz) {
        const resource = QuizAssembler.toUpdateResource(quiz);
        return learningApi.updateQuiz(quiz.id, resource)
            .then(response => {
                const updated = QuizAssembler.toEntityFromResource(response.data);
                const index   = quizzes.value.findIndex(q => q.id === updated.id);
                if (index !== -1) quizzes.value[index] = updated;
                return updated;
            })
            .catch(err => { error.value = err.message; return null; });
    }

    /** POST /Quizzes/{quizId}/questions — agrega una pregunta individual */
    function addQuestion(quizId, question) {
        const resource = QuizAssembler.toQuestionResource(question);
        return learningApi.addQuestion(quizId, resource)
            .then(() => fetchQuizById(quizId))
            .catch(err => { error.value = err.message; return null; });
    }

    function deleteQuiz(id) {
        return learningApi.deleteQuiz(id)
            .then(() => {
                const index = quizzes.value.findIndex(q => q.id === id);
                if (index !== -1) quizzes.value.splice(index, 1);
            })
            .catch(err => { error.value = err.message; });
    }

    function getQuizById(id) {
        return quizzes.value.find(q => q.id === parseInt(id));
    }

    /** POST /QuizAttempts/quiz/{quizId} */
    function submitAttempt(quizId, { learnerId, sessionId, selectedAnswers }) {
        return learningApi.submitAttempt(quizId, { learnerId, sessionId, selectedAnswers })
            .then(response => response.data)
            .catch(err => { error.value = err.message; return null; });
    }

    function getAttemptsByQuiz(quizId) {
        return learningApi.getAttemptsByQuiz(quizId)
            .then(response => response.data)
            .catch(err => { error.value = err.message; return []; });
    }

    return {
        quizzes, loading, error,
        quizCount,
        fetchQuizzes, fetchQuizById, addQuiz, updateQuiz, addQuestion, deleteQuiz, getQuizById,
        submitAttempt, getAttemptsByQuiz
    };
});

export default useLearningStore;