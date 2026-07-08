import {IamApi} from "@/iam/infrastructure/iam-api.js";
import {UserAssembler} from "@/iam/infrastructure/user.assembler.js";
import {User} from "@/iam/domain/model/user-entity.js";
import {defineStore} from "pinia";
import {computed, ref} from "vue";

const iamApi = new IamApi();

const TOKEN_KEY = 'skillswap_token';
const USER_KEY  = 'skillswap_user';

function readStoredUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? new User(JSON.parse(raw)) : null;
}

const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem(TOKEN_KEY) || '');
    const user  = ref(readStoredUser());
    const error = ref('');

    const isAuthenticated = computed(() => !!token.value);

    function persist(userEntity, jwt) {
        user.value  = userEntity;
        token.value = jwt;
        localStorage.setItem(TOKEN_KEY, jwt);
        localStorage.setItem(USER_KEY, JSON.stringify(userEntity));
    }

    function login({username, password}) {
        error.value = '';
        return iamApi.signIn({username, password}).then(response => {
            const authenticatedUser = UserAssembler.toEntityFromResponse(response);
            persist(authenticatedUser, response.data.token);
            return authenticatedUser;
        }).catch(err => {
            error.value = err.response?.data?.detail || err.response?.data?.message || 'No se pudo iniciar sesión.';
            throw err;
        });
    }

    function register({username, email, password, role}) {
        error.value = '';
        return iamApi.signUp({username, email, password, role})
            .then(() => login({username, password}))
            .catch(err => {
                if (!error.value) {
                    error.value = err.response?.data?.detail || err.response?.data?.message || 'No se pudo completar el registro.';
                }
                throw err;
            });
    }

    function logout() {
        user.value  = null;
        token.value = '';
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    return {user, token, error, isAuthenticated, login, register, logout};
});

export default useAuthStore;
