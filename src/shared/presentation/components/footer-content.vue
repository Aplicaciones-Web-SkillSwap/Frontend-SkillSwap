<script setup>
import {useI18n} from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <div class="footer-container">
    <div class="footer-content">
      <p class="footer-text">Copyright &copy; 2026. Innovify Studios</p>
      <p class="footer-text">
        {{ t('authoring-phrase.intro') }}
        <i class="pi pi-heart heart-icon"></i>
        {{ t('authoring-phrase.use') }}
        <a href="https://primevue.org/" target="_blank" class="footer-link">PrimeVue</a>
        {{ t('authoring-phrase.author', {brand: 'Innovify'}) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Contenedor principal con tu color azul oscuro */
.footer-container {
  background-color: #1a2a40;
  padding: 1.5rem 0;
  width: 100%;
}

/* Centrado de texto simple */
.footer-content {
  text-align: center;
  color: #ffffff; /* Letras blancas para contrastar el fondo oscuro */
}

/* Espaciado de los párrafos */
.footer-text {
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

/* Estilo para el corazón */
.heart-icon {
  color: #e53e4f; /* Tu color rojo */
  margin: 0 0.3rem; /* Separación a los lados */
}

/* Estilo para el enlace de PrimeVue */
.footer-link {
  color: #e53e4f;
  text-decoration: none; /* Quitamos la línea de abajo */
  font-weight: bold;
}

.footer-link:hover {
  text-decoration: underline; /* Aparece la línea al pasar el cursor */
}
</style>