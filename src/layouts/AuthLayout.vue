<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()
</script>

<template>
  <div class="auth-wrapper min-vh-100 d-flex flex-column justify-content-between">
    <!-- Header decorativo sutil -->
    <header class="py-3 px-4">
      <div class="container-fluid d-flex align-items-center justify-content-between">
        <router-link to="/" class="d-flex align-items-center text-white text-decoration-none gap-2">
          <span class="fs-4 fw-bold tracking-wide">REPOJ</span>
        </router-link>
        <span class="badge bg-white bg-opacity-25 text-white fw-normal px-3 py-2 rounded-pill">
          Aplicativo para el Análisis de Juicios Evaluativos | v1.0.0 
        </span>
      </div>
    </header>

    <!-- Contenido principal centrado -->
    <main class="container my-auto py-4">
      <div class="row justify-content-center">
        <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
          <RouterView />
        </div>
      </div>
    </main>

    <!-- Footer sobrio -->
    <footer class="py-3 text-center text-white-50 small">
      <div class="container">
        <span>&copy; {{ new Date().getFullYear() }} REPOJ - Todos los derechos reservados.</span>
      </div>
    </footer>

    <!-- Contenedor de notificaciones flotantes (Toasts) -->
    <div
      v-if="notificationStore.notifications.length > 0"
      class="toast-container-fixed"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        v-for="toast in notificationStore.notifications"
        :key="toast.id"
        :class="['toast-item alert alert-dismissible mb-0', `alert-${toast.variant}`]"
        role="alert"
      >
        <div class="d-flex align-items-center justify-content-between">
          <strong v-if="toast.title" class="me-auto fw-bold">{{ toast.title }}</strong>
          <button
            type="button"
            class="btn-close ms-2"
            aria-label="Cerrar"
            @click="notificationStore.removeNotification(toast.id)"
          ></button>
        </div>
        <div class="small mt-1">{{ toast.message }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  background: var(--primary-gradient, linear-gradient(180deg, #4e73df 10%, #224abe 100%));
}

.auth-brand-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.25));
  transition: transform 0.2s ease;
}

.auth-brand-logo:hover {
  transform: scale(1.05);
}

.tracking-wide {
  letter-spacing: 0.05rem;
}
</style>
