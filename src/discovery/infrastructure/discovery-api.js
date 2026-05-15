import {BaseApi} from "@/shared/infrastructure/base-api.js";
import {BaseEndpoint} from "@/shared/infrastructure/base-endpoint.js";

const tutorsEndpointPath = import.meta.env.VITE_TUTORS_ENDPOINT_PATH;

export class DiscoveryApi extends BaseApi {
    #tutorsEndpoint;

    constructor() {
        super();
        this.#tutorsEndpoint = new BaseEndpoint(this, tutorsEndpointPath);
    }

    getTutors()           { return this.#tutorsEndpoint.getAll(); }
    getTutorById(id)      { return this.#tutorsEndpoint.getById(id); }
    createTutor(resource) { return this.#tutorsEndpoint.create(resource); }
    updateTutor(resource) { return this.#tutorsEndpoint.update(resource.id, resource); }
    deleteTutor(id)       { return this.#tutorsEndpoint.delete(id); }
}
