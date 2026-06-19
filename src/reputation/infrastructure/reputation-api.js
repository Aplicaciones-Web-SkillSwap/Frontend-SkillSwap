import {BaseApi}      from "@/shared/infrastructure/base-api.js";
import {BaseEndpoint} from "@/shared/infrastructure/base-endpoint.js";

const reviewsEndpointPath = import.meta.env.VITE_REVIEWS_ENDPOINT_PATH;

export class ReputationApi extends BaseApi {
    #reviews;

    constructor() {
        super(import.meta.env.VITE_REPUTATION_API_URL);
        this.#reviews = new BaseEndpoint(this, reviewsEndpointPath);
    }


    getReviews()        { return this.#reviews.getAll(); }
    getReviewById(id)   { return this.#reviews.getById(id); }
    createReview(body)  { return this.#reviews.create(body); }


    getTutorSummary(tutorId) {
        return this.http.get(`${reviewsEndpointPath}/tutor/${tutorId}/summary`);
    }
}