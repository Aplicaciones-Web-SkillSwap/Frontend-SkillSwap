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

/** Pasos: 'form' → 'method-select' → 'method-form' → 'checkout' → 'success' | 'error' */
const step = ref('form');

const tutorId      = computed(() => route.query.tutorId ? Number(route.query.tutorId) : null);
const amount       = ref(null);
const description  = ref('');

const tutor = computed(() =>
    tutorId.value ? discoveryStore.tutors.find(t => t.userId === tutorId.value) : null
);
const tutorName = computed(() => tutor.value?.name ?? `Usuario #${tutorId.value}`);

const processing = ref(false);

const donationResult = ref(null); // respuesta real del backend
const donationError  = ref('');

onMounted(async () => {
  if (!discoveryStore.tutorsLoaded) await discoveryStore.fetchTutors();
  if (!store.paymentMethodLoaded) await store.fetchMyPaymentMethod();
});

const platformFeePreview = computed(() => amount.value ? +(amount.value * 0.05).toFixed(2) : 0);
const tutorReceivesPreview = computed(() => amount.value ? +(amount.value - platformFeePreview.value).toFixed(2) : 0);

const canContinue = computed(() => amount.value > 0);

const hasSavedMethod = computed(() => !!store.paymentMethod);

/** Método activo para esta donación: el guardado, o el recién ingresado (aunque no se guarde). */
const activeMethod = ref(null); // { type, displayLabel }

const goToPaymentStep = () => {
  if (!canContinue.value) return;
  if (hasSavedMethod.value) {
    activeMethod.value = { type: store.paymentMethod.type, displayLabel: store.paymentMethod.displayLabel };
    step.value = 'checkout';
  } else {
    step.value = 'method-select';
  }
};

// ── Selección + captura de método de pago ──
const methodType      = ref(null); // 'card' | 'bank' | 'yape'
const saveMethod      = ref(true);
const yapeQrShown     = ref(false);

const cardNumber = ref('');
const cardExpiry = ref('');
const cardCvv    = ref('');
const cardHolder = ref('');

const bankName    = ref('');
const bankAccount = ref('');

const yapePhone = ref('');

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
    cardCvv.value.length === 3 &&
    cardHolder.value.trim().length > 0
);

const bankValid = computed(() => bankName.value.trim().length > 0 && bankAccount.value.replace(/\D/g, '').length >= 4);

const yapePhoneValid = computed(() => yapePhone.value.replace(/\D/g, '').length === 9);

const methodFormValid = computed(() => {
  if (methodType.value === 'card') return cardValid.value;
  if (methodType.value === 'bank') return bankValid.value;
  if (methodType.value === 'yape') return yapeQrShown.value;
  return false;
});

const selectMethodType = (type) => {
  methodType.value  = type;
  yapeQrShown.value = false;
  step.value = 'method-form';
};

const backToMethodSelect = () => {
  step.value = 'method-select';
};

const generateYapeQr = () => {
  if (!yapePhoneValid.value) return;
  yapeQrShown.value = true;
};

const continueFromMethodForm = async () => {
  if (!methodFormValid.value) return;

  let displayLabel = '';
  if (methodType.value === 'card') {
    displayLabel = `${t('transaction.method-card')} •••• ${cardNumber.value.replace(/\s/g, '').slice(-4)}`;
  } else if (methodType.value === 'bank') {
    displayLabel = `${bankName.value} •••${bankAccount.value.replace(/\D/g, '').slice(-4)}`;
  } else if (methodType.value === 'yape') {
    displayLabel = `${t('transaction.method-yape')} •••${yapePhone.value.replace(/\D/g, '').slice(-3)}`;
  }

  activeMethod.value = { type: methodType.value, displayLabel };

  if (saveMethod.value) {
    await store.savePaymentMethod({ type: methodType.value, displayLabel });
  }

  step.value = 'checkout';
};

const confirmPayment = async () => {
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

      <form @submit.prevent="goToPaymentStep" class="p-fluid">

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

    <!-- ── PASO 2a: Selección de método de pago ── -->
    <div v-else-if="step === 'method-select'" class="table-card">
      <div class="gateway-header">
        <p class="gateway-title">{{ t('transaction.method-select-title') }}</p>
        <p class="gateway-sub">{{ t('transaction.method-select-sub') }}</p>
      </div>

      <div class="method-options">
        <button type="button" class="method-option" @click="selectMethodType('card')">
          <i class="pi pi-credit-card method-option-icon"/>
          <span>{{ t('transaction.method-card') }}</span>
          <i class="pi pi-chevron-right method-option-arrow"/>
        </button>
        <button type="button" class="method-option" @click="selectMethodType('bank')">
          <i class="pi pi-building-columns method-option-icon"/>
          <span>{{ t('transaction.method-bank') }}</span>
          <i class="pi pi-chevron-right method-option-arrow"/>
        </button>
        <button type="button" class="method-option" @click="selectMethodType('yape')">
          <i class="pi pi-qrcode method-option-icon"/>
          <span>{{ t('transaction.method-yape') }}</span>
          <i class="pi pi-chevron-right method-option-arrow"/>
        </button>
      </div>

      <pv-button :label="t('transaction.cancel')" text class="btn-cancel w-full mt-3" @click="step = 'form'"/>
    </div>

    <!-- ── PASO 2b: Datos del método de pago ── -->
    <div v-else-if="step === 'method-form'" class="table-card gateway-card">

      <div class="gateway-header">
        <i class="pi pi-shield gateway-shield"/>
        <p class="gateway-title">{{ t(`transaction.method-${methodType}`) }}</p>
      </div>

      <!-- Tarjeta -->
      <template v-if="methodType === 'card'">
        <div class="field mb-3">
          <label class="custom-label">{{ t('transaction.card-holder') }}</label>
          <pv-input-text v-model="cardHolder" :placeholder="t('transaction.card-holder-ph')" class="w-full"/>
        </div>
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
      </template>

      <!-- Cuenta de banco -->
      <template v-else-if="methodType === 'bank'">
        <div class="field mb-3">
          <label class="custom-label">{{ t('transaction.bank-name') }}</label>
          <pv-input-text v-model="bankName" :placeholder="t('transaction.bank-name-ph')" class="w-full"/>
        </div>
        <div class="field mb-3">
          <label class="custom-label">{{ t('transaction.bank-account') }}</label>
          <pv-input-text v-model="bankAccount" :placeholder="t('transaction.bank-account-ph')" class="w-full"/>
        </div>
      </template>

      <!-- Yape (QR simulado) -->
      <template v-else-if="methodType === 'yape'">
        <div v-if="!yapeQrShown">
          <div class="field mb-3">
            <label class="custom-label">{{ t('transaction.yape-phone') }}</label>
            <pv-input-text v-model="yapePhone" maxlength="9" :placeholder="t('transaction.yape-phone-ph')" class="w-full"/>
          </div>
          <pv-button :label="t('transaction.yape-generate')" class="btn-save w-full" :disabled="!yapePhoneValid" @click="generateYapeQr"/>
        </div>
        <div v-else class="yape-qr-block">
          <p class="yape-qr-title">{{ t('transaction.yape-scan-title') }}</p>
          <div class="yape-qr-box">
            <i class="pi pi-qrcode"/>
          </div>
          <p class="yape-qr-sub">{{ t('transaction.yape-scan-sub') }}</p>
        </div>
      </template>

      <div v-if="methodType !== 'yape' || yapeQrShown" class="save-method-row">
        <pv-checkbox v-model="saveMethod" :binary="true" inputId="saveMethod"/>
        <label for="saveMethod" class="save-method-label">{{ t('transaction.save-method-toggle') }}</label>
      </div>

      <pv-button
          v-if="methodType !== 'yape' || yapeQrShown"
          :label="t('transaction.continue')"
          class="btn-save w-full mt-3"
          :disabled="!methodFormValid"
          @click="continueFromMethodForm"/>
      <pv-button :label="t('transaction.back')" text class="btn-cancel w-full mt-2" @click="backToMethodSelect"/>
    </div>

    <!-- ── PASO 3: Checkout ── -->
    <div v-else-if="step === 'checkout'" class="table-card gateway-card">

      <div v-if="!processing">
        <div class="gateway-header">
          <p class="gateway-title">{{ t('transaction.checkout-title') }}</p>
        </div>

        <div class="gateway-amount">USD {{ Number(amount).toFixed(2) }}</div>

        <div class="commission-breakdown">
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

        <div class="checkout-method-row">
          <span class="breakdown-label">{{ t('transaction.checkout-method-label') }}</span>
          <span class="checkout-method-value">{{ activeMethod?.displayLabel }}</span>
        </div>

        <pv-button
            :label="t('transaction.checkout-pay', { amount: Number(amount).toFixed(2) })"
            class="btn-save w-full mt-3"
            icon="pi pi-lock"
            @click="confirmPayment"/>
        <pv-button :label="t('transaction.change-method')" text class="btn-cancel w-full mt-2" @click="step = 'method-select'"/>
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

/* Method selection */
.method-options { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
.method-option {
  display: flex; align-items: center; gap: 1rem;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 1rem 1.25rem; cursor: pointer; font-size: 1rem; font-weight: 700; color: #1a2a40;
  transition: background-color 0.15s, border-color 0.15s;
}
.method-option:hover { background: #f0f4ff; border-color: #1e4d8c; }
.method-option-icon { font-size: 1.3rem; color: #1e4d8c; }
.method-option-arrow { margin-left: auto; color: #a0aec0; }

/* Yape QR simulado */
.yape-qr-block { text-align: center; padding: 0.5rem 0 1rem; }
.yape-qr-title { color: #1a2a40; font-weight: 700; margin: 0 0 1rem; }
.yape-qr-box {
  width: 180px; height: 180px; margin: 0 auto 1rem;
  display: flex; align-items: center; justify-content: center;
  background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 12px;
  font-size: 5rem; color: #1a2a40;
}
.yape-qr-sub { color: #a0aec0; font-size: 0.85rem; margin: 0; }

/* Guardar método */
.save-method-row { display: flex; align-items: center; gap: 0.6rem; margin-top: 1rem; }
.save-method-label { color: #4a5568; font-size: 0.9rem; cursor: pointer; }

/* Checkout */
.checkout-method-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.25rem; margin-bottom: 0.5rem; }
.checkout-method-value { color: #1a2a40; font-weight: 700; }
</style>