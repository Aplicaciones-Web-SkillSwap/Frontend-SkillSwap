<script setup>
import { ref, onMounted }      from 'vue';
import { useI18n }             from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import useModerationStore      from '@/moderation/application/moderation.store.js';
import useAuthStore            from '@/iam/application/auth.store.js';
import { Report }              from '@/moderation/domain/model/report-entity.js';

const { t }  = useI18n();
const router = useRouter();
const route  = useRoute();
const store  = useModerationStore();
const authStore = useAuthStore();

const form = ref({
  reportedUserId: route.query.reportedUserId ? Number(route.query.reportedUserId) : 0,
  sessionId:      route.query.sessionId      ? Number(route.query.sessionId)      : null,
  reason:         '',
});

const errors = ref({ reason: '' });

onMounted(() => {
  if (!form.value.sessionId || !form.value.reportedUserId) {
    router.push({ name: 'workspace-sessions' });
  }
});

function validate() {
  errors.value.reason = !form.value.reason.trim() ? t('moderation.err-reason') : '';
  return !errors.value.reason;
}

function submit() {
  if (!validate()) return;
  const report = new Report({
    reporterUserId: authStore.user?.id,
    reportedUserId: Number(form.value.reportedUserId),
    sessionId:      form.value.sessionId,
    reason:         form.value.reason,
  });
  store.addReport(report);
  router.push({ name: 'moderation-reports' });
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('moderation.report-new-title') }}</h1>
      <p class="page-sub">{{ t('moderation.report-new-sub') }}</p>
    </div>

    <div class="form-card">
      <form class="form-wrap" @submit.prevent="submit">

        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-reported') }}</label>
          <div class="readonly-value">Usuario #{{ form.reportedUserId }}</div>
          <small class="field-hint">
            <i class="pi pi-info-circle mr-1"/> Pre-cargado desde la sesión
          </small>
        </div>

        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-reason') }}</label>
          <pv-textarea v-model="form.reason" :placeholder="t('moderation.field-reason-ph')" rows="3" fluid :invalid="!!errors.reason"/>
          <small v-if="errors.reason" class="field-error">{{ errors.reason }}</small>
        </div>

        <div class="btn-row">
          <button class="btn-primary" type="submit">
            <i class="pi pi-save" style="font-size:14px;"></i>
            {{ t('moderation.btn-create-report') }}
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
.field-hint  { color: #64748b; font-size: 0.8rem; display: flex; align-items: center; }
.readonly-value {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.65rem 0.9rem;
  color: #1a2a40;
  font-weight: 600;
  font-size: 0.95rem;
}
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