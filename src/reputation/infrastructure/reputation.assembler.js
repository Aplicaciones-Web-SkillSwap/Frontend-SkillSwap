import {Reputation} from "@/reputation/domain/model/reputation-entity.js";

export class ReputationAssembler {
    static toEntityFromResource(resource) {
        return new Reputation({ ...resource });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        const data = response.data;
        const list = Array.isArray(data) ? data : (data.reputations ?? []);
        return list.map(r => this.toEntityFromResource(r));
    }
}
