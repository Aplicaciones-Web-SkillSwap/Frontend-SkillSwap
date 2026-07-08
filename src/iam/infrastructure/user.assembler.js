import {User} from "@/iam/domain/model/user-entity.js";

export class UserAssembler {
    static toEntityFromResource(resource) {
        return new User({...resource});
    }

    static toEntityFromResponse(response) {
        return this.toEntityFromResource(response.data);
    }
}
