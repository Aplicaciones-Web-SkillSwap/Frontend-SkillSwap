<script setup>
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue";
import useWorkspaceStore from "@/workspace/application/workspace.store.js";
import useDiscoveryStore from "@/discovery/application/discovery.store.js";
import useAuthStore      from "@/iam/application/auth.store.js";
import {computed, onMounted, ref, toRefs} from "vue";
import {formatDateTime} from "@/shared/utils/format-date.js";

const {t}     = useI18n();
const router  = useRouter();
const confirm = useConfirm();
const store   = useWorkspaceStore();
const discoveryStore = useDiscoveryStore();
const authStore = useAuthStore();
const { errors, sessionsLoaded } = toRefs(store);
const { fetchSessions, acceptSession, rejectSession, cancelSession, rescheduleSession } = store;

/** Vista activa: 'learner' (sesiones donde soy aprendiz) o 'tutor' (sesiones donde soy tutor) */
const viewMode = ref('learner');
const viewModeOptions = computed(() => [
  { label: t('sessions.tab-learner'), value: 'learner' },
  { label: t('sessions.tab-tutor'),   value: 'tutor' },
]);

/** Sesiones donde participo, separadas por el rol que cumplo en cada una. Las más nuevas primero. */
const learnerSessions = computed(() =>
    store.sessions.filter(s => s.learnerId === authStore.user?.id).sort((a, b) => b.id - a.id)
);
const tutorSessions   = computed(() =>
    store.sessions.filter(s => s.tutorId === authStore.user?.id).sort((a, b) => b.id - a.id)
);

/** Lista principal: solo el historial resuelto (agendadas, rechazadas, completadas) — lo pendiente vive en la caja lateral */
const resolvedStatuses = ['scheduled', 'in_progress', 'rejected', 'completed'];
const sessions = computed(() => {
  const source = viewMode.value === 'learner' ? learnerSessions.value : tutorSessions.value;
  return source.filter(s => resolvedStatuses.includes(s.status));
});

/** Caja lateral: solicitudes pendientes (como tutor) o estado de mis solicitudes enviadas (como aprendiz) */
const tutorPendingRequests = computed(() => tutorSessions.value.filter(s => s.status === 'pending'));
const learnerSentRequests  = computed(() => learnerSessions.value.filter(s => s.status === 'pending'));

/** True si me corresponde responder (no fui yo quien propuso la fecha/hora actual) */
const isMyTurn = (session) => session.proposedByUserId !== authStore.user?.id;

const rescheduleDialogVisible = ref(false);
const rescheduleTarget = ref(null);
const rescheduleDate   = ref(null);

const openReschedule = (session) => {
  rescheduleTarget.value = session;
  rescheduleDate.value   = session.scheduledAt ? new Date(session.scheduledAt) : new Date();
  rescheduleDialogVisible.value = true;
};

const confirmReschedule = async () => {
  if (!rescheduleTarget.value || !rescheduleDate.value) return;
  await rescheduleSession(rescheduleTarget.value, rescheduleDate.value.toISOString());
  rescheduleDialogVisible.value = false;
  rescheduleTarget.value = null;
};

onMounted(() => {
  if (!store.sessionsLoaded) {
    fetchSessions();
    sessionsLoaded.value = store.sessionsLoaded;
  }
  if (!discoveryStore.tutorsLoaded) discoveryStore.fetchTutors();
  // Siempre se refresca (no solo la primera vez) para incluir cuentas creadas después
  // de que el directorio ya se hubiera cargado en esta misma sesión del navegador.
  authStore.fetchAllUsers();
});

/** Resuelve el nombre real de cualquier usuario (tutor o aprendiz) por su userId */
const userName = (id) => authStore.getUsername(id) || `Usuario #${id}`;

const navigateToEdit      = (id) => router.push({name: 'workspace-sessions-edit', params: {id}});
const navigateToNew       = ()    => router.push({name: 'workspace-sessions-new'});
const navigateToWorkspace = (id)  => router.push({name: 'workspace-sessions-view', params: {id}});


const confirmAccept = (session) => {
  confirm.require({
    message: t('sessions.confirm-accept', {topic: session.topic}),
    header:  t('sessions.accept-header'),
    icon:    'pi pi-check-circle',
    acceptProps: { severity: 'success' },
    rejectProps: { severity: 'danger' },
    accept:  () => { acceptSession(session); },
  });
};

const confirmReject = (session) => {
  confirm.require({
    message: t('sessions.confirm-reject', {topic: session.topic}),
    header:  t('sessions.reject-header'),
    icon:    'pi pi-times-circle',
    acceptProps: { severity: 'success' },
    rejectProps: { severity: 'danger' },
    accept:  () => { rejectSession(session); },
  });
};

const confirmCancel = (session) => {
  confirm.require({
    message: t('sessions.confirm-cancel', {topic: session.topic}),
    header:  t('sessions.cancel-header'),
    icon:    'pi pi-exclamation-triangle',
    acceptProps: { severity: 'success' },
    rejectProps: { severity: 'danger' },
    accept:  () => { cancelSession(session); },
  });
};
</script>

<template>
  <div class="p-4 sessions-container">

    <div class="header-actions flex justify-content-between align-items-center mb-4">
      <h1 class="page-title m-0">{{ t('sessions.title') }}</h1>
      <pv-button
          v-if="viewMode === 'learner'"
          :label="t('sessions.new')"
          @click="navigateToNew"
          class="btn-new"
          icon="pi pi-plus"
      />
    </div>

    <div class="mb-4">
      <pv-select-button
          v-model="viewMode"
          :allow-empty="false"
          :options="viewModeOptions"
          option-label="label"
          option-value="value"
          class="view-toggle"/>
    </div>

    <div class="sessions-grid">

      <div class="left-col">
        <div class="table-card">
          <pv-data-table
              :loading="!sessionsLoaded"
              :rows="5"
              :rows-per-page-options="[5, 10, 25]"
              :value="sessions"
              paginator
              class="clean-table"
              table-style="min-width: 50rem">

            <template #empty>
              <p class="empty-msg">{{ t(viewMode === 'learner' ? 'sessions.empty-learner' : 'sessions.empty-tutor') }}</p>
            </template>

            <pv-column
                :header="t(viewMode === 'learner' ? 'sessions.counterpart-tutor' : 'sessions.counterpart-learner')"
                :field="viewMode === 'learner' ? 'tutorId' : 'learnerId'"
                sortable>
              <template #body="slotProps">
                <span class="text-neutral">
                  {{ userName(viewMode === 'learner' ? slotProps.data.tutorId : slotProps.data.learnerId) }}
                </span>
              </template>
            </pv-column>

            <pv-column :header="t('sessions.topic')" field="topic" sortable>
              <template #body="slotProps">
                <span class="text-topic">{{ slotProps.data.topic }}</span>
              </template>
            </pv-column>

            <pv-column :header="t('sessions.status')" field="status" sortable>
              <template #body="slotProps">
                <span :class="'status-badge status-' + slotProps.data.status">
                  {{ t('sessions.status-' + slotProps.data.status) }}
                </span>
              </template>
            </pv-column>

            <pv-column :header="t('sessions.scheduledAt')" field="scheduledAt" sortable>
              <template #body="slotProps">
                <span class="text-date">
                  <i class="pi pi-clock icon-clock"></i>
                  {{ formatDateTime(slotProps.data.scheduledAt) }}
                </span>
              </template>
            </pv-column>

            <pv-column :header="t('sessions.actions')">
              <template #body="slotProps">
                <div class="actions-cell">


                  <pv-button
                      v-if="slotProps.data.status !== 'rejected'"
                      icon="pi pi-comments"
                      rounded text
                      class="action-btn-view"
                      :title="t('sessions.action-view')"
                      @click="navigateToWorkspace(slotProps.data.id)" />


                  <pv-button
                      v-if="slotProps.data.status === 'pending' && isMyTurn(slotProps.data)"
                      icon="pi pi-check"
                      rounded text
                      class="action-btn-accept"
                      :title="t('sessions.action-accept')"
                      @click="confirmAccept(slotProps.data)" />


                  <pv-button
                      v-if="slotProps.data.status === 'pending' && isMyTurn(slotProps.data)"
                      icon="pi pi-times"
                      rounded text
                      class="action-btn-reject"
                      :title="t('sessions.action-reject')"
                      @click="confirmReject(slotProps.data)" />


                  <pv-button
                      v-if="slotProps.data.status === 'pending' || slotProps.data.status === 'scheduled'"
                      icon="pi pi-ban"
                      rounded text
                      class="action-btn-cancel"
                      :title="t('sessions.action-cancel')"
                      @click="confirmCancel(slotProps.data)" />


                  <pv-button
                      v-if="slotProps.data.status !== 'rejected'"
                      icon="pi pi-pencil"
                      rounded text
                      class="action-btn-edit"
                      :title="t('sessions.action-edit')"
                      @click="navigateToEdit(slotProps.data.id)" />
                </div>
              </template>
            </pv-column>

          </pv-data-table>
        </div>

        <div v-if="errors.length" class="text-red-500 mt-3 error-msg">
          {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
        </div>
      </div>

      <div class="right-col">

        <!-- Como tutor: solicitudes pendientes -->
        <div v-if="viewMode === 'tutor'" class="section">
          <h2 class="section-title">{{ t('sessions.sidebar-title-tutor') }}</h2>

          <p v-if="tutorPendingRequests.length === 0" class="empty-sidebar">{{ t('sessions.no-pending-requests') }}</p>

          <div v-else class="request-list">
            <div v-for="session in tutorPendingRequests" :key="session.id" class="request-card">
              <div class="request-avatar"><i class="pi pi-user avatar-icon"/></div>
              <div class="request-info">
                <p class="request-name">{{ userName(session.learnerId) }}</p>
                <p class="request-msg"><i class="pi pi-book" style="font-size:0.75rem; margin-right:3px;"/>{{ session.topic }}</p>
                <p class="request-date" v-if="session.scheduledAt">
                  <i class="pi pi-calendar" style="font-size:0.75rem; margin-right:3px;"/>{{ formatDateTime(session.scheduledAt) }}
                </p>
                <p v-if="session.initialMessage" class="request-note">
                  <i class="pi pi-comment" style="font-size:0.75rem; margin-right:3px;"/>{{ session.initialMessage }}
                </p>

                <div v-if="isMyTurn(session)" class="request-actions">
                  <pv-button icon="pi pi-check" rounded class="btn-accept" :title="t('sessions.action-accept')" @click="confirmAccept(session)"/>
                  <pv-button icon="pi pi-times" rounded class="btn-reject" :title="t('sessions.action-reject')" @click="confirmReject(session)"/>
                  <pv-button icon="pi pi-calendar" rounded class="btn-reschedule" :title="t('sessions.action-reschedule')" @click="openReschedule(session)"/>
                </div>
                <p v-else class="waiting-hint"><i class="pi pi-clock" style="font-size:0.75rem; margin-right:3px;"/>{{ t('sessions.waiting-for-learner') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Como aprendiz: estado de mis solicitudes -->
        <div v-else class="section">
          <h2 class="section-title">{{ t('sessions.sidebar-title-learner') }}</h2>

          <p v-if="learnerSentRequests.length === 0" class="empty-sidebar">{{ t('sessions.no-sent-requests') }}</p>

          <div v-else class="request-list">
            <div v-for="session in learnerSentRequests" :key="session.id" class="request-card">
              <div class="request-avatar"><i class="pi pi-user avatar-icon"/></div>
              <div class="request-info">
                <div class="flex justify-content-between align-items-center">
                  <p class="request-name">{{ userName(session.tutorId) }}</p>
                  <span :class="'status-badge status-' + session.status">{{ t('sessions.status-' + session.status) }}</span>
                </div>
                <p class="request-msg"><i class="pi pi-book" style="font-size:0.75rem; margin-right:3px;"/>{{ session.topic }}</p>
                <p class="request-date" v-if="session.scheduledAt">
                  <i class="pi pi-calendar" style="font-size:0.75rem; margin-right:3px;"/>{{ formatDateTime(session.scheduledAt) }}
                </p>
                <p v-if="session.initialMessage" class="request-note">
                  <i class="pi pi-comment" style="font-size:0.75rem; margin-right:3px;"/>{{ session.initialMessage }}
                </p>

                <template v-if="session.status === 'pending'">
                  <div v-if="isMyTurn(session)" class="request-actions">
                    <pv-button icon="pi pi-check" rounded class="btn-accept" :title="t('sessions.action-accept')" @click="confirmAccept(session)"/>
                    <pv-button icon="pi pi-calendar" rounded class="btn-reschedule" :title="t('sessions.action-counter')" @click="openReschedule(session)"/>
                  </div>
                  <p v-else class="waiting-hint"><i class="pi pi-clock" style="font-size:0.75rem; margin-right:3px;"/>{{ t('sessions.waiting-for-tutor') }}</p>
                </template>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <pv-dialog v-model:visible="rescheduleDialogVisible" modal :header="t('sessions.reschedule-title')" style="width: 420px;">
      <div class="reschedule-body">
        <label class="custom-label">{{ t('sessions.reschedule-label') }}</label>
        <pv-date-picker
            v-model="rescheduleDate"
            showTime
            hourFormat="12"
            dateFormat="dd/mm/yy"
            class="w-full"
            :minDate="new Date()"/>
      </div>
      <template #footer>
        <pv-button :label="t('session.cancel')" text @click="rescheduleDialogVisible = false"/>
        <pv-button :label="t('sessions.reschedule-confirm')" class="btn-save" @click="confirmReschedule"/>
      </template>
    </pv-dialog>
  </div>
</template>

<style scoped>

.sessions-container {
  width: 100%;
  padding: 0 2rem;
}


.page-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 2rem;
}

.btn-new {
  background-color: #e53e4f !important;
  border: none !important;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
}

.btn-new:hover {
  background-color: #d03544 !important;
}


.table-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 1rem;
  border: 1px solid #f0f2f5;
}


:deep(.clean-table .p-datatable-thead > tr > th) {
  background-color: #ffffff;
  color: #8c98a4;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #f0f2f5;
  padding: 1.5rem 1rem;
}


:deep(.clean-table .p-datatable-tbody > tr) {
  background-color: #ffffff;
  color: #333333;
}

:deep(.clean-table .p-datatable-tbody > tr > td) {
  padding: 1.2rem 1rem;
  border-bottom: 1px solid #f0f2f5;
}

:deep(.clean-table .p-datatable-tbody > tr:hover) {
  background-color: #fcfcfc;
}


.text-id      { color: #a0aec0; font-weight: 700; }
.text-topic   { color: #1a2a40; font-weight: 800; font-size: 0.95rem; }
.text-neutral { color: #4a5568; }
.text-date    { color: #718096; display: flex; align-items: center; }
.icon-clock   { margin-right: 0.5rem; color: #a0aec0; }


.status-badge {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.status-scheduled   { background-color: #e0f2fe; color: #0284c7; }
.status-pending     { background-color: #fef3c7; color: #d97706; }
.status-completed   { background-color: #dcfce7; color: #16a34a; }
.status-in_progress { background-color: #ede9fe; color: #7c3aed; }
.status-cancelled,
.status-rejected  { background-color: #fee2e2; color: #dc2626; }


.actions-cell {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}


.action-btn-view   { color: #1a2a40 !important; }
.action-btn-accept { color: #16a34a !important; }
.action-btn-reject { color: #dc2626 !important; }
.action-btn-cancel { color: #d97706 !important; }
.action-btn-edit   { color: #a0aec0 !important; }
.action-btn-delete { color: #e53e4f !important; }

.error-msg { font-weight: bold; }

.empty-msg { color: #94a3b8; text-align: center; padding: 2rem 0; margin: 0; }

.view-toggle :deep(.p-togglebutton) {
  border-color: #e2e8f0;
  color: #4a5568;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.6rem 1.2rem;
}

.view-toggle :deep(.p-togglebutton.p-togglebutton-checked) {
  background-color: #1a2a40;
  border-color: #1a2a40;
  color: #ffffff;
}

/* Layout de dos columnas: lista + caja lateral */
.sessions-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
  align-items: start;
}

.left-col, .right-col { display: flex; flex-direction: column; gap: 1rem; }

.section {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.section-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 1.2rem;
  margin: 0 0 1rem 0;
}

.empty-sidebar { color: #a0aec0; font-size: 0.9rem; margin: 0; }

.request-list { display: flex; flex-direction: column; gap: 0.75rem; }

.request-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem;
  background: #f8fafc;
  border-radius: 10px;
}

.request-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon { color: #718096; font-size: 1.05rem; }

.request-info { flex: 1; min-width: 0; }

.request-name {
  color: #1a2a40;
  font-weight: 700;
  font-size: 0.9rem;
  margin: 0 0 0.2rem 0;
}

.request-msg, .request-date {
  color: #718096;
  font-size: 0.78rem;
  margin: 0.1rem 0;
  display: flex;
  align-items: center;
}

.request-note {
  color: #4a5568;
  font-style: italic;
  font-size: 0.78rem;
  margin: 0.4rem 0 0 0;
  padding: 0.5rem 0.6rem;
  background: #ffffff;
  border-left: 2px solid #cbd5e0;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
}

.request-actions { display: flex; gap: 0.4rem; margin-top: 0.6rem; }

.btn-accept {
  background-color: #16a34a !important;
  border: none !important;
  color: #ffffff !important;
  width: 32px !important;
  height: 32px !important;
}

.btn-reject {
  background-color: #dc2626 !important;
  border: none !important;
  color: #ffffff !important;
  width: 32px !important;
  height: 32px !important;
}

.btn-reschedule {
  background-color: #1e4d8c !important;
  border: none !important;
  color: #ffffff !important;
  width: 32px !important;
  height: 32px !important;
}

.waiting-hint {
  color: #d97706;
  font-size: 0.78rem;
  margin: 0.6rem 0 0 0;
  display: flex;
  align-items: center;
}

.reschedule-body { display: flex; flex-direction: column; gap: 0.6rem; }

.custom-label {
  color: #8c98a4;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
}

.btn-save {
  background-color: #e53e4f !important;
  border: none !important;
  font-weight: bold;
  border-radius: 8px;
  color: white !important;
}

.btn-save:hover { background-color: #d03544 !important; }
</style>