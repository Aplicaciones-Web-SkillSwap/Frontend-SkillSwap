<script lang="js" setup>
import { useI18n }           from "vue-i18n";
import { useRouter }         from "vue-router";
import { ref, computed, onMounted } from "vue";
import LanguageSwitcher      from "@/shared/presentation/components/language-switcher.vue";
import FooterContent         from "@/shared/presentation/components/footer-content.vue";
import useWorkspaceStore     from "@/workspace/application/workspace.store.js";
import useAuthStore          from "@/iam/application/auth.store.js";

const { t }  = useI18n();
const router = useRouter();
const drawer = ref(false);
const store  = useWorkspaceStore();
const authStore = useAuthStore();

const logout = () => {
  authStore.logout();
  router.push({ name: 'login' });
};

onMounted(() => {
  if (!store.sessionsLoaded) store.fetchSessions();
});

const pendingCount = computed(() =>
    store.sessions.filter(s => s.tutorId === authStore.user?.id && s.status === 'pending').length
);

const toggleDrawer   = () => { drawer.value = !drawer.value; };
const navigateToSearch = () => { router.push({ name: 'discovery-search' }); };
const navigateToPending = () => { router.push({ name: 'workspace-sessions' }); };

const isCoordinator = computed(() => authStore.user?.role === 'Coordinator');

const items = computed(() => [
  { label: 'option.home',     path: isCoordinator.value ? '/dashboard' : '/home' },
  { label: 'option.sessions', path: '/workspace/sessions' },
  { label: 'option.wallets',  path: '/payment/wallets'    },
  ...(isCoordinator.value ? [{ label: 'option.quizzes', path: '/learning/quizzes' }] : []),
]);
</script>

<template>
  <pv-toast/>
  <pv-confirm-dialog :pt="{ footer: { style: 'display: flex; width: 100%; box-sizing: border-box; flex-direction: row-reverse; justify-content: flex-end; align-items: center; gap: 0.75rem;' } }"/>

  <div class="app-shell">

    <div class="header">
      <pv-toolbar class="custom-toolbar">
        <template #start>
          <pv-button class="p-button-text text-color" icon="pi pi-bars" @click="toggleDrawer" />
          <div class="brand-container">
            <h3>SkillSwap</h3>
          </div>
        </template>

        <template #center>
        </template>

        <template #end>
          <div class="right-actions">
            <router-link
                v-for="item in items"
                :key="item.label"
                :to="item.path"
                class="nav-link"
            >
              {{ t(item.label) }}
            </router-link>


            <i
                class="pi pi-search action-icon search-icon"
                :title="t('option.search')"
                @click="navigateToSearch">
            </i>

            <div
                class="notification-container action-icon"
                :title="pendingCount > 0 ? `${pendingCount} solicitudes pendientes` : 'Sin notificaciones'"
                @click="navigateToPending">
              <i class="pi pi-bell"></i>
              <span v-if="pendingCount > 0" class="notification-badge">{{ pendingCount }}</span>
            </div>

            <pv-avatar
                image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png"
                shape="circle"
                class="user-avatar"
                :title="t('profile.title')"
                @click="router.push({ name: 'profile' })"
            />

            <pv-button
                label="Cerrar Sesión"
                class="logout-btn"
                rounded
                @click="logout"
            />

            <language-switcher/>
          </div>
        </template>
      </pv-toolbar>

      <pv-drawer v-model:visible="drawer" header="SkillSwap">
        <div class="drawer-links">
          <router-link
              v-for="item in items"
              :key="item.label"
              :to="item.path"
              class="drawer-link"
              @click="drawer = false">
            {{ t(item.label) }}
          </router-link>
          <router-link
              to="/discovery/search"
              class="drawer-link"
              @click="drawer = false">
            {{ t('option.search') }}
          </router-link>
        </div>
      </pv-drawer>
    </div>


    <div class="main-content">
      <router-view/>
    </div>


    <div class="footer">
      <footer-content/>
      <div v-if="isCoordinator" class="admin-bar">
        <router-link to="/dashboard" class="btn-admin">
          <i class="pi pi-shield"></i>
          {{ t('moderation.admin-btn') }}
        </router-link>
      </div>
    </div>

  </div>
</template>

<style scoped>

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}


.header {
  position: sticky;
  top: 0;
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  z-index: 1000;
}


.custom-toolbar {
  background-color: transparent !important;
  border: none !important;
  padding: 0.5rem 2rem;
}

.brand-container h3 {
  color: #1a2a40;
  font-weight: 700;
  font-size: 1.6rem;
  margin: 0;
  margin-left: 0.5rem;
}

.text-color {
  color: #1a2a40 !important;
}


.main-content {
  flex: 1;
  padding: 28px 2.5rem;
}


.right-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}


.nav-link {
  text-decoration: none;
  color: #000000;
  font-weight: 600;
  font-size: 1rem;
  transition: color 0.2s;
  padding-bottom: 3px;
  border-bottom: 2px solid transparent;
}

.nav-link:hover {
  color: #e53e4f;
}


.nav-link.router-link-active,
.nav-link.router-link-exact-active {
  color: #e53e4f;
  border-bottom: 2px solid #e53e4f;
}


.action-icon {
  font-size: 1.4rem;
  color: #000000;
  cursor: pointer;
  transition: color 0.2s;
}


.search-icon:hover {
  color: #e53e4f;
}

/* Campanita y badge */
.notification-container {
  position: relative;
  display: flex;
  align-items: center;
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background-color: #e53e4f;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
}


.user-avatar {
  width: 40px;
  height: 40px;
  cursor: pointer;
}

/* Botón Cerrar Sesión */
.logout-btn {
  background-color: #e53e4f !important;
  border: none !important;
  color: white !important;
  font-weight: 600;
  padding: 0.5rem 1.2rem;
}

.logout-btn:hover {
  background-color: #d03544 !important;
}


.footer {
  width: 100%;
  background-color: #f8f9fa;
}


.admin-bar {
  display: flex;
  justify-content: center;
  padding: 6px 0 8px;
  background-color: #1a2a40;
}

.btn-admin {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255,255,255,0.08);
  color: #c8d9f0;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
}

.btn-admin:hover {
  background: rgba(255,255,255,0.18);
  color: #ffffff;
  border-color: rgba(255,255,255,0.4);
}
.drawer-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.drawer-link {
  text-decoration: none;
  color: #1a2a40;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  transition: background 0.15s;
}

.drawer-link:hover { background: #f1f5f9; }

.drawer-link.router-link-active {
  background: #f0f4ff;
  color: #1e4d8c;
}

</style>