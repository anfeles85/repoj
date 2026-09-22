<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const userMenuOpen = ref(false)

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

const handleLogout = async () => {
  userMenuOpen.value = false
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="topbar">
    <div class="d-flex align-items-center gap-3">
      <!-- Botón toggle de sidebar -->
      <button
        type="button"
        class="btn btn-light rounded-circle shadow-none border"
        title="Alternar barra lateral"
        aria-label="Alternar navegación"
        @click="emit('toggleSidebar')"
      >
        <i class="fas fa-bars text-primary"></i>
      </button>

      <!-- Título o indicador del sistema -->
      <div class="d-none d-sm-block">
        <span class="badge bg-primary-subtle text-primary fw-bold px-2 py-1">
          <i class="fas fa-bolt me-1"></i> REPOJ v1.0
        </span>
      </div>
    </div>

    <!-- Acciones derechas del Topbar -->
    <div class="d-flex align-items-center gap-2">
      <!-- Menú de Usuario -->
      <div class="dropdown position-relative">
        <button
          type="button"
          class="user-profile-btn py-1 px-2 rounded hover-bg"
          :aria-expanded="userMenuOpen"
          @click="userMenuOpen = !userMenuOpen"
        >
          <div class="user-avatar-circle">
            {{ authStore.userName.charAt(0).toUpperCase() }}
          </div>
          <div class="d-none d-md-flex flex-column text-start">
            <span class="fw-bold text-dark lh-sm">{{ authStore.userName }}</span>
            <span class="text-muted small lh-sm" style="font-size: 0.75rem;">
              {{ authStore.userRoleLabel }}
            </span>
          </div>
          <i class="fas fa-chevron-down text-muted small ms-1"></i>
        </button>

        <!-- Dropdown de perfil -->
        <ul
          v-if="userMenuOpen"
          class="dropdown-menu dropdown-menu-end show shadow border-0 mt-2 position-absolute"
          style="min-width: 220px;"
          @click="userMenuOpen = false"
        >
          <li class="px-3 py-2 border-bottom">
            <p class="mb-0 fw-bold small text-dark">{{ authStore.userName }}</p>
            <span class="text-muted small text-truncate d-block" style="font-size: 0.75rem;">
              {{ authStore.user?.email }}
            </span>
            <span class="badge bg-light text-primary border mt-1" style="font-size: 0.7rem;">
              Rol: {{ authStore.userRoleLabel }}
            </span>
          </li>
          <li>
            <router-link to="/perfil" class="dropdown-item py-2 small">
              <i class="fas fa-user-circle me-2 text-primary"></i> Mi Perfil
            </router-link>
          </li>
          <li><hr class="dropdown-divider my-1"></li>
          <li>
            <button
              type="button"
              class="dropdown-item text-danger py-2 small"
              @click="handleLogout"
            >
              <i class="fas fa-sign-out-alt me-2"></i> Cerrar Sesión
            </button>
          </li>
        </ul>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hover-bg:hover {
  background-color: #f8f9fa;
}
</style>
