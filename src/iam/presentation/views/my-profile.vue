<script setup>
import {useI18n}    from "vue-i18n";
import {useRouter}  from "vue-router";
import {computed, onMounted, ref, watch} from "vue";
import useAuthStore       from "@/iam/application/auth.store.js";
import useDiscoveryStore  from "@/discovery/application/discovery.store.js";
import useReputationStore from "@/reputation/application/reputation.store.js";
import {IamApi}           from "@/iam/infrastructure/iam-api.js";
import {UserAssembler}    from "@/iam/infrastructure/user.assembler.js";
import {deriveUniversityFromEmail} from "@/shared/utils/derive-university.js";
import {formatDate}       from "@/shared/utils/format-date.js";

const {t}    = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const discoveryStore = useDiscoveryStore();
const reputationStore = useReputationStore();
const iamApi = new IamApi();

const viewMode = ref('learner');
const viewModeOptions = computed(() => [
  {label: t('profile.tab-learner'), value: 'learner'},
  {label: t('profile.tab-tutor'), value: 'tutor'},
]);

const university = computed(() => deriveUniversityFromEmail(authStore.user?.email));

/** Bio del aprendiz */
const learnerBio = ref('');
const learnerSaving = ref(false);
const learnerSaved  = ref(false);

/** Perfil de tutor: puede no existir todavía */
const existingTutor = computed(() => discoveryStore.getTutorByUserId(authStore.user?.id));
const tutorBio    = ref('');
const tutorSkills = ref([]);
const tutorVisible = ref(true);
const skillInput   = ref('');
const tutorSaving  = ref(false);
const tutorSaved   = ref(false);

const skillSuggestions = computed(() =>
    discoveryStore.uniqueSkills
        .filter(s => !tutorSkills.value.includes(s))
        .filter(s => !skillInput.value.trim() || s.toLowerCase().includes(skillInput.value.toLowerCase()))
);

const addSkill = (skill) => {
  const value = (skill ?? skillInput.value).trim();
  if (value && !tutorSkills.value.includes(value)) tutorSkills.value.push(value);
  skillInput.value = '';
};

const removeSkill = (skill) => {
  tutorSkills.value = tutorSkills.value.filter(s => s !== skill);
};

const loadTutorTab = () => {
  const tutor = existingTutor.value;
  if (tutor) {
    tutorBio.value     = tutor.bio;
    tutorSkills.value  = [...tutor.skills];
    tutorVisible.value = tutor.visible;
  } else {
    tutorBio.value     = '';
    tutorSkills.value  = [];
    tutorVisible.value = true;
  }
};

onMounted(async () => {
  if (!discoveryStore.tutorsLoaded) await discoveryStore.fetchTutors();
  if (!reputationStore.reviewsLoaded) reputationStore.fetchReviews();
  if (!authStore.usersDirectoryLoaded) authStore.fetchAllUsers();

  if (authStore.user?.id) {
    const response = await iamApi.getUserById(authStore.user.id);
    const freshUser = UserAssembler.toEntityFromResponse(response);
    learnerBio.value = freshUser.bio;
    authStore.updateUser(freshUser);
  }

  loadTutorTab();
});

watch(viewMode, (mode) => {
  if (mode === 'tutor') loadTutorTab();
});

const saveLearnerBio = async () => {
  learnerSaving.value = true;
  learnerSaved.value  = false;
  const response = await iamApi.updateBio(authStore.user.id, learnerBio.value);
  const updatedUser = UserAssembler.toEntityFromResponse(response);
  authStore.updateUser(updatedUser);
  learnerSaving.value = false;
  learnerSaved.value  = true;
};

const saveTutorProfile = async () => {
  tutorSaving.value = true;
  tutorSaved.value  = false;

  if (existingTutor.value) {
    await discoveryStore.updateTutor({
      id: existingTutor.value.id,
      bio: tutorBio.value,
      skills: tutorSkills.value,
      avatarUrl: existingTutor.value.avatarUrl || '',
      mainSubject: tutorSkills.value[0] || '',
      visible: tutorVisible.value,
    });
  } else {
    const created = await discoveryStore.createTutor({
      userId: authStore.user.id,
      name: authStore.user.username,
      university: university.value,
      career: '',
      bio: tutorBio.value,
      skills: tutorSkills.value,
      avatarUrl: '',
      experienceYears: 0,
      mainSubject: tutorSkills.value[0] || '',
    });
    // CreateTutor always starts Visible=true server-side; sync it down if the user picked "Oculto" before saving.
    if (created && !tutorVisible.value) {
      await discoveryStore.updateTutor({
        id: created.id,
        bio: created.bio,
        skills: created.skills,
        avatarUrl: created.avatarUrl || '',
        mainSubject: created.mainSubject || '',
        visible: false,
      });
    }
  }

  tutorSaving.value = false;
  tutorSaved.value  = true;
};

/** Reseñas que me dejaron los tutores como aprendiz (no las que yo escribí) */
const reviewsReceivedAsLearner = computed(() =>
    reputationStore.reviews.filter(r => r.learnerId === authStore.user?.id && r.reviewerId !== authStore.user?.id)
);
/** Reseñas que me dejaron los aprendices como tutor (no las que yo escribí) */
const reviewsReceivedAsTutor = computed(() =>
    reputationStore.reviews.filter(r => r.tutorId === authStore.user?.id && r.reviewerId !== authStore.user?.id)
);

/** Una sola lista de reseñas visible a la vez, según la pestaña activa */
const activeReviews = computed(() => viewMode.value === 'learner' ? reviewsReceivedAsLearner.value : reviewsReceivedAsTutor.value);

/** Resuelve el nombre real de cualquier usuario por su userId */
const userName = (id) => authStore.getUsername(id) || `Usuario #${id}`;

const navigateBack = () => router.push({name: 'home'});
</script>

<template>
  <div class="p-4 profile-container">

    <div class="header-actions flex align-items-center gap-3 mb-4">
      <pv-button icon="pi pi-arrow-left" text class="btn-back" @click="navigateBack"/>
      <h1 class="page-title m-0">{{ t('profile.title') }}</h1>
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

    <!-- Pestaña Aprendiz -->
    <div v-if="viewMode === 'learner'" class="section-card">
      <div class="field-group">
        <label class="field-label">{{ t('profile.name') }}</label>
        <div class="readonly-value">{{ authStore.user?.username }}</div>
      </div>

      <div class="field-group">
        <label class="field-label">{{ t('profile.university') }}</label>
        <div class="readonly-value">{{ university }}</div>
      </div>

      <div class="field-group">
        <label class="field-label">{{ t('profile.bio-learner') }}</label>
        <pv-textarea v-model="learnerBio" rows="4" class="w-full" :placeholder="t('profile.bio-placeholder')"/>
      </div>

      <div class="btn-row">
        <pv-button :label="t('profile.save')" class="btn-save" :loading="learnerSaving" @click="saveLearnerBio"/>
        <span v-if="learnerSaved" class="saved-hint"><i class="pi pi-check-circle mr-1"/>{{ t('profile.saved') }}</span>
      </div>
    </div>

    <!-- Pestaña Tutor -->
    <div v-else class="section-card">
      <div class="field-group">
        <label class="field-label">{{ t('profile.name') }}</label>
        <div class="readonly-value">{{ authStore.user?.username }}</div>
      </div>

      <div class="field-group">
        <label class="field-label">{{ t('profile.university') }}</label>
        <div class="readonly-value">{{ university }}</div>
      </div>

      <div class="field-group">
        <label class="field-label">{{ t('profile.bio-tutor') }}</label>
        <pv-textarea v-model="tutorBio" rows="4" class="w-full" :placeholder="t('profile.bio-placeholder')"/>
      </div>

      <div class="field-group">
        <label class="field-label">{{ t('profile.courses') }}</label>

        <div class="skills-row mb-2">
          <span v-for="skill in tutorSkills" :key="skill" class="skill-tag">
            {{ skill }}
            <i class="pi pi-times skill-remove" @click="removeSkill(skill)"/>
          </span>
          <span v-if="tutorSkills.length === 0" class="no-skills-hint">{{ t('profile.no-courses') }}</span>
        </div>

        <div class="add-skill-row">
          <pv-select
              v-model="skillInput"
              editable
              :options="skillSuggestions"
              :placeholder="t('profile.add-course-placeholder')"
              class="flex-1"
              @keyup.enter="addSkill()"/>
          <pv-button icon="pi pi-plus" :label="t('profile.add')" class="btn-add-skill" @click="addSkill()"/>
        </div>
        <small class="field-hint">
          <i class="pi pi-info-circle mr-1"/> {{ t('profile.courses-hint') }}
        </small>
      </div>

      <div class="field-group">
        <label class="field-label">{{ t('profile.visibility') }}</label>
        <pv-select-button
            v-model="tutorVisible"
            :allow-empty="false"
            :options="[{label: t('profile.visible'), value: true}, {label: t('profile.hidden'), value: false}]"
            option-label="label"
            option-value="value"
            class="visibility-toggle"/>
        <small class="field-hint">
          <i class="pi pi-info-circle mr-1"/> {{ t('profile.visibility-hint') }}
        </small>
      </div>

      <div class="btn-row">
        <pv-button :label="t('profile.save')" class="btn-save" :loading="tutorSaving" @click="saveTutorProfile"/>
        <span v-if="tutorSaved" class="saved-hint"><i class="pi pi-check-circle mr-1"/>{{ t('profile.saved') }}</span>
      </div>
    </div>

    <!-- Mis reseñas: cambia según la pestaña activa -->
    <div class="section-card mt-4">
      <h3 class="section-title">{{ t(viewMode === 'learner' ? 'profile.reviews-received-learner' : 'profile.reviews-received') }}</h3>
      <div v-if="activeReviews.length === 0" class="empty-reviews">
        <p class="empty-title">{{ t(viewMode === 'learner' ? 'profile.no-reviews-received-learner' : 'profile.no-reviews-received') }}</p>
      </div>
      <div v-else class="reviews-list">
        <div v-for="review in activeReviews" :key="review.id" class="review-card">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar"><i class="pi pi-user reviewer-avatar-icon"/></div>
              <div>
                <p class="reviewer-name">{{ userName(review.reviewerId) }}</p>
                <p class="review-date">{{ formatDate(review.reviewedAt) }}</p>
              </div>
            </div>
            <div class="review-stars">
              <span v-for="n in Math.floor(review.rating)" :key="'f'+n" class="star star-full">★</span>
              <span v-for="n in (5 - Math.floor(review.rating))" :key="'e'+n" class="star star-empty">★</span>
              <span class="score-badge">{{ review.rating }}</span>
            </div>
          </div>
          <p class="review-comment">{{ review.comment }}</p>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.profile-container { width: 100%; padding: 0 2rem; max-width: 850px; margin: 0 auto; }

.page-title { color: #1a2a40; font-weight: 800; font-size: 2rem; }
.btn-back   { color: #1a2a40 !important; }

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

.visibility-toggle :deep(.p-togglebutton) {
  border-color: #e2e8f0;
  color: #4a5568;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.45rem 1rem;
}
.visibility-toggle :deep(.p-togglebutton.p-togglebutton-checked) {
  background-color: #16a34a;
  border-color: #16a34a;
  color: #ffffff;
}

.section-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #f0f2f5;
}

.section-title { color: #1a2a40; font-weight: 800; font-size: 1.05rem; margin: 0 0 1rem 0; }

.field-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
.field-label { color: #8c98a4; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
.field-hint  { color: #64748b; font-size: 0.8rem; display: flex; align-items: center; margin-top: 0.3rem; }

.readonly-value {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.65rem 0.9rem;
  color: #1a2a40;
  font-weight: 600;
  font-size: 0.95rem;
}

.skills-row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.skill-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background-color: #f0f2f5;
  color: #4a5568;
  padding: 0.35rem 0.4rem 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}
.skill-remove {
  cursor: pointer;
  color: #94a3b8;
  font-size: 0.7rem;
  padding: 0.25rem;
  border-radius: 50%;
}
.skill-remove:hover { color: #e53e4f; background: #fee2e2; }
.no-skills-hint { color: #a0aec0; font-size: 0.85rem; }

.add-skill-row { display: flex; gap: 0.6rem; }
.btn-add-skill {
  background-color: #1e4d8c !important;
  border: none !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  white-space: nowrap;
}
.btn-add-skill:hover { background-color: #163d72 !important; }

.btn-row { display: flex; align-items: center; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #f0f2f5; }
.btn-save {
  background-color: #e53e4f !important;
  border: none !important;
  font-weight: bold;
  border-radius: 8px;
  padding: 0.6rem 1.8rem;
  color: white !important;
}
.btn-save:hover { background-color: #d03544 !important; }
.saved-hint { color: #16a34a; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; }

.reviews-list { display: flex; flex-direction: column; gap: 1rem; }
.review-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #f0f2f5;
}
.review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
.reviewer-info { display: flex; align-items: center; gap: 0.75rem; }
.reviewer-avatar {
  width: 36px; height: 36px; border-radius: 50%; background-color: #e2e8f0;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.reviewer-avatar-icon { color: #718096; font-size: 0.9rem; }
.reviewer-name { color: #1a2a40; font-weight: 700; font-size: 0.9rem; margin: 0; }
.review-date   { color: #a0aec0; font-size: 0.75rem; margin: 0; }
.review-stars  { display: flex; align-items: center; gap: 0.1rem; }
.star          { font-size: 1rem; }
.star-full     { color: #f5a623; }
.star-empty    { color: #e2e8f0; }
.score-badge {
  background-color: #fef3c7; color: #d97706; padding: 0.1rem 0.5rem;
  border-radius: 20px; font-size: 0.75rem; font-weight: 700; margin-left: 0.3rem;
}
.review-comment { color: #4a5568; font-size: 0.88rem; margin: 0; line-height: 1.6; }

.empty-reviews { text-align: center; padding: 1.5rem; }
.empty-title   { color: #a0aec0; font-size: 0.9rem; margin: 0; }
</style>
