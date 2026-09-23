<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
  type ChartConfiguration
} from 'chart.js'
import type { OutcomeBreakdownItem } from '@/interfaces/JudgmentAnalysis'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

const props = defineProps<{
  inFormationJudgments: {
    approved: number
    pending: number
    total: number
    approvalPercentage: number
  }
  competences: string[]
  outcomesByCompetence: Record<string, OutcomeBreakdownItem[]>
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const selectedCompetence = ref<string>('')
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchCompetenceText = ref('')

// Inicializar la competencia seleccionada
watch(
  () => props.competences,
  (list) => {
    if (list && list.length > 0 && !selectedCompetence.value) {
      selectedCompetence.value = list[0]
    }
  },
  { immediate: true }
)

// Calcular estadísticas específicas de la competencia seleccionada
const currentCompetenceStats = computed(() => {
  if (!selectedCompetence.value || !props.outcomesByCompetence[selectedCompetence.value]) {
    return props.inFormationJudgments
  }

  const outcomes = props.outcomesByCompetence[selectedCompetence.value] || []
  let approved = 0
  let pending = 0
  outcomes.forEach((r) => {
    approved += r.approved
    pending += r.pending
  })
  const total = approved + pending
  const approvalPercentage = total > 0 ? (approved / total) * 100 : 0

  return {
    approved,
    pending,
    total,
    approvalPercentage
  }
})

// Filtrado de competencias para el buscador del select personalizado
const filteredCompetenceOptions = computed(() => {
  const query = searchCompetenceText.value.trim().toLowerCase()
  if (!query) return props.competences
  return props.competences.filter((c) => c.toLowerCase().includes(query))
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
  if (isDropdownOpen.value) {
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 50)
  }
}

const closeDropdown = () => {
  isDropdownOpen.value = false
  searchCompetenceText.value = ''
}

const selectCompetence = (comp: string) => {
  selectedCompetence.value = comp
  closeDropdown()
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

const renderChart = () => {
  if (!canvasRef.value) return

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const { approved, pending } = currentCompetenceStats.value

  const config: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
      labels: ['Aprobados', 'Por Evaluar'],
      datasets: [
        {
          data: [approved, pending],
          backgroundColor: ['#39A900', '#f6c23e'],
          hoverBackgroundColor: ['#2e8700', '#dda20a'],
          borderColor: '#ffffff',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 12,
            font: {
              size: 12,
              family: 'inherit'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const val = Number(context.raw) || 0
              const total = approved + pending
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
              return ` ${context.label}: ${new Intl.NumberFormat('es-CO').format(val)} (${pct}%)`
            }
          }
        }
      },
      cutout: '68%'
    }
  }

  chartInstance = new Chart(canvasRef.value, config)
}

const updateChartData = () => {
  if (!chartInstance) {
    renderChart()
    return
  }
  const { approved, pending } = currentCompetenceStats.value
  chartInstance.data.datasets[0].data = [approved, pending]
  chartInstance.update()
}

onMounted(() => {
  renderChart()
  document.addEventListener('click', handleClickOutside)
})

watch(
  currentCompetenceStats,
  () => {
    updateChartData()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<template>
  <div class="card border-0 shadow-sm h-100">
    <div class="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon bg-success-subtle text-success">
          <i class="fas fa-chart-pie"></i>
        </div>
        <div>
          <h6 class="fw-bold mb-0 text-dark">Distribución de Juicios Evaluativos</h6>
          <small class="text-muted">Porcentajes y RAPs en aprendices activos (En Formación, Certificado, Por Certificar)</small>
        </div>
      </div>
      <span class="badge bg-success-subtle text-success border border-success-subtle" title="Calculado sobre aprendices en estado EN FORMACIÓN, CERTIFICADO y POR CERTIFICAR">
        APRENDICES ACTIVOS
      </span>
    </div>

    <div class="card-body p-4">
      <div class="row g-4 align-items-center">
        <!-- Gráfica Circular de Aprobados vs Por Evaluar de la Competencia Seleccionada -->
        <div class="col-12 col-md-5 d-flex flex-column align-items-center justify-content-center">
          <div style="position: relative; height: 210px; width: 100%; max-width: 250px;">
            <canvas ref="canvasRef"></canvas>
            <div class="doughnut-inner-text text-center">
              <div class="h4 fw-bold text-dark mb-0">
                {{ currentCompetenceStats.approvalPercentage.toFixed(1) }}%
              </div>
              <small class="text-muted" style="font-size: 0.7rem;">Aprobados</small>
            </div>
          </div>

          <!-- Métricas de la Competencia Seleccionada -->
          <div class="d-flex justify-content-around w-100 mt-2 pt-2 border-top text-center">
            <div>
              <div class="text-muted small">Aprobados</div>
              <div class="fw-bold text-success font-monospace">
                {{ currentCompetenceStats.approved }}
              </div>
            </div>
            <div class="border-end"></div>
            <div>
              <div class="text-muted small">Por Evaluar</div>
              <div class="fw-bold text-warning font-monospace">
                {{ currentCompetenceStats.pending }}
              </div>
            </div>
            <div class="border-end"></div>
            <div>
              <div class="text-muted small">Total Juicios</div>
              <div class="fw-bold text-dark font-monospace">
                {{ currentCompetenceStats.total }}
              </div>
            </div>
          </div>
        </div>

        <!-- Selector Personalizado de Competencia y Resultados de Aprendizaje -->
        <div class="col-12 col-md-7">
          <div class="mb-3 position-relative" ref="dropdownRef">
            <label class="form-label fw-bold small text-dark d-flex align-items-center gap-1 mb-1">
              <i class="fas fa-search me-1 text-primary"></i> Seleccionar Competencia:
            </label>

            <!-- Botón Desplegable Personalizado -->
            <button
              type="button"
              class="form-select form-select-sm bg-light border text-start d-flex justify-content-between align-items-center w-100 py-2 custom-select-btn"
              @click="toggleDropdown"
            >
              <span class="text-truncate me-2 fw-semibold text-dark" :title="selectedCompetence || 'Seleccionar Competencia'">
                {{ selectedCompetence || 'Seleccionar Competencia...' }}
              </span>
              <i :class="['fas fa-chevron-down small text-muted transition-transform', { 'rotate-180': isDropdownOpen }]"></i>
            </button>

            <!-- Menú Desplegable Flotante hacia Abajo -->
            <div
              v-if="isDropdownOpen"
              class="custom-dropdown-menu shadow-lg rounded-3 border bg-white p-2"
            >
              <!-- Campo de Búsqueda rápida dentro del menú -->
              <div class="input-group input-group-sm mb-2">
                <span class="input-group-text bg-light border-end-0">
                  <i class="fas fa-search text-muted"></i>
                </span>
                <input
                  ref="searchInputRef"
                  v-model="searchCompetenceText"
                  type="text"
                  class="form-control border-start-0"
                  placeholder="Buscar competencia por código o nombre..."
                  @click.stop
                />
                <button
                  v-if="searchCompetenceText"
                  class="btn btn-outline-secondary"
                  type="button"
                  @click.stop="searchCompetenceText = ''"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>

              <!-- Lista de Competencias con Scroll -->
              <div class="competence-options-list pe-1" style="max-height: 230px; overflow-y: auto;">
                <button
                  v-for="comp in filteredCompetenceOptions"
                  :key="comp"
                  type="button"
                  :class="[
                    'dropdown-item text-start p-2 rounded-2 small mb-1 d-flex align-items-start gap-2',
                    comp === selectedCompetence ? 'bg-success-subtle text-success fw-bold' : 'text-dark'
                  ]"
                  @click="selectCompetence(comp)"
                >
                  <i
                    :class="[
                      'mt-1 flex-shrink-0',
                      comp === selectedCompetence ? 'fas fa-check-circle text-success' : 'far fa-circle text-muted'
                    ]"
                  ></i>
                  <span class="text-break">{{ comp }}</span>
                </button>

                <div v-if="filteredCompetenceOptions.length === 0" class="text-muted small text-center py-3">
                  No se encontraron competencias que coincidan.
                </div>
              </div>
            </div>
          </div>

          <!-- Desglose de Resultados de Aprendizaje -->
          <div v-if="selectedCompetence && outcomesByCompetence[selectedCompetence]" class="outcomes-container">
            <div class="small fw-semibold text-muted mb-2 d-flex justify-content-between align-items-center">
              <span>Resultados de Aprendizaje ({{ outcomesByCompetence[selectedCompetence].length }} RAPs):</span>
              <span class="badge bg-light text-dark border font-monospace">
                {{ currentCompetenceStats.approved }} de {{ currentCompetenceStats.total }} aprobados
              </span>
            </div>

            <div class="rap-scroll-list pe-1" style="max-height: 200px; overflow-y: auto;">
              <div
                v-for="rap in outcomesByCompetence[selectedCompetence]"
                :key="rap.outcomeId"
                class="rap-item p-2 mb-2 bg-light rounded-2 border"
              >
                <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                  <span class="small fw-semibold text-dark text-truncate" :title="rap.outcomeName">
                    {{ rap.outcomeName }}
                  </span>
                  <span class="badge bg-white text-dark border small font-monospace flex-shrink-0">
                    {{ rap.approved }} / {{ rap.total }}
                  </span>
                </div>

                <!-- Barra comparativa de aprobados y por evaluar -->
                <div class="progress" style="height: 6px;">
                  <div
                    class="progress-bar bg-success"
                    role="progressbar"
                    :style="{ width: `${rap.percentage}%` }"
                    :title="`Aprobados: ${rap.approved}`"
                  ></div>
                  <div
                    class="progress-bar bg-warning"
                    role="progressbar"
                    :style="{ width: `${100 - rap.percentage}%` }"
                    :title="`Por evaluar: ${rap.pending}`"
                  ></div>
                </div>

                <div class="d-flex justify-content-between mt-1 text-muted" style="font-size: 0.72rem;">
                  <span class="text-success"><i class="fas fa-check-circle me-1"></i>{{ rap.approved }} aprobados</span>
                  <span class="text-warning"><i class="fas fa-clock me-1"></i>{{ rap.pending }} por evaluar</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-muted small py-4 text-center">
            Seleccione una competencia para visualizar sus resultados de aprendizaje.
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

.doughnut-inner-text {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.custom-select-btn {
  cursor: pointer;
  border-color: #ced4da;
  transition: all 0.15s ease;
}

.custom-select-btn:hover {
  border-color: #39A900;
  background-color: #fcfdfc;
}

.custom-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 1050;
  background-color: #ffffff;
  animation: fadeInDown 0.15s ease-out;
}

.transition-transform {
  transition: transform 0.2s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

.dropdown-item {
  white-space: normal !important;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.dropdown-item:hover {
  background-color: #f1f4f8;
}

.rap-item {
  transition: background-color 0.15s ease;
}

.rap-item:hover {
  background-color: #f1f4f8 !important;
}

.rap-scroll-list::-webkit-scrollbar,
.competence-options-list::-webkit-scrollbar {
  width: 5px;
}

.rap-scroll-list::-webkit-scrollbar-thumb,
.competence-options-list::-webkit-scrollbar-thumb {
  background-color: #ced4da;
  border-radius: 3px;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
