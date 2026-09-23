<script setup lang="ts">
import type { ApprenticeStatusCount } from '@/interfaces/JudgmentAnalysis'

defineProps<{
  statusList: ApprenticeStatusCount[]
  totalApprentices: number
}>()

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'EN FORMACION':
      return 'bg-success'
    case 'CERTIFICADO':
      return 'bg-primary'
    case 'POR CERTIFICAR':
      return 'bg-info text-dark'
    case 'RETIRO VOLUNTARIO':
      return 'bg-secondary'
    case 'CANCELADO':
      return 'bg-danger'
    case 'CONDICIONADO':
      return 'bg-warning text-dark'
    case 'TRASLADADO':
      return 'bg-info text-dark'
    case 'APLAZADO':
      return 'bg-dark'
    default:
      return 'bg-light text-dark border'
  }
}

const getProgressBarClass = (status: string): string => {
  switch (status) {
    case 'EN FORMACION':
      return 'bg-success'
    case 'CERTIFICADO':
      return 'bg-primary'
    case 'POR CERTIFICAR':
      return 'bg-info'
    case 'RETIRO VOLUNTARIO':
      return 'bg-secondary'
    case 'CANCELADO':
      return 'bg-danger'
    case 'CONDICIONADO':
      return 'bg-warning'
    case 'TRASLADADO':
      return 'bg-info'
    default:
      return 'bg-primary'
  }
}
</script>

<template>
  <div class="card border-0 shadow-sm h-100">
    <div class="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon bg-primary-subtle text-primary">
          <i class="fas fa-user-tag"></i>
        </div>
        <div>
          <h6 class="fw-bold mb-0 text-dark">Aprendices por Estado</h6>
          <small class="text-muted">Distribución del grupo según condición actual</small>
        </div>
      </div>
      <span class="badge bg-light text-dark border font-monospace">
        {{ totalApprentices }} Aprendices
      </span>
    </div>

    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light small text-muted text-uppercase">
            <tr>
              <th class="ps-3 py-2">Estado del Aprendiz</th>
              <th class="text-center py-2" style="width: 100px;">Cantidad</th>
              <th class="py-2 pe-3" style="width: 180px;">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in statusList" :key="item.status">
              <td class="ps-3 py-2">
                <span :class="['badge rounded-pill px-2 py-1', getStatusBadgeClass(item.status)]">
                  {{ item.status }}
                </span>
              </td>
              <td class="text-center fw-bold font-monospace py-2">
                {{ item.count }}
              </td>
              <td class="pe-3 py-2">
                <div class="d-flex align-items-center gap-2">
                  <div class="progress flex-grow-1" style="height: 6px;">
                    <div
                      :class="['progress-bar', getProgressBarClass(item.status)]"
                      role="progressbar"
                      :style="{ width: `${item.percentage}%` }"
                      :aria-valuenow="item.percentage"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <span class="small font-monospace text-muted" style="width: 45px; text-align: right;">
                    {{ item.percentage.toFixed(1) }}%
                  </span>
                </div>
              </td>
            </tr>
            <tr v-if="statusList.length === 0">
              <td colspan="3" class="text-center text-muted py-4 small">
                No hay datos de estados disponibles.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
}
</style>
