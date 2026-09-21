<script setup lang="ts">
import { computed } from 'vue'
import type { GroupAnalysisSummary } from '@/interfaces/JudgmentAnalysis'

const props = defineProps<{
  summary: GroupAnalysisSummary
}>()

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-CO').format(num)
}

const formatPercentage = (num: number): string => {
  return num.toFixed(1).replace('.', ',') + ' %'
}

const approvalBadgeClass = computed(() => {
  if (props.summary.approvalPercentage >= 90) return 'text-success'
  if (props.summary.approvalPercentage >= 70) return 'text-primary'
  if (props.summary.approvalPercentage >= 50) return 'text-warning'
  return 'text-danger'
})
</script>

<template>
  <div class="analisis-summary-cards mb-4">
    <!-- Grid de 6 Tarjetas Superiores -->
    <div class="row g-3">
      <!-- 1. APRENDICES -->
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card h-100 border-0 shadow-sm kpi-card border-start border-4 border-primary">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="text-uppercase fw-bold text-muted small kpi-title">Aprendices</span>
              <div class="kpi-icon bg-primary-subtle text-primary">
                <i class="fas fa-users"></i>
              </div>
            </div>
            <div class="h3 fw-bold text-dark mb-0">{{ formatNumber(summary.totalApprentices) }}</div>
            <small class="text-muted" style="font-size: 0.72rem;">Total registrados</small>
          </div>
        </div>
      </div>

      <!-- 2. JUICIOS -->
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card h-100 border-0 shadow-sm kpi-card border-start border-4 border-secondary">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="text-uppercase fw-bold text-muted small kpi-title">Juicios</span>
              <div class="kpi-icon bg-secondary-subtle text-secondary">
                <i class="fas fa-clipboard-list"></i>
              </div>
            </div>
            <div class="h3 fw-bold text-dark mb-0">{{ formatNumber(summary.totalJudgments) }}</div>
            <small class="text-muted" style="font-size: 0.72rem;">Registros totales</small>
          </div>
        </div>
      </div>

      <!-- 3. APROBADOS -->
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card h-100 border-0 shadow-sm kpi-card border-start border-4 border-success">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="text-uppercase fw-bold text-muted small kpi-title">Aprobados</span>
              <div class="kpi-icon bg-success-subtle text-success">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>
            <div class="h3 fw-bold text-success mb-0">{{ formatNumber(summary.approvedJudgments) }}</div>
            <small class="text-muted" style="font-size: 0.72rem;">Juicios aprobados</small>
          </div>
        </div>
      </div>

      <!-- 4. POR EVALUAR -->
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card h-100 border-0 shadow-sm kpi-card border-start border-4 border-warning">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="text-uppercase fw-bold text-muted small kpi-title">Por Evaluar</span>
              <div class="kpi-icon bg-warning-subtle text-warning">
                <i class="fas fa-clock"></i>
              </div>
            </div>
            <div class="h3 fw-bold text-warning mb-0">{{ formatNumber(summary.pendingJudgments) }}</div>
            <small class="text-muted" style="font-size: 0.72rem;">Pendientes</small>
          </div>
        </div>
      </div>

      <!-- 5. % APROBACIÓN -->
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card h-100 border-0 shadow-sm kpi-card border-start border-4 border-info">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="text-uppercase fw-bold text-muted small kpi-title">% Aprobación</span>
              <div class="kpi-icon bg-info-subtle text-info">
                <i class="fas fa-chart-line"></i>
              </div>
            </div>
            <div :class="['h3 fw-bold mb-0', approvalBadgeClass]">
              {{ formatPercentage(summary.approvalPercentage) }}
            </div>
            <small class="text-muted" style="font-size: 0.72rem;">Tasa global</small>
          </div>
        </div>
      </div>

      <!-- 6. COMPETENCIAS -->
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card h-100 border-0 shadow-sm kpi-card border-start border-4 border-primary">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="text-uppercase fw-bold text-muted small kpi-title">Competencias</span>
              <div class="kpi-icon bg-primary-subtle text-primary">
                <i class="fas fa-award"></i>
              </div>
            </div>
            <div class="h3 fw-bold text-dark mb-0">{{ formatNumber(summary.totalCompetences) }}</div>
            <small class="text-muted" style="font-size: 0.72rem;">Del programa</small>
          </div>
        </div>
      </div>
    </div>   
  </div>
</template>

<style scoped>
.kpi-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  background-color: #ffffff;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.08) !important;
}

.kpi-title {
  letter-spacing: 0.5px;
  font-size: 0.7rem;
}

.kpi-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
}
</style>
