<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupStore } from '@/stores/groupStore'
import { useAuthStore } from '@/stores/authStore'
import { judgmentAnalysisService } from '@/services/judgmentAnalysisService'
import { judgmentPdfReportService } from '@/services/judgmentPdfReportService'
import type { Group } from '@/interfaces/Group'
import type { GroupAnalyticsResult } from '@/interfaces/JudgmentAnalysis'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import Loading from '@/components/common/Loading.vue'
import AnalisisSummaryCards from '@/components/analisis/AnalisisSummaryCards.vue'
import ApprenticeStatusTable from '@/components/analisis/ApprenticeStatusTable.vue'
import JudgmentsDistributionChart from '@/components/analisis/JudgmentsDistributionChart.vue'
import CompetencePendingChart from '@/components/analisis/CompetencePendingChart.vue'
import TimelineEvolutionChart from '@/components/analisis/TimelineEvolutionChart.vue'
import ApprenticeHeatmap from '@/components/analisis/ApprenticeHeatmap.vue'

const route = useRoute()
const router = useRouter()
const groupStore = useGroupStore()
const authStore = useAuthStore()

const selectedGroupId = ref<number | ''>('')
const isProcessing = ref(false)
const processingError = ref<string | null>(null)
const analyticsResult = ref<GroupAnalyticsResult | null>(null)

// Estados para el selector personalizado con buscador
const isGroupDropdownOpen = ref(false)
const groupDropdownRef = ref<HTMLElement | null>(null)
const groupSearchInputRef = ref<HTMLInputElement | null>(null)
const searchGroupText = ref('')

// Lista de grupos ordenados (primero los que tienen archivo de juicios)
const sortedGroups = computed(() => {
  return [...groupStore.groups].sort((a, b) => {
    const aHas = !!a.evaluative_judgments_file ? 1 : 0
    const bHas = !!b.evaluative_judgments_file ? 1 : 0
    return bHas - aHas
  })
})

// Filtrar grupos por número de ficha, programa o jornada
const filteredGroups = computed(() => {
  const query = searchGroupText.value.trim().toLowerCase()
  if (!query) return sortedGroups.value
  return sortedGroups.value.filter((g) => {
    const num = String(g.number || '').toLowerCase()
    const prog = String(g.program || '').toLowerCase()
    const shift = String(g.shift || '').toLowerCase()
    return num.includes(query) || prog.includes(query) || shift.includes(query)
  })
})

const toggleGroupDropdown = () => {
  if (isProcessing.value || groupStore.loading) return
  isGroupDropdownOpen.value = !isGroupDropdownOpen.value
  if (isGroupDropdownOpen.value) {
    setTimeout(() => {
      groupSearchInputRef.value?.focus()
    }, 50)
  }
}

const closeGroupDropdown = () => {
  isGroupDropdownOpen.value = false
  searchGroupText.value = ''
}

const selectGroup = (groupId: number) => {
  selectedGroupId.value = groupId
  closeGroupDropdown()
}

const handleGroupClickOutside = (event: MouseEvent) => {
  if (groupDropdownRef.value && !groupDropdownRef.value.contains(event.target as Node)) {
    closeGroupDropdown()
  }
}

const currentSelectedGroup = computed<Group | null>(() => {
  if (!selectedGroupId.value) return null
  return groupStore.groups.find((g) => g.id === Number(selectedGroupId.value)) || null
})

// Competencias únicas del resultado
const availableCompetences = computed(() => {
  if (!analyticsResult.value) return []
  return analyticsResult.value.competenceMatrix.map((c) => c.competenceName)
})

// Procesar análisis cuando cambie el grupo
const processGroupAnalytics = async () => {
  processingError.value = null
  analyticsResult.value = null

  const group = currentSelectedGroup.value
  if (!group || !group.evaluative_judgments_file) {
    return
  }

  isProcessing.value = true
  try {
    // Breve pausa para permitir render del loading
    await new Promise((resolve) => setTimeout(resolve, 80))

    const records = judgmentAnalysisService.parseExcelBase64(group.evaluative_judgments_file)
    analyticsResult.value = judgmentAnalysisService.calculateGroupAnalytics(records)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al procesar el archivo Excel del grupo.'
    processingError.value = msg
  } finally {
    isProcessing.value = false
  }
}

watch(selectedGroupId, () => {
  processGroupAnalytics()
})

onMounted(async () => {
  if (groupStore.groups.length === 0) {
    await groupStore.fetchGroups()
  }

  // Preseleccionar si viene por parámetro en URL
  const paramId = route.query.groupId
  if (paramId) {
    const parsed = Number(paramId)
    if (!isNaN(parsed) && groupStore.groups.some((g) => g.id === parsed)) {
      selectedGroupId.value = parsed
      return
    }
  }

  // Si no hay parámetro, preseleccionar el primer grupo que tenga archivo
  const firstWithFile = groupStore.groups.find((g) => !!g.evaluative_judgments_file)
  if (firstWithFile) {
    selectedGroupId.value = firstWithFile.id
  } else if (groupStore.groups.length > 0) {
    selectedGroupId.value = groupStore.groups[0].id
  }

  document.addEventListener('click', handleGroupClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleGroupClickOutside)
})

const handleDownloadCurrentFile = () => {
  if (currentSelectedGroup.value) {
    groupStore.downloadJudgments(currentSelectedGroup.value)
  }
}

const isGeneratingPdf = ref(false)

// Permiso para exportar PDF: Instructor, Administrador y Coordinador
const canDownloadPdf = computed(() => {
  return authStore.isInstructor || authStore.isAdmin || authStore.isCoordinador
})

const handleExportPdf = async () => {
  if (!currentSelectedGroup.value || !analyticsResult.value || isGeneratingPdf.value) return
  isGeneratingPdf.value = true
  try {
    await judgmentPdfReportService.downloadPdfReport(
      currentSelectedGroup.value,
      analyticsResult.value,
      authStore.userName
    )
  } catch (err) {
    console.error('Error al generar el PDF:', err)
  } finally {
    isGeneratingPdf.value = false
  }
}

const goToGroups = () => {
  router.push('/grupos')
}
</script>

<template>
  <div class="analisis-juicios-view">
    <!-- Encabezado de página -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
      <div>
        <h1 class="h3 mb-1 text-gray-800 fw-bold">Análisis de Juicios Evaluativos</h1>
        <p class="text-muted small mb-0">
          Tablero de control y analítica académica de juicios evaluativos SENA
        </p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button
          v-if="analyticsResult && canDownloadPdf"
          type="button"
          class="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-2 px-3 shadow-none"
          :disabled="isGeneratingPdf"
          title="Descargar análisis en PDF"
          @click="handleExportPdf"
        >
          <span v-if="isGeneratingPdf" class="spinner-border spinner-border-sm text-danger" role="status"></span>
          <i v-else class="fas fa-file-pdf text-danger fs-6"></i>
          <span class="fw-semibold">{{ isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF' }}</span>
        </button>

        <BaseButton
          variant="outline-secondary"
          icon="fas fa-users-rectangle"
          size="sm"
          @click="goToGroups"
        >
          Gestión de Grupos
        </BaseButton>
      </div>
    </div>

    <!-- Filtro Principal de Selección de Grupo -->
    <div class="card shadow-sm border-0 mb-4 select-group-bar">
      <div class="card-body py-3 px-4">
        <div class="row g-3 align-items-center">
          <div class="col-12 col-md-auto">
            <label class="form-label fw-bold mb-0 text-dark d-flex align-items-center gap-2">
              <i class="fas fa-filter text-success"></i>
              <span>Seleccionar Grupo / Ficha:</span>
            </label>
          </div>

          <div class="col-12 col-md-6 col-lg-5 col-xl-4 position-relative" ref="groupDropdownRef">
            <!-- Botón Desplegable Personalizado -->
            <button
              type="button"
              class="form-select form-select-sm bg-light border text-start d-flex justify-content-between align-items-center w-100 py-2 custom-select-btn"
              :disabled="isProcessing || groupStore.loading"
              @click="toggleGroupDropdown"
            >
              <span v-if="currentSelectedGroup" class="text-truncate me-2 fw-semibold text-dark">
                Ficha {{ currentSelectedGroup.number }} - {{ currentSelectedGroup.program }}
                <span v-if="currentSelectedGroup.evaluative_judgments_file" class="text-success small fw-normal ms-1">
                  (con XLS)
                </span>
                <span v-else class="text-muted small fw-normal ms-1">
                  (sin archivo)
                </span>
              </span>
              <span v-else class="text-muted small">
                Seleccione una ficha...
              </span>
              <i :class="['fas fa-chevron-down small text-muted transition-transform ms-1 flex-shrink-0', { 'rotate-180': isGroupDropdownOpen }]"></i>
            </button>

            <!-- Menú Desplegable Flotante con Buscador -->
            <div
              v-if="isGroupDropdownOpen"
              class="custom-dropdown-menu shadow-lg rounded-3 border bg-white p-2"
            >
              <!-- Campo de Búsqueda rápida -->
              <div class="input-group input-group-sm mb-2">
                <span class="input-group-text bg-light border-end-0">
                  <i class="fas fa-search text-muted"></i>
                </span>
                <input
                  ref="groupSearchInputRef"
                  v-model="searchGroupText"
                  type="text"
                  class="form-control border-start-0"
                  placeholder="Buscar por ficha, programa o jornada..."
                  @click.stop
                />
                <button
                  v-if="searchGroupText"
                  class="btn btn-outline-secondary"
                  type="button"
                  @click.stop="searchGroupText = ''"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>

              <!-- Lista de Grupos / Fichas con Scroll -->
              <div class="group-options-list pe-1" style="max-height: 240px; overflow-y: auto;">
                <button
                  v-for="group in filteredGroups"
                  :key="group.id"
                  type="button"
                  :class="[
                    'dropdown-item text-start p-2 rounded-2 small mb-1 d-flex align-items-center justify-content-between gap-2',
                    group.id === selectedGroupId ? 'bg-success-subtle text-success fw-bold' : 'text-dark'
                  ]"
                  @click="selectGroup(group.id)"
                >
                  <div class="d-flex align-items-center gap-2 text-truncate">
                    <i
                      :class="[
                        'flex-shrink-0',
                        group.id === selectedGroupId ? 'fas fa-check-circle text-success' : 'far fa-circle text-muted'
                      ]"
                    ></i>
                    <span class="text-truncate">
                      <strong>Ficha {{ group.number }}</strong> - {{ group.program }}
                    </span>
                  </div>
                  <span
                    v-if="group.evaluative_judgments_file"
                    class="badge bg-success-subtle text-success border border-success-subtle flex-shrink-0"
                    style="font-size: 0.68rem;"
                  >
                    <i class="fas fa-file-excel me-1"></i>Con XLS
                  </span>
                  <span
                    v-else
                    class="badge bg-light text-muted border flex-shrink-0"
                    style="font-size: 0.68rem;"
                  >
                    Sin archivo
                  </span>
                </button>

                <div v-if="filteredGroups.length === 0" class="text-muted small text-center py-3">
                  No se encontraron fichas que coincidan con la búsqueda.
                </div>
              </div>
            </div>
          </div>

          <!-- Información del grupo seleccionado -->
          <div v-if="currentSelectedGroup" class="col-12 col-md ms-md-auto d-flex flex-wrap align-items-center justify-content-md-end gap-2">
            <span class="badge bg-light text-dark border px-2 py-1 font-monospace">
              <i class="fas fa-clock text-muted me-1"></i> Jornada: {{ currentSelectedGroup.shift }}
            </span>
            <span class="badge bg-light text-dark border px-2 py-1">
              Estado: {{ currentSelectedGroup.status }}
            </span>

            <button
              v-if="currentSelectedGroup.evaluative_judgments_file"
              type="button"
              class="btn btn-sm btn-outline-success px-3"
              title="Descargar archivo XLS original"
              @click="handleDownloadCurrentFile"
            >
              <i class="fas fa-download me-1"></i> Descargar XLS
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicador de Carga -->
    <div v-if="isProcessing || groupStore.loading" class="py-5 text-center">
      <Loading message="Analizando datos de juicios evaluativos del grupo..." />
    </div>

    <!-- Error al procesar -->
    <div v-else-if="processingError" class="mb-4">
      <AlertMessage
        variant="danger"
        title="Error de Procesamiento"
        :message="processingError"
      />
    </div>

    <!-- Caso: No hay grupo seleccionado -->
    <div v-else-if="!selectedGroupId" class="card border-0 shadow-sm text-center py-5">
      <div class="card-body">
        <i class="fas fa-users-rectangle fs-1 text-secondary mb-3"></i>
        <h5 class="fw-bold text-dark">Seleccione un Grupo para Comenzar</h5>
        <p class="text-muted small mb-0">
          Utilice el selector superior para cargar el archivo de juicios evaluativos de la ficha.
        </p>
      </div>
    </div>

    <!-- Caso: Grupo seleccionado pero no tiene archivo XLS -->
    <div
      v-else-if="currentSelectedGroup && !currentSelectedGroup.evaluative_judgments_file"
      class="card border-0 shadow-sm py-5 text-center"
    >
      <div class="card-body px-4 py-4">
        <div class="empty-icon-box bg-warning-subtle text-warning mx-auto mb-3">
          <i class="fas fa-file-excel fs-2"></i>
        </div>
        <h5 class="fw-bold text-dark mb-2">Este Grupo no tiene Archivo de Juicios Evaluativos</h5>
        <p class="text-muted small mx-auto mb-4" style="max-width: 480px;">
          La ficha <strong>{{ currentSelectedGroup.number }} ({{ currentSelectedGroup.program }})</strong>
          aún no cuenta con un archivo Excel de juicios evaluativos subido al sistema.
        </p>
        <BaseButton
          variant="primary"
          icon="fas fa-upload"
          @click="goToGroups"
        >
          Ir a Grupos para Adjuntar Archivo
        </BaseButton>
      </div>
    </div>

    <!-- Caso: Datos procesados exitosamente -> Renderizar Dashboard de Analítica -->
    <div v-else-if="analyticsResult" class="dashboard-content">
      <!-- 1. Tarjetas Superiores (6 KPIs + Tasa de Evaluación) -->
      <AnalisisSummaryCards :summary="analyticsResult.summary" />

      <!-- 2. Fila: Estado de Aprendices y Distribución de Juicios (Doughnut) -->
      <div class="row g-4 mb-4">
        <div class="col-12 col-lg-5">
          <ApprenticeStatusTable
            :status-list="analyticsResult.statusDistribution"
            :total-apprentices="analyticsResult.summary.totalApprentices"
          />
        </div>
        <div class="col-12 col-lg-7">
          <JudgmentsDistributionChart
            :in-formation-judgments="analyticsResult.inFormationJudgments"
            :competences="availableCompetences"
            :outcomes-by-competence="analyticsResult.outcomesByCompetence"
          />
        </div>
      </div>

      <!-- 3. Juicios Pendientes por Competencia & Matriz Competencia x Estado -->
      <CompetencePendingChart :matrix="analyticsResult.competenceMatrix" />

      <!-- 4. Evolución Temporal de Juicios por Mes -->
      <TimelineEvolutionChart :evolution="analyticsResult.monthlyEvolution" />

      <!-- 5. Matriz de Calor de Aprendices x Competencias -->
      <ApprenticeHeatmap :heatmap="analyticsResult.heatmap" />
    </div>
  </div>
</template>

<style scoped>
.analisis-juicios-view {
  animation: fadeIn 0.15s ease-out;
}

.select-group-bar {
  border-left: 4px solid #39A900 !important;
}

.custom-select-btn {
  cursor: pointer;
  border-color: #ced4da;
  transition: all 0.15s ease;
}

.custom-select-btn:hover:not(:disabled) {
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

.empty-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
