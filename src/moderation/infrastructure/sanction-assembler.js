import { Sanction } from '@/moderation/domain/model/sanction-entity.js';

export class SanctionAssembler {

    static toEntityFromResource(resource) {
        return new Sanction({ ...resource });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        const data  = response.data;
        const items = Array.isArray(data) ? data : (data['sanctions'] ?? []);
        return items.map(s => this.toEntityFromResource(s));
    }

    static toResourceFromEntity(entity) {
        return {
            id:               entity.id,
            reportId:         entity.reportId,
            sanctionedUserId: entity.sanctionedUserId,
            type:             entity.type,
            description:      entity.description,
            durationDays:     entity.durationDays,
            createdAt:        entity.createdAt instanceof Date
                                  ? entity.createdAt.toISOString()
                                  : entity.createdAt
        };
    }
}
