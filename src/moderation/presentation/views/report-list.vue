<script setup>
import { onMounted, computed, ref } from 'vue';
import { useI18n }             from 'vue-i18n';
import { useRouter }           from 'vue-router';
import useModerationStore      from '@/moderation/application/moderation.store.js';
import useAuthStore            from '@/iam/application/auth.store.js';
import { formatDate }          from '@/shared/utils/format-date.js';
import { usePolling }          from '@/shared/composables/use-polling.js';

const { t }  = useI18n();
const router = useRouter();
const store  = useModerationStore();
const authStore = useAuthStore();

const activeReports   = computed(() => store.activeReports);
const resolvedReports = computed(() => store.resolvedReports);
const searchQuery     = ref('');

/**
 * Pendientes primero (de la más antigua a la más reciente por fecha de reporte),
 * luego resueltos (de la más reciente a la más antigua por fecha de resolución).
 */
const sortedReports = computed(() => {
  const pending = [...activeReports.value].sort(
      (a, b) => new Date(a.reportedAt) - new Date(b.reportedAt)
  );
  const resolved = [...resolvedReports.value].sort(
      (a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt)
  );
  return [...pending, ...resolved];
});

const filteredReports = computed(() => {
  if (!searchQuery.value.trim()) return sortedReports.value;
  const q = searchQuery.value.toLowerCase().trim();
  return sortedReports.value.filter(r =>
      userName(r.reporterUserId).toLowerCase().includes(q) ||
      userName(r.reportedUserId).toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
  );
});

onMounted(() => {
  store.fetchReports();
  store.fetchSanctions();
  if (!authStore.usersDirectoryLoaded) authStore.fetchAllUsers();
});

/**
 * Refresca reportes y sanciones periódicamente para que el moderador vea casos nuevos
 * sin recargar. `silent: true` evita que cada tick vuelva a mostrar el spinner de carga.
 */
const REPORTS_POLL_INTERVAL_MS = 6000;
usePolling(() => {
  store.fetchReports({ silent: true });
  store.fetchSanctions({ silent: true });
}, REPORTS_POLL_INTERVAL_MS, { immediate: false });

const userName = (id) => authStore.getUsername(id) || `Usuario #${id}`;

/**
 * Un reporte cerrado puede haber terminado en una sanción real (warning/ban)
 * o haber sido desestimado sin sanción (ya sea directo, o vía el formulario
 * de sanción con tipo "dismissed").
 */
const reportOutcome = (report) => {
  if (!report.closed) return 'pending';
  const sanction = store.sanctions.find(s => s.reportId === report.id);
  return sanction && sanction.type !== 'dismissed' ? 'sanctioned' : 'dismissed';
};

const statusLabel = (report) => {
  const outcome = reportOutcome(report);
  if (outcome === 'pending')    return t('moderation.status-pending');
  if (outcome === 'sanctioned') return t('moderation.status-sanctioned');
  return t('moderation.status-dismissed');
};

const statusChipClass = (report) => {
  const outcome = reportOutcome(report);
  if (outcome === 'pending')    return 'chip chip-pending';
  if (outcome === 'sanctioned') return 'chip chip-sanctioned';
  return 'chip chip-dismissed';
};

// ── Detalle del reporte (se abre al hacer click en la fila) ──
const selectedReport = ref(null);
const openReport  = (report) => { selectedReport.value = report; };
const closeReport = () => { selectedReport.value = null; };

/** PATCH /Reports/{id}/close — única acción de resolución soportada por el backend */
function resolveReport(report) {
  store.closeReport(report.id);
  closeReport();
}

const navigateToSanction = (report) => {
  router.push({
    name:  'moderation-sanctions-new',
    query: { reportId: report.id, sanctionedUserId: report.reportedUserId }
  });
};

const navigateToChat = (report) => {
  closeReport();
  router.push({ name: 'moderation-reports-chat', params: { userId: report.reportedUserId }, query: { reportId: report.id } });
};
</script>

<template>
  <div>

    <div class="page-header">
      <h1 class="page-title">{{ t('moderation.reports-title') }}</h1>
      <p class="page-sub">{{ t('moderation.reports-sub') }}</p>
    </div>

    <div class="table-card">
      <div class="table-header">
        <span class="table-title">
          {{ t('moderation.table-reports') }}
          <span class="badge-count">{{ sortedReports.length }}</span>
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
          :value="filteredReports"
          :rows="10"
          paginator
          row-hover
          striped-rows
          size="small"
          table-style="min-width: 50rem;"
          class="clickable-rows"
          @row-click="({ data }) => openReport(data)"
      >
        <pv-column :header="t('moderation.col-reporter')" field="reporterUserId">
          <template #body="{ data }">
            <span>{{ userName(data.reporterUserId) }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('moderation.col-reported')" field="reportedUserId">
          <template #body="{ data }">
            <span>{{ userName(data.reportedUserId) }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('moderation.col-status')" field="status">
          <template #body="{ data }">
            <span :class="statusChipClass(data)">{{ statusLabel(data) }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('moderation.col-date')" field="reportedAt">
          <template #body="{ data }">
            <span style="color:#6b7280; font-size:13px;">{{ formatDate(data.reportedAt) }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('moderation.col-resolved-date')" field="resolvedAt">
          <template #body="{ data }">
            <span style="color:#6b7280; font-size:13px;">{{ data.resolvedAt ? formatDate(data.resolvedAt) : '—' }}</span>
          </template>
        </pv-column>

        <template #empty>
          <p class="empty-msg">{{ t('moderation.no-active') }}</p>
        </template>
      </pv-data-table>
    </div>

    <!-- Detalle del reporte -->
    <pv-dialog
        :visible="!!selectedReport"
        @update:visible="closeReport"
        modal
        :header="t('moderation.report-detail-title')"
        style="width: 480px;"
    >
      <div v-if="selectedReport" class="detail-body">

        <div class="detail-row">
          <span class="detail-label">{{ t('moderation.col-reporter') }}</span>
          <span class="detail-value">{{ userName(selectedReport.reporterUserId) }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">{{ t('moderation.col-reported') }}</span>
          <span class="detail-value user-link clickable" @click="navigateToChat(selectedReport)">
            {{ userName(selectedReport.reportedUserId) }}
          </span>
        </div>

        <div class="detail-row">
          <span class="detail-label">{{ t('moderation.col-reason') }}</span>
          <p class="detail-reason">{{ selectedReport.reason }}</p>
        </div>

        <div class="detail-row">
          <span class="detail-label">{{ t('moderation.col-status') }}</span>
          <span :class="statusChipClass(selectedReport)">{{ statusLabel(selectedReport) }}</span>
        </div>

        <div class="detail-row two-col">
          <div>
            <span class="detail-label">{{ t('moderation.col-date') }}</span>
            <p class="detail-value">{{ formatDate(selectedReport.reportedAt) }}</p>
          </div>
          <div>
            <span class="detail-label">{{ t('moderation.col-resolved-date') }}</span>
            <p class="detail-value">{{ selectedReport.resolvedAt ? formatDate(selectedReport.resolvedAt) : '—' }}</p>
          </div>
        </div>

        <div v-if="!selectedReport.closed" class="detail-actions">
          <button class="btn-sanction" type="button" @click="navigateToSanction(selectedReport)">
            <i class="pi pi-gavel"></i> Sancionar
          </button>
          <button class="btn-dismiss" type="button" @click="resolveReport(selectedReport)">
            <i class="pi pi-times-circle"></i> Desestimar
          </button>
        </div>

      </div>
    </pv-dialog>

  </div>
</template>

<style scoped>
.page-header { margin-bottom: 20px; }
.page-title  { font-size: 24px; font-weight: 700; color: #1a2a40; margin: 0 0 4px; }
.page-sub    { font-size: 13px; color: #9ca3af; margin: 0; }

.table-card  { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
.table-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid #f1f3f5; }
.table-title  { font-size: 15px; font-weight: 600; color: #1a2a40; margin: 0; }
.badge-count  { display: inline-flex; align-items: center; justify-content: center; background: #fef3c7; color: #d97706; font-size: 11px; font-weight: 700; border-radius: 20px; padding: 2px 8px; margin-left: 8px; }

.spinner-wrap { padding: 32px; text-align: center; }

.chip { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.chip-sanctioned { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
.chip-dismissed  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.chip-pending    { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }

.user-link           { color: #1e4d8c; font-weight: 500; }
.user-link.clickable { cursor: pointer; text-decoration: underline; }
.user-link.clickable:hover { color: #1a2a40; }
.empty-msg { text-align: center; color: #9ca3af; font-size: 13px; padding: 32px; }

:deep(.clickable-rows .p-datatable-tbody > tr) { cursor: pointer; }
:deep(.p-datatable)                      { background: #ffffff !important; }
:deep(.p-datatable-table-container)      { background: #ffffff !important; }
:deep(.p-datatable-thead > tr > th)      { background: #f8f9fa !important; color: #374151 !important; border-color: #e5e7eb !important; text-align: left !important; }
:deep(.p-datatable-tbody > tr)           { background: #ffffff !important; color: #374151 !important; }
:deep(.p-datatable-tbody > tr > td)      { text-align: left !important; }
:deep(.p-datatable-tbody > tr:nth-child(even)) { background: #f9fafb !important; }
:deep(.p-datatable-tbody > tr:hover)     { background: #f0f4ff !important; }
:deep(.p-datatable-tfoot > tr > td)      { background: #ffffff !important; }
:deep(.p-paginator)                      { background: #ffffff !important; border-color: #e5e7eb !important; }

/* Diálogo de detalle */
.detail-body   { display: flex; flex-direction: column; gap: 16px; }
.detail-row    { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.detail-row.two-col { flex-direction: row; gap: 24px; }
.detail-label  { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
.detail-value  { font-size: 14px; font-weight: 600; color: #1a2a40; margin: 2px 0 0; }
.detail-reason { font-size: 14px; color: #374151; margin: 2px 0 0; line-height: 1.5; }

.detail-actions { display: flex; justify-content: center; gap: 10px; padding-top: 8px; border-top: 1px solid #f1f3f5; margin-top: 4px; }
.btn-sanction, .btn-dismiss {
  display: inline-flex; align-items: center; gap: 6px;
  border: none; border-radius: 8px; padding: 10px 16px;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit;
}
.btn-sanction { background: #fff1f0; color: #e53e4f; }
.btn-sanction:hover { background: #ffe1de; }
.btn-dismiss  { background: #f3f4f6; color: #4b5563; }
.btn-dismiss:hover  { background: #e5e7eb; }
</style>
