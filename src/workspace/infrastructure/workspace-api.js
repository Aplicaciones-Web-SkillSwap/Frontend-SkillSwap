import {BaseApi} from "@/shared/infrastructure/base-api.js";
import {BaseEndpoint} from "@/shared/infrastructure/base-endpoint.js";

const sessionsEndpointPath = import.meta.env.VITE_SESSIONS_ENDPOINT_PATH;
const messagesEndpointPath = import.meta.env.VITE_MESSAGES_ENDPOINT_PATH;

export class WorkspaceApi extends BaseApi {
    #sessionsEndpoint;
    #messagesEndpoint;

    constructor() {
        super();
        this.#sessionsEndpoint = new BaseEndpoint(this, sessionsEndpointPath);
        this.#messagesEndpoint = new BaseEndpoint(this, messagesEndpointPath);
    }

    getSessions() {
        return this.#sessionsEndpoint.getAll();
    }

    getSessionById(id) {
        return this.#sessionsEndpoint.getById(id);
    }

    createSession(resource) {
        return this.#sessionsEndpoint.create(resource);
    }

    updateSession(resource) {
        return this.#sessionsEndpoint.update(resource.id, resource);
    }

    deleteSession(id) {
        return this.#sessionsEndpoint.delete(id);
    }

    getMessages() {
        return this.#messagesEndpoint.getAll();
    }

    getMessageById(id) {
        return this.#messagesEndpoint.getById(id);
    }

    createMessage(resource) {
        return this.#messagesEndpoint.create(resource);
    }

    updateMessage(resource) {
        return this.#messagesEndpoint.update(resource.id, resource);
    }

    deleteMessage(id) {
        return this.#messagesEndpoint.delete(id);
    }
}
