<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { HeatmapData, HeatmapCellDetail } from '@/interfaces/JudgmentAnalysis'

const props = defineProps<{
  heatmap: HeatmapData
}>()

const searchQuery = ref('')
const onlyInFormation = ref(false)
const selectedCompetenceId = ref<string | null>(null)

const filteredApprentices = computed(() => {
  return props.heatmap.apprentices.filter((app) => {
    if (onlyInFormation.value && app.status !== 'EN FORMACION') return false
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return true
    return app.name.toLowerCase().includes(q) || app.document.toLowerCase().includes(q)
  })
})

const selectedCompetence = computed(() => {
  if (!selectedCompetenceId.value) return null
  return props.heatmap.competences.find((c) => c.id === selectedCompetenceId.value) || null
})

const getCell = (apprenticeId: string, competenceId: string): HeatmapCellDetail => {
  return (
    props.heatmap.matrix[apprenticeId]?.[competenceId] || {
      status: 'POR_EVALUAR',
      approved: 0,
      total: 0,
      percentage: 0
    }
  )
}

const selectCompetence = (competenceId: string) => {
  selectedCompetenceId.value = competenceId

  // Desplazar suavemente hasta el glosario hacia el elemento resaltado
  nextTick(() => {
    const el = document.getElementById(`glossary-item-${competenceId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })
}

const clearSelectedCompetence = () => {
  selectedCompetenceId.value = null
}
</script>

<template>
  <div class="card border-0 shadow-sm mb-4">
    <div class="card-header bg-white border-bottom py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon bg-primary-subtle text-primary">
          <i class="fas fa-th"></i>
        </div>
        <div>
          <h6 class="fw-bold mb-0 text-dark">Matriz de Calor de Aprendices</h6>
          <small class="text-muted">
            Haga clic en cualquier celda para identificar y resaltar la competencia respectiva
          </small>
        </div>
      </div>

      <!-- Leyenda de Convenciones -->
      <div class="d-flex align-items-center gap-3 small">
        <span class="d-flex align-items-center gap-1">          
          <span class="text-muted">🟢 Aprobado (100%)</span>
        </span>
        <span class="d-flex align-items-center gap-1">
          <span class="text-muted">🟡 Parcial</span>
        </span>
        <span class="d-flex align-items-center gap-1">
          <span class="text-muted">🔴 Por evaluar</span>
        </span>
      </div>
    </div>

    <div class="card-body p-3">
      <!-- Filtros de la Matriz -->
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
        <div class="input-group input-group-sm" style="max-width: 320px;">
          <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
          <input
            v-model="searchQuery"
            type="text"
            class="form-control"
            placeholder="Filtrar aprendiz por nombre o doc..."
          />
          <button v-if="searchQuery" class="btn btn-outline-secondary" type="button" @click="searchQuery = ''">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="d-flex align-items-center gap-3">
          <div v-if="selectedCompetence" class="d-none d-md-flex align-items-center gap-1 small text-muted">
            <i class="fas fa-hand-pointer text-success"></i>
            <span>Competencia activa: <strong>{{ selectedCompetence.shortCode }}</strong></span>
            <button
              type="button"
              class="btn btn-link btn-sm text-danger p-0 text-decoration-none ms-1"
              @click="clearSelectedCompetence"
            >
              (desmarcar)
            </button>
          </div>

          <div class="form-check form-switch mb-0">
            <input
              id="heatmap-in-formation-switch"
              v-model="onlyInFormation"
              class="form-check-input"
              type="checkbox"
              role="switch"
            />
            Solo <label class="badge bg-success-subtle text-success border border-success-subtle" for="heatmap-in-formation-switch">
               EN FORMACIÓN
            </label>
          </div>
        </div>
      </div>

      <!-- Tabla / Matriz con Scroll Horizontal -->
      <div class="table-responsive border rounded-3 heatmap-container">
        <table class="table table-bordered table-sm align-middle mb-0 text-center">
          <thead class="table-light sticky-top">
            <tr>
              <th class="ps-3 text-start sticky-col bg-light py-2" style="min-width: 200px; z-index: 5;">
                Aprendiz ({{ filteredApprentices.length }})
              </th>
              <th
                v-for="comp in heatmap.competences"
                :key="comp.id"
                :class="[
                  'py-2 px-1 text-center cursor-pointer header-competence-th',
                  comp.id === selectedCompetenceId ? 'selected-column-header' : ''
                ]"
                style="min-width: 48px; max-width: 55px;"
                :title="`Clic para resaltar: ${comp.shortCode} - ${comp.name}`"
                @click="selectCompetence(comp.id)"
              >
                <div class="fw-bold font-monospace" style="font-size: 0.8rem;">
                  {{ comp.shortCode }}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in filteredApprentices" :key="app.id">
              <td class="ps-3 text-start sticky-col bg-white text-truncate py-2" style="max-width: 220px;" :title="`${app.name} (${app.document})`">
                <div class="fw-semibold text-dark text-truncate" style="font-size: 0.82rem;">
                  {{ app.name }}
                </div>
                <div class="text-muted" style="font-size: 0.7rem;">
                  {{ app.document }}
                </div>
              </td>

              <td
                v-for="comp in heatmap.competences"
                :key="comp.id"
                :class="[
                  'p-1 cursor-pointer heatmap-td',
                  comp.id === selectedCompetenceId ? 'selected-column-cell' : ''
                ]"
                :title="`Competencia ${comp.shortCode}: ${comp.name}\n${getCell(app.id, comp.id).approved}/${getCell(app.id, comp.id).total} RAPs (${getCell(app.id, comp.id).percentage.toFixed(0)}%)\nClic para resaltar esta competencia abajo`"
                @click="selectCompetence(comp.id)"
              >
                <div
                  :class="[
                    'heatmap-cell mx-auto',
                    getCell(app.id, comp.id).status === 'APROBADO'
                      ? 'cell-approved'
                      : getCell(app.id, comp.id).status === 'PARCIAL'
                        ? 'cell-partial'
                        : 'cell-pending',
                    comp.id === selectedCompetenceId ? 'active-cell-focus' : ''
                  ]"
                >
                  <i
                    v-if="getCell(app.id, comp.id).status === 'APROBADO'"
                    class="fas fa-check"
                    style="font-size: 0.65rem;"
                  ></i>
                  <span
                    v-else-if="getCell(app.id, comp.id).status === 'PARCIAL'"
                    style="font-size: 0.65rem;"
                  >
                    ~
                  </span>
                  <i
                    v-else
                    class="fas fa-times"
                    style="font-size: 0.65rem;"
                  ></i>
                </div>
              </td>
            </tr>

            <tr v-if="filteredApprentices.length === 0">
              <td :colspan="heatmap.competences.length + 1" class="text-center text-muted py-4 small">
                No hay aprendices que coincidan con la búsqueda.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Glosario de Competencias (C1, C2...) con resaltado dinámico -->
      <div class="mt-3 pt-3 border-top">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="small fw-bold text-muted text-uppercase" style="letter-spacing: 0.5px;">
            Glosario de Competencias:
          </div>
          <small class="text-muted" style="font-size: 0.72rem;">
            (Haga clic en una competencia o celda de la tabla para resaltarla)
          </small>
        </div>

        <div class="row g-2">
          <div
            v-for="comp in heatmap.competences"
            :id="`glossary-item-${comp.id}`"
            :key="comp.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <div
              :class="[
                'd-flex align-items-center gap-2 p-2 rounded-2 border small cursor-pointer glossary-item transition-all',
                comp.id === selectedCompetenceId
                  ? 'bg-success-subtle border-success border-2 shadow-sm text-success fw-bold highlighted-item'
                  : 'bg-light text-dark'
              ]"
              @click="selectCompetence(comp.id)"
            >
              <span
                :class="[
                  'badge font-monospace flex-shrink-0',
                  comp.id === selectedCompetenceId ? 'bg-success text-white' : 'bg-dark'
                ]"
              >
                {{ comp.shortCode }}
              </span>
              <span class="text-truncate" :title="comp.name">
                {{ comp.name }}
              </span>
              <i
                v-if="comp.id === selectedCompetenceId"
                class="fas fa-arrow-left ms-auto text-success flex-shrink-0"
                title="Seleccionada"
              ></i>
            </div>
          </div>
        </div>
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

.heatmap-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.heatmap-container {
  max-height: 480px;
  overflow: auto;
}

.sticky-col {
  position: sticky;
  left: 0;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.04);
}

.cursor-pointer {
  cursor: pointer;
}

.header-competence-th {
  transition: background-color 0.15s ease;
}

.header-competence-th:hover {
  background-color: #e2f0d9 !important;
  color: #39A900 !important;
}

.selected-column-header {
  background-color: #e2f0d9 !important;
  color: #39A900 !important;
  border-bottom: 2px solid #39A900 !important;
}

.selected-column-cell {
  background-color: rgba(57, 169, 0, 0.07) !important;
}

.heatmap-td {
  transition: background-color 0.15s ease;
}

.heatmap-td:hover {
  background-color: rgba(57, 169, 0, 0.12) !important;
}

.heatmap-cell {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.heatmap-cell:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
}

.active-cell-focus {
  transform: scale(1.12);
  outline: 2px solid #39A900;
  outline-offset: 1px;
}

.cell-approved {
  background-color: #39A900;
  color: #ffffff;
}

.cell-partial {
  background-color: #f6c23e;
  color: #5a4000;
}

.cell-pending {
  background-color: #e74a3b;
  color: #ffffff;
}

.glossary-item {
  transition: all 0.2s ease;
}

.glossary-item:hover {
  border-color: #39A900 !important;
  background-color: #f6fff2 !important;
}

.highlighted-item {
  animation: pulseHighlight 0.4s ease-out;
}

@keyframes pulseHighlight {
  0% {
    transform: scale(0.97);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

.transition-all {
  transition: all 0.2s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
