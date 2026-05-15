<script setup>
import { useI18n }    from 'vue-i18n'
import { useRouter }  from 'vue-router'
import { computed, ref } from 'vue'

const { t, locale } = useI18n()
const router = useRouter()

const localeOptions = ref([
  { label: 'EN', value: 'en' },
  { label: 'ES', value: 'es' }
])

const currentLocale = computed({
  get: () => localeOptions.value.find(o => o.value === locale.value),
  set: (opt) => {
    locale.value = opt.value
    localStorage.setItem('skillswap-locale', opt.value)
  }
})

const menuItems = computed(() => [
  { label: t('nav.home'),   command: () => router.push('/home') },
  { label: t('nav.about'),  command: () => router.push('/about') },
  { label: t('nav.tutors'), command: () => router.push('/home') },
  { label: t('nav.reviews'),command: () => router.push('/reputation/reviews') },
])
</script>

<template>
  <div class="layout">
    <pv-menubar :model="menuItems" class="layout__nav">
      <template #start>
        <span class="layout__brand" @click="router.push('/home')">SkillSwap</span>
      </template>
      <template #end>
        <pv-select-button
            v-model="currentLocale"
            :options="localeOptions"
            option-label="label"
            :allow-empty="false"
            size="small"
        />
      </template>
    </pv-menubar>

    <main class="layout__content">
      <router-view />
    </main>

    <footer class="layout__footer">
      <p>SkillSwap &copy; {{ new Date().getFullYear() }}</p>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout__brand {
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  margin-right: 1rem;
  white-space: nowrap;
}

.layout__content {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
}

/* Tablet */
@media (max-width: 960px) {
  .layout__content {
    padding: 1.5rem 1rem;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .layout__content {
    padding: 1rem 0.75rem;
  }
}

.layout__footer {
  text-align: center;
  padding: 1rem;
  font-size: 0.85rem;
  color: #94a3b8;
  border-top: 1px solid #e2e8f0;
}
</style>