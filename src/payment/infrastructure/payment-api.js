import {BaseApi} from "@/shared/infrastructure/base-api.js";
import {BaseEndpoint} from "@/shared/infrastructure/base-endpoint.js";

const walletsEndpointPath      = import.meta.env.VITE_WALLETS_ENDPOINT_PATH;
const transactionsEndpointPath = import.meta.env.VITE_TRANSACTIONS_ENDPOINT_PATH;

export class PaymentApi extends BaseApi {
    #walletsEndpoint;
    #transactionsEndpoint;

    constructor() {
        super(import.meta.env.VITE_PAYMENT_API_URL);
        this.#walletsEndpoint      = new BaseEndpoint(this, walletsEndpointPath);
        this.#transactionsEndpoint = new BaseEndpoint(this, transactionsEndpointPath);
    }

    getWallets() {
        return this.#walletsEndpoint.getAll();
    }

    getWalletById(id) {
        return this.#walletsEndpoint.getById(id);
    }

    getWalletByUserId(userId) {
        return this.http.get(`${walletsEndpointPath}/user/${userId}`);
    }

    createWallet(resource) {
        return this.#walletsEndpoint.create(resource);
    }

    getTransactions() {
        return this.#transactionsEndpoint.getAll();
    }

    getTransactionsByWalletId(walletId) {
        return this.http.get(`${transactionsEndpointPath}/wallet/${walletId}`);
    }

    createTransaction(resource) {
        return this.#transactionsEndpoint.create(resource);
    }

    /** POST /Transactions/donate — operación atómica de donación */
    donate({ fromUserId, toUserId, amount, description }) {
        return this.http.post(`${transactionsEndpointPath}/donate`, {
            fromUserId, toUserId, amount, description
        });
    }
}