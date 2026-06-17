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
  { value: 'warning',   label: 'moderation.type-warning',   icon: 'pi pi-exclamation-triangle' },
  { value: 'ban',       label: 'moderation.type-ban',       icon: 'pi pi-ban'                  },
  { value: 'dismissed', label: 'moderation.type-dismissed', icon: 'pi pi-check-circle'         },
];

onMounted(() => {
    store.fetchSanctions();
    const id = route.params.id;
  if (route.query.reportId)         form.value.reportId         = Number(route.query.reportId);
  if (route.query.sanctionedUserId) form.value.sanctionedUserId = Number(route.query.sanctionedUserId);
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
      <div class="header-top">
        <button class="back-btn" @click="router.back()">
          <i class="pi pi-arrow-left"></i>
        </button>
        <div>
          <h1 class="page-title">
            <i class="pi pi-gavel title-icon"/>
            {{ isEdit ? t('moderation.sanction-edit-title') : t('moderation.sanction-new-title') }}
          </h1>
          <p class="page-sub">{{ isEdit ? t('moderation.sanction-edit-sub') : t('moderation.sanction-new-sub') }}</p>
        </div>
      </div>
    </div>

    <div class="form-card">

      <!-- Info del reporte vinculado -->
      <div class="report-ref">
        <i class="pi pi-link ref-icon"/>
        <span class="ref-label">Reporte vinculado:</span>
        <span class="ref-value">#{{ form.reportId }}</span>
        <span class="ref-sep">·</span>
        <span class="ref-label">Usuario infractor:</span>
        <span class="ref-value ref-user">
          <i class="pi pi-user" style="font-size:11px;"/>
          #{{ form.sanctionedUserId }}
        </span>
      </div>

      <form class="form-wrap" @submit.prevent="submit">

        <!-- Tipo de sanción — visual con cards -->
        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-type') }}</label>
          <div class="type-cards">
            <div
                v-for="opt in typeOptions"
                :key="opt.value"
                class="type-card"
                :class="{
                  'type-card-active':     form.type === opt.value,
                  'type-card-warning':    opt.value === 'warning'   && form.type === opt.value,
                  'type-card-ban':        opt.value === 'ban'       && form.type === opt.value,
                  'type-card-dismissed':  opt.value === 'dismissed' && form.type === opt.value,
                }"
                @click="form.type = opt.value">
              <i :class="opt.icon" class="type-card-icon"/>
              <span class="type-card-label">{{ t(opt.label) }}</span>
            </div>
          </div>
        </div>

        <!-- Descripción -->
        <div class="field-group">
          <label class="field-label">{{ t('moderation.field-notes') }}</label>
          <pv-textarea
              v-model="form.description"
              :placeholder="t('moderation.field-notes-ph')"
              rows="3"
              fluid
              :invalid="!!errors.description"/>
          <small v-if="errors.description" class="field-error">{{ errors.description }}</small>
        </div>

        <!-- Duración — solo si es ban -->
        <div v-if="form.type === 'ban'" class="field-group duration-group">
          <label class="field-label">
            <i class="pi pi-clock" style="margin-right:4px;"/>
            {{ t('moderation.field-duration') }}
          </label>
          <div class="duration-row">
            <pv-input-number v-model="form.durationDays" :min="1" fluid/>
            <span class="duration-unit">días</span>
          </div>
        </div>

        <!-- Botones -->
        <div class="btn-row">
          <button class="btn-primary" type="submit">
            <i class="pi pi-check" style="font-size:14px;"></i>
            {{ isEdit ? t('moderation.btn-update') : t('moderation.btn-create-sanction') }}
          </button>
          <button class="btn-secondary" type="button" @click="router.back()">
            {{ t('moderation.btn-cancel') }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<style scoped>
.form-page   { max-width: 580px; }
.page-header { margin-bottom: 24px; }

.header-top {
  display: flex;
  align-items: center;
  gap: 14px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
  flex-shrink: 0;
  transition: all 0.15s;
}
.back-btn:hover { background: #f3f4f6; }

.title-icon  { color: #e53e4f; margin-right: 8px; font-size: 1.1rem; }
.page-title  { font-size: 22px; font-weight: 700; color: #1a2a40; margin: 0 0 4px; display: flex; align-items: center; }
.page-sub    { font-size: 13px; color: #9ca3af; margin: 0; }

.form-card   { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }

/* Reporte vinculado */
.report-ref {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  flex-wrap: wrap;
}
.ref-icon  { color: #1e4d8c; }
.ref-label { color: #6b7280; font-weight: 500; }
.ref-value { color: #1a2a40; font-weight: 700; }
.ref-user  { display: inline-flex; align-items: center; gap: 3px; }
.ref-sep   { color: #d1d5db; }

.form-wrap   { display: flex; flex-direction: column; gap: 20px; padding: 24px; }
.field-group { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 13px; font-weight: 600; color: #374151; }
.field-error { font-size: 12px; color: #e53e4f; }

/* Type cards */
.type-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.type-card {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: #fff;
}
.type-card:hover { border-color: #1e4d8c; background: #f0f4ff; }

.type-card-icon  { font-size: 1.4rem; color: #9ca3af; }
.type-card-label { font-size: 13px; font-weight: 600; color: #6b7280; }

.type-card-active         { border-color: #1e4d8c; background: #f0f4ff; }
.type-card-active .type-card-icon  { color: #1e4d8c; }
.type-card-active .type-card-label { color: #1e4d8c; }

.type-card-warning         { border-color: #d97706 !important; background: #fffbeb !important; }
.type-card-warning .type-card-icon  { color: #d97706 !important; }
.type-card-warning .type-card-label { color: #d97706 !important; }

.type-card-ban         { border-color: #dc2626 !important; background: #fef2f2 !important; }
.type-card-ban .type-card-icon  { color: #dc2626 !important; }
.type-card-ban .type-card-label { color: #dc2626 !important; }

.type-card-dismissed         { border-color: #16a34a !important; background: #f0fdf4 !important; }
.type-card-dismissed .type-card-icon  { color: #16a34a !important; }
.type-card-dismissed .type-card-label { color: #16a34a !important; }

/* Duración */
.duration-group { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; }
.duration-row   { display: flex; align-items: center; gap: 10px; }
.duration-unit  { font-size: 13px; font-weight: 600; color: #6b7280; white-space: nowrap; }

/* Botones */
.btn-row { display: flex; gap: 12px; padding-top: 4px; }
.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  background: #e53e4f; color: #fff; border: none; border-radius: 8px;
  padding: 10px 22px; font-size: 14px; font-weight: 600;
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
