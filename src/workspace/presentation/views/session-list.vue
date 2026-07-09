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
const { fetchSessions, acceptSession, rejectSession, cancelSession } = store;

/** Vista activa: 'learner' (sesiones donde soy aprendiz) o 'tutor' (sesiones donde soy tutor) */
const viewMode = ref('learner');
const viewModeOptions = computed(() => [
  { label: t('sessions.tab-learner'), value: 'learner' },
  { label: t('sessions.tab-tutor'),   value: 'tutor' },
]);

/** Sesiones donde participo, separadas por el rol que cumplo en cada una */
const learnerSessions = computed(() => store.sessions.filter(s => s.learnerId === authStore.user?.id));
const tutorSessions   = computed(() => store.sessions.filter(s => s.tutorId === authStore.user?.id));
const sessions = computed(() => viewMode.value === 'learner' ? learnerSessions.value : tutorSessions.value);

onMounted(() => {
  if (!store.sessionsLoaded) {
    fetchSessions();
    sessionsLoaded.value = store.sessionsLoaded;
  }
  if (!discoveryStore.tutorsLoaded) discoveryStore.fetchTutors();
});

/** Resuelve el nombre de un tutor/learner por su userId */
const userName = (id) => {
  const tutor = discoveryStore.tutors.find(t => t.userId === id);
  return tutor ? tutor.name : `Usuario #${id}`;
};

const navigateToEdit      = (id) => router.push({name: 'workspace-sessions-edit', params: {id}});
const navigateToNew       = ()    => router.push({name: 'workspace-sessions-new'});
const navigateToWorkspace = (id)  => router.push({name: 'workspace-sessions-view', params: {id}});


const confirmAccept = (session) => {
  confirm.require({
    message: t('sessions.confirm-accept', {topic: session.topic}),
    header:  t('sessions.accept-header'),
    icon:    'pi pi-check-circle',
    accept:  () => { acceptSession(session); },
  });
};

const confirmReject = (session) => {
  confirm.require({
    message: t('sessions.confirm-reject', {topic: session.topic}),
    header:  t('sessions.reject-header'),
    icon:    'pi pi-times-circle',
    accept:  () => { rejectSession(session); },
  });
};

const confirmCancel = (session) => {
  confirm.require({
    message: t('sessions.confirm-cancel', {topic: session.topic}),
    header:  t('sessions.cancel-header'),
    icon:    'pi pi-exclamation-triangle',
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

        <pv-column :header="t('sessions.id')" field="id" sortable>
          <template #body="slotProps">
            <span class="text-id">#{{ slotProps.data.id }}</span>
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
                  icon="pi pi-comments"
                  rounded text
                  class="action-btn-view"
                  :title="t('sessions.action-view')"
                  @click="navigateToWorkspace(slotProps.data.id)" />


              <pv-button
                  v-if="slotProps.data.status === 'pending' && slotProps.data.tutorId === authStore.user?.id"
                  icon="pi pi-check"
                  rounded text
                  class="action-btn-accept"
                  :title="t('sessions.action-accept')"
                  @click="confirmAccept(slotProps.data)" />


              <pv-button
                  v-if="slotProps.data.status === 'pending' && slotProps.data.tutorId === authStore.user?.id"
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

    <pv-confirm-dialog/>
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

.status-scheduled { background-color: #e0f2fe; color: #0284c7; }
.status-pending   { background-color: #fef3c7; color: #d97706; }
.status-completed { background-color: #dcfce7; color: #16a34a; }
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
</style>