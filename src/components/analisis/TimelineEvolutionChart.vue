<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
  type ChartConfiguration
} from 'chart.js'
import type { MonthlyEvolutionItem } from '@/interfaces/JudgmentAnalysis'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend
)

const props = defineProps<{
  evolution: MonthlyEvolutionItem[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const maxMonth = computed(() => {
  if (!props.evolution || props.evolution.length === 0) return null
  return [...props.evolution].sort((a, b) => b.count - a.count)[0]
})

const totalEvaluatedWithDates = computed(() => {
  return props.evolution.reduce((acc, curr) => acc + curr.count, 0)
})

const renderChart = () => {
  if (!canvasRef.value) return

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  if (props.evolution.length === 0) return

  const labels = props.evolution.map((e) => e.label)
  const data = props.evolution.map((e) => e.count)

  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Juicios Evaluados',
          data,
          borderColor: '#39A900',
          backgroundColor: 'rgba(57, 169, 0, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#39A900',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f5f5f5' },
          ticks: {
            font: { size: 11 },
            stepSize: Math.ceil(Math.max(...data, 10) / 5)
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Evaluados: ${ctx.raw} juicios`
          }
        }
      }
    }
  }

  chartInstance = new Chart(canvasRef.value, config)
}

onMounted(() => {
  renderChart()
})

watch(
  () => props.evolution,
  () => {
    renderChart()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<template>
  <div class="card border-0 shadow-sm mb-4">
    <div class="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-2">
        <div class="header-icon bg-info-subtle text-info">
          <i class="fas fa-calendar-alt"></i>
        </div>
        <div>
          <h6 class="fw-bold mb-0 text-dark">Evolución Temporal de Evaluaciones</h6>
          <small class="text-muted">Cantidad de juicios evaluativos registrados por mes</small>
        </div>
      </div>
      <div v-if="maxMonth" class="badge bg-light text-dark border">
        Pico: <span class="fw-bold text-success">{{ maxMonth.label }}</span> ({{ maxMonth.count }} juicios)
      </div>
    </div>

    <div class="card-body p-4">
      <div v-if="evolution.length > 0">
        <div style="height: 250px; position: relative;">
          <canvas ref="canvasRef"></canvas>
        </div>

        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top text-muted small">
          <div>
            <i class="fas fa-info-circle me-1 text-primary"></i>
            Total de evaluaciones registradas con fecha:
            <span class="fw-bold text-dark font-monospace">{{ totalEvaluatedWithDates }}</span>
          </div>
          <div>
            Rango: <span class="fw-semibold text-dark">{{ evolution[0]?.label }}</span> a
            <span class="fw-semibold text-dark">{{ evolution[evolution.length - 1]?.label }}</span>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-5 text-muted">
        <i class="far fa-calendar-times fs-2 text-secondary mb-2"></i>
        <div class="fw-semibold">No se encontraron fechas de evaluación</div>
        <small>El archivo cargado no contiene columnas de fecha u hora reconocibles para este grupo.</small>
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
