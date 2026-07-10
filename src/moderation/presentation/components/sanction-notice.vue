<script setup>
import { computed } from 'vue';
import { useI18n }  from 'vue-i18n';
import { useRouter } from 'vue-router';
import useModerationStore from '@/moderation/application/moderation.store.js';
import useAuthStore       from '@/iam/application/auth.store.js';
import { formatDate }     from '@/shared/utils/format-date.js';

const { t }  = useI18n();
const router = useRouter();
const store  = useModerationStore();
const authStore = useAuthStore();

const sanction = computed(() => store.nextUnacknowledgedSanction);

/** Advertencias acumuladas por el usuario en el mes calendario de la sanción mostrada, incluyéndola */
const warningCountThisMonth = computed(() => {
  if (!sanction.value || sanction.value.type !== 'warning') return 0;
  const monthStart = new Date(sanction.value.createdAt.getFullYear(), sanction.value.createdAt.getMonth(), 1);
  return store.mySanctions.filter(s => s.type === 'warning' && s.createdAt >= monthStart).length;
});

const banUntilLabel = computed(() => {
  if (!sanction.value || sanction.value.type !== 'ban') return '';
  if (sanction.value.isPermanent) return t('moderation.notice-ban-title-permanent');
  return t('moderation.notice-ban-title-until', { date: formatDate(sanction.value.bannedUntil()) });
});

async function acknowledge() {
  if (!sanction.value) return;
  const wasBan = sanction.value.type === 'ban';
  await store.acknowledgeSanction(sanction.value.id);

  if (wasBan) {
    authStore.logout();
    router.push({ name: 'login' });
  }
}
</script>

<template>
  <pv-dialog
      :visible="!!sanction"
      modal
      :closable="false"
      style="width: 420px;"
  >
    <div v-if="sanction" class="notice-body">
      <template v-if="sanction.type === 'warning'">
        <i class="pi pi-exclamation-triangle notice-icon notice-warning"/>
        <h2 class="notice-title">{{ t('moderation.notice-warning-title') }}</h2>
        <p class="notice-description">{{ sanction.description }}</p>
        <p class="notice-count">{{ t('moderation.notice-warning-count', { count: warningCountThisMonth }) }}</p>
      </template>

      <template v-else>
        <i class="pi pi-ban notice-icon notice-ban"/>
        <h2 class="notice-title">{{ banUntilLabel }}</h2>
        <p class="notice-description">{{ sanction.description }}</p>
      </template>

      <button class="btn-ok" type="button" @click="acknowledge">
        {{ t('moderation.notice-btn-ok') }}
      </button>
    </div>
  </pv-dialog>
</template>

<style scoped>
.notice-body { text-align: center; padding: 0.5rem 0.5rem 0; }
.notice-icon { font-size: 2.8rem; display: block; margin-bottom: 1rem; }
.notice-warning { color: #d97706; }
.notice-ban      { color: #dc2626; }
.notice-title    { color: #1a2a40; font-weight: 800; font-size: 1.15rem; margin: 0 0 0.6rem; }
.notice-description { color: #4b5563; font-size: 0.9rem; margin: 0 0 0.75rem; line-height: 1.5; }
.notice-count    { color: #6b7280; font-size: 0.85rem; margin: 0 0 1.5rem; line-height: 1.5; }

.btn-ok {
  width: 100%;
  background: #e53e4f; color: #fff; border: none; border-radius: 8px;
  padding: 10px 20px; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: background 0.15s; font-family: inherit;
}
.btn-ok:hover { background: #d03544; }
</style>
