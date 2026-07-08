<script setup>
import { ref }        from 'vue';
import { useI18n }    from 'vue-i18n';
import { useRouter }  from 'vue-router';
import useAuthStore   from '@/iam/application/auth.store.js';

const { t }      = useI18n();
const router     = useRouter();
const authStore  = useAuthStore();

const form      = ref({ username: '', password: '' });
const submitting = ref(false);

function submit() {
  submitting.value = true;
  authStore.login(form.value)
      .then(() => router.push({ name: 'home' }))
      .catch(() => {})
      .finally(() => { submitting.value = false; });
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-brand">SkillSwap</h1>
      <p class="auth-sub">{{ t('auth.login-sub') }}</p>

      <form class="form-wrap" @submit.prevent="submit">
        <div class="field-group">
          <label class="field-label">{{ t('auth.username') }}</label>
          <pv-input-text v-model="form.username" fluid required autocomplete="username"/>
        </div>

        <div class="field-group">
          <label class="field-label">{{ t('auth.password') }}</label>
          <pv-password v-model="form.password" :feedback="false" toggle-mask fluid input-class="w-full" required autocomplete="current-password"/>
        </div>

        <p v-if="authStore.error" class="error-msg">
          <i class="pi pi-exclamation-circle mr-1"/> {{ authStore.error }}
        </p>

        <button class="btn-primary" type="submit" :disabled="submitting">
          <i v-if="submitting" class="pi pi-spin pi-spinner"/>
          {{ t('auth.login-submit') }}
        </button>
      </form>

      <p class="auth-switch">
        {{ t('auth.no-account') }}
        <router-link to="/register">{{ t('auth.go-register') }}</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1a2a40 0%, #2d4a6e 100%);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 2.5rem;
  border: 1px solid #f0f2f5;
}

.auth-brand {
  color: #1a2a40;
  font-weight: 800;
  font-size: 2rem;
  margin: 0 0 0.25rem 0;
  text-align: center;
}

.auth-sub {
  color: #718096;
  font-size: 0.9rem;
  margin: 0 0 1.75rem 0;
  text-align: center;
}

.form-wrap { display: flex; flex-direction: column; gap: 1.25rem; }
.field-group { display: flex; flex-direction: column; gap: 0.6rem; }
.field-label { font-weight: 700; color: #1a2a40; font-size: 0.95rem; }

.error-msg {
  font-weight: bold;
  background-color: #fee2e2;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  color: #dc2626;
  margin: 0;
  font-size: 0.85rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #e53e4f !important;
  border: none !important;
  color: #ffffff !important;
  font-weight: bold !important;
  border-radius: 8px;
  padding: 0.75rem 1.8rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  transition: background-color 0.15s;
}

.btn-primary:hover { background-color: #d03544 !important; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.auth-switch {
  text-align: center;
  margin: 1.75rem 0 0 0;
  color: #718096;
  font-size: 0.9rem;
}

.auth-switch a {
  color: #1e4d8c;
  font-weight: 700;
  text-decoration: none;
}

.auth-switch a:hover { text-decoration: underline; }
</style>
