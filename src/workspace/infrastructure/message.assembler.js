import {Message} from "@/workspace/domain/model/message-entity.js";

export class MessageAssembler {

    static toEntityFromResource(resource) {
        return new Message({ ...resource });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        let resources = response.data instanceof Array ? response.data : response.data['messages'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
