<script setup>
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useConfirm} from "primevue";
import usePaymentStore from "@/payment/application/payment.store.js";
import {computed, onMounted, toRefs} from "vue";

const {t}     = useI18n();
const route   = useRoute();
const router  = useRouter();
const confirm = useConfirm();
const store   = usePaymentStore();
const { transactions, errors, transactionsLoaded } = toRefs(store);
const { fetchTransactions, deleteTransaction }     = store;

const filterWalletId = computed(() => route.query.walletId || null);

const displayedTransactions = computed(() => {
  if (!filterWalletId.value) return transactions.value;
  return store.getTransactionsByWalletId(filterWalletId.value);
});

const pageTitle = computed(() =>
    filterWalletId.value
        ? t('transactions.title-filtered', { walletId: filterWalletId.value })
        : t('transactions.title')
);

onMounted(() => {
  if (!store.transactionsLoaded) {
    fetchTransactions();
    transactionsLoaded.value = store.transactionsLoaded;
  }
  if (filterWalletId.value && !store.walletsLoaded) store.fetchWallets();
});

const navigateToNew = () => {
  router.push({ name: 'payment-transactions-new', query: filterWalletId.value ? { walletId: filterWalletId.value } : {} });
};

const navigateToEdit = (id) => {
  router.push({ name: 'payment-transactions-edit', params: { id } });
};

const navigateBack = () => {
  if (filterWalletId.value) router.push({ name: 'payment-wallets-view', params: { id: filterWalletId.value } });
  else router.push({ name: 'payment-wallets' });
};

const confirmDelete = (transaction) => {
  confirm.require({
    message: t('transactions.confirm-delete', { id: transaction.id }),
    header:  t('transactions.delete-header'),
    icon:    'pi pi-exclamation-triangle',
    accept:  () => { deleteTransaction(transaction); },
  });
};

const statusClass = (status) => {
  const map = { pending: 'status-pending', completed: 'status-completed', failed: 'status-failed', cancelled: 'status-cancelled' };
  return 'status-badge ' + (map[status] || '');
};
</script>

<template>
  <div class="p-4 transactions-container">


    <div class="header-actions flex justify-content-between align-items-center mb-4">
      <div class="flex align-items-center gap-3">
        <pv-button icon="pi pi-arrow-left" text class="action-btn-view" @click="navigateBack"/>
        <div>
          <h1 class="page-title m-0">{{ pageTitle }}</h1>
          <p v-if="filterWalletId" class="m-0 subtitle">
            {{ t('transactions.filter-label') }}
            <span class="wallet-chip">#{{ filterWalletId }}</span>
          </p>
        </div>
      </div>
      <pv-button :label="t('transactions.new')" icon="pi pi-plus" class="btn-new" @click="navigateToNew"/>
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

        <pv-column v-if="!filterWalletId" :header="t('transactions.walletId')" field="walletId" sortable>
          <template #body="slotProps">
            <span class="text-neutral">{{ slotProps.data.walletId }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('transactions.type')" field="type" sortable>
          <template #body="slotProps">
            <span class="text-neutral" style="text-transform: capitalize;">{{ slotProps.data.type }}</span>
          </template>
        </pv-column>


        <pv-column :header="t('transactions.original-amount')" field="originalAmount" sortable>
          <template #body="slotProps">
            <span class="text-amount">USD {{ Number(slotProps.data.originalAmount).toFixed(2) }}</span>
          </template>
        </pv-column>


        <pv-column :header="t('transactions.commission-fee')">
          <template #body="slotProps">
            <span class="text-commission">
              - USD {{ Number(slotProps.data.commissionFee).toFixed(2) }}
              <span class="commission-rate-tag">5%</span>
            </span>
          </template>
        </pv-column>


        <pv-column :header="t('transactions.net-amount')">
          <template #body="slotProps">
            <span class="text-net">USD {{ Number(slotProps.data.netAmount).toFixed(2) }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('transactions.status')" field="status" sortable>
          <template #body="slotProps">
            <span :class="statusClass(slotProps.data.status)">{{ slotProps.data.status }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('transactions.createdAt')" field="createdAt" sortable>
          <template #body="slotProps">
            <span class="text-date"><i class="pi pi-clock icon-clock"/>{{ slotProps.data.createdAt }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('transactions.actions')">
          <template #body="slotProps">
            <div class="actions-cell">
              <pv-button icon="pi pi-pencil" rounded text class="action-btn-edit"   @click="navigateToEdit(slotProps.data.id)"/>
              <pv-button icon="pi pi-trash"  rounded text class="action-btn-delete" @click="confirmDelete(slotProps.data)"/>
            </div>
          </template>
        </pv-column>

      </pv-data-table>
    </div>


    <div v-if="errors.length" class="text-red-500 mt-3 error-msg">
      <i class="pi pi-exclamation-circle mr-2"></i>
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

    <pv-confirm-dialog/>
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

.subtitle {
  color: #718096;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.2rem;
}

.wallet-chip {
  background-color: #e0f2fe;
  color: #0284c7;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.8rem;
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


.status-badge {
  padding: 0.35rem 0.9rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: capitalize;
}

.status-completed { background-color: #dcfce7; color: #16a34a; }
.status-pending   { background-color: #fef3c7; color: #d97706; }
.status-failed,
.status-cancelled { background-color: #fee2e2; color: #dc2626; }


.btn-new {
  background-color: #e53e4f !important;
  border: none !important;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
}

.btn-new:hover {
  background-color: #d03544 !important;
}

.action-btn-view   { color: #1a2a40 !important; }
.action-btn-edit   { color: #a0aec0 !important; }
.action-btn-delete { color: #e53e4f !important; }

.actions-cell {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.error-msg {
  font-weight: bold;
  background-color: #fee2e2;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
}
</style>