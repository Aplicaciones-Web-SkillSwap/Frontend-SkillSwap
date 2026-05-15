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

    static toResourceFromEntity(entity) {
        return {
            id:          entity.id,
            tutorId:     entity.tutorId,
            course:      entity.course,
            title:       entity.title,
            description: entity.description,
            questions:   entity.questions,
            status:      entity.status,
            createdAt:   entity.createdAt instanceof Date
                ? entity.createdAt.toISOString()
                : entity.createdAt
        };
    }
}