import { BaseApi }      from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const quizzesPath = import.meta.env.VITE_QUIZZES_ENDPOINT_PATH; // "/Quizzes"
const attemptsPath = '/QuizAttempts';

export class LearningApi extends BaseApi {
    #quizzesEndpoint;

    constructor() {
        super(import.meta.env.VITE_LEARNING_API_URL);
        this.#quizzesEndpoint = new BaseEndpoint(this, quizzesPath);
    }

    getQuizzes()             { return this.#quizzesEndpoint.getAll();            }
    getQuizById(id)          { return this.#quizzesEndpoint.getById(id);         }
    createQuiz(resource)     { return this.#quizzesEndpoint.create(resource);    }
    updateQuiz(id, resource) { return this.#quizzesEndpoint.update(id, resource);}
    deleteQuiz(id)           { return this.#quizzesEndpoint.delete(id);          }

    // Preguntas individuales
    addQuestion(quizId, resource) {
        return this.http.post(`${quizzesPath}/${quizId}/questions`, resource);
    }
    updateQuestion(quizId, questionId, resource) {
        return this.http.put(`${quizzesPath}/${quizId}/questions/${questionId}`, resource);
    }
    deleteQuestion(quizId, questionId) {
        return this.http.delete(`${quizzesPath}/${quizId}/questions/${questionId}`);
    }

    // QuizAttempts
    submitAttempt(quizId, resource) {
        return this.http.post(`${attemptsPath}/quiz/${quizId}`, resource);
    }
    getAttemptById(attemptId) {
        return this.http.get(`${attemptsPath}/${attemptId}`);
    }
    getAttemptsByLearner(learnerId) {
        return this.http.get(`${attemptsPath}/learner/${learnerId}`);
    }
    getAttemptsByQuiz(quizId) {
        return this.http.get(`${attemptsPath}/quiz/${quizId}`);
    }
}