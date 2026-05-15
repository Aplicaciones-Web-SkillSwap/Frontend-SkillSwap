<script setup>
import { ref, onMounted }      from 'vue';
import { useI18n }             from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import useModerationStore      from '@/moderation/application/moderation.store.js';
import { Report }              from '@/moderation/domain/model/report-entity.js';

const { t }  = useI18n();
const router = useRouter();
const route  = useRoute();
const store  = useModerationStore();

const isEdit         = ref(false);
const reportId       = ref(null);
const originalClosed = ref(false);

const form = ref({
    reporterUserId: 0,
    reportedUserId: 0,
    reason:         '',
    status:         'pending'
});

const errors = ref({ reporterUserId: '', reportedUserId: '', reason: '' });

const statusOptions = [
    { value: 'pending',   label: 'moderation.status-pending'   },
    { value: 'warning',   label: 'moderation.status-warning'   },
    { value: 'dismissed', label: 'moderation.status-dismissed' }
];

onMounted(() => {
    store.fetchReports();
    const id = route.params.id;
    if (id) {
        reportId.value = parseInt(id);
        isEdit.value   = true;
        const existing = store.getReportById(id);
        if (existing) {
            originalClosed.value        = existing.closed ?? false;
            form.value.reporterUserId   = existing.reporterUserId;
            form.value.reportedUserId   = existing.reportedUserId;
            form.value.reason           = existing.reason;
            form.value.status           = existing.status;
        }
    }
});

function validate() {
    errors.value.reporterUserId = form.value.reporterUserId < 1 ? t('moderation.err-id')     : '';
    errors.value.reportedUserId = form.value.reportedUserId < 1 ? t('moderation.err-id')     : '';
    errors.value.reason         = !form.value.reason.trim()     ? t('moderation.err-reason') : '';
    return !errors.value.reporterUserId && !errors.value.reportedUserId && !errors.value.reason;
}

function submit() {
    if (!validate()) return;
    const report = new Report({
        id:             reportId.value ?? 0,
        reporterUserId: Number(form.value.reporterUserId),
        reportedUserId: Number(form.value.reportedUserId),
        reason:         form.value.reason,
        status:         form.value.status,
        closed:         originalClosed.value,
        createdAt:      new Date().toISOString()
    });
    if (isEdit.value) { store.updateReport(report); }
    else              { store.addReport(report);    }
    router.push({ name: 'moderation-reports' });
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? t('moderation.report-edit-title') : t('moderation.report-new-title') }}</h1>
      <p class="page-sub">{{ isEdit ? t('moderation.report-edit-sub') : t('moderation.report-new-sub') }}</p>
    </div>

    <div class="form-card">
      <form class="form-wrap" @submit.prevent="submit">

        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-reporter') }}</label>
          <pv-input-number v-model="form.reporterUserId" :min="1" fluid :invalid="!!errors.reporterUserId"/>
          <small v-if="errors.reporterUserId" class="field-error">{{ errors.reporterUserId }}</small>
        </div>

        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-reported') }}</label>
          <pv-input-number v-model="form.reportedUserId" :min="1" fluid :invalid="!!errors.reportedUserId"/>
          <small v-if="errors.reportedUserId" class="field-error">{{ errors.reportedUserId }}</small>
        </div>

        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-reason') }}</label>
          <pv-input-text v-model="form.reason" :placeholder="t('moderation.field-reason-ph')" fluid :invalid="!!errors.reason"/>
          <small v-if="errors.reason" class="field-error">{{ errors.reason }}</small>
        </div>

        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-status') }}</label>
          <pv-select v-model="form.status" :options="statusOptions" option-label="label" option-value="value" fluid>
            <template #option="{ option }">{{ t(option.label) }}</template>
            <template #value="{ value }">{{ t(statusOptions.find(s => s.value === value)?.label ?? '') }}</template>
          </pv-select>
        </div>

        <div class="btn-row">
          <button class="btn-primary" type="submit">
            <i class="pi pi-save" style="font-size:14px;"></i>
            {{ isEdit ? t('moderation.btn-update') : t('moderation.btn-create-report') }}
          </button>
          <button class="btn-secondary" type="button" @click="router.push({ name: 'moderation-reports' })">
            {{ t('moderation.btn-cancel') }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<style scoped>
.form-page   { max-width: 600px; }
.page-header { margin-bottom: 24px; }
.page-title  { font-size: 22px; font-weight: 700; color: #1a2a40; margin: 0 0 4px; }
.page-sub    { font-size: 13px; color: #9ca3af; margin: 0; }
.form-card   { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; }
.form-wrap   { display: flex; flex-direction: column; gap: 18px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 13px; font-weight: 600; color: #374151; }
.field-error { font-size: 12px; color: #e53e4f; }
.btn-row     { display: flex; gap: 12px; padding-top: 8px; }
.btn-primary {
    display: inline-flex; align-items: center; gap: 6px;
    background: #e53e4f; color: #fff; border: none; border-radius: 8px;
    padding: 10px 20px; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: background 0.15s; font-family: inherit;
}
.btn-primary:hover { background: #d03544; }
.btn-secondary {
    display: inline-flex; align-items: center;
    background: none; color: #6b7280; border: 1px solid #e5e7eb;
    border-radius: 8px; padding: 10px 20px; font-size: 14px;
    font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.btn-secondary:hover { border-color: #1e4d8c; color: #1e4d8c; }
</style>
