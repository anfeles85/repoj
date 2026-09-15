<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCausalStore } from '@/stores/causalStore'
import { useAuthStore } from '@/stores/authStore'
import BaseButton from '@/components/common/BaseButton.vue'
import Loading from '@/components/common/Loading.vue'

const router = useRouter()
const causalStore = useCausalStore()
const authStore = useAuthStore()

const loadingMetrics = ref(true)

onMounted(async () => {
  try {
    if (causalStore.causales.length === 0) {
      await causalStore.fetchCausales()
    }
  } catch (err) {
    console.error('Error cargando métricas iniciales:', err)
  } finally {
    loadingMetrics.value = false
  }
})

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="dashboard-view">
    <!-- Encabezado de la página -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
      <div>
        <h1 class="h3 mb-1 text-gray-800 fw-bold">Panel Principal</h1>
        <p class="text-muted small mb-0">
          Bienvenido(a), <span class="fw-bold text-dark">{{ authStore.user?.name }}</span>. Resumen del sistema REPOJ.
        </p>
      </div>

      <div class="d-flex gap-2">
        <BaseButton
          variant="primary"
          icon="fas fa-plus"
          @click="navigateTo('/causales')"
        >
          Gestionar Causales
        </BaseButton>
      </div>
    </div>

    <!-- Tarjetas de Métricas Estadísticas (Estilo SB Admin 2) -->
    <div class="row g-3 mb-4">
      <!-- Métrica: Total Causales -->
      <div class="col-xl-3 col-md-6">
        <div class="card border-left-primary shadow h-100 py-2">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col me-2">
                <div class="stat-card-title text-primary">
                  Causales Registradas
                </div>
                <div class="stat-card-value">
                  <span v-if="loadingMetrics" class="spinner-border spinner-border-sm text-primary"></span>
                  <span v-else>{{ causalStore.totalCount }}</span>
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-clipboard-list stat-card-icon text-primary opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métrica: Juicios Evaluativos -->
      <div class="col-xl-3 col-md-6">
        <div class="card border-left-success shadow h-100 py-2">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col me-2">
                <div class="stat-card-title text-success">
                  Juicios Evaluativos
                </div>
                <div class="stat-card-value">
                  1,428
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-graduation-cap stat-card-icon text-success opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métrica: Casos Auditados -->
      <div class="col-xl-3 col-md-6">
        <div class="card border-left-info shadow h-100 py-2">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col me-2">
                <div class="stat-card-title text-info">
                  Efectividad de Reporte
                </div>
                <div class="stat-card-value">
                  96.4%
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-chart-line stat-card-icon text-info opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métrica: Alertas del Sistema -->
      <div class="col-xl-3 col-md-6">
        <div class="card border-left-warning shadow h-100 py-2">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col me-2">
                <div class="stat-card-title text-warning">
                  Revisiones Pendientes
                </div>
                <div class="stat-card-value">
                  12
                </div>
              </div>
              <div class="col-auto">
                <i class="fas fa-exclamation-circle stat-card-icon text-warning opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fila de Contenido: Información general y acceso directo a Causales -->
    <div class="row g-4">
      <!-- Columna Izquierda: Información de REPOJ -->
      <div class="col-lg-7 col-12">
        <div class="card shadow mb-4">
          <div class="card-header py-3 d-flex align-items-center justify-content-between">
            <h6 class="m-0 fw-bold text-primary">
              <i class="fas fa-info-circle me-1"></i> Acerca del Sistema REPOJ
            </h6>
          </div>
          <div class="card-body">
            <p>
              <strong>REPOJ</strong> es la plataforma especializada para el análisis, auditoría y seguimiento del reporte de 
              <strong>juicios evaluativos</strong> de SofiaPlus. Diseñada bajo una arquitectura SPA modular y escalable 
              con <strong>Vue.js 3, TypeScript y Bootstrap 5</strong>.
            </p>
            <div class="alert alert-info border-0 mb-3 small">
              <i class="fas fa-shield-alt me-2"></i>
              El módulo de <strong>Causales</strong> permite tipificar los motivos de novedad, inconsistencias o solicitudes 
              de modificación de evaluaciones registradas en el sistema.
            </div>

            <h6 class="fw-bold small text-dark text-uppercase mt-3 mb-2">Capacidades del Sistema:</h6>
            <ul class="list-unstyled mb-0">
              <li class="mb-2 d-flex align-items-center gap-2">
                <i class="fas fa-check-circle text-success"></i>
                <span>Gestión centralizada de catálogo de causales e incidencias.</span>
              </li>
              <li class="mb-2 d-flex align-items-center gap-2">
                <i class="fas fa-check-circle text-success"></i>
                <span>Consumo estandarizado de endpoints REST mediante Axios con interceptores.</span>
              </li>
              <li class="mb-2 d-flex align-items-center gap-2">
                <i class="fas fa-check-circle text-success"></i>
                <span>Manejo resiliente de errores HTTP y respuestas de validación Laravel.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Causales Recientes -->
      <div class="col-lg-5 col-12">
        <div class="card shadow mb-4">
          <div class="card-header py-3 d-flex align-items-center justify-content-between">
            <h6 class="m-0 fw-bold text-primary">
              <i class="fas fa-list me-1"></i> Causales Registradas Recientes
            </h6>
            <router-link to="/causales" class="btn btn-sm btn-link p-0 text-decoration-none">
              Ver todas <i class="fas fa-arrow-right small"></i>
            </router-link>
          </div>
          <div class="card-body p-0">
            <Loading v-if="loadingMetrics" message="Cargando catálogo..." />

            <div v-else-if="causalStore.causales.length === 0" class="p-4 text-center text-muted">
              No hay causales configuradas.
            </div>

            <ul v-else class="list-group list-group-flush">
              <li
                v-for="item in causalStore.causales.slice(0, 5)"
                :key="item.id"
                class="list-group-item d-flex justify-content-between align-items-center py-3"
              >
                <div>
                  <span class="badge bg-secondary me-2">#{{ item.id }}</span>
                  <span class="fw-semibold text-dark">{{ item.description }}</span>
                </div>
                <span class="text-muted small">
                  {{ item.created_at ? item.created_at.substring(0, 10) : '—' }}
                </span>
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
