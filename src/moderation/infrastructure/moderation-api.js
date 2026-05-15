// ── API propia del BC Moderation ────────────────────────────────────────────
// Usa su propio baseURL (my-json-server.typicode.com) para no interferir
// con la base-api.js compartida que apunta a localhost:3000/api/v1
// ────────────────────────────────────────────────────────────────────────────
import axios from 'axios';
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js';

const MODERATION_BASE_URL = import.meta.env.VITE_MODERATION_API_BASE_URL;
const reportsPath         = import.meta.env.VITE_REPORTS_ENDPOINT_PATH;
const sanctionsPath       = import.meta.env.VITE_SANCTIONS_ENDPOINT_PATH;

class ModerationHttp {
    #http;
    constructor() {
        this.#http = axios.create({
            baseURL: MODERATION_BASE_URL,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    get http() { return this.#http; }
}

export class ModerationApi {
    #reportsEndpoint;
    #sanctionsEndpoint;
    #http;

    constructor() {
        const base = new ModerationHttp();
        this.#http              = base.http;
        this.#reportsEndpoint   = new BaseEndpoint(base, reportsPath);
        this.#sanctionsEndpoint = new BaseEndpoint(base, sanctionsPath);
    }

    // ── Reports ────────────────────────────────────────────────
    getReports()                    { return this.#reportsEndpoint.getAll();           }
    getReportById(id)               { return this.#reportsEndpoint.getById(id);        }
    createReport(resource)          { return this.#reportsEndpoint.create(resource);   }
    updateReport(id, resource)      { return this.#reportsEndpoint.update(id, resource); }
    deleteReport(id)                { return this.#reportsEndpoint.delete(id);         }

    // ── Sanctions ──────────────────────────────────────────────
    getSanctions()                  { return this.#sanctionsEndpoint.getAll();           }
    getSanctionById(id)             { return this.#sanctionsEndpoint.getById(id);        }
    createSanction(resource)        { return this.#sanctionsEndpoint.create(resource);   }
    updateSanction(id, resource)    { return this.#sanctionsEndpoint.update(id, resource); }
    deleteSanction(id)              { return this.#sanctionsEndpoint.delete(id);         }

    // ── Messages (report chat) ─────────────────────────────────
    getMessagesByUser(userId) {
        return this.#http.get(`/messages?reportedUserId=${userId}`).then(r => r.data);
    }
}
