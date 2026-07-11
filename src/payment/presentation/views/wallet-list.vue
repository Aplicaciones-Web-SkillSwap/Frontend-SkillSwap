<script setup>
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import usePaymentStore from "@/payment/application/payment.store.js";
import useAuthStore    from "@/iam/application/auth.store.js";
import {computed, watch} from "vue";
import {usePolling} from "@/shared/composables/use-polling.js";

const {t}    = useI18n();
const router = useRouter();
const store  = usePaymentStore();
const authStore = useAuthStore();

/** Cada cuenta tiene un único balance: el de su propia billetera de donaciones recibidas */
const myWallet = computed(() => store.getWalletByUserId(authStore.user?.id));

/**
 * Si todavía no tenía billetera (nunca recibió una donación), se sigue consultando
 * en segundo plano: en cuanto el backend la provisiona con la primera donación,
 * se redirige automáticamente sin que el usuario tenga que recargar la página.
 */
const WALLET_POLL_INTERVAL_MS = 6000;
usePolling(() => store.fetchWallets(), WALLET_POLL_INTERVAL_MS);

watch(myWallet, (wallet) => {
  if (wallet) router.replace({ name: 'payment-wallets-view', params: { id: wallet.id } });
}, { immediate: true });
</script>

<template>
  <div class="p-4 wallets-container">

    <div class="header-actions flex justify-content-between align-items-center mb-4">
      <h1 class="page-title m-0">{{ t('wallets.title') }}</h1>
    </div>

    <div v-if="!store.walletsLoaded" class="flex justify-content-center p-5">
      <i class="pi pi-spin pi-spinner text-4xl" style="color: #1a2a40;"></i>
    </div>

    <div v-else-if="!myWallet" class="table-card empty-state">
      <i class="pi pi-wallet empty-icon"/>
      <h2 class="balance-value">USD 0.00</h2>
      <p class="empty-title">{{ t('wallets.no-balance-title') }}</p>
      <p class="empty-sub">{{ t('wallets.no-balance-sub') }}</p>
    </div>

  </div>
</template>

<style scoped>
.wallets-container { width: 100%; padding: 0 2rem; }
.page-title { color: #1a2a40; font-weight: 800; font-size: 2rem; }

.table-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f2f5;
}

.empty-state { text-align: center; padding: 3rem 2rem; }
.empty-icon  { font-size: 3rem; color: #a0aec0; display: block; margin-bottom: 1rem; }
.balance-value { color: #1a2a40; font-weight: 800; font-size: 2rem; margin: 0 0 0.75rem; }
.empty-title { color: #4a5568; font-weight: 700; font-size: 1rem; margin: 0 0 0.5rem; }
.empty-sub   { color: #a0aec0; font-size: 0.85rem; margin: 0; }
</style>
