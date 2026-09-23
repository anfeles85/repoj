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
  <header class="topbar position-relative">
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
        <span class="badge bg-primary-subtle text-primary fw-bold px-2 py-1 d-inline-flex align-items-center">
          REPOJ v1.0
        </span>
      </div>
    </div>

    <!-- Logo SENA centrado horizontalmente -->
    <div class="topbar-center-logo auth-icon-circle bg-primary-subtle text-primary">
      <img
        src="data:image/svg+xml,%3c?xml%20version=%271.0%27%20encoding=%27utf-8%27?%3e%3c!--%20Generator:%20Adobe%20Illustrator%2026.0.1,%20SVG%20Export%20Plug-In%20.%20SVG%20Version:%206.00%20Build%200)%20--%3e%3csvg%20version=%271.1%27%20id=%27Capa_1%27%20xmlns=%27http://www.w3.org/2000/svg%27%20xmlns:xlink=%27http://www.w3.org/1999/xlink%27%20x=%270px%27%20y=%270px%27%20viewBox=%270%200%201000%201000%27%20style=%27enable-background:new%200%200%201000%201000;%27%20xml:space=%27preserve%27%3e%3cstyle%20type=%27text/css%27%3e%20.st0{fill:%2339a900;}%20%3c/style%3e%3cpath%20id=%27path47-5%27%20class=%27st0%27%20d=%27M504.2,20.5c-58.3,0.1-105.6,47.4-105.5,105.8c0.1,58.3,47.4,105.6,105.7,105.6%20c58.3,0,105.6-47.3,105.6-105.7V126C609.9,67.6,562.6,20.4,504.2,20.5z%20M155.6,264.6c-18.6,0.1-37.5,1.1-55.2,5.6%20c-11.7,3-23,7.8-30.3,15.4c-9.2,9.5-10.4,22.3-5.9,33.3c4,9.7,14.8,16.9,26.8,21.1c25.9,8.9,54.6,10.7,81.8,16.3%20c5,1.2,10.6,2.6,13.7,6c3.2,4.1,1.3,9.7-4,12.2c-8.8,4.5-20.1,4.5-30.4,4.4c-9.4-0.4-19.7-1.2-27.2-5.9c-5.5-3.4-6.5-9.1-5.2-14.1%20l-60.6,0c-0.2,9.2,1.6,18.9,8.4,26.8c5.6,6.8,14.8,11.5,24.6,14.4c15.7,4.6,32.7,6,49.4,6.4c22.7,0.4,45.8-0.3,67.6-5.4%20c13-3.2,25.8-8.3,34.1-16.6c14.8-14.8,11.3-38.3-8.3-49.8c-9.8-5.7-21.5-9.2-33.4-11.5c-17.5-3.6-35.3-6.3-52.9-9.2%20c-6.2-1.2-12.8-2.3-18-5.2c-5.5-2.9-5.9-9.8-0.3-12.9c7.2-4.1,16.8-4,25.4-4c9.1,0.2,19,0.7,26.5,5c4.2,2.3,5.9,6.3,5.9,10.1%20l57.6-0.1c-0.2-7.3-1.6-14.9-6.9-21.2c-6.2-7.8-17.1-12.7-28.3-15.5C192.8,265.6,174.1,264.7,155.6,264.6L155.6,264.6z%20M280.6,268.9%20l0,137.7l168.1,0l0-30H342.3v-26.7h94.9v-29.3h-94.9l0-21.9l102.6,0l-0.1-29.7L280.6,268.9z%20M557.5,269c0,0-51.9,0-77.9,0l0,137.7%20l59,0l0-92.7l80.8,92.6l81,0.1l0-137.7l-59.1,0l0.1,92L557.5,269z%20M805.6,269.2c0,0-63.6,91.9-95.6,137.7l61.9,0l14.9-24.8h95.7%20l13.9,24.9l68.8,0L874,269.2L805.6,269.2z%20M836.6,302.1l29.4,49.9l-60.7,0.1L836.6,302.1z%20M10.6,445.6l0.5,75l280.1-1%20c14.3,3.1,22.6,12.4,19.7,33.5L138.6,854.7l56.1,52.5l266.9-461.6L10.6,445.6z%20M545.2,446.2l262.4,459.6l58-52.1L691.3,552.9%20c-2.9-21.2,5.4-30.6,19.7-33.7l280.2,1l-0.1-73.7L545.2,446.2z%20M500.9,522.3L254.8,944.7l65.4,31.9L484.4,699%20c5.7-4.6,11.4-7.1,17.1-7.3c6-0.2,12.2,2,18.3,6.8l163.8,278.4l67.4-35.2L500.9,522.3z%27/%3e%3cg%20id=%27_x23_000000ff-2%27%20transform=%27matrix(0.31570611,0,0,0.23560774,-391.49698,-10.601126)%27%3e%3c/g%3e%3c/svg%3e"
        alt="Logo SENA"
      />
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
.topbar-center-logo {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.topbar-center-logo img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.hover-bg:hover {
  background-color: #f8f9fa;
}
</style>
