<script setup>
import {useI18n}             from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import usePaymentStore       from "@/payment/application/payment.store.js";
import useDiscoveryStore     from "@/discovery/application/discovery.store.js";
import {computed, onMounted, ref} from "vue";
import useAuthStore          from "@/iam/application/auth.store.js";

const {t}    = useI18n();
const router = useRouter();
const route  = useRoute();
const store  = usePaymentStore();
const discoveryStore = useDiscoveryStore();
const authStore = useAuthStore();

const CURRENT_USER_ID = computed(() => authStore.user?.id);

/** Pasos: 'form' → 'gateway' → 'success' | 'error' */
const step = ref('form');

const tutorId      = computed(() => route.query.tutorId ? Number(route.query.tutorId) : null);
const amount       = ref(null);
const description  = ref('');

const checkingWallet  = ref(true);
const tutorHasWallet  = ref(true);
const senderHasWallet = ref(true);

const tutor = computed(() =>
    tutorId.value ? discoveryStore.tutors.find(t => t.userId === tutorId.value) : null
);
const tutorName = computed(() => tutor.value?.name ?? `Usuario #${tutorId.value}`);

// Simulación de tarjeta
const cardNumber = ref('');
const cardExpiry = ref('');
const cardCvv    = ref('');
const processing = ref(false);

const donationResult = ref(null); // respuesta real del backend
const donationError  = ref('');

onMounted(async () => {
  if (!discoveryStore.tutorsLoaded) await discoveryStore.fetchTutors();

  const checks = [store.checkWalletExists(CURRENT_USER_ID.value)];
  if (tutorId.value) checks.push(store.checkWalletExists(tutorId.value));
  else checks.push(Promise.resolve(true));

  const [senderOk, tutorOk] = await Promise.all(checks);
  senderHasWallet.value = senderOk;
  tutorHasWallet.value  = tutorOk;
  checkingWallet.value  = false;
});

const platformFeePreview = computed(() => amount.value ? +(amount.value * 0.05).toFixed(2) : 0);
const tutorReceivesPreview = computed(() => amount.value ? +(amount.value - platformFeePreview.value).toFixed(2) : 0);

const canContinue = computed(() => amount.value > 0 && tutorHasWallet.value && senderHasWallet.value);

const goToGateway = () => {
  if (!canContinue.value) return;
  step.value = 'gateway';
};

const formatCardNumber = () => {
  let digits = cardNumber.value.replace(/\D/g, '').slice(0, 16);
  cardNumber.value = digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiry = () => {
  let digits = cardExpiry.value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) digits = digits.slice(0, 2) + '/' + digits.slice(2);
  cardExpiry.value = digits;
};

const cardValid = computed(() =>
    cardNumber.value.replace(/\s/g, '').length === 16 &&
    cardExpiry.value.length === 5 &&
    cardCvv.value.length === 3
);

const confirmPayment = async () => {
  if (!cardValid.value) return;
  processing.value = true;

  // Simulación visual de pasarela (no afecta el resultado real)
  await new Promise(resolve => setTimeout(resolve, 1800));

  const result = await store.donate({
    fromUserId:  CURRENT_USER_ID.value,
    toUserId:    tutorId.value,
    amount:      amount.value,
    description: description.value || `Donación para ${tutorName.value}`,
  });

  processing.value = false;

  if (result.ok) {
    donationResult.value = result.data;
    step.value = 'success';
  } else {
    donationError.value =
        result.errorType === 'not-found' ? t('transaction.error-not-found') :
            result.errorType === 'invalid'   ? t('transaction.error-invalid')   :
                t('transaction.error-unknown');
    step.value = 'error';
  }
};

const navigateBack = () => router.back();
const navigateToWorkspace = () => router.push({ name: 'workspace-sessions' });
</script>

<template>
  <div class="p-4 transaction-container">

    <!-- Header -->
    <div class="header-actions flex align-items-center gap-3 mb-4">
      <pv-button icon="pi pi-arrow-left" text class="action-btn-view" @click="navigateBack"/>
      <h1 class="page-title m-0">{{ t('transaction.new-title') }}</h1>
    </div>

    <!-- ── PASO 1: Formulario de monto ── -->
    <div v-if="step === 'form'" class="table-card form-wrapper">

      <div v-if="checkingWallet" class="loading-wallet">
        <i class="pi pi-spin pi-spinner" style="font-size:1.5rem; color:#1e4d8c;"></i>
        <p>{{ t('transaction.checking-wallet') }}</p>
      </div>

      <div v-else-if="!senderHasWallet" class="wallet-error">
        <i class="pi pi-exclamation-triangle wallet-error-icon"/>
        <p class="wallet-error-title">{{ t('transaction.no-sender-wallet-title') }}</p>
        <p class="wallet-error-sub">{{ t('transaction.no-sender-wallet-sub') }}</p>
        <pv-button :label="t('transaction.back-to-session')" class="btn-cancel mt-3" @click="navigateToWorkspace"/>
      </div>

      <div v-else-if="!tutorHasWallet" class="wallet-error">
        <i class="pi pi-exclamation-triangle wallet-error-icon"/>
        <p class="wallet-error-title">{{ t('transaction.no-wallet-title') }}</p>
        <p class="wallet-error-sub">{{ t('transaction.no-wallet-sub', { name: tutorName }) }}</p>
        <pv-button :label="t('transaction.back-to-session')" class="btn-cancel mt-3" @click="navigateToWorkspace"/>
      </div>

      <form v-else @submit.prevent="goToGateway" class="p-fluid">

        <div class="recipient-card">
          <div class="recipient-avatar"><i class="pi pi-user"/></div>
          <div>
            <p class="recipient-label">{{ t('transaction.donating-to') }}</p>
            <p class="recipient-name">{{ tutorName }}</p>
          </div>
        </div>

        <div class="field mb-4 mt-4">
          <label class="custom-label">{{ t('transaction.amount-label') }}</label>
          <pv-input-number
              v-model="amount"
              class="w-full amount-input"
              :min="1"
              :min-fraction-digits="2"
              :max-fraction-digits="2"
              mode="currency"
              currency="USD"
              locale="en-US"
              placeholder="$0.00"
              required/>
        </div>

        <div class="field mb-4">
          <label class="custom-label">{{ t('transaction.message-label') }} <span class="optional-tag">({{ t('session.optional') }})</span></label>
          <pv-textarea v-model="description" rows="2" class="w-full" :placeholder="t('transaction.message-ph')"/>
        </div>

        <div v-if="amount > 0" class="commission-breakdown">
          <div class="breakdown-rows">
            <div class="breakdown-row">
              <span class="breakdown-label">{{ t('transaction.learner-pays') }}</span>
              <span class="breakdown-original">USD {{ Number(amount).toFixed(2) }}</span>
            </div>
            <div class="breakdown-row">
              <span class="breakdown-label commission-label">
                {{ t('transaction.skillswap-commission') }}
                <span class="rate-tag">5%</span>
              </span>
              <span class="breakdown-commission">- USD {{ platformFeePreview.toFixed(2) }}</span>
            </div>
            <div class="breakdown-divider"/>
            <div class="breakdown-row">
              <span class="breakdown-label net-label">{{ t('transaction.tutor-receives') }}</span>
              <span class="breakdown-net">USD {{ tutorReceivesPreview.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-content-end gap-3 mt-4 pt-4 border-top-1 border-300">
          <pv-button :label="t('transaction.cancel')" text class="btn-cancel" @click="navigateBack"/>
          <pv-button :label="t('transaction.continue-to-pay')" type="submit" class="btn-save" :disabled="!canContinue"/>
        </div>

      </form>
    </div>

    <!-- ── PASO 2: Pasarela simulada ── -->
    <div v-else-if="step === 'gateway'" class="table-card gateway-card">

      <div v-if="!processing" class="gateway-form">
        <div class="gateway-header">
          <i class="pi pi-shield gateway-shield"/>
          <p class="gateway-title">{{ t('transaction.gateway-title') }}</p>
          <p class="gateway-sub">{{ t('transaction.gateway-sub') }}</p>
        </div>

        <div class="gateway-amount">USD {{ Number(amount).toFixed(2) }}</div>

        <div class="field mb-3">
          <label class="custom-label">{{ t('transaction.card-number') }}</label>
          <pv-input-text v-model="cardNumber" maxlength="19" placeholder="4242 4242 4242 4242" class="w-full" @input="formatCardNumber"/>
        </div>

        <div class="grid">
          <div class="col-6 field mb-3">
            <label class="custom-label">{{ t('transaction.card-expiry') }}</label>
            <pv-input-text v-model="cardExpiry" maxlength="5" placeholder="MM/YY" class="w-full" @input="formatExpiry"/>
          </div>
          <div class="col-6 field mb-3">
            <label class="custom-label">CVV</label>
            <pv-input-text v-model="cardCvv" maxlength="3" placeholder="123" class="w-full"/>
          </div>
        </div>

        <pv-button
            :label="t('transaction.pay-now', { amount: Number(amount).toFixed(2) })"
            class="btn-save w-full mt-3"
            icon="pi pi-lock"
            :disabled="!cardValid"
            @click="confirmPayment"/>
        <pv-button :label="t('transaction.cancel')" text class="btn-cancel w-full mt-2" @click="step = 'form'"/>
      </div>

      <div v-else class="gateway-processing">
        <i class="pi pi-spin pi-spinner processing-icon"/>
        <p class="processing-text">{{ t('transaction.processing') }}</p>
      </div>

    </div>

    <!-- ── PASO 3a: Éxito ── -->
    <div v-else-if="step === 'success'" class="table-card result-card">
      <i class="pi pi-check-circle result-icon result-success"/>
      <h2 class="result-title">{{ t('transaction.success-title') }}</h2>
      <p class="result-sub">{{ t('transaction.success-sub', { name: tutorName }) }}</p>

      <div class="result-breakdown">
        <div class="breakdown-row">
          <span class="breakdown-label">{{ t('transaction.learner-pays') }}</span>
          <span class="breakdown-original">USD {{ donationResult.amountSent.toFixed(2) }}</span>
        </div>
        <div class="breakdown-row">
          <span class="breakdown-label commission-label">{{ t('transaction.skillswap-commission') }}</span>
          <span class="breakdown-commission">- USD {{ donationResult.platformFee.toFixed(2) }}</span>
        </div>
        <div class="breakdown-divider"/>
        <div class="breakdown-row">
          <span class="breakdown-label net-label">{{ t('transaction.tutor-receives') }}</span>
          <span class="breakdown-net">USD {{ donationResult.amountReceived.toFixed(2) }}</span>
        </div>
      </div>

      <pv-button :label="t('transaction.back-to-session')" class="btn-save mt-4" @click="navigateToWorkspace"/>
    </div>

    <!-- ── PASO 3b: Error ── -->
    <div v-else-if="step === 'error'" class="table-card result-card">
      <i class="pi pi-times-circle result-icon result-error"/>
      <h2 class="result-title">{{ t('transaction.error-title') }}</h2>
      <p class="result-sub">{{ donationError }}</p>
      <pv-button :label="t('transaction.try-again')" class="btn-save mt-4" @click="step = 'form'"/>
    </div>

  </div>
</template>

<style scoped>
.transaction-container { width: 100%; padding: 0 2rem; max-width: 600px; margin: 0 auto; }
.page-title { color: #1a2a40; font-weight: 800; font-size: 2rem; }
.table-card { background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04); padding: 2.5rem; border: 1px solid #f0f2f5; }
.custom-label { display: block; font-weight: 700; color: #1a2a40; margin-bottom: 0.6rem; font-size: 0.95rem; }
.optional-tag { color: #a0aec0; font-weight: 500; font-size: 0.8rem; }

/* Loading / wallet error */
.loading-wallet { text-align: center; padding: 2rem; color: #718096; }
.wallet-error { text-align: center; padding: 1.5rem; }
.wallet-error-icon { font-size: 2.5rem; color: #f59e0b; display: block; margin-bottom: 0.75rem; }
.wallet-error-title { color: #1a2a40; font-weight: 800; font-size: 1.1rem; margin: 0 0 0.4rem; }
.wallet-error-sub { color: #718096; font-size: 0.9rem; margin: 0; }

/* Recipient card */
.recipient-card {
  display: flex; align-items: center; gap: 1rem;
  background: #f0f4ff; border-radius: 10px; padding: 1rem 1.25rem;
}
.recipient-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: #1e4d8c; color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; flex-shrink: 0;
}
.recipient-label { color: #718096; font-size: 0.8rem; margin: 0; }
.recipient-name { color: #1a2a40; font-weight: 800; font-size: 1.05rem; margin: 0; }

.amount-input :deep(input) { font-size: 1.4rem; font-weight: 700; text-align: center; }

/* Commission breakdown */
.commission-breakdown { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; }
.breakdown-rows { display: flex; flex-direction: column; gap: 0.6rem; }
.breakdown-row { display: flex; justify-content: space-between; align-items: center; }
.breakdown-label { color: #718096; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; }
.commission-label { color: #dc2626; }
.net-label { color: #16a34a; font-weight: 700; }
.rate-tag { background-color: #fee2e2; color: #dc2626; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
.breakdown-original { color: #1a2a40; font-weight: 700; font-size: 0.95rem; }
.breakdown-commission { color: #dc2626; font-weight: 700; font-size: 0.95rem; }
.breakdown-net { color: #16a34a; font-weight: 800; font-size: 1.1rem; }
.breakdown-divider { height: 1px; background-color: #cbd5e1; margin: 0.4rem 0; }

/* Gateway */
.gateway-header { text-align: center; margin-bottom: 1.5rem; }
.gateway-shield { font-size: 2rem; color: #1e4d8c; display: block; margin-bottom: 0.5rem; }
.gateway-title { color: #1a2a40; font-weight: 800; font-size: 1.2rem; margin: 0 0 0.2rem; }
.gateway-sub { color: #a0aec0; font-size: 0.85rem; margin: 0; }
.gateway-amount { text-align: center; font-size: 2rem; font-weight: 800; color: #1a2a40; margin-bottom: 1.5rem; }

.gateway-processing { text-align: center; padding: 3rem 1rem; }
.processing-icon { font-size: 2.5rem; color: #1e4d8c; display: block; margin-bottom: 1rem; }
.processing-text { color: #718096; font-weight: 600; }

/* Result */
.result-card { text-align: center; }
.result-icon { font-size: 3.5rem; display: block; margin-bottom: 1rem; }
.result-success { color: #16a34a; }
.result-error { color: #dc2626; }
.result-title { color: #1a2a40; font-weight: 800; font-size: 1.4rem; margin: 0 0 0.4rem; }
.result-sub { color: #718096; font-size: 0.95rem; margin: 0 0 1.5rem; }
.result-breakdown { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem 1.5rem; text-align: left; }

.action-btn-view { color: #1a2a40 !important; }
.btn-save { background-color: #e53e4f !important; border: none !important; font-weight: bold; border-radius: 8px; padding: 0.6rem 1.8rem; color: white !important; }
.btn-save:hover { background-color: #d03544 !important; }
.btn-save:disabled { opacity: 0.5; }
.btn-cancel { color: #4a5568 !important; font-weight: bold; border-radius: 8px; padding: 0.6rem 1.5rem; }
.btn-cancel:hover { background-color: #f8f9fa !important; }
</style>