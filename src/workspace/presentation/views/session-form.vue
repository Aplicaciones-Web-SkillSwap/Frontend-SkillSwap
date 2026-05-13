<script setup>
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import useWorkspaceStore from "@/workspace/application/workspace.store.js";
import {computed, onMounted, ref} from "vue";
import {Session} from "@/workspace/domain/model/session-entity.js";

const {t}    = useI18n();
const router = useRouter();
const route  = useRoute();
const store  = useWorkspaceStore();
const { addSession, errors, updateSession } = store;

const form = ref({
  learnerId:   null,
  tutorId:     null,
  topic:       '',
  status:      'pending',
  scheduledAt: '',
  courseId:    null,
});

const isEdit = computed(() => !!route.params.id);

const statusOptions = [
  { label: 'Pending',   value: 'pending'   },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected',  value: 'rejected'  },
];

onMounted(() => {
  console.log('route params:', route.params.id);
  if (isEdit.value) {
    const sessionFound = getSessionById(route.params.id);
    console.log('session found:', sessionFound);
    if (sessionFound) {
      form.value.learnerId   = sessionFound.learnerId;
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

function getSessionById(id) {
  return store.getSessionById(id);
}

const saveSession = () => {
  const session = new Session({
    id:          isEdit.value ? parseInt(route.params.id) : null,
    learnerId:   form.value.learnerId,
    tutorId:     form.value.tutorId,
    topic:       form.value.topic,
    status:      form.value.status,
    scheduledAt: form.value.scheduledAt,
    courseId:    form.value.courseId,
  });
  if (isEdit.value) updateSession(session); else addSession(session);
  navigateBack();
};

const navigateBack = () => {
  router.push({name: 'workspace-sessions'});
};
</script>

<template>
  <div class="p-4 form-container">

    <div class="form-wrapper">

      <div class="flex align-items-center mb-4 gap-3">
        <pv-button icon="pi pi-arrow-left" text rounded class="back-btn" @click="navigateBack" />
        <h1 class="page-title m-0">{{ isEdit ? t('session.edit-title') : t('session.new-title') }}</h1>
      </div>

      <div class="form-card">
        <form @submit.prevent="saveSession">

          <div class="field mb-4">
            <label for="learnerId" class="custom-label">{{ t('session.learnerId') }}</label>
            <pv-input-number id="learnerId" v-model="form.learnerId" class="w-full custom-input" :min="1" required/>
          </div>

          <div class="field mb-4">
            <label for="tutorId" class="custom-label">{{ t('session.tutorId') }}</label>
            <pv-input-number id="tutorId" v-model="form.tutorId" class="w-full custom-input" :min="1" required/>
          </div>

          <div class="field mb-4">
            <label for="topic" class="custom-label">{{ t('session.topic') }}</label>
            <pv-input-text id="topic" v-model="form.topic" class="w-full custom-input" required/>
          </div>

          <div class="field mb-4">
            <label for="status" class="custom-label">{{ t('session.status') }}</label>
            <pv-select
                id="status"
                v-model="form.status"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                class="w-full custom-input"/>
          </div>

          <div class="field mb-4">
            <label for="scheduledAt" class="custom-label">{{ t('session.scheduledAt') }}</label>
            <pv-input-text id="scheduledAt" v-model="form.scheduledAt" class="w-full custom-input" placeholder="2026-06-01T10:00"/>
          </div>

          <div class="field mb-5">
            <label for="courseId" class="custom-label">{{ t('session.courseId') }}</label>
            <pv-input-number id="courseId" v-model="form.courseId" class="w-full custom-input" :min="1"/>
          </div>

          <div class="flex justify-content-end gap-3 mt-2 border-top-1 pt-4 border-gray-200">
            <pv-button :label="t('session.cancel')" text class="cancel-btn" @click="navigateBack"/>
            <pv-button :label="t('session.save')" type="submit" class="save-btn"/>
          </div>

        </form>
      </div>

      <div v-if="errors.length" class="text-red-500 mt-3 error-msg">
        {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Contenedor general (aprovecha el espacio, igual que la tabla) */
.form-container {
  width: 100%;
  padding: 0 2rem;
}

/* Envoltorio del formulario para que tenga un tamaño máximo prudente */
.form-wrapper {
  max-width: 600px;
  margin: 0 auto; /* Centra la tarjeta en la pantalla */
}

/* Título */
.page-title {
  color: #1a2a40;
  font-weight: 800;
  font-size: 1.8rem;
}

.back-btn {
  color: #1a2a40 !important;
}

.back-btn:hover {
  background-color: #f0f2f5 !important;
}

/* Estilo de la tarjeta blanca */
.form-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 2.5rem;
  border: 1px solid #f0f2f5;
}

/* Estilo para los nombres de los campos (Labels) */
.custom-label {
  display: block;
  font-weight: 700;
  color: #4a5568;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

/* Modificando los inputs de PrimeVue para que se vean modernos */
:deep(.custom-input),
:deep(.p-inputtext),
:deep(.p-select) {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

:deep(.p-inputtext:focus),
:deep(.p-select.p-focus) {
  border-color: #1a2a40;
  box-shadow: 0 0 0 1px #1a2a40;
}

/* Botones de acción */
.save-btn {
  background-color: #e2e8f0 !important; /* Azul oscuro del proyecto */
  border: none !important;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.6rem 1.5rem;
}

.save-btn:hover {
  background-color: #a0aec0 !important;
}

.cancel-btn {
  color: #64748b !important; /* Color gris sutil */
  font-weight: bold;
}

.cancel-btn:hover {
  background-color: #f8fafc !important;
}

.error-msg {
  font-weight: bold;
  text-align: center;
}
</style>