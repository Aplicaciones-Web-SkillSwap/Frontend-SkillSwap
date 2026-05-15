import { BaseApi }      from '@/shared/infrastructure/base-api.js';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const quizzesPath = import.meta.env.VITE_QUIZZES_ENDPOINT_PATH;

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
}