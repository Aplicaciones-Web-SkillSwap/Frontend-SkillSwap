<script setup>
import { onMounted, computed, ref } from 'vue';
import { useI18n }             from 'vue-i18n';
import { useRouter }           from 'vue-router';
import useModerationStore      from '@/moderation/application/moderation.store.js';
import useDiscoveryStore        from '@/discovery/application/discovery.store.js';
import { formatDate }          from '@/shared/utils/format-date.js';

const { t }  = useI18n();
const router = useRouter();
const store  = useModerationStore();
const discoveryStore = useDiscoveryStore();

const activeReports   = computed(() => store.activeReports);
const resolvedReports = computed(() => store.resolvedReports);
const searchQuery     = ref('');

const filteredActiveReports = computed(() => {
  if (!searchQuery.value.trim()) return activeReports.value;
  const q = searchQuery.value.toLowerCase().trim();
  return activeReports.value.filter(r =>
      userName(r.reporterUserId).toLowerCase().includes(q) ||
      userName(r.reportedUserId).toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
  );
});

onMounted(() => {
  store.fetchReports();
  if (!discoveryStore.tutorsLoaded) discoveryStore.fetchTutors();
});

const userName = (id) => {
  const tutor = discoveryStore.tutors.find(t => t.userId === id);
  return tutor ? tutor.name : `Usuario #${id}`;
};
const userRole = (id) => {
  const isTutor = discoveryStore.tutors.some(t => t.userId === id);
  return isTutor ? 'tutor' : 'aprendiz';
};

/** PATCH /Reports/{id}/close — única acción de resolución soportada por el backend */
function resolveReport(report) {
  store.closeReport(report.id);
}

const navigateToSanction = (report) => {
  router.push({
    name:  'moderation-sanctions-new',
    query: { reportId: report.id, sanctionedUserId: report.reportedUserId }
  });
};
</script>

<template>
  <div class="page-layout">

    <div class="col-left">
      <div class="page-header">
        <h1 class="page-title">{{ t('moderation.reports-title') }}</h1>
        <p class="page-sub">{{ t('moderation.reports-sub') }}</p>
      </div>

      <div class="table-card">
        <div class="table-header">
          <span class="table-title">
            {{ t('moderation.table-reports') }}
            <span class="badge-count">{{ activeReports.length }}</span>
          </span>
        </div>

        <!-- Búsqueda por nombre o razón -->
        <div style="padding: 12px 20px; border-bottom: 1px solid #f1f3f5;">
          <pv-icon-field>
            <pv-input-icon class="pi pi-search"/>
            <pv-input-text
                v-model="searchQuery"
                placeholder="Buscar por nombre o motivo..."
                style="width: 100%; max-width: 380px;"
            />
          </pv-icon-field>
        </div>

        <div v-if="store.loading" class="spinner-wrap">
          <i class="pi pi-spin pi-spinner" style="font-size:28px; color:#1e4d8c;"></i>
        </div>

        <pv-data-table
            v-else
            :value="filteredActiveReports"
            :rows="10"
            paginator
            row-hover
            striped-rows
            size="small"
        >
          <pv-column header="#" style="width:52px;">
            <template #body="{ index }">
              <span style="color:#9ca3af; font-size:13px;">#{{ index + 1 }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('moderation.col-reporter')" field="reporterUserId">
            <template #body="{ data }">
              <span>{{ userName(data.reporterUserId) }}</span>
              <span :class="userRole(data.reporterUserId) === 'tutor' ? 'badge-tutor' : 'badge-aprendiz'">
                {{ userRole(data.reporterUserId) === 'tutor' ? 'Tutor' : 'Aprendiz' }}
              </span>
            </template>
          </pv-column>

          <pv-column :header="t('moderation.col-reported')" field="reportedUserId">
            <template #body="{ data }">
              <span
                  class="user-link clickable"
                  @click="router.push({ name: 'moderation-reports-chat', params: { userId: data.reportedUserId }, query: { reportId: data.id } })"
              >{{ userName(data.reportedUserId) }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('moderation.col-reason')" field="reason">
            <template #body="{ data }">
              <span style="font-weight:500;">{{ data.reason }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('moderation.col-date')" field="createdAt">
            <template #body="{ data }">
              <span style="color:#6b7280; font-size:13px;">{{ formatDate(data.createdAt) }}</span>
            </template>
          </pv-column>

          <pv-column :header="t('moderation.col-actions')" style="width:140px;">
            <template #body="{ data }">
              <div class="actions-wrap">
                <button class="action-icon sanction" :title="'Sancionar'" @click="navigateToSanction(data)">
                  <i class="pi pi-gavel" style="font-size:15px;"></i>
                </button>
                <button class="action-icon check" :title="'Resolver sin sanción'" @click="resolveReport(data)">
                  <i class="pi pi-check-circle" style="font-size:15px;"></i>
                </button>
              </div>
            </template>
          </pv-column>

          <template #empty>
            <p class="empty-msg">{{ t('moderation.no-active') }}</p>
          </template>
        </pv-data-table>
      </div>
    </div>

    <div class="col-right">
      <div class="resolved-box">
        <div class="resolved-header">
          <span class="resolved-title">{{ t('moderation.resolved-title') }}</span>
          <span class="resolved-count">{{ resolvedReports.length }}</span>
        </div>

        <div v-for="r in resolvedReports" :key="r.id" class="resolved-item">
          <div class="resolved-top">
            <span class="resolved-user">{{ userName(r.reportedUserId) }}</span>
          </div>
          <div class="resolved-reason">{{ r.reason }}</div>
          <div class="resolved-meta">
            <span style="font-size:11px; color:#9ca3af;">{{ formatDate(r.createdAt) }}</span>
            <span class="chip chip-resolved" style="font-size:11px; padding:2px 8px;">
              {{ t('moderation.status-resolved') }}
            </span>
          </div>
        </div>

        <p v-if="resolvedReports.length === 0" class="resolved-empty">
          {{ t('moderation.no-resolved') }}
        </p>
      </div>
    </div>

  </div>
</template>

<style scoped>
.page-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }

.page-header { margin-bottom: 20px; }
.page-title  { font-size: 24px; font-weight: 700; color: #1a2a40; margin: 0 0 4px; }
.page-sub    { font-size: 13px; color: #9ca3af; margin: 0; }

.table-card  { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
.table-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid #f1f3f5; }
.table-title  { font-size: 15px; font-weight: 600; color: #1a2a40; margin: 0; }
.badge-count  { display: inline-flex; align-items: center; justify-content: center; background: #fef3c7; color: #d97706; font-size: 11px; font-weight: 700; border-radius: 20px; padding: 2px 8px; margin-left: 8px; }

.spinner-wrap { padding: 32px; text-align: center; }

.chip { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.chip-resolved  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

.actions-wrap { display: flex; align-items: center; gap: 4px; }
.action-icon  { width: 32px; height: 32px; border: none; background: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9ca3af; transition: all 0.15s; }
.action-icon:hover           { background: #f3f4f6; color: #1a2a40; }
.action-icon.check:hover     { background: #f0fdf4; color: #16a34a; }
.action-icon.sanction:hover  { background: #fff1f0; color: #e53e4f; }

.user-link           { color: #1e4d8c; font-weight: 500; }
.user-link.clickable { cursor: pointer; text-decoration: underline; }
.user-link.clickable:hover { color: #1a2a40; }
.empty-msg { text-align: center; color: #9ca3af; font-size: 13px; padding: 32px; }

:deep(.p-datatable)                      { background: #ffffff !important; }
:deep(.p-datatable-table-container)      { background: #ffffff !important; }
:deep(.p-datatable-thead > tr > th)      { background: #f8f9fa !important; color: #374151 !important; border-color: #e5e7eb !important; }
:deep(.p-datatable-tbody > tr)           { background: #ffffff !important; color: #374151 !important; }
:deep(.p-datatable-tbody > tr:nth-child(even)) { background: #f9fafb !important; }
:deep(.p-datatable-tbody > tr:hover)     { background: #f0f4ff !important; }
:deep(.p-datatable-tfoot > tr > td)      { background: #ffffff !important; }
:deep(.p-paginator)                      { background: #ffffff !important; border-color: #e5e7eb !important; }

.resolved-box    { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.resolved-header { padding: 14px 16px; border-bottom: 1px solid #f1f3f5; display: flex; align-items: center; gap: 8px; }
.resolved-title  { font-size: 14px; font-weight: 600; color: #1a2a40; }
.resolved-count  { background: #f0fdf4; color: #16a34a; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
.resolved-item   { padding: 12px 16px; border-bottom: 1px solid #f1f3f5; transition: background 0.15s; }
.resolved-item:hover      { background: #f8f9fb; }
.resolved-item:last-child { border-bottom: none; }
.resolved-top    { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.resolved-user   { font-size: 13px; font-weight: 600; color: #1e4d8c; }
.resolved-reason { font-size: 12px; color: #6b7280; margin-bottom: 6px; line-height: 1.4; }
.resolved-meta   { display: flex; justify-content: space-between; align-items: center; }
.resolved-empty  { text-align: center; color: #9ca3af; font-size: 13px; padding: 24px; }
.badge-tutor {
  display: inline-block; background: #e0f2fe; color: #0284c7; font-size: 0.7rem;
  font-weight: 700; padding: 2px 8px; border-radius: 20px; margin-left: 6px; vertical-align: middle;
}
.badge-aprendiz {
  display: inline-block; background: #f0fdf4; color: #16a34a; font-size: 0.7rem;
  font-weight: 700; padding: 2px 8px; border-radius: 20px; margin-left: 6px; vertical-align: middle;
}
</style>