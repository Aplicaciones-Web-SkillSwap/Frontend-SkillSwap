import { Quiz } from '@/learning/domain/model/quiz-entity.js';

export class QuizAssembler {

    static toEntityFromResource(resource) {
        return new Quiz({ ...resource });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        const data  = response.data;
        const items = Array.isArray(data) ? data : (data['quizzes'] ?? []);
        return items.map(r => this.toEntityFromResource(r));
    }

    /** POST /Quizzes — solo el quiz base, sin preguntas */
    static toCreateResource(entity) {
        return {
            tutorId:     entity.tutorId,
            course:      entity.course,
            title:       entity.title,
            description: entity.description,
        };
    }

    /** PUT /Quizzes/{id} — incluye preguntas completas */
    static toUpdateResource(entity) {
        return {
            course:      entity.course,
            title:       entity.title,
            description: entity.description,
            questions:   entity.questions.map(q => ({
                questionString: q.questionString,
                answers:        q.answers,
                correctAnswer:  q.correctAnswer,
            })),
        };
    }

    /** POST /Quizzes/{quizId}/questions */
    static toQuestionResource(question) {
        return {
            questionString: question.questionString,
            answers:        question.answers,
            correctAnswer:  question.correctAnswer,
        };
    }
}