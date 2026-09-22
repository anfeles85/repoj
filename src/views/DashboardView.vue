<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useGroupStore } from '@/stores/groupStore'
import Loading from '@/components/common/Loading.vue'
import UserStatusBadge from '@/components/users/UserStatusBadge.vue'

const authStore = useAuthStore()
const userStore = useUserStore()
const groupStore = useGroupStore()

onMounted(async () => {
  if (userStore.users.length === 0) {
    await userStore.fetchUsers()
  }
  if (groupStore.groups.length === 0) {
    await groupStore.fetchGroups()
  }
})

const totalUsers = computed(() => userStore.users.length)
const totalActivos = computed(() => userStore.users.filter((u) => u.status === 'ACTIVO').length)

const totalGroups = computed(() => groupStore.groups.length)
const totalGruposEjecucion = computed(() => groupStore.groups.filter((g) => g.status === 'EN EJECUCION').length)
</script>

<template>
  <div class="dashboard-view">
    <!-- Encabezado de la página -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
      <div>
        <h1 class="h3 mb-1 text-gray-800 fw-bold">Panel Principal</h1>
        <p class="text-muted small mb-0">
          Bienvenido(a), <span class="fw-bold text-dark">{{ authStore.userName }}</span>. Resumen del sistema REPOJ.
        </p>
      </div>      
    </div>

    <!-- Tarjetas de Métricas Estadísticas (Estilo SB Admin 2) -->
    <div class="row g-3 mb-4">
      <!-- Métrica: Total Grupos -->
      <div class="col-xl-3 col-md-6">
        <div class="card border-left-primary shadow h-100 py-2">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col me-2">
                <div class="stat-card-title text-primary">
                  Grupos de Formación
                </div>
                <div class="stat-card-value">
                  <span v-if="groupStore.loading" class="spinner-border spinner-border-sm text-primary"></span>
                  <span v-else>{{ totalGroups }}</span>
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-users-rectangle stat-card-icon text-primary opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métrica: Grupos en Ejecución -->
      <div class="col-xl-3 col-md-6">
        <div class="card border-left-success shadow h-100 py-2">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col me-2">
                <div class="stat-card-title text-success">
                  En Ejecución
                </div>
                <div class="stat-card-value">
                  <span v-if="groupStore.loading" class="spinner-border spinner-border-sm text-success"></span>
                  <span v-else>{{ totalGruposEjecucion }}</span>
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-play-circle stat-card-icon text-success opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métrica: Total Usuarios -->
      <div class="col-xl-3 col-md-6">
        <div class="card border-left-info shadow h-100 py-2">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col me-2">
                <div class="stat-card-title text-info">
                  Usuarios del Sistema
                </div>
                <div class="stat-card-value">
                  <span v-if="userStore.loading" class="spinner-border spinner-border-sm text-info"></span>
                  <span v-else>{{ totalUsers }}</span>
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-users stat-card-icon text-info opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métrica: Usuarios Activos -->
      <div class="col-xl-3 col-md-6">
        <div class="card border-left-warning shadow h-100 py-2">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col me-2">
                <div class="stat-card-title text-warning">
                  Usuarios Activos
                </div>
                <div class="stat-card-value">
                  <span v-if="userStore.loading" class="spinner-border spinner-border-sm text-warning"></span>
                  <span v-else>{{ totalActivos }}</span>
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-user-check stat-card-icon text-warning opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fila de Contenido: Información general y accesos -->
    <div class="row g-4">
      <!-- Columna Izquierda: Información de REPOJ -->
      <div :class="authStore.isAdmin ? 'col-lg-7 col-12' : 'col-12'">
        <div class="card shadow mb-4">
          <div class="card-header py-3 d-flex align-items-center justify-content-between">
            <h6 class="m-0 fw-bold text-primary">
              <i class="fas fa-info-circle me-1"></i> Plataforma REPOJ
            </h6>
          </div>
          <div class="card-body">
            <p>
              <strong>REPOJ</strong> es el sistema integral para la gestión, seguimiento y auditoría de fichas, 
              grupos e informes institucionales.
            </p>

            <div class="row g-3 my-2">
              <div class="col-md-4">
                <div class="p-3 border rounded-3 bg-light h-100">
                  <div class="fw-bold text-danger mb-1">
                    <i class="fas fa-user-shield me-1"></i> Administrador
                  </div>
                  <small class="text-muted">
                    Acceso total al sistema. Gestiona y crea usuarios instructores y coordinadores.
                  </small>
                </div>
              </div>

              <div class="col-md-4">
                <div class="p-3 border rounded-3 bg-light h-100">
                  <div class="fw-bold text-primary mb-1">
                    <i class="fas fa-chalkboard-teacher me-1"></i> Instructor
                  </div>
                  <small class="text-muted">
                    Registro de fichas, creación de grupos, carga de archivos e informes de seguimiento.
                  </small>
                </div>
              </div>

              <div class="col-md-4">
                <div class="p-3 border rounded-3 bg-light h-100">
                  <div class="fw-bold text-info mb-1">
                    <i class="fas fa-user-tie me-1"></i> Coordinador
                  </div>
                  <small class="text-muted">
                    Consulta general de grupos creados por instructores y consolidación de informes.
                  </small>
                </div>
              </div>
            </div>

            <h6 class="fw-bold small text-dark text-uppercase mt-4 mb-2">Seguridad y Políticas:</h6>
            <ul class="list-unstyled mb-0">
              <li class="mb-2 d-flex align-items-center gap-2">
                <i class="fas fa-check-circle text-success"></i>
                <span>Contraseñas seguras y encriptación con bcrypt.</span>
              </li>
              <li class="mb-2 d-flex align-items-center gap-2">
                <i class="fas fa-check-circle text-success"></i>
                <span>Protección del Administrador contra eliminación o desactivación accidental.</span>
              </li>
              <li class="mb-2 d-flex align-items-center gap-2">
                <i class="fas fa-check-circle text-success"></i>
                <span>Bloqueo inmediato de acceso para cuentas en estado inactivo.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Usuarios Recientes (Solo para Administrador) -->
      <div v-if="authStore.isAdmin" class="col-lg-5 col-12">
        <div class="card shadow mb-4">
          <div class="card-header py-3 d-flex align-items-center justify-content-between">
            <h6 class="m-0 fw-bold text-primary">
              <i class="fas fa-users me-1"></i> Usuarios en el Sistema
            </h6>
            <router-link to="/usuarios" class="btn btn-sm btn-link p-0 text-decoration-none">
              Gestionar <i class="fas fa-arrow-right small"></i>
            </router-link>
          </div>
          <div class="card-body p-0">
            <Loading v-if="userStore.loading" message="Cargando usuarios..." />

            <div v-else-if="userStore.users.length === 0" class="p-4 text-center text-muted">
              No hay usuarios registrados.
            </div>

            <ul v-else class="list-group list-group-flush">
              <li
                v-for="item in userStore.users.slice(0, 5)"
                :key="item.id"
                class="list-group-item d-flex justify-content-between align-items-center py-3 px-3"
              >
                <div>
                  <div class="fw-semibold text-dark">{{ item.fullname }}</div>
                  <div class="text-muted small" style="font-size: 0.75rem;">
                    {{ item.email }}
                  </div>
                </div>
                <div class="d-flex align-items-center gap-1">
                  <UserStatusBadge type="role" :value="item.role" />
                  <UserStatusBadge type="status" :value="item.status" />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Los estilos generales residen en main.css */
</style>
