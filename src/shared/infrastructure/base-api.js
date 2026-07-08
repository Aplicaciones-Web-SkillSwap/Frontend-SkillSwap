import axios from "axios";

const TOKEN_KEY = 'skillswap_token';
const USER_KEY  = 'skillswap_user';

export class BaseApi {

    #http;

    constructor(baseURL = import.meta.env.VITE_LEARNING_PLATFORM_API_URL) {
        this.#http = axios.create({
            baseURL: baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.#http.interceptors.request.use(config => {
            const token = localStorage.getItem(TOKEN_KEY);
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
        });

        this.#http.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
                    if (window.location.pathname !== '/login') window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    get http() {
        return this.#http;
    }
}
