import {Tutor} from "@/discovery/domain/model/tutor-entity.js";

export class TutorAssembler {
    static toEntityFromResource(resource) {
        return new Tutor({ ...resource });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        let resources = response.data instanceof Array ? response.data : response.data['tutors'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
