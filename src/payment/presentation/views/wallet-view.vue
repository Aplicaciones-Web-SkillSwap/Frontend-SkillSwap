<script setup>
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import usePaymentStore from "@/payment/application/payment.store.js";
import {computed, onMounted} from "vue";

const {t}    = useI18n();
const route  = useRoute();
const router = useRouter();
const store  = usePaymentStore();
const { fetchWallets, fetchTransactions } = store;

const wallet = computed(() => store.getWalletById(route.params.id));

const walletTransactions = computed(() => store.getTransactionsByWalletId(route.params.id));

const recentTransactions = computed(() => walletTransactions.value.slice(0, 3));

const totalTransactions = computed(() => walletTransactions.value.length);

// Saldo real de la wallet (campo balance del db.json)
const netBalance = computed(() => {
  return Number(wallet.value?.balance || 0).toFixed(2);
});

// Total de comisiones retenidas
const totalCommission = computed(() => {
  return walletTransactions.value
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.commissionFee || 0), 0)
      .toFixed(2);
});

onMounted(() => {
  if (!store.walletsLoaded)      fetchWallets();
  if (!store.transactionsLoaded) fetchTransactions();
});

const navigateToTransactions = () => {
  router.push({ name: 'payment-transactions', query: { walletId: route.params.id } });
};

const navigateToNewTransaction = () => {
  router.push({ name: 'payment-transactions-new', query: { walletId: route.params.id } });
};

const navigateBack = () => {
  router.push({ name: 'payment-wallets' });
};

const statusClass = (status) => {
  const map = { pending: 'status-pending', completed: 'status-completed', failed: 'status-failed', cancelled: 'status-cancelled' };
  return 'status-badge ' + (map[status] || '');
};
</script>

<template>
  <div class="p-4 wallet-view-container">

    <!-- Header -->
    <div class="flex align-items-center gap-3 mb-4">
      <pv-button icon="pi pi-arrow-left" text class="btn-back" @click="navigateBack"/>
      <div>
        <h1 class="page-title m-0">{{ t('wallet.title') }}</h1>
        <p v-if="wallet" class="m-0 subtitle">
          {{ t('wallet.userId') }}: <strong>#{{ wallet.userId }}</strong>
        </p>
      </div>
    </div>

    <div v-if="wallet">

      <!-- Métricas de balance -->
      <div class="metrics-grid mb-4">

        <!-- Saldo neto disponible -->
        <div class="metric-card balance-card">
          <div class="metric-icon-wrap">
            <i class="pi pi-wallet metric-icon"/>
          </div>
          <div>
            <p class="metric-label">{{ t('wallet.net-balance') }}</p>
            <h2 class="metric-value">{{ wallet.currency }} {{ netBalance }}</h2>
            <p class="metric-sub">{{ t('wallet.after-commission') }}</p>
          </div>
        </div>

        <!-- Comisión retenida por SkillSwap -->
        <div class="metric-card commission-card">
          <div class="metric-icon-wrap com-icon-wrap">
            <i class="pi pi-percentage metric-icon com-icon"/>
          </div>
          <div>
            <p class="metric-label">{{ t('wallet.skillswap-commission') }}</p>
            <h2 class="metric-value">{{ wallet.currency }} {{ totalCommission }}</h2>
            <p class="metric-sub">{{ t('wallet.commission-rate') }}</p>
          </div>
        </div>

        <!-- Número de transacciones -->
        <div class="metric-card transactions-card">
          <div class="metric-icon-wrap tx-icon-wrap">
            <i class="pi pi-arrows-h metric-icon tx-icon"/>
          </div>
          <div>
            <p class="metric-label">{{ t('wallet.total-transactions') }}</p>
            <h2 class="metric-value">{{ totalTransactions }}</h2>
            <p class="metric-sub">{{ t('wallet.donations-received') }}</p>
          </div>
        </div>

      </div>

      <!-- CTA → Ver transacciones -->
      <div class="transactions-cta mb-4">
        <div class="cta-info">
          <i class="pi pi-list cta-icon"/>
          <div>
            <p class="cta-title">{{ t('wallet.transactions-cta-title') }}</p>
            <p class="cta-sub">{{ t('wallet.transactions-cta-sub', { count: totalTransactions }) }}</p>
          </div>
        </div>
        <div class="cta-buttons">
          <pv-button
              :label="t('wallet.btn-new-transaction')"
              icon="pi pi-plus"
              class="btn-new-tx"
              @click="navigateToNewTransaction"/>
          <pv-button
              :label="t('wallet.btn-view-transactions')"
              icon="pi pi-arrow-right"
              icon-pos="right"
              class="btn-view-tx"
              @click="navigateToTransactions"/>
        </div>
      </div>

      <!-- Preview últimas donaciones con desglose de comisión (US19) -->
      <div class="recent-section">
        <p class="recent-label">{{ t('wallet.recent-transactions') }}</p>

        <!-- Estado vacío (US19 Scenario 2) -->
        <div v-if="walletTransactions.length === 0" class="empty-state">
          <i class="pi pi-inbox empty-icon"/>
          <p class="empty-title">{{ t('wallet.no-donations-title') }}</p>
          <p class="empty-sub">{{ t('wallet.no-donations-sub') }}</p>
        </div>

        <!-- Tabla con desglose (US19 Scenario 1) -->
        <div v-else class="table-card">
          <pv-data-table
              :value="recentTransactions"
              class="clean-table"
              table-style="min-width: 35rem">

            <pv-column :header="t('transactions.id')" field="id" sortable>
              <template #body="slotProps">
                <span class="text-id">#{{ slotProps.data.id }}</span>
              </template>
            </pv-column>

            <!-- Monto original (lo que donó el aprendiz) -->
            <pv-column :header="t('transactions.original-amount')" field="originalAmount" sortable>
              <template #body="slotProps">
                <span class="text-balance">
                  {{ wallet.currency }} {{ Number(slotProps.data.originalAmount).toFixed(2) }}
                </span>
              </template>
            </pv-column>

            <!-- -5% comisión SkillSwap -->
            <pv-column :header="t('transactions.commission-fee')">
              <template #body="slotProps">
                <span class="text-commission">
                  - {{ wallet.currency }} {{ Number(slotProps.data.commissionFee).toFixed(2) }}
                  <span class="commission-rate-tag">5%</span>
                </span>
              </template>
            </pv-column>

            <!-- Monto neto que recibe el tutor -->
            <pv-column :header="t('transactions.net-amount')">
              <template #body="slotProps">
                <span class="text-net">
                  {{ wallet.currency }} {{ Number(slotProps.data.netAmount).toFixed(2) }}
                </span>
              </template>
            </pv-column>

            <!-- Estado -->
            <pv-column :header="t('transactions.status')" field="status">
              <template #body="slotProps">
                <span :class="statusClass(slotProps.data.status)">{{ slotProps.data.status }}</span>
              </template>
            </pv-column>

          </pv-data-table>

          <div class="see-all-row">
            <pv-button
                :label="t('wallet.see-all-transactions')"
                link
                icon="pi pi-external-link"
                icon-pos="right"
                @click="navigateToTransactions"/>
          </div>
        </div>
      </div>

    </div>

    <pv-toast/>
  </div>
</template>

<style scoped>
.wallet-view-container { width: 100%; padding: 0 2rem; }
.page-title { color: #1a2a40; font-weight: 800; font-size: 2rem; }
.subtitle { color: #718096; font-size: 0.9rem; }
.btn-back { color: #1a2a40 !important; }

/* Métricas */
.metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.metric-card { background: #ffffff; border-radius: 12px; padding: 1.5rem; border: 1px solid #f0f2f5; box-shadow: 0 2px 10px rgba(0,0,0,0.04); display: flex; align-items: flex-start; gap: 1.2rem; }
.metric-icon-wrap { width: 52px; height: 52px; border-radius: 12px; background-color: #e0f2fe; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tx-icon-wrap  { background-color: #dcfce7; }
.com-icon-wrap { background-color: #fef3c7; }
.metric-icon   { font-size: 1.5rem; color: #0284c7; }
.tx-icon       { color: #16a34a; }
.com-icon      { color: #d97706; }
.metric-label  { color: #8c98a4; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 0.25rem 0; font-weight: 700; }
.metric-value  { color: #1a2a40; font-weight: 800; font-size: 1.4rem; margin: 0 0 0.2rem 0; }
.metric-sub    { color: #a0aec0; font-size: 0.75rem; margin: 0; }

/* CTA */
.transactions-cta { background: linear-gradient(135deg, #1a2a40 0%, #2d4a6e 100%); border-radius: 12px; padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.cta-info { display: flex; align-items: center; gap: 1rem; }
.cta-icon { font-size: 1.8rem; color: #ffffff; opacity: 0.8; }
.cta-title { color: #ffffff; font-weight: 700; font-size: 1rem; margin: 0 0 0.2rem 0; }
.cta-sub   { color: #a0aec0; font-size: 0.85rem; margin: 0; }
.cta-buttons { display: flex; gap: 0.75rem; flex-shrink: 0; }
.btn-new-tx { background-color: rgba(255,255,255,0.15) !important; border: 1px solid rgba(255,255,255,0.3) !important; color: #ffffff !important; font-weight: 600; border-radius: 8px; }
.btn-new-tx:hover { background-color: rgba(255,255,255,0.25) !important; }
.btn-view-tx { background-color: #e53e4f !important; border: none !important; color: #ffffff !important; font-weight: 700; border-radius: 8px; padding: 0.6rem 1.4rem; }
.btn-view-tx:hover { background-color: #d03544 !important; }

/* Recent section */
.recent-section { margin-top: 0.5rem; }
.recent-label { color: #8c98a4; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem; font-weight: 700; }

/* Empty state (US19 Scenario 2) */
.empty-state { background: #ffffff; border-radius: 12px; border: 1px dashed #e2e8f0; padding: 3rem 2rem; text-align: center; }
.empty-icon  { font-size: 3rem; color: #cbd5e0; display: block; margin-bottom: 1rem; }
.empty-title { color: #4a5568; font-weight: 700; font-size: 1rem; margin: 0 0 0.5rem 0; }
.empty-sub   { color: #a0aec0; font-size: 0.85rem; margin: 0; }

/* Table */
.table-card { background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); padding: 1rem; border: 1px solid #f0f2f5; }
:deep(.clean-table .p-datatable-thead > tr > th) { background-color: #ffffff; color: #8c98a4; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f0f2f5; padding: 1rem; }
:deep(.clean-table .p-datatable-tbody > tr > td) { padding: 1rem; border-bottom: 1px solid #f0f2f5; }
:deep(.clean-table .p-datatable-tbody > tr:hover) { background-color: #fcfcfc; }

/* Textos de montos */
.text-id         { color: #a0aec0; font-weight: 700; }
.text-balance    { color: #1a2a40; font-weight: 700; }
.text-commission { color: #dc2626; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; }
.text-net        { color: #16a34a; font-weight: 800; }

.commission-rate-tag { background-color: #fee2e2; color: #dc2626; padding: 0.1rem 0.4rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; }

/* Status */
.status-badge     { padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 700; font-size: 0.75rem; text-transform: capitalize; }
.status-completed { background-color: #dcfce7; color: #16a34a; }
.status-pending   { background-color: #fef3c7; color: #d97706; }
.status-failed, .status-cancelled { background-color: #fee2e2; color: #dc2626; }

.see-all-row { display: flex; justify-content: flex-end; margin-top: 0.5rem; }
</style>