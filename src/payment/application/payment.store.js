import {PaymentApi} from "@/payment/infrastructure/payment-api.js";
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {WalletAssembler} from "@/payment/infrastructure/wallet.assembler.js";
import {TransactionAssembler} from "@/payment/infrastructure/transaction.assembler.js";
import {PaymentMethodAssembler} from "@/payment/infrastructure/payment-method.assembler.js";

const paymentApi = new PaymentApi();

const usePaymentStore = defineStore('payment', () => {
    const wallets      = ref([]);
    const transactions = ref([]);
    const errors       = ref([]);
    const walletsLoaded      = ref(false);
    const transactionsLoaded = ref(false);

    const paymentMethod       = ref(null);
    const paymentMethodLoaded = ref(false);

    const walletsCount = computed(() => walletsLoaded.value ? wallets.value.length : 0);
    const transactionsCount = computed(() => transactionsLoaded.value ? transactions.value.length : 0);

    function fetchWallets() {
        paymentApi.getWallets().then(response => {
            wallets.value = WalletAssembler.toEntitiesFromResponse(response);
            walletsLoaded.value = true;
        }).catch(error => {
            errors.value.push(error);
            console.log('Error fetching wallets:', error);
        });
    }

    function fetchTransactions() {
        paymentApi.getTransactions().then(response => {
            transactions.value = TransactionAssembler.toEntitiesFromResponse(response);
            transactionsLoaded.value = true;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function getWalletById(id) {
        return wallets.value.find(w => w.id === parseInt(id));
    }

    function getWalletByUserId(userId) {
        return wallets.value.find(w => w.userId === parseInt(userId));
    }

    function getTransactionById(id) {
        return transactions.value.find(t => t.id === parseInt(id));
    }

    function getTransactionsByWalletId(walletId) {
        return transactions.value.filter(t => t.walletId === parseInt(walletId));
    }

    /**
     * Verifica si un usuario tiene wallet creada, consultando al backend directamente
     * (no depende de que `wallets` ya esté cargado en el store).
     */
    function checkWalletExists(userId) {
        return paymentApi.getWalletByUserId(userId)
            .then(() => true)
            .catch(() => false);
    }

    /**
     * Donación atómica estudiante → tutor.
     * POST /Transactions/donate — el backend calcula la comisión (5%) y mueve
     * el saldo en ambos wallets en una sola operación.
     *
     * @returns {Promise<{ok: boolean, data?: object, errorType?: 'not-found'|'invalid'|'unknown'}>}
     */
    async function donate({ fromUserId, toUserId, amount, description }) {
        try {
            const response = await paymentApi.donate({ fromUserId, toUserId, amount, description });
            return { ok: true, data: response.data };
        } catch (error) {
            const status = error.response?.status;
            if (status === 404) return { ok: false, errorType: 'not-found' };
            if (status === 400) return { ok: false, errorType: 'invalid' };
            errors.value.push(error);
            return { ok: false, errorType: 'unknown' };
        }
    }

    function addWallet(wallet) {
        return paymentApi.createWallet(wallet).then(response => {
            const newWallet = WalletAssembler.toEntityFromResource(response.data);
            wallets.value.push(newWallet);
            return newWallet;
        }).catch(error => {
            errors.value.push(error);
            return null;
        });
    }

    /**
     * Carga el método de pago guardado del usuario autenticado, si existe.
     * Un 404 es un estado válido (nunca guardó uno) y no se trata como error.
     */
    async function fetchMyPaymentMethod() {
        try {
            const response = await paymentApi.getMyPaymentMethod();
            paymentMethod.value = PaymentMethodAssembler.toEntityFromResource(response.data);
        } catch (error) {
            if (error.response?.status !== 404) errors.value.push(error);
            paymentMethod.value = null;
        } finally {
            paymentMethodLoaded.value = true;
        }
    }

    /**
     * Guarda (crea o reemplaza) el único método de pago del usuario autenticado.
     */
    async function savePaymentMethod({ type, displayLabel }) {
        try {
            const response = await paymentApi.saveMyPaymentMethod({ type, displayLabel });
            paymentMethod.value = PaymentMethodAssembler.toEntityFromResource(response.data);
            paymentMethodLoaded.value = true;
            return paymentMethod.value;
        } catch (error) {
            errors.value.push(error);
            return null;
        }
    }

    return {
        wallets, transactions, errors,
        walletsLoaded, transactionsLoaded,
        walletsCount, transactionsCount,
        fetchWallets, fetchTransactions,
        getWalletById, getWalletByUserId, getTransactionById, getTransactionsByWalletId,
        checkWalletExists, donate, addWallet,
        paymentMethod, paymentMethodLoaded,
        fetchMyPaymentMethod, savePaymentMethod,
    };
});

export default usePaymentStore;