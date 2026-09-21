<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupStore } from '@/stores/groupStore'
import { judgmentAnalysisService } from '@/services/judgmentAnalysisService'
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

const selectedGroupId = ref<number | ''>('')
const isProcessing = ref(false)
const processingError = ref<string | null>(null)
const analyticsResult = ref<GroupAnalyticsResult | null>(null)

// Lista de grupos ordenados (primero los que tienen archivo de juicios)
const sortedGroups = computed(() => {
  return [...groupStore.groups].sort((a, b) => {
    const aHas = !!a.evaluative_judgments_file ? 1 : 0
    const bHas = !!b.evaluative_judgments_file ? 1 : 0
    return bHas - aHas
  })
})

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
})

const handleDownloadCurrentFile = () => {
  if (currentSelectedGroup.value) {
    groupStore.downloadJudgments(currentSelectedGroup.value)
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

          <div class="col-12 col-md-5 col-xl-4">
            <select
              v-model="selectedGroupId"
              class="form-select bg-light border-secondary-subtle fw-semibold"
              :disabled="isProcessing || groupStore.loading"
            >
              <option value="" disabled>Seleccione una ficha...</option>
              <option
                v-for="group in sortedGroups"
                :key="group.id"
                :value="group.id"
              >
                Ficha {{ group.number }} - {{ group.program }}
                {{ group.evaluative_judgments_file ? ' (con archivo XLS)' : ' (sin archivo)' }}
              </option>
            </select>
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
</style>
