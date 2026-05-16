<script setup>
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue";
import useWorkspaceStore from "@/workspace/application/workspace.store.js";
import {onMounted, toRefs} from "vue";

/**
 * Sessions record dashboard management component.
 *
 * @remarks
 * Coordinates collection processing arrays bound to workspace entities. Supports
 * data table listing models, structural workflow redirections, and multi-state
 * state transitions backed by transaction confirmation modals.
 */
const {t}     = useI18n();
const router  = useRouter();
const confirm = useConfirm();
const store   = useWorkspaceStore();
const { sessions, errors, sessionsLoaded } = toRefs(store);
const { fetchSessions, deleteSession, acceptSession, rejectSession, cancelSession } = store;

onMounted(() => {
  if (!store.sessionsLoaded) {
    fetchSessions();
    console.log('fetching sessions:', sessions);
    sessionsLoaded.value = store.sessionsLoaded;
  }
});

/**
 *  structural route updates targeting selected record identification keys.
 */
const navigateToEdit = (id) => {
  router.push({name: 'workspace-sessions-edit', params: {id}});
};

/**
 * Diverts layout context towards new entity initialization views.
 */
const navigateToNew = () => {
  router.push({name: 'workspace-sessions-new'});
};

/**
 * Directs navigation flow into dedicated single interactive sub-view states.
 */
const navigateToWorkspace = (id) => {
  router.push({name: 'workspace-sessions-view', params: {id}});
};

/**
 *  runtime context via confirm sub-routines prior to purging elements.
 */
const confirmDelete = (session) => {
  confirm.require({
    message: t('sessions.confirm-delete', {topic: session.topic}),
    header:  t('sessions.delete-header'),
    icon:    'pi pi-exclamation-triangle',
    accept:  () => { deleteSession(session); },
  });
};

/**
 * Approves an existing session record through UI confirmation wrappers.
 */
const confirmAccept = (session) => {
  confirm.require({
    message: t('sessions.confirm-accept', {topic: session.topic}),
    header:  t('sessions.accept-header'),
    icon:    'pi pi-check-circle',
    accept:  () => { acceptSession(session); },
  });
};

/**
 * Rejects an upcoming request entry via functional fallback accept channels.
 */
const confirmReject = (session) => {
  confirm.require({
    message: t('sessions.confirm-reject', {topic: session.topic}),
    header:  t('sessions.reject-header'),
    icon:    'pi pi-times-circle',
    accept:  () => { rejectSession(session); },
  });
};

/**
 * active processing streams and switches parameters to cancelled labels.
 */
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
          :label="t('sessions.new')"
          @click="navigateToNew"
          class="btn-new"
          icon="pi pi-plus"
      />
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

        <pv-column :header="t('sessions.learnerId')" field="learnerId" sortable>
          <template #body="slotProps">
            <span class="text-neutral">{{ slotProps.data.learnerId }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('sessions.tutorId')" field="tutorId" sortable>
          <template #body="slotProps">
            <span class="text-neutral">{{ slotProps.data.tutorId }}</span>
          </template>
        </pv-column>

        <pv-column :header="t('sessions.scheduledAt')" field="scheduledAt" sortable>
          <template #body="slotProps">
            <span class="text-date">
              <i class="pi pi-clock icon-clock"></i>
              {{ slotProps.data.scheduledAt }}
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
                  v-if="slotProps.data.status === 'pending'"
                  icon="pi pi-check"
                  rounded text
                  class="action-btn-accept"
                  :title="t('sessions.action-accept')"
                  @click="confirmAccept(slotProps.data)" />


              <pv-button
                  v-if="slotProps.data.status === 'pending'"
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


              <pv-button
                  icon="pi pi-trash"
                  rounded text
                  class="action-btn-delete"
                  :title="t('sessions.action-delete')"
                  @click="confirmDelete(slotProps.data)" />

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
</style>