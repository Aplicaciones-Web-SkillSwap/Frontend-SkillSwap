<script setup>
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue";
import usePaymentStore from "@/payment/application/payment.store.js";
import {onMounted, toRefs} from "vue";

const {t}     = useI18n();
const router  = useRouter();
const confirm = useConfirm();
const store   = usePaymentStore();
const { wallets, errors, walletsLoaded } = toRefs(store);
const { fetchWallets, deleteWallet }     = store;

onMounted(() => {
  if (!store.walletsLoaded) {
    fetchWallets();
    console.log('fetching wallets:', wallets);
    walletsLoaded.value = store.walletsLoaded;
  }
});

const navigateToView = (id) => {
  router.push({ name: 'payment-wallets-view', params: { id } });
};

const confirmDelete = (wallet) => {
  confirm.require({
    message: t('wallets.confirm-delete', { userId: wallet.userId }),
    header:  t('wallets.delete-header'),
    icon:    'pi pi-exclamation-triangle',
    accept:  () => { deleteWallet(wallet); },
  });
};
</script>

<template>
  <div class="p-4 wallets-container">

    <div class="header-actions flex justify-content-between align-items-center mb-4">
      <h1 class="page-title m-0">{{ t('wallets.title') }}</h1>
    </div>

    <!-- Indicador de carga -->
    <div v-if="!walletsLoaded" class="flex justify-content-center p-5">
      <i class="pi pi-spin pi-spinner text-4xl" style="color: #1a2a40;"></i>
    </div>

    <!-- Grid de Tarjetas (Cards) -->
    <div v-else class="grid">
      <div
          v-for="wallet in wallets"
          :key="wallet.id"
          class="col-12 md:col-6 lg:col-4 xl:col-3 p-2">

        <div class="wallet-card">
          <!-- Encabezado de la tarjeta -->
          <div class="flex justify-content-between align-items-start mb-3">
            <div>
              <span class="text-id block mb-1">#{{ wallet.id }}</span>
              <span class="text-neutral text-sm">
                <i class="pi pi-user mr-1"></i>
                {{ t('wallets.userId') }}: <strong>{{ wallet.userId }}</strong>
              </span>
            </div>
            <span class="currency-badge">{{ wallet.currency }}</span>
          </div>

          <!-- Cuerpo de la tarjeta (Balance) -->
          <div class="card-body py-3">
            <p class="text-neutral text-sm m-0 mb-1">{{ t('wallets.balance') }}</p>
            <div class="flex align-items-center">
              <h2 class="text-balance m-0 text-3xl">
                {{ wallet.currency }} {{ Number(wallet.balance).toFixed(2) }}
              </h2>
            </div>
          </div>

          <!-- Pie de la tarjeta (Acciones) -->
          <div class="card-footer mt-3 pt-3 flex justify-content-end gap-2">
            <pv-button
                icon="pi pi-eye"
                rounded
                text
                class="action-btn-view"
                :title="t('wallets.action-view')"
                @click="navigateToView(wallet.id)"
            />
            <pv-button
                icon="pi pi-trash"
                rounded
                text
                class="action-btn-delete"
                :title="t('wallets.action-delete')"
                @click="confirmDelete(wallet)"
            />
          </div>
        </div>

      </div>
    </div>

    <!-- Estado vacío si no hay data -->
    <div v-if="walletsLoaded && wallets.length === 0" class="text-center p-5 table-card mt-3">
      <i class="pi pi-wallet text-5xl mb-3" style="color: #a0aec0;"></i>
      <h3 class="text-neutral m-0">No hay billeteras registradas</h3>
    </div>

    <div v-if="errors.length" class="text-red-500 mt-3 error-msg">
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

    <pv-confirm-dialog/>
  </div>
</template>

<style scoped>
.wallets-container {
  width: 100%;
  padding: 0 2rem;
}

.page-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 2rem;
}

/* --- ESTILO DE LA TARJETA PRINCIPAL --- */
.wallet-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 1.5rem;
  border: 1px solid #f0f2f5;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.wallet-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.card-footer {
  border-top: 1px solid #f0f2f5;
  margin-top: auto; /* Empuja las acciones hacia abajo para tarjetas simétricas */
}

/* Tarjeta genérica (usada para el empty state) */
.table-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f2f5;
}

/* --- ESTILOS DE TEXTO INTERNO --- */
.text-id {
  color: #a0aec0;
  font-weight: 700;
  font-size: 0.9rem;
}

.text-neutral {
  color: #64748b;
  font-weight: 500;
}

.text-balance {
  color: #1a2a40;
  font-weight: 800;
}

/* --- PÍLDORAS DE ESTADO --- */
.currency-badge {
  background-color: #e0f2fe;
  color: #0284c7;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.8rem;
  display: inline-block;
}

/* --- BOTONES DE ACCIÓN --- */
.action-btn-view {
  color: #1a2a40 !important;
  background-color: #f8fafc !important;
}

.action-btn-view:hover {
  background-color: #e2e8f0 !important;
}

.action-btn-delete {
  color: #e53e4f !important;
  background-color: #fef2f2 !important;
}

.action-btn-delete:hover {
  background-color: #fee2e2 !important;
}

.error-msg { font-weight: bold; }
</style>