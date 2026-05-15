import {BaseApi} from "@/shared/infrastructure/base-api.js";
import {BaseEndpoint} from "@/shared/infrastructure/base-endpoint.js";

const walletsEndpointPath      = import.meta.env.VITE_WALLETS_ENDPOINT_PATH;
const transactionsEndpointPath = import.meta.env.VITE_TRANSACTIONS_ENDPOINT_PATH;

export class PaymentApi extends BaseApi {
    #walletsEndpoint;
    #transactionsEndpoint;

    constructor() {
        super();
        this.#walletsEndpoint      = new BaseEndpoint(this, walletsEndpointPath);
        this.#transactionsEndpoint = new BaseEndpoint(this, transactionsEndpointPath);
    }

    getWallets() {
        return this.#walletsEndpoint.getAll();
    }

    getWalletById(id) {
        return this.#walletsEndpoint.getById(id);
    }

    createWallet(resource) {
        return this.#walletsEndpoint.create(resource);
    }

    updateWallet(resource) {
        return this.#walletsEndpoint.update(resource.id, resource);
    }

    deleteWallet(id) {
        return this.#walletsEndpoint.delete(id);
    }

    getTransactions() {
        return this.#transactionsEndpoint.getAll();
    }

    getTransactionById(id) {
        return this.#transactionsEndpoint.getById(id);
    }

    createTransaction(resource) {
        return this.#transactionsEndpoint.create(resource);
    }

    updateTransaction(resource) {
        return this.#transactionsEndpoint.update(resource.id, resource);
    }

    deleteTransaction(id) {
        return this.#transactionsEndpoint.delete(id);
    }
}
