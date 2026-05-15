import axios from "axios";

export class BaseApi {

    #http;

    constructor(baseURL = import.meta.env.VITE_LEARNING_PLATFORM_API_URL) {
        this.#http = axios.create({
            baseURL: baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    get http() {
        return this.#http;
    }
}
