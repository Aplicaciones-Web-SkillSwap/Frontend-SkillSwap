import axios from 'axios'

export class BaseApi {
    #http

    constructor() {
        this.#http = axios.create({
            baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    get http() { return this.#http }
}