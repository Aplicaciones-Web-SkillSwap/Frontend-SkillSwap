import { defineStore }   from 'pinia';
import { ref, computed } from 'vue';
import { LearningApi }   from '@/learning/infrastructure/learning-api.js';
import { QuizAssembler } from '@/learning/infrastructure/quiz-assembler.js';
import { Quiz }          from '@/learning/domain/model/quiz-entity.js';

const learningApi = new LearningApi();

const useLearningStore = defineStore('learning', () => {

    const quizzes = ref([]);
    const loading = ref(false);
    const error   = ref(null);

    const quizCount        = computed(() => quizzes.value.length);
    const publishedQuizzes = computed(() => quizzes.value.filter(q => q.isPublished()));
    const draftQuizzes     = computed(() => quizzes.value.filter(q => !q.isPublished()));

    function fetchQuizzes() {
        loading.value = true;
        learningApi.getQuizzes()
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

    function addQuiz(quiz) {
        const resource = QuizAssembler.toResourceFromEntity(quiz);
        return learningApi.createQuiz(resource)
            .then(response => {
                const newQuiz = QuizAssembler.toEntityFromResource(response.data);
                quizzes.value.push(newQuiz);
            })
            .catch(err => { error.value = err.message; });
    }

    function updateQuiz(quiz) {
        const resource = QuizAssembler.toResourceFromEntity(quiz);
        return learningApi.updateQuiz(quiz.id, resource)
            .then(response => {
                const updated = QuizAssembler.toEntityFromResource(response.data);
                const index   = quizzes.value.findIndex(q => q.id === updated.id);
                if (index !== -1) quizzes.value[index] = updated;
            })
            .catch(err => { error.value = err.message; });
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

    return {
        quizzes, loading, error,
        quizCount, publishedQuizzes, draftQuizzes,
        fetchQuizzes, addQuiz, updateQuiz, deleteQuiz, getQuizById
    };
});

export default useLearningStore;