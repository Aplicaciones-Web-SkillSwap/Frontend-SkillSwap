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

    /** POST /Reports solo espera estos 4 campos */
    static toResourceFromEntity(entity) {
        return {
            reporterUserId: entity.reporterUserId,
            reportedUserId: entity.reportedUserId,
            sessionId:      entity.sessionId,
            reason:         entity.reason,
        };
    }
}