import { Report } from '@/moderation/domain/model/report-entity.js';

export class ReportAssembler {

    static toEntityFromResource(resource) {
        return new Report({ ...resource });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        const data  = response.data;
        const items = Array.isArray(data) ? data : (data['reports'] ?? []);
        return items.map(r => this.toEntityFromResource(r));
    }

    static toResourceFromEntity(entity) {
        return {
            id:             entity.id,
            reportedUserId: entity.reportedUserId,
            reporterUserId: entity.reporterUserId,
            reason:         entity.reason,
            status:         entity.status,
            closed:         entity.closed,
            createdAt:      entity.createdAt instanceof Date
                                ? entity.createdAt.toISOString()
                                : entity.createdAt
        };
    }
}
