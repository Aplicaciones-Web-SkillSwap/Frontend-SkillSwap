<script setup>
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {ref} from "vue";
import LanguageSwitcher from "@/shared/presentation/components/language-switcher.vue";
import FooterContent from "@/shared/presentation/components/footer-content.vue";

const { t } = useI18n();
const router = useRouter();

const drawer = ref(false);
const toggleDrawer = () => { drawer.value = !drawer.value; }

const items = [
  { label: 'option.home',     path: '/home'               },
  { label: 'option.sessions', path: '/workspace/sessions' },
  { label: 'option.wallets',  path: '/payment/wallets'    },
]

const navigateToSearch = () => {
  router.push({ name: 'discovery-search' });
}
</script>

<template>
  <pv-toast/>
  <pv-confirm-dialog/>

  <!-- app-shell ocupa el 100% del alto de la pantalla y apila header → contenido → footer -->
  <div class="app-shell">

    <!-- ═══ HEADER (sticky: queda arriba al hacer scroll y no sale del flujo) ═══ -->
    <div class="header">
      <pv-toolbar class="custom-toolbar">
        <template #start>
          <pv-button class="p-button-text text-color" icon="pi pi-bars" @click="toggleDrawer" />
          <div class="brand-container">
            <h3>SkillSwap</h3>
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

          <!-- Lupa → navega a Find Tutors -->
          <i
              class="pi pi-search action-icon search-icon"
              :title="t('option.search')"
              @click="navigateToSearch">
          </i>

          <div class="notification-container action-icon">
            <i class="pi pi-bell"></i>
            <span class="notification-badge">2</span>
          </div>
        </template>
        <template #center></template>
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

            <i class="pi pi-search action-icon"></i>

            <!-- Campanita SIN badge de notificación -->
            <div class="notification-container action-icon">
              <i class="pi pi-bell"></i>
            </div>

            <pv-avatar
                image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png"
                shape="circle"
                class="user-avatar"
            />

            <pv-button
                label="Cerrar Sesión"
                class="logout-btn"
                rounded
            />

            <language-switcher/>
          </div>
        </template>
      </pv-toolbar>
      <pv-drawer v-model:visible="drawer"/>
    </div>

    <!-- ═══ CONTENIDO PRINCIPAL (crece para llenar el espacio disponible) ═══ -->
    <div class="main-content">
      <router-view/>
    </div>

    <!-- ═══ FOOTER (siempre al fondo, nunca encima del contenido) ═══ -->
    <div class="footer">
      <footer-content/>
      <div class="admin-bar">
        <router-link to="/moderation/reports" class="btn-admin">
          <i class="pi pi-shield"></i>
          {{ t('moderation.admin-btn') }}
        </router-link>
      </div>
    </div>

          <pv-avatar
              image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png"
              shape="circle"
              class="user-avatar"
          />

          <pv-button
              label="Cerrar Sesión"
              class="logout-btn"
              rounded
          />

          <language-switcher/>
        </div>
      </template>
    </pv-toolbar>

    <pv-drawer v-model:visible="drawer"/>
  </div>

  <div class="main-content">
    <router-view/>
  </div>

  <div class="footer">
    <footer-content/>
  </div>
</template>

<style scoped>
/* ── Estructura general de página ── */
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Header sticky (permanece arriba al hacer scroll, ocupa espacio en el flujo) ── */
.header {
  position: sticky;
  top: 0;
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); /* Sombra ligera inferior */
  z-index: 1000;
}

/* Quitar fondo azul del Toolbar de PrimeVue */
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

/* ── Contenido principal (flex: 1 lo hace crecer y empuja el footer hacia abajo) ── */
.main-content {
  flex: 1;
  padding: 28px 2.5rem;   /* margen lateral para que nada quede pegado a los bordes */
}

/* ── Acciones de la navbar ── */
.right-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

/* Links de navegación */
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

/* Indicador de sección activa */
.nav-link.router-link-active,
.nav-link.router-link-exact-active {
  color: #e53e4f;
  border-bottom: 2px solid #e53e4f;
}

/* Íconos */
.action-icon {
  font-size: 1.4rem;
  color: #000000;
  cursor: pointer;
  transition: color 0.2s;
}

/* Efecto hover específico para la lupa */
.search-icon:hover {
  color: #e53e4f;
}

/* Campanita (sin badge) */
.notification-container {
  display: flex;
  align-items: center;
}

/* Avatar */
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

/* ── Footer (siempre al fondo, nunca flotante) ── */
.footer {
  width: 100%;
  background-color: #f8f9fa;
}

/* ── Barra con botón Profesor Admin ── */
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
</style>
