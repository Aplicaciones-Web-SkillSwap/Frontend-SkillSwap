import {BaseApi}      from "@/shared/infrastructure/base-api.js";
import {BaseEndpoint} from "@/shared/infrastructure/base-endpoint.js";

const reviewsEndpointPath     = import.meta.env.VITE_REVIEWS_ENDPOINT_PATH;
const reputationsEndpointPath = import.meta.env.VITE_REPUTATIONS_ENDPOINT_PATH;

export class ReputationApi extends BaseApi {
    #reviews;
    #reputations;

    constructor() {
        super(import.meta.env.VITE_REPUTATION_API_URL);
        this.#reviews     = new BaseEndpoint(this, reviewsEndpointPath);
        this.#reputations = new BaseEndpoint(this, reputationsEndpointPath);
    }

    // Reviews
    getReviews()           { return this.#reviews.getAll(); }
    getReviewById(id)      { return this.#reviews.getById(id); }
    createReview(body)     { return this.#reviews.create(body); }
    updateReview(id, body) { return this.#reviews.update(id, body); }
    deleteReview(id)       { return this.#reviews.delete(id); }

    // Reputations
    getReputations()      { return this.#reputations.getAll(); }
    getReputationById(id) { return this.#reputations.getById(id); }
}
