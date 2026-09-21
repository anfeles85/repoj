<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CompetenceMatrixItem } from '@/interfaces/JudgmentAnalysis'

const props = defineProps<{
  matrix: CompetenceMatrixItem[]
}>()

const searchQuery = ref('')

const filteredMatrix = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.matrix
  return props.matrix.filter((item) =>
    item.competenceName.toLowerCase().includes(query)
  )
})
</script>

<template>
  <div class="card border-0 shadow-sm mb-4">
    <div class="card-header bg-white border-bottom py-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon bg-warning-subtle text-warning">
          <i class="fas fa-table-list"></i>
        </div>
        <div>
          <h6 class="fw-bold mb-0 text-dark">Matriz Competencia x Estado</h6>
          <small class="text-muted">Detalle de juicios aprobados, por evaluar y porcentaje de cumplimiento</small>
        </div>
      </div>

      <div class="d-flex align-items-center gap-2">
        <div class="input-group input-group-sm" style="max-width: 250px;">
          <span class="input-group-text bg-light"><i class="fas fa-search text-muted"></i></span>
          <input
            v-model="searchQuery"
            type="text"
            class="form-control"
            placeholder="Buscar competencia..."
          />
          <button
            v-if="searchQuery"
            class="btn btn-outline-secondary"
            type="button"
            @click="searchQuery = ''"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <span class="badge bg-light text-muted border font-monospace">
          {{ matrix.length }} Competencias
        </span>
      </div>
    </div>

    <div class="card-body p-0">
      <div class="table-responsive" style="max-height: 420px; overflow-y: auto;">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light sticky-top small text-muted text-uppercase">
            <tr>
              <th class="ps-4 py-2">Competencia</th>
              <th class="text-end py-2" style="width: 130px;">Aprobado</th>
              <th class="text-end py-2" style="width: 140px;">Por Evaluar</th>
              <th class="text-end py-2" style="width: 120px;">Total</th>
              <th class="text-end pe-4 py-2" style="width: 180px;">% Avance</th>
            </tr>
          </thead>
          <tbody class="small font-monospace">
            <tr v-for="item in filteredMatrix" :key="item.competenceId">
              <td class="ps-4 py-2 font-sans fw-semibold text-dark">
                {{ item.competenceName }}
              </td>
              <td class="text-end py-2 text-success fw-bold">
                {{ item.approved }}
              </td>
              <td class="text-end py-2 text-danger fw-bold">
                {{ item.pending }}
              </td>
              <td class="text-end py-2 text-dark">
                {{ item.total }}
              </td>
              <td class="text-end pe-4 py-2">
                <div class="d-flex align-items-center justify-content-end gap-2">
                  <div class="progress flex-grow-1 d-none d-sm-flex" style="height: 6px; max-width: 80px;">
                    <div
                      class="progress-bar bg-success"
                      role="progressbar"
                      :style="{ width: `${item.percentage}%` }"
                    ></div>
                  </div>
                  <span
                    :class="[
                      'badge font-monospace',
                      item.percentage >= 80
                        ? 'bg-success-subtle text-success'
                        : item.percentage >= 50
                          ? 'bg-warning-subtle text-warning'
                          : 'bg-danger-subtle text-danger'
                    ]"
                  >
                    {{ item.percentage.toFixed(1) }}%
                  </span>
                </div>
              </td>
            </tr>
            <tr v-if="filteredMatrix.length === 0">
              <td colspan="5" class="text-center text-muted py-4 small font-sans">
                No hay información de competencias que coincida con la búsqueda.
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

.font-sans {
  font-family: inherit;
}
</style>
