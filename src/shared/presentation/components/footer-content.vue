<script lang="js" setup>
import {useI18n} from "vue-i18n";

/**
 * Shared presentation footer layout component.
 *
 * @remarks
 * Renders copyright info and internationalized authoring credits globally across
 * app layouts, embedding localized structural strings alongside external styling dependencies.
 */

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

.footer-container {
  background-color: #1a2a40;
  padding: 1.5rem 0;
  width: 100%;
}


.footer-content {
  text-align: center;
  color: #ffffff;
}


.footer-text {
  margin: 0.5rem 0;
  font-size: 0.95rem;
}


.heart-icon {
  color: #e53e4f;
  margin: 0 0.3rem;
}

/* Estilo para el enlace de PrimeVue */
.footer-link {
  color: #e53e4f;
  text-decoration: none;
  font-weight: bold;
}

.footer-link:hover {
  text-decoration: underline;
}
</style>