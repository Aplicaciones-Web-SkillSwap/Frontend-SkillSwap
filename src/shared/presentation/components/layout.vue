<script setup>
import {useI18n} from "vue-i18n";
import {ref} from "vue";
import LanguageSwitcher from "@/shared/presentation/components/language-switcher.vue";
import FooterContent from "@/shared/presentation/components/footer-content.vue";

const { t } = useI18n();

const drawer = ref(false);
const toggleDrawer = () => {
  drawer.value = !drawer.value;
}

const items = [
  { label: 'option.home',     path: '/home'               },
  { label: 'option.about',    path: '/about'              },
  { label: 'option.sessions', path: '/workspace/sessions' },
]
</script>

<template>
  <pv-toast/>
  <pv-confirm-dialog/>
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

          <i class="pi pi-search action-icon"></i>

          <div class="notification-container action-icon">
            <i class="pi pi-bell"></i>
            <span class="notification-badge">2</span>
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
.header {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); /* Sombra ligera inferior */
}

/* Sobrescribiendo estilos del Toolbar para quitar el fondo azul */
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

/* Contenedor derecho usando Flexbox para separar los elementos */
.right-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

/* Estilo para los links simulando texto plano */
.nav-link {
  text-decoration: none;
  color: #000000;
  font-weight: 600;
  font-size: 1rem;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #e53e4f;
}

/* Íconos */
.action-icon {
  font-size: 1.4rem;
  color: #000000;
  cursor: pointer;
}

/* Contenedor de la campanita y su número */
.notification-container {
  position: relative;
  display: flex;
  align-items: center;
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background-color: #e53e4f; /* Rojo parecido a la imagen */
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
}

/* Avatar */
.user-avatar {
  width: 40px;
  height: 40px;
  cursor: pointer;
}

/* Botón de Cerrar Sesión tipo "píldora" */
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

.main-content {
  margin-top: 80px; /* Ajustado para que el header no tape la vista */
}

.footer {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  padding: 10px;
  background-color: #f8f9fa;
}
</style>