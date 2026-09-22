<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

defineProps<{
  toggled: boolean
  mobileOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
  (e: 'closeMobile'): void
}>()

const route = useRoute()
const authStore = useAuthStore()

const isCurrentRoute = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <!-- Backdrop para móviles -->
  <div
    v-if="mobileOpen"
    class="sidebar-backdrop d-md-none"
    @click="emit('closeMobile')"
  ></div>

  <!-- Sidebar Principal -->
  <aside
    :class="[
      'sidebar',
      { toggled: toggled, 'mobile-open': mobileOpen }
    ]"
  >
      <!-- Logo / Marca -->
      <router-link
        to="/"
        class="sidebar-brand text-decoration-none"
        @click="emit('closeMobile')"
      >
        <div class="sidebar-brand-icon me-2">
          <i class="fas fa-layer-group"></i>
        </div>
        <div class="sidebar-brand-text">
          <span>REPOJ</span>
        </div>
      </router-link>

      <!-- Encabezado de sección -->
      <div class="sidebar-heading">
        Módulos Principales
      </div>

      <!-- Menú de Navegación -->
      <ul class="sidebar-nav">
        <!-- Dashboard -->
        <li class="nav-item">
          <router-link
            to="/"
            class="nav-link"
            :class="{ active: isCurrentRoute('/') }"
            @click="emit('closeMobile')"
          >
            <i class="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </router-link>
        </li>

        <!-- Grupos -->
        <li class="nav-item">
          <router-link
            to="/grupos"
            class="nav-link"
            :class="{ active: isCurrentRoute('/grupos') }"
            @click="emit('closeMobile')"
          >
            <i class="fas fa-users-rectangle"></i>
            <span>Grupos</span>
          </router-link>
        </li>

        <!-- Análisis de Juicios Evaluativos -->
        <li class="nav-item">
          <router-link
            to="/analisis-juicios"
            class="nav-link"
            :class="{ active: isCurrentRoute('/analisis-juicios') }"
            @click="emit('closeMobile')"
          >
            <i class="fas fa-chart-pie"></i>
            <span>Análisis Juicios</span>
          </router-link>
        </li>

        <!-- Encabezado de Administración (Solo para Administrador) -->
        <template v-if="authStore.isAdmin">
          <div class="sidebar-heading mt-2">
            Administración
          </div>

          <!-- Usuarios -->
          <li class="nav-item">
            <router-link
              to="/usuarios"
              class="nav-link"
              :class="{ active: isCurrentRoute('/usuarios') }"
              @click="emit('closeMobile')"
            >
              <i class="fas fa-users-cog"></i>
              <span>Usuarios</span>
            </router-link>
          </li>
        </template>
      </ul>

      <!-- Botón inferior para colapsar barra en escritorio -->
      <div class="sidebar-toggler-wrapper d-none d-md-block">
        <button
          type="button"
          class="sidebar-toggler"
          title="Alternar ancho de barra"
          @click="emit('toggleSidebar')"
        >
          <i :class="toggled ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
        </button>
      </div>
    </aside>
</template>

<style scoped>
/* Los estilos generales residen en main.css */
</style>
