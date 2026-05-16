<script setup>
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import useWorkspaceStore from "@/workspace/application/workspace.store.js";
import {computed, onMounted} from "vue";

const {t}     = useI18n();
const router  = useRouter();
const store   = useWorkspaceStore();
const { fetchSessions, acceptSession, rejectSession } = store;

onMounted(() => {
  if (!store.sessionsLoaded) fetchSessions();
});


const scheduledSessions = computed(() =>
    store.sessions.filter(s => s.status === 'scheduled' || s.status === 'completed').slice(0, 3)
);


const pendingSessions = computed(() =>
    store.sessions.filter(s => s.status === 'pending')
);


const onlineTutors = [
  { id: 1, name: 'Miguel Santos Medina', career: 'Ing. Software', university: 'PUCP', verified: true, online: true, favorite: true },
  { id: 2, name: 'Adrian Guevara Romero', career: 'Ing. Sistemas', university: 'Ulima', verified: true, online: true, favorite: true },
];

const statusClass = (status) => {
  const map = {
    scheduled: 'badge-scheduled',
    completed: 'badge-completed',
    pending:   'badge-pending',
    cancelled: 'badge-cancelled',
    rejected:  'badge-rejected',
  };
  return 'status-badge ' + (map[status] || '');
};

const statusLabel = (status) => {
  const map = {
    scheduled: 'Confirmada',
    completed: 'Completada',
    pending:   'Pendiente',
    cancelled: 'Cancelada',
    rejected:  'Rechazada',
  };
  return map[status] || status;
};

const navigateToSession = (id) => {
  router.push({ name: 'workspace-sessions-view', params: { id } });
};

const navigateToSessions = () => {
  router.push({ name: 'workspace-sessions' });
};
</script>

<template>
  <div class="dashboard-container">

    <div class="dashboard-grid">


      <div class="left-col">


        <div class="welcome-row">
          <h1 class="welcome-title">¡Bienvenida de nuevo, <span class="highlight">Alexandra</span>!</h1>
          <pv-button label="Aprender un nuevo tema" class="btn-learn" @click="navigateToSessions"/>
        </div>

        <!-- Sesiones programadas -->
        <div class="section">
          <h2 class="section-title">Sesiones programadas</h2>

          <div v-if="!store.sessionsLoaded" class="loading-state">
            <i class="pi pi-spin pi-spinner"/> Cargando sesiones...
          </div>

          <div v-else-if="scheduledSessions.length === 0" class="empty-sessions">
            <p>No tienes sesiones programadas aún.</p>
          </div>

          <div v-else class="sessions-list">
            <div
                v-for="session in scheduledSessions"
                :key="session.id"
                class="session-card">

              <div class="session-card-header">
                <h3 class="session-topic">{{ session.topic }}</h3>
                <span :class="statusClass(session.status)">{{ statusLabel(session.status) }}</span>
              </div>

              <div class="session-card-body">
                <p><strong>Tutor:</strong> Usuario #{{ session.tutorId }}</p>
                <p><strong>Estudiante:</strong> Usuario #{{ session.learnerId }}</p>
                <p v-if="session.scheduledAt"><strong>Fecha:</strong> {{ session.scheduledAt.split('T')[0] }}</p>
                <p v-if="session.scheduledAt"><strong>Hora:</strong> {{ session.scheduledAt.split('T')[1] }}</p>
              </div>

              <pv-button
                  label="Ver detalles"
                  class="btn-details w-full"
                  @click="navigateToSession(session.id)"/>
            </div>
          </div>

          <pv-button
              label="Abrir Calendario"
              class="btn-calendar w-full mt-3"
              icon="pi pi-calendar"
              @click="navigateToSessions"/>
        </div>

      </div>


      <div class="right-col">


        <div class="section">
          <div class="section-header-row">
            <h2 class="section-title">Solicitudes</h2>
            <span class="link-ver-todas" @click="navigateToSessions">Ver todas</span>
          </div>

          <p v-if="pendingSessions.length > 0" class="pending-count">
            ¡Tienes {{ pendingSessions.length }} solicitud{{ pendingSessions.length > 1 ? 'es' : '' }} pendiente{{ pendingSessions.length > 1 ? 's' : '' }}!
          </p>
          <p v-else class="pending-count">No tienes solicitudes pendientes.</p>

          <div class="solicitudes-list">
            <div
                v-for="session in pendingSessions"
                :key="session.id"
                class="solicitud-card">
              <div class="solicitud-avatar">
                <i class="pi pi-user avatar-icon"/>
              </div>
              <div class="solicitud-info">
                <p class="solicitud-name">Usuario #{{ session.learnerId }}</p>
                <p class="solicitud-msg">{{ session.topic }}</p>
              </div>
              <div class="solicitud-actions">
                <pv-button
                    icon="pi pi-check"
                    rounded
                    class="btn-accept"
                    @click="acceptSession(session)"/>
                <pv-button
                    icon="pi pi-times"
                    rounded
                    class="btn-reject"
                    @click="rejectSession(session)"/>
              </div>
            </div>
          </div>
        </div>

        <!-- Mis tutores en línea -->
        <div class="section mt-4">
          <h2 class="section-title">Mis tutores en línea</h2>

          <div class="tutors-list">
            <div
                v-for="tutor in onlineTutors"
                :key="tutor.id"
                class="tutor-card">
              <div class="tutor-avatar-wrap">
                <div class="tutor-avatar">
                  <i class="pi pi-user tutor-avatar-icon"/>
                </div>
                <span class="online-dot"/>
              </div>
              <div class="tutor-info">
                <p class="tutor-name">
                  {{ tutor.name }}
                  <i v-if="tutor.verified" class="pi pi-check verified-icon"/>
                </p>
                <p class="tutor-career">{{ tutor.career }} - {{ tutor.university }}</p>
                <span class="btn-schedule">Programar sesión</span>
              </div>
              <i class="pi pi-heart heart-icon"/>
            </div>
          </div>

          <pv-button
              label="Ver todos mis tutores"
              class="btn-all-tutors w-full mt-3"/>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>

.dashboard-container {
  background-color: #f3f4f6;
  min-height: 100vh;
  padding: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}


.left-col, .right-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}


.section {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.section-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 1.3rem;
  margin: 0 0 1rem 0;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

/* Bienvenida */
.welcome-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.welcome-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 1.6rem;
  margin: 0;
}

.highlight { color: #1a2a40; }

.btn-learn {
  background-color: #f5a623 !important;
  border: none !important;
  color: #1a2a40 !important;
  font-weight: 800 !important;
  border-radius: 30px !important;
  padding: 0.7rem 1.5rem !important;
  white-space: nowrap;
}

.btn-learn:hover {
  background-color: #e09518 !important;
}

/* Tarjetas de sesión */
.sessions-list { display: flex; flex-direction: column; gap: 1rem; }

.session-card {
  background-color: #ffffff;
  border: 1px solid #e8ecf0;
  border-radius: 12px;
  padding: 1.25rem;
}

.session-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.session-topic {
  color: #1a2a40;
  font-weight: 800;
  font-size: 1.1rem;
  margin: 0;
}

.session-card-body { margin-bottom: 1rem; }

.session-card-body p {
  color: #4a5568;
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.session-card-body strong { color: #1a2a40; }

/* Status badges */
.status-badge {
  padding: 0.35rem 1rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.82rem;
}

.badge-scheduled { background-color: #dcfce7; color: #16a34a; }
.badge-completed  { background-color: #e0f2fe; color: #0284c7; }
.badge-pending    { background-color: #fef3c7; color: #d97706; }
.badge-cancelled,
.badge-rejected   { background-color: #fee2e2; color: #dc2626; }

/* Botones */
.btn-details {
  background-color: #1e4d8c !important;
  border: none !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  padding: 0.75rem !important;
}

.btn-details:hover { background-color: #163d72 !important; }

.btn-calendar {
  background-color: #1e4d8c !important;
  border: none !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  padding: 0.75rem !important;
}

.btn-calendar:hover { background-color: #163d72 !important; }

/* Loading y empty */
.loading-state { color: #718096; padding: 1rem 0; }
.empty-sessions { color: #a0aec0; font-size: 0.9rem; text-align: center; padding: 1rem; }

/* Solicitudes */
.pending-count {
  color: #4a5568;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
}

.link-ver-todas {
  color: #1e4d8c;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: none;
}

.link-ver-todas:hover { text-decoration: underline; }

.solicitudes-list { display: flex; flex-direction: column; gap: 0.75rem; }

.solicitud-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 10px;
}

.solicitud-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon { color: #718096; font-size: 1.1rem; }

.solicitud-info { flex: 1; min-width: 0; }

.solicitud-name {
  color: #1a2a40;
  font-weight: 700;
  font-size: 0.9rem;
  margin: 0 0 0.2rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.solicitud-msg {
  color: #718096;
  font-size: 0.8rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.solicitud-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }

.btn-accept {
  background-color: #16a34a !important;
  border: none !important;
  color: #ffffff !important;
  width: 34px !important;
  height: 34px !important;
}

.btn-reject {
  background-color: #dc2626 !important;
  border: none !important;
  color: #ffffff !important;
  width: 34px !important;
  height: 34px !important;
}

/* Tutores */
.tutors-list { display: flex; flex-direction: column; gap: 0.75rem; }

.tutor-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 10px;
}

.tutor-avatar-wrap { position: relative; flex-shrink: 0; }

.tutor-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #cbd5e0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tutor-avatar-icon { color: #718096; font-size: 1.3rem; }

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background-color: #16a34a;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.tutor-info { flex: 1; min-width: 0; }

.tutor-name {
  color: #1a2a40;
  font-weight: 700;
  font-size: 0.9rem;
  margin: 0 0 0.15rem 0;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.verified-icon { color: #0284c7; font-size: 0.8rem; }

.tutor-career {
  color: #718096;
  font-size: 0.8rem;
  margin: 0 0 0.4rem 0;
}

.btn-schedule {
  background-color: #f5a623;
  color: #1a2a40;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  cursor: pointer;
}

.heart-icon { color: #e53e4f; font-size: 1.2rem; flex-shrink: 0; }

.btn-all-tutors {
  background-color: #1e4d8c !important;
  border: none !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  padding: 0.75rem !important;
}

.btn-all-tutors:hover { background-color: #163d72 !important; }

/* Utilities */
.w-full  { width: 100%; }
.mt-3    { margin-top: 0.75rem; }
.mt-4    { margin-top: 1rem; }
</style>