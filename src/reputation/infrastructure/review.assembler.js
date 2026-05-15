import { Review } from '@/reputation/domain/model/review-entity.js'

export class ReviewAssembler {
    static toEntityFromResource(resource) {
        return new Review({ ...resource })
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`)
            return []
        }
        const data = response.data
        const list = Array.isArray(data) ? data : (data.reviews ?? [])
        return list.map(r => this.toEntityFromResource(r))
    }

    static toResourceFromEntity(entity) {
        return {
            tutorId:   entity.tutorId,
            studentId: entity.studentId,
            sessionId: entity.sessionId,
            score:     entity.score,
            comment:   entity.comment,
            status:    entity.status,
            date:      entity.date,
        }
    }
}