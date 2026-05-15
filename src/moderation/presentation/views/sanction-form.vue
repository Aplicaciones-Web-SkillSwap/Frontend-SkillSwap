<script setup>
import { ref, onMounted }      from 'vue';
import { useI18n }             from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import useModerationStore      from '@/moderation/application/moderation.store.js';
import { Sanction }            from '@/moderation/domain/model/sanction-entity.js';

const { t }  = useI18n();
const router = useRouter();
const route  = useRoute();
const store  = useModerationStore();

const isEdit     = ref(false);
const sanctionId = ref(null);

const form = ref({
    reportId:         0,
    sanctionedUserId: 0,
    type:             'warning',
    description:      '',
    durationDays:     0
});

const errors = ref({ reportId: '', sanctionedUserId: '', description: '' });

const typeOptions = [
    { value: 'ban',       label: 'moderation.type-ban'       },
    { value: 'warning',   label: 'moderation.type-warning'   },
    { value: 'dismissed', label: 'moderation.type-dismissed' }
];

onMounted(() => {
    store.fetchSanctions();
    const id = route.params.id;
    if (id) {
        sanctionId.value = parseInt(id);
        isEdit.value     = true;
        const existing   = store.getSanctionById(id);
        if (existing) {
            form.value.reportId         = existing.reportId;
            form.value.sanctionedUserId = existing.sanctionedUserId;
            form.value.type             = existing.type;
            form.value.description      = existing.description;
            form.value.durationDays     = existing.durationDays;
        }
    }
});

function validate() {
    errors.value.reportId         = form.value.reportId < 1         ? t('moderation.err-id')    : '';
    errors.value.sanctionedUserId = form.value.sanctionedUserId < 1 ? t('moderation.err-id')    : '';
    errors.value.description      = !form.value.description.trim()  ? t('moderation.err-notes') : '';
    return !errors.value.reportId && !errors.value.sanctionedUserId && !errors.value.description;
}

function submit() {
    if (!validate()) return;
    const sanction = new Sanction({
        id:               sanctionId.value ?? 0,
        reportId:         Number(form.value.reportId),
        sanctionedUserId: Number(form.value.sanctionedUserId),
        type:             form.value.type,
        description:      form.value.description,
        durationDays:     Number(form.value.durationDays) ?? 0,
        createdAt:        new Date().toISOString()
    });
    if (isEdit.value) { store.updateSanction(sanction); }
    else              { store.addSanction(sanction);    }
    router.push({ name: 'moderation-sanctions' });
}
</script>

<template>
  <div class="form-page">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? t('moderation.sanction-edit-title') : t('moderation.sanction-new-title') }}</h1>
      <p class="page-sub">{{ isEdit ? t('moderation.sanction-edit-sub') : t('moderation.sanction-new-sub') }}</p>
    </div>

    <div class="form-card">
      <form class="form-wrap" @submit.prevent="submit">

        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-report') }}</label>
          <pv-input-number v-model="form.reportId" :min="1" fluid :invalid="!!errors.reportId"/>
          <small v-if="errors.reportId" class="field-error">{{ errors.reportId }}</small>
        </div>

        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-user') }}</label>
          <pv-input-number v-model="form.sanctionedUserId" :min="1" fluid :invalid="!!errors.sanctionedUserId"/>
          <small v-if="errors.sanctionedUserId" class="field-error">{{ errors.sanctionedUserId }}</small>
        </div>

        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-type') }}</label>
          <pv-select v-model="form.type" :options="typeOptions" option-label="label" option-value="value" fluid>
            <template #option="{ option }">{{ t(option.label) }}</template>
            <template #value="{ value }">{{ t(typeOptions.find(o => o.value === value)?.label ?? '') }}</template>
          </pv-select>
        </div>

        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-notes') }}</label>
          <pv-textarea v-model="form.description" :placeholder="t('moderation.field-notes-ph')" rows="3" fluid :invalid="!!errors.description"/>
          <small v-if="errors.description" class="field-error">{{ errors.description }}</small>
        </div>

        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-duration') }}</label>
          <pv-input-number v-model="form.durationDays" :min="0" fluid/>
        </div>

        <div class="btn-row">
          <button class="btn-primary" type="submit">
            <i class="pi pi-check" style="font-size:14px;"></i>
            {{ isEdit ? t('moderation.btn-update') : t('moderation.btn-create-sanction') }}
          </button>
          <button class="btn-secondary" type="button" @click="router.push({ name: 'moderation-sanctions' })">
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
