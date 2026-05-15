<script setup>
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import usePaymentStore from "@/payment/application/payment.store.js";
import {computed, onMounted, ref} from "vue";
import {Transaction} from "@/payment/domain/model/transaction-entity.js";

const {t}    = useI18n();
const router = useRouter();
const route  = useRoute();
const store  = usePaymentStore();
const { addTransaction, errors, updateTransaction } = store;

const COMMISSION_RATE = 0.05;

const form = ref({
  walletId:       route.query.walletId ? parseInt(route.query.walletId) : null,
  senderId:       null,
  receiverId:     null,
  originalAmount: 0,
  type:           'donation',
  status:         'pending',
  description:    '',
});

// Calculados automáticamente al cambiar el monto
const commissionFee = computed(() =>
    parseFloat((form.value.originalAmount * COMMISSION_RATE).toFixed(2))
);

const netAmount = computed(() =>
    parseFloat((form.value.originalAmount - commissionFee.value).toFixed(2))
);

const isEdit = computed(() => !!route.params.id);

const typeOptions = [
  { label: 'Donation',   value: 'donation'   },
  { label: 'Deposit',    value: 'deposit'     },
  { label: 'Withdrawal', value: 'withdrawal'  },
  { label: 'Refund',     value: 'refund'      },
];

const statusOptions = [
  { label: 'Pending',   value: 'pending'   },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed',    value: 'failed'    },
  { label: 'Cancelled', value: 'cancelled' },
];

onMounted(() => {
  if (isEdit.value) {
    const found = store.getTransactionById(route.params.id);
    if (found) {
      form.value.walletId       = found.walletId;
      form.value.senderId       = found.senderId;
      form.value.receiverId     = found.receiverId;
      form.value.originalAmount = found.originalAmount;
      form.value.type           = found.type;
      form.value.status         = found.status;
      form.value.description    = found.description;
    } else {
      router.push({ name: 'payment-transactions' });
    }
  }
});

const saveTransaction = () => {
  const transaction = new Transaction({
    id:             isEdit.value ? parseInt(route.params.id) : null,
    walletId:       form.value.walletId,
    senderId:       form.value.senderId,
    receiverId:     form.value.receiverId,
    originalAmount: form.value.originalAmount,
    commissionFee:  commissionFee.value,
    netAmount:      netAmount.value,
    type:           form.value.type,
    status:         form.value.status,
    description:    form.value.description,
    createdAt:      new Date().toISOString(),
  });
  if (isEdit.value) updateTransaction(transaction); else addTransaction(transaction);
  navigateBack();
};

const navigateBack = () => {
  if (route.query.walletId)
    router.push({ name: 'payment-transactions', query: { walletId: route.query.walletId } });
  else
    router.push({ name: 'payment-transactions' });
};
</script>

<template>
  <div class="p-4 transaction-container">

    <!-- Header -->
    <div class="header-actions flex align-items-center gap-3 mb-4">
      <pv-button icon="pi pi-arrow-left" text class="action-btn-view" @click="navigateBack"/>
      <h1 class="page-title m-0">
        {{ isEdit ? t('transaction.edit-title') : t('transaction.new-title') }}
      </h1>
    </div>

    <!-- Formulario en tarjeta -->
    <div class="table-card form-wrapper">
      <form @submit.prevent="saveTransaction" class="p-fluid">

        <div class="grid">

          <div class="col-12 md:col-6 field mb-4">
            <label for="walletId" class="custom-label">{{ t('transaction.walletId') }}</label>
            <pv-input-number
                id="walletId"
                v-model="form.walletId"
                class="w-full"
                :min="1"
                :disabled="!!route.query.walletId"
                required/>
          </div>

          <div class="col-12 md:col-6 field mb-4">
            <label for="senderId" class="custom-label">{{ t('transaction.senderId') }}</label>
            <pv-input-number id="senderId" v-model="form.senderId" class="w-full" :min="1" required/>
          </div>

          <div class="col-12 md:col-6 field mb-4">
            <label for="receiverId" class="custom-label">{{ t('transaction.receiverId') }}</label>
            <pv-input-number id="receiverId" v-model="form.receiverId" class="w-full" :min="1" required/>
          </div>

          <div class="col-12 md:col-6 field mb-4">
            <label for="type" class="custom-label">{{ t('transaction.type') }}</label>
            <pv-select id="type" v-model="form.type" :options="typeOptions" option-label="label" option-value="value" class="w-full"/>
          </div>

          <div class="col-12 md:col-6 field mb-4">
            <label for="status" class="custom-label">{{ t('transaction.status') }}</label>
            <pv-select id="status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value" class="w-full"/>
          </div>

          <!-- Monto original -->
          <div class="col-12 md:col-6 field mb-4">
            <label for="originalAmount" class="custom-label">{{ t('transaction.original-amount') }}</label>
            <pv-input-number
                id="originalAmount"
                v-model="form.originalAmount"
                class="w-full"
                :min="0"
                :min-fraction-digits="2"
                :max-fraction-digits="2"
                required/>
          </div>

          <div class="col-12 field mb-4">
            <label for="description" class="custom-label">{{ t('transaction.description') }}</label>
            <pv-input-text id="description" v-model="form.description" class="w-full"/>
          </div>

        </div>

        <!-- Desglose automático de comisión -->
        <div v-if="form.originalAmount > 0" class="commission-breakdown">
          <p class="breakdown-title">{{ t('transaction.breakdown-title') }}</p>
          <div class="breakdown-rows">
            <div class="breakdown-row">
              <span class="breakdown-label">{{ t('transaction.learner-pays') }}</span>
              <span class="breakdown-original">USD {{ form.originalAmount.toFixed(2) }}</span>
            </div>
            <div class="breakdown-row">
              <span class="breakdown-label commission-label">
                {{ t('transaction.skillswap-commission') }}
                <span class="rate-tag">5%</span>
              </span>
              <span class="breakdown-commission">- USD {{ commissionFee.toFixed(2) }}</span>
            </div>
            <div class="breakdown-divider"/>
            <div class="breakdown-row">
              <span class="breakdown-label net-label">{{ t('transaction.tutor-receives') }}</span>
              <span class="breakdown-net">USD {{ netAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Acciones del formulario -->
        <div class="flex justify-content-end gap-3 mt-4 pt-4 border-top-1 border-300">
          <pv-button :label="t('transaction.cancel')" text class="btn-cancel" @click="navigateBack"/>
          <pv-button :label="t('transaction.save')"   type="submit" class="btn-save"/>
        </div>

      </form>
    </div>

    <!-- Errores -->
    <div v-if="errors.length" class="text-red-500 mt-4 error-msg">
      <i class="pi pi-exclamation-circle mr-2"></i>
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

  </div>
</template>

<style scoped>
/* Contenedor principal */
.transaction-container {
  width: 100%;
  padding: 0 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

/* Título */
.page-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 2rem;
}

/* Efecto tarjeta unificado */
.table-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 2.5rem;
  border: 1px solid #f0f2f5;
}

/* Etiquetas del formulario */
.custom-label {
  display: block;
  font-weight: 700;
  color: #1a2a40;
  margin-bottom: 0.6rem;
  font-size: 0.95rem;
}

/* --- DESGLOSE DE COMISIÓN --- */
.commission-breakdown {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  margin-top: 1rem;
  margin-bottom: 1.5rem;
}

.breakdown-title {
  color: #4a5568;
  font-weight: 700;
  font-size: 0.85rem;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.breakdown-rows { display: flex; flex-direction: column; gap: 0.6rem; }
.breakdown-row { display: flex; justify-content: space-between; align-items: center; }
.breakdown-label { color: #718096; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; }

.commission-label { color: #dc2626; }
.net-label        { color: #16a34a; font-weight: 700; }

.rate-tag {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}

.breakdown-original   { color: #1a2a40; font-weight: 700; font-size: 0.95rem; }
.breakdown-commission { color: #dc2626; font-weight: 700; font-size: 0.95rem; }
.breakdown-net        { color: #16a34a; font-weight: 800; font-size: 1.1rem; }

.breakdown-divider { height: 1px; background-color: #cbd5e1; margin: 0.4rem 0; }

/* --- BOTONES --- */
.action-btn-view {
  color: #1a2a40 !important;
}

.btn-save {
  background-color: #e53e4f !important;
  border: none !important;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.6rem 1.8rem;
  color: white !important;
}

.btn-save:hover {
  background-color: #d03544 !important;
}

.btn-cancel {
  color: #4a5568 !important;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.6rem 1.5rem;
}

.btn-cancel:hover {
  background-color: #f8f9fa !important;
}

/* Mensaje de error */
.error-msg {
  font-weight: bold;
  background-color: #fee2e2;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
}
</style>