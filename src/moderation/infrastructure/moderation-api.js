import {BaseApi}      from "@/shared/infrastructure/base-api.js";
import {BaseEndpoint} from "@/shared/infrastructure/base-endpoint.js";

const reportsPath   = import.meta.env.VITE_REPORTS_ENDPOINT_PATH;
const sanctionsPath = import.meta.env.VITE_SANCTIONS_ENDPOINT_PATH;

export class ModerationApi extends BaseApi {
    #reportsEndpoint;
    #sanctionsEndpoint;

    constructor() {
        super(import.meta.env.VITE_MODERATION_API_BASE_URL);
        this.#reportsEndpoint   = new BaseEndpoint(this, reportsPath);
        this.#sanctionsEndpoint = new BaseEndpoint(this, sanctionsPath);
    }

    // Reports
    getReports()         { return this.#reportsEndpoint.getAll(); }
    getReportById(id)    { return this.#reportsEndpoint.getById(id); }
    createReport(resource) { return this.#reportsEndpoint.create(resource); }

    /** PATCH /Reports/{id}/close */
    closeReport(id) {
        return this.http.patch(`${reportsPath}/${id}/close`);
    }

    getReportsByReportedUser(userId) {
        return this.http.get(`${reportsPath}/reported-user/${userId}`);
    }

    // Sanctions
    getSanctions()         { return this.#sanctionsEndpoint.getAll(); }
    getSanctionById(id)    { return this.#sanctionsEndpoint.getById(id); }
    createSanction(resource) { return this.#sanctionsEndpoint.create(resource); }

    getSanctionsByReportId(reportId) {
        return this.http.get(`${sanctionsPath}/report/${reportId}`);
    }

    /** GET /Sanctions/me — sanciones del usuario autenticado */
    getMySanctions() {
        return this.http.get(`${sanctionsPath}/me`);
    }

    /** PATCH /Sanctions/{id}/acknowledge */
    acknowledgeSanction(id) {
        return this.http.patch(`${sanctionsPath}/${id}/acknowledge`);
    }
}