<script setup>
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import usePaymentStore from "@/payment/application/payment.store.js";
import useAuthStore    from "@/iam/application/auth.store.js";
import {computed, onMounted, toRefs} from "vue";

const {t}     = useI18n();
const router  = useRouter();
const store   = usePaymentStore();
const authStore = useAuthStore();
const { transactions, errors, transactionsLoaded } = toRefs(store);
const { fetchTransactions }     = store;

/** Mi propia billetera: todas mis transacciones recibidas */
const myWalletId = computed(() => store.getWalletByUserId(authStore.user?.id)?.id);

const displayedTransactions = computed(() =>
    transactions.value.filter(tx => tx.walletId === myWalletId.value)
);

onMounted(() => {
  if (!store.transactionsLoaded) {
    fetchTransactions();
    transactionsLoaded.value = store.transactionsLoaded;
  }
  if (!store.walletsLoaded) store.fetchWallets();
});

const navigateBack = () => {
  if (myWalletId.value) router.push({ name: 'payment-wallets-view', params: { id: myWalletId.value } });
  else router.push({ name: 'payment-wallets' });
};
</script>

<template>
  <div class="p-4 transactions-container">


    <div class="header-actions flex justify-content-between align-items-center mb-4">
      <div class="flex align-items-center gap-3">
        <pv-button icon="pi pi-arrow-left" text class="action-btn-view" @click="navigateBack"/>
        <h1 class="page-title m-0">{{ t('transactions.title') }}</h1>
      </div>
    </div>


    <div class="table-card">
      <pv-data-table
          :loading="!transactionsLoaded"
          :rows="10"
          :rows-per-page-options="[5, 10, 25]"
          :value="displayedTransactions"
          paginator
          class="clean-table"
          table-style="min-width: 55rem">

        <pv-column :header="t('transactions.id')" field="id" sortable>
          <template #body="slotProps">
            <span class="text-id">#{{ slotProps.data.id }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('transactions.type')" field="type" sortable>
          <template #body="slotProps">
            <span class="text-neutral" style="text-transform: capitalize;">{{ slotProps.data.type }}</span>
          </template>
        </pv-column>


        <pv-column :header="t('transactions.original-amount')" field="amountSent" sortable>
          <template #body="slotProps">
            <span class="text-amount">USD {{ Number(slotProps.data.amountSent).toFixed(2) }}</span>
          </template>
        </pv-column>


        <pv-column :header="t('transactions.commission-fee')">
          <template #body="slotProps">
            <span class="text-commission">
              - USD {{ Number(slotProps.data.platformFee).toFixed(2) }}
              <span class="commission-rate-tag">5%</span>
            </span>
          </template>
        </pv-column>


        <pv-column :header="t('transactions.net-amount')">
          <template #body="slotProps">
            <span class="text-net">USD {{ Number(slotProps.data.amountReceived).toFixed(2) }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('transactions.createdAt')" field="createdAt" sortable>
          <template #body="slotProps">
            <span class="text-date"><i class="pi pi-clock icon-clock"/>{{ slotProps.data.createdAt }}</span>
          </template>
        </pv-column>

      </pv-data-table>
    </div>


    <div v-if="errors.length" class="text-red-500 mt-3 error-msg">
      <i class="pi pi-exclamation-circle mr-2"></i>
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>
  </div>
</template>

<style scoped>

.transactions-container {
  width: 100%;
  padding: 0 2rem;
}


.page-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 2rem;
}

.table-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  padding: 1rem;
  border: 1px solid #f0f2f5;
}


:deep(.clean-table .p-datatable-thead > tr > th) {
  background-color: #ffffff !important;
  color: #8c98a4 !important;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #f0f2f5 !important;
  padding: 1.2rem 1rem;
}

:deep(.clean-table .p-datatable-tbody > tr > td) {
  background-color: #ffffff !important;
  color: #1a2a40 !important;
  padding: 1.1rem 1rem;
  border-bottom: 1px solid #f0f2f5 !important;
}

:deep(.clean-table .p-datatable-tbody > tr:hover > td) {
  background-color: #f8fafc !important;
}


.text-id      { color: #a0aec0; font-weight: 700; }
.text-neutral { color: #4a5568; }
.text-amount  { color: #1a2a40; font-weight: 700; }

.text-commission {
  color: #dc2626;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.text-net  { color: #16a34a; font-weight: 800; }
.text-date { color: #718096; display: flex; align-items: center; white-space: nowrap; }

.icon-clock { margin-right: 0.4rem; color: #a0aec0; }

.commission-rate-tag {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
}


.action-btn-view   { color: #1a2a40 !important; }

.error-msg {
  font-weight: bold;
  background-color: #fee2e2;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
}
</style>