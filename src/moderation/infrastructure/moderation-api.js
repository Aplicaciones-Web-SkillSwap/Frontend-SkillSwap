import {BaseApi}      from "@/shared/infrastructure/base-api.js";
import {BaseEndpoint} from "@/shared/infrastructure/base-endpoint.js";

const reportsPath   = import.meta.env.VITE_REPORTS_ENDPOINT_PATH;
const sanctionsPath = import.meta.env.VITE_SANCTIONS_ENDPOINT_PATH;

export class ModerationApi extends BaseApi {
    #reportsEndpoint;
    #sanctionsEndpoint;

    constructor() {
        super();
        this.#reportsEndpoint   = new BaseEndpoint(this, reportsPath);
        this.#sanctionsEndpoint = new BaseEndpoint(this, sanctionsPath);
    }

    getReports() {
        return this.#reportsEndpoint.getAll();
    }

    getReportById(id) {
        return this.#reportsEndpoint.getById(id);
    }

    createReport(resource) {
        return this.#reportsEndpoint.create(resource);
    }

    updateReport(id, resource) {
        return this.#reportsEndpoint.update(id, resource);
    }

    deleteReport(id) {
        return this.#reportsEndpoint.delete(id);
    }

    getSanctions() {
        return this.#sanctionsEndpoint.getAll();
    }

    getSanctionById(id) {
        return this.#sanctionsEndpoint.getById(id);
    }

    createSanction(resource) {
        return this.#sanctionsEndpoint.create(resource);
    }

    updateSanction(id, resource) {
        return this.#sanctionsEndpoint.update(id, resource);
    }

    deleteSanction(id) {
        return this.#sanctionsEndpoint.delete(id);
    }

    getMessagesByUser(userId) {
        return this.http.get(`/messages?reportedUserId=${userId}`).then(r => r.data);
    }
}