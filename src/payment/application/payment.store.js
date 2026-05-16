import {PaymentApi} from "@/payment/infrastructure/payment-api.js";
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {WalletAssembler} from "@/payment/infrastructure/wallet.assembler.js";
import {TransactionAssembler} from "@/payment/infrastructure/transaction.assembler.js";

const paymentApi = new PaymentApi();

const usePaymentStore = defineStore('payment', () => {
    const wallets      = ref([]);
    const transactions = ref([]);
    const errors       = ref([]);
    const walletsLoaded      = ref(false);
    const transactionsLoaded = ref(false);

    const walletsCount = computed(() => {
        return walletsLoaded.value ? wallets.value.length : 0;
    });

    const transactionsCount = computed(() => {
        return transactionsLoaded.value ? transactions.value.length : 0;
    });

    function fetchWallets() {
        paymentApi.getWallets().then(response => {
            wallets.value = WalletAssembler.toEntitiesFromResponse(response);
            walletsLoaded.value = true;
            console.log(walletsLoaded.value);
            console.log(wallets.value);
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
        let idNum = parseInt(id);
        return wallets.value.find(wallet => wallet['id'] === idNum);
    }

    function getTransactionById(id) {
        let idNum = parseInt(id);
        return transactions.value.find(transaction => transaction['id'] === idNum);
    }

    function getTransactionsByWalletId(walletId) {
        let idNum = parseInt(walletId);
        return transactions.value.filter(transaction => transaction['walletId'] === idNum);
    }

    function addWallet(wallet) {
        paymentApi.createWallet(wallet).then(response => {
            const resource  = response.data;
            const newWallet = WalletAssembler.toEntityFromResource(resource);
            wallets.value.push(newWallet);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    // ── addTransaction ──────
    function addTransaction(transaction) {
        paymentApi.createTransaction(transaction).then(response => {
            const resource       = response.data;
            const newTransaction = TransactionAssembler.toEntityFromResource(resource);
            transactions.value.push(newTransaction);


            if (newTransaction.status === 'completed') {
                _applyTransactionToWallet(newTransaction.walletId, newTransaction.netAmount);
            }
        }).catch(error => {
            errors.value.push(error);
            console.log('Error creating transaction:', error);
        });
    }


    function updateTransaction(transaction) {

        const previousTransaction = getTransactionById(transaction.id);
        const wasAlreadyCompleted = previousTransaction?.status === 'completed';

        paymentApi.updateTransaction(transaction).then(response => {
            const resource           = response.data;
            const updatedTransaction = TransactionAssembler.toEntityFromResource(resource);
            const index = transactions.value.findIndex(t => t['id'] === updatedTransaction.id);
            if (index !== -1) transactions.value[index] = updatedTransaction;

            if (updatedTransaction.status === 'completed' && !wasAlreadyCompleted) {
                _applyTransactionToWallet(updatedTransaction.walletId, updatedTransaction.netAmount);
            }
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function _applyTransactionToWallet(walletId, netAmount) {
        const wallet = getWalletById(walletId);
        if (!wallet) {
            console.warn(`Wallet ${walletId} no encontrada. No se actualizó el balance.`);
            return;
        }
        const updatedWallet = {
            ...wallet,
            balance: parseFloat((Number(wallet.balance) + Number(netAmount)).toFixed(2))
        };
        updateWallet(updatedWallet);
        console.log(`Wallet #${walletId} balance actualizado: +${netAmount} → ${updatedWallet.balance}`);
    }

    function updateWallet(wallet) {
        paymentApi.updateWallet(wallet).then(response => {
            const resource      = response.data;
            const updatedWallet = WalletAssembler.toEntityFromResource(resource);
            const index = wallets.value.findIndex(w => w['id'] === updatedWallet.id);
            if (index !== -1) wallets.value[index] = updatedWallet;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function deleteWallet(wallet) {
        paymentApi.deleteWallet(wallet.id).then(() => {
            const index = wallets.value.findIndex(w => w['id'] === wallet.id);
            if (index !== -1) wallets.value.splice(index, 1);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function deleteTransaction(transaction) {
        paymentApi.deleteTransaction(transaction.id).then(() => {
            const index = transactions.value.findIndex(t => t['id'] === transaction.id);
            if (index !== -1) transactions.value.splice(index, 1);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    return {
        wallets, transactions,
        errors,
        walletsLoaded, transactionsLoaded,
        walletsCount, transactionsCount,
        fetchWallets, fetchTransactions,
        getWalletById, getTransactionById, getTransactionsByWalletId,
        addWallet, addTransaction,
        updateWallet, updateTransaction,
        deleteWallet, deleteTransaction
    };
});

export default usePaymentStore;