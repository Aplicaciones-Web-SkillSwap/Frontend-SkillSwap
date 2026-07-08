import {BaseApi} from "@/shared/infrastructure/base-api.js";

const authenticationEndpointPath = import.meta.env.VITE_AUTHENTICATION_ENDPOINT_PATH;
const usersEndpointPath          = import.meta.env.VITE_USERS_ENDPOINT_PATH;

export class IamApi extends BaseApi {
    constructor() {
        super(import.meta.env.VITE_AUTH_API_URL);
    }

    signIn({username, password}) {
        return this.http.post(`${authenticationEndpointPath}/sign-in`, {username, password});
    }

    signUp({username, email, password, role}) {
        return this.http.post(`${authenticationEndpointPath}/sign-up`, {username, email, password, role});
    }

    getUserById(id) {
        return this.http.get(`${usersEndpointPath}/${id}`);
    }
}
