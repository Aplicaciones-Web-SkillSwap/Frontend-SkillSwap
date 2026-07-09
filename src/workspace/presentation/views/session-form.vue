<script setup>
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useWorkspaceStore from "@/workspace/application/workspace.store.js";
import useAuthStore      from "@/iam/application/auth.store.js";
import {computed, onMounted, ref} from "vue";
import {Session} from "@/workspace/domain/model/session-entity.js";


/**
 * Session mutation and management form component.
 *
 * @remarks
 * Orchestrates form lifecycle data operations for single student-tutor sessions.
 * Resolves context conditionally via route states to pre-populate workspace models
 * or facilitate discovery redirection pathways.
 */
const {t}    = useI18n();
const router = useRouter();
const route  = useRoute();
const store  = useWorkspaceStore();
const authStore = useAuthStore();
const { addSession, errors, updateSession } = store;

/**
 * Local form field mappings bound to session properties.
 */
const form = ref({
  tutorId:     route.query.tutorId ? parseInt(route.query.tutorId) : null,
  topic:       '',
  status:      'pending',
  scheduledAt: '',
  courseId:    null,
  initialMessage: '',
});
const scheduledAtDate = computed({
  get() {
    return form.value.scheduledAt ? new Date(form.value.scheduledAt) : null;
  },
  set(val) {
    form.value.scheduledAt = val ? val.toISOString() : '';
  }
});

/**
 * Evaluates context state to verify if an active identifier parameters exists.
 */
const isEdit = computed(() => !!route.params.id);

/**
 * Flags if workflow context has originated directly out of discovery funnels.
 */
const comesFromDiscovery = computed(() => !!route.query.tutorId && !isEdit.value);

/**
 * Direct selection static items list used within dropdown models.
 */
const statusOptions = [
  { label: 'Pending',   value: 'pending'   },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected',  value: 'rejected'  },
];

onMounted(() => {
  console.log('route params:', route.params.id);
  console.log('route query tutorId:', route.query.tutorId);
  if (isEdit.value) {
    if (!store.sessionsLoaded) store.fetchSessions();
    const sessionFound = getSessionById(route.params.id);
    console.log('session found:', sessionFound);
    if (sessionFound) {
      form.value.tutorId     = sessionFound.tutorId;
      form.value.topic       = sessionFound.topic;
      form.value.status      = sessionFound.status;
      form.value.scheduledAt = sessionFound.scheduledAt;
      form.value.courseId    = sessionFound.courseId;
    } else {
      router.push({name: 'workspace-sessions'});
    }
  }
});

/**
 * Queries target instance matches relative to stored cache sets.
 */
function getSessionById(id) {
  return store.getSessionById(id);
}

/**
 * Packs transaction records into explicit session domains and pushes save streams.
 */
const saveSession = async () => {
  const session = new Session({
    id:          isEdit.value ? parseInt(route.params.id) : null,
    learnerId:   authStore.user?.id,
    tutorId:     form.value.tutorId,
    topic:       form.value.topic,
    status:      isEdit.value ? form.value.status : 'pending',
    scheduledAt: form.value.scheduledAt,
    courseId:    form.value.courseId,
  });

  if (isEdit.value) {
    updateSession(session);
  } else {
    const createdSession = await addSession(session);
    // Si el estudiante escribió un mensaje inicial, lo enviamos vinculado a la sesión creada
    if (createdSession && form.value.initialMessage.trim()) {
      await store.addMessage({
        sessionId: createdSession.id,
        senderId:  authStore.user?.id,
        content:   form.value.initialMessage.trim(),
        fileUrl:   null,
        fileName:  null,
      });
    }
  }
  navigateBack();
};

/**
 * Controls redirection steps back to historical workspace views or original workflows.
 */
const navigateBack = () => {

  if (route.query.tutorId && !isEdit.value) {
    router.push({ name: 'discovery-search' });
  } else {
    router.push({name: 'workspace-sessions'});
  }
};
</script>

<template>
  <div class="p-4 session-container">


    <div class="header-actions flex align-items-center gap-3 mb-4">
      <pv-button icon="pi pi-arrow-left" text class="action-btn-view" @click="navigateBack"/>
      <h1 class="page-title m-0">{{ isEdit ? t('session.edit-title') : t('session.new-title') }}</h1>
    </div>


    <div v-if="comesFromDiscovery" class="discovery-banner mb-4">
      <div class="icon-wrapper">
        <i class="pi pi-send banner-icon"/>
      </div>
      <div>
        <p class="banner-title">{{ t('session.from-discovery-title') }}</p>
        <p class="banner-sub">{{ t('session.from-discovery-sub') }}</p>
      </div>
    </div>


    <div class="table-card form-wrapper">
      <form @submit.prevent="saveSession" class="p-fluid">

        <div class="grid">

          <div class="col-12 md:col-6 field mb-4">
            <label class="custom-label">{{ t('session.learnerId') }}</label>
            <div class="readonly-value">{{ authStore.user?.username }}</div>
          </div>

          <div class="col-12 md:col-6 field mb-4">
            <label for="tutorId" class="custom-label">{{ t('session.tutorId') }}</label>
            <div v-if="isEdit" class="readonly-value">Tutor #{{ form.tutorId }}</div>
            <pv-input-number
                v-else
                id="tutorId"
                v-model="form.tutorId"
                class="w-full"
                :min="1"
                :disabled="comesFromDiscovery"
                required/>
            <small v-if="comesFromDiscovery" class="field-hint">
              <i class="pi pi-info-circle mr-1"/> {{ t('session.tutor-prefilled') }}
            </small>
          </div>

          <div class="col-12 field mb-4">
            <label for="topic" class="custom-label">{{ t('session.topic') }}</label>
            <pv-input-text id="topic" v-model="form.topic" class="w-full" required/>
          </div>

          <div class="col-12 field mb-4">
            <label for="initialMessage" class="custom-label">
              {{ t('session.initial-message') }}
              <span class="optional-tag">({{ t('session.optional') }})</span>
            </label>
            <pv-textarea
                id="initialMessage"
                v-model="form.initialMessage"
                rows="3"
                class="w-full"
                :placeholder="t('session.initial-message-ph')"/>
            <small class="field-hint">
              <i class="pi pi-info-circle mr-1"/> {{ t('session.initial-message-hint') }}
            </small>
          </div>

          <div class="col-12 md:col-4 field mb-4">
            <label class="custom-label">{{ t('session.status') }}</label>
            <div v-if="isEdit">
              <pv-select
                  id="status"
                  v-model="form.status"
                  :options="statusOptions"
                  option-label="label"
                  option-value="value"
                  class="w-full"/>
            </div>
            <div v-else class="status-readonly">
              <i class="pi pi-clock mr-2"/>
              Pendiente — el tutor decidirá si acepta
            </div>
          </div>

          <div class="col-12 md:col-4 field mb-4">
            <label for="scheduledAt" class="custom-label">{{ t('session.scheduledAt') }}</label>
            <pv-date-picker
                id="scheduledAt"
                v-model="scheduledAtDate"
                showTime
                hourFormat="12"
                dateFormat="dd/mm/yy"
                class="w-full"
                :minDate="new Date()"
                placeholder="Seleccioná fecha y hora"/>
          </div>

          <div class="col-12 md:col-4 field mb-4">
            <label for="courseId" class="custom-label">{{ t('session.courseId') }}</label>
            <pv-input-number id="courseId" v-model="form.courseId" class="w-full" :min="1"/>
          </div>

        </div>


        <div class="flex justify-content-end gap-3 mt-4 pt-4 border-top-1 border-300">
          <pv-button :label="t('session.cancel')" text class="btn-cancel" @click="navigateBack"/>
          <pv-button :label="t('session.save')"   type="submit" class="btn-save"/>
        </div>

      </form>
    </div>


    <div v-if="errors.length" class="text-red-500 mt-4 error-msg">
      <i class="pi pi-exclamation-circle mr-2"></i>
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>

  </div>
</template>

<style scoped>

.session-container {
  width: 100%;
  padding: 0 2rem;
  max-width: 1000px;
  margin: 0 auto;
}


.page-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 2rem;
}


.table-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 2.5rem;
  border: 1px solid #f0f2f5;
}


.discovery-banner {
  background: linear-gradient(135deg, #1a2a40 0%, #2d4a6e 100%);
  border-radius: 12px;
  padding: 1.25rem 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  box-shadow: 0 4px 15px rgba(26, 42, 64, 0.15);
}

.icon-wrapper {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.8rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-icon {
  font-size: 1.6rem;
  color: #60a5fa;
}

.banner-title {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
  margin: 0 0 0.2rem 0;
}

.banner-sub {
  color: #cbd5e1;
  font-size: 0.9rem;
  margin: 0;
}


.custom-label {
  display: block;
  font-weight: 700;
  color: #1a2a40;
  margin-bottom: 0.6rem;
  font-size: 0.95rem;
}

.field-hint {
  color: #64748b;
  font-size: 0.8rem;
  margin-top: 0.4rem;
  display: flex;
  align-items: center;
}

.readonly-value {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.65rem 0.9rem;
  color: #1a2a40;
  font-weight: 600;
  font-size: 0.95rem;
}


.action-btn-view {
  color: #1a2a40 !important;
}

.action-btn-view:hover {
  background-color: #f8fafc !important;
}

.btn-save {
  background-color: #e53e4f !important;
  border: none !important;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.6rem 1.8rem;
  color: white !important;
}

.btn-save:hover {
  background-color: #d03544 !important;
}

.btn-cancel {
  color: #4a5568 !important;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.6rem 1.5rem;
}

.btn-cancel:hover {
  background-color: #f8f9fa !important;
}


.error-msg {
  font-weight: bold;
  background-color: #fee2e2;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  color: #dc2626;
}
.optional-tag { color: #a0aec0; font-weight: 500; font-size: 0.8rem; }
</style>