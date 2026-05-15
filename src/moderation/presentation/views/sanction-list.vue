<script setup>
import { onMounted }      from 'vue';
import { useI18n }        from 'vue-i18n';
import { useRouter }      from 'vue-router';
import useModerationStore from '@/moderation/application/moderation.store.js';

const { t }  = useI18n();
const router = useRouter();
const store  = useModerationStore();

onMounted(() => {
    store.fetchSanctions();
});

function typeLabel(type) {
    const map = { ban: t('moderation.type-ban'), warning: t('moderation.type-warning'), dismissed: t('moderation.type-dismissed') };
    return map[type] ?? type;
}

function durationLabel(days) {
    return days === 0 ? t('moderation.duration-na') : `${days} ${t('moderation.duration-days')}`;
}
</script>

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('moderation.sanctions-title') }}</h1>
      <p class="page-sub">{{ t('moderation.sanctions-sub') }}</p>
    </div>

    <div v-if="store.loading" class="spinner-wrap">
      <i class="pi pi-spin pi-spinner" style="font-size:28px; color:#1e4d8c;"></i>
    </div>

    <div v-else class="table-card">
      <div class="table-header">
        <span class="table-title">
          {{ t('moderation.table-sanctions') }}
          <span class="badge-count">{{ store.sanctionCount }}</span>
        </span>
        <button class="btn-apply" @click="router.push({ name: 'moderation-sanctions-new' })">
          <i class="pi pi-gavel" style="font-size:14px;"></i>
          {{ t('moderation.btn-apply') }}
        </button>
      </div>

      <pv-data-table :value="store.sanctions" :rows="10" paginator row-hover striped-rows size="small">

        <pv-column header="#" style="width:52px;">
          <template #body="{ index }"><span style="color:#9ca3af; font-size:13px;">#{{ index + 1 }}</span></template>
        </pv-column>

        <pv-column :header="t('moderation.col-report')" field="reportId">
          <template #body="{ data }">#{{ data.reportId }}</template>
        </pv-column>

        <pv-column :header="t('moderation.col-user')" field="sanctionedUserId">
          <template #body="{ data }"><span style="font-weight:500;">User #{{ data.sanctionedUserId }}</span></template>
        </pv-column>

        <pv-column :header="t('moderation.col-type')" field="type">
          <template #body="{ data }">
            <span class="chip" :class="{ 'chip-ban': data.type === 'ban', 'chip-warning': data.type === 'warning', 'chip-dismissed': data.type === 'dismissed' }">
              {{ typeLabel(data.type) }}
            </span>
          </template>
        </pv-column>

        <pv-column :header="t('moderation.col-notes')" field="description">
          <template #body="{ data }"><span style="color:#6b7280; font-size:13px;">{{ data.description }}</span></template>
        </pv-column>

        <pv-column :header="t('moderation.col-duration')" field="durationDays">
          <template #body="{ data }"><span style="color:#6b7280; font-size:13px;">{{ durationLabel(data.durationDays) }}</span></template>
        </pv-column>

        <pv-column :header="t('moderation.col-actions')" style="width:100px;">
          <template #body="{ data }">
            <div class="actions-wrap">
              <button class="action-icon" @click="router.push({ name: 'moderation-sanctions-edit', params: { id: data.id } })">
                <i class="pi pi-pencil" style="font-size:15px;"></i>
              </button>
              <button class="action-icon delete" @click="store.deleteSanction(data.id)">
                <i class="pi pi-trash" style="font-size:15px;"></i>
              </button>
            </div>
          </template>
        </pv-column>

        <template #empty><p class="empty-msg">{{ t('moderation.no-sanctions') }}</p></template>
      </pv-data-table>
    </div>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-title  { font-size: 24px; font-weight: 700; color: #1a2a40; margin: 0 0 4px; }
.page-sub    { font-size: 13px; color: #9ca3af; margin: 0; }
.spinner-wrap{ padding: 32px; text-align: center; }
.table-card  { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
.table-header{ display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid #f1f3f5; }
.table-title { font-size: 15px; font-weight: 600; color: #1a2a40; }
.badge-count { background: #fef3c7; color: #d97706; font-size: 11px; font-weight: 700; border-radius: 20px; padding: 2px 8px; margin-left: 8px; }
.chip        { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.chip-ban       { background: #fff1f0; color: #ef4444; border: 1px solid #fecaca; }
.chip-warning   { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.chip-dismissed { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
.actions-wrap{ display: flex; align-items: center; gap: 4px; }
.action-icon { width: 32px; height: 32px; border: none; background: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9ca3af; transition: all 0.15s; }
.action-icon:hover        { background: #f3f4f6; color: #1a2a40; }
.action-icon.delete:hover { background: #fff1f0; color: #ef4444; }
.btn-apply   { display: inline-flex; align-items: center; gap: 6px; background: #e53e4f; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit; }
.btn-apply:hover { background: #d03544; }
.empty-msg   { text-align: center; color: #9ca3af; font-size: 13px; padding: 32px; }
</style>
