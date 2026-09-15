<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import Topbar from '@/components/layout/Topbar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Footer from '@/components/layout/Footer.vue'
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()

const sidebarToggled = ref(false)
const sidebarMobileOpen = ref(false)

const handleToggleSidebar = () => {
  // En pantallas de escritorio alterna el modo colapsado
  if (window.innerWidth >= 768) {
    sidebarToggled.value = !sidebarToggled.value
  } else {
    // En móviles abre/cierra el drawer lateral
    sidebarMobileOpen.value = !sidebarMobileOpen.value
  }
}

const handleCloseMobile = () => {
  sidebarMobileOpen.value = false
}
</script>

<template>
  <div class="app-wrapper">
    <!-- Barra lateral de navegación -->
    <Sidebar
      :toggled="sidebarToggled"
      :mobile-open="sidebarMobileOpen"
      @toggle-sidebar="handleToggleSidebar"
      @close-mobile="handleCloseMobile"
    />

    <!-- Contenedor del contenido principal -->
    <div class="content-wrapper">
      <!-- Barra superior de navegación -->
      <Topbar @toggle-sidebar="handleToggleSidebar" />

      <!-- Contenedor de la vista dinámica -->
      <main class="main-content">
        <RouterView />
      </main>

      <!-- Pie de página -->
      <Footer />
    </div>

    <!-- Contenedor de notificaciones flotantes (Toasts globales) -->
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
/* Los estilos estructurales residen en main.css */
</style>
