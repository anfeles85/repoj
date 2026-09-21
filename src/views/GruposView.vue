<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGroupStore } from '@/stores/groupStore'
import DataTable from '@/components/common/DataTable.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import GroupModal from '@/components/groups/GroupModal.vue'
import GroupStatusBadge from '@/components/groups/GroupStatusBadge.vue'
import type { Group, CreateGroupPayload, UpdateGroupPayload } from '@/interfaces/Group'
import type { TableColumn } from '@/interfaces/Pagination'

const groupStore = useGroupStore()

// Filtros locales
const selectedShiftFilter = ref<string>('')
const selectedStatusFilter = ref<string>('')

// Control del Modal de Crear/Editar
const isModalOpen = ref(false)
const selectedGroup = ref<Group | null>(null)

// Control del Diálogo de Eliminación
const isDeleteConfirmOpen = ref(false)
const groupToDelete = ref<Group | null>(null)
const deleteLoading = ref(false)

// Definición de columnas para DataTable
const columns: TableColumn<Group>[] = [
  { key: 'number', label: 'Ficha', width: '130px', align: 'center', sortable: true },
  { key: 'program', label: 'Programa de Formación', sortable: true },
  { key: 'shift', label: 'Jornada', width: '120px', align: 'center', sortable: true },
  { key: 'initial_date', label: 'Fecha Inicio', width: '120px', align: 'center', sortable: true },
  { key: 'final_date', label: 'Fecha Fin', width: '120px', align: 'center', sortable: true },
  { key: 'status', label: 'Estado', width: '160px', align: 'center', sortable: true },
  { key: 'evaluative_judgments_file', label: 'Juicios', width: '110px', align: 'center', sortable: false }
]

// Lista con filtros reactivos aplicados
const filteredGroups = computed(() => {
  return groupStore.groups.filter((group) => {
    const matchShift = !selectedShiftFilter.value || group.shift === selectedShiftFilter.value
    const matchStatus = !selectedStatusFilter.value || group.status === selectedStatusFilter.value
    return matchShift && matchStatus
  })
})

onMounted(() => {
  groupStore.fetchGroups()
})

// Abrir modal para crear nuevo grupo
const handleOpenCreate = () => {
  selectedGroup.value = null
  isModalOpen.value = true
}

// Abrir modal para editar grupo existente
const handleOpenEdit = (group: Group) => {
  selectedGroup.value = { ...group }
  isModalOpen.value = true
}

// Guardar grupo (Creación o Edición)
const handleSubmitGroup = async (payload: CreateGroupPayload | UpdateGroupPayload) => {
  try {
    if (selectedGroup.value) {
      await groupStore.updateGroup(selectedGroup.value.id, payload as UpdateGroupPayload)
    } else {
      await groupStore.createGroup(payload as CreateGroupPayload)
    }
    isModalOpen.value = false
    selectedGroup.value = null
  } catch {
    // El error se gestiona de forma centralizada en el store y se muestra en AlertMessage
  }
}

// Confirmación para eliminar
const handleOpenDelete = (group: Group) => {
  groupToDelete.value = group
  isDeleteConfirmOpen.value = true
}

// Confirmar y procesar eliminación
const handleConfirmDelete = async () => {
  if (!groupToDelete.value) return
  deleteLoading.value = true
  try {
    await groupStore.deleteGroup(groupToDelete.value.id)
    isDeleteConfirmOpen.value = false
    groupToDelete.value = null
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="grupos-view">
    <!-- Encabezado de página -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
      <div>
        <h1 class="h3 mb-1 text-gray-800 fw-bold">Gestión de Grupos</h1>
        <p class="text-muted small mb-0">
          Administración de fichas y programas de formación SENA en Supabase.
        </p>
      </div>

      <div>
        <BaseButton
          variant="primary"
          icon="fas fa-plus-circle"
          @click="handleOpenCreate"
        >
          Nuevo Grupo
        </BaseButton>
      </div>
    </div>

    <!-- Alerta de error si falla la carga inicial -->
    <AlertMessage
      v-if="groupStore.error && !isModalOpen"
      variant="danger"
      :message="groupStore.error.message"
      :errors="groupStore.error.errors"
      dismissible
      class="mb-3"
      @dismiss="groupStore.error = null"
    />

    <!-- Barra de Filtros Rápidos por Jornada y Estado -->
    <div class="card shadow-sm border-0 mb-3">
      <div class="card-body py-2 px-3">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-sm-auto text-muted small fw-bold">
            <i class="fas fa-filter me-1"></i> Filtrar por:
          </div>

          <div class="col-12 col-sm-auto">
            <select v-model="selectedShiftFilter" class="form-select form-select-sm bg-light">
              <option value="">Todas las Jornadas</option>
              <option value="DIURNA">Diurna</option>
              <option value="MIXTA">Mixta</option>
              <option value="NOCTURNA">Nocturna</option>
            </select>
          </div>

          <div class="col-12 col-sm-auto">
            <select v-model="selectedStatusFilter" class="form-select form-select-sm bg-light">
              <option value="">Todos los Estados</option>
              <option value="EN EJECUCION">En Ejecución</option>
              <option value="PRODUCTIVA">Etapa Productiva</option>
              <option value="INACTIVA">Inactiva</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <div
            v-if="selectedShiftFilter || selectedStatusFilter"
            class="col-12 col-sm-auto ms-sm-auto"
          >
            <button
              type="button"
              class="btn btn-link btn-sm text-decoration-none text-danger p-0"
              @click="selectedShiftFilter = ''; selectedStatusFilter = ''"
            >
              <i class="fas fa-times me-1"></i> Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla interactiva con DataTable -->
    <DataTable
      :items="filteredGroups"
      :columns="columns"
      :loading="groupStore.loading"
      search-placeholder="Buscar grupo por número de ficha o programa..."
      :page-size="10"
      @refresh="groupStore.fetchGroups"
    >
      <!-- Celda de Ficha / Número -->
      <template #cell(number)="{ value }">
        <span class="badge bg-light text-dark border px-2 py-1 fw-bold font-monospace" style="font-size: 0.9rem;">
          <i class="fas fa-hashtag text-primary me-1"></i> {{ value }}
        </span>
      </template>

      <!-- Celda de Programa -->
      <template #cell(program)="{ value }">
        <div class="fw-semibold text-dark">{{ value }}</div>
      </template>

      <!-- Celda de Jornada -->
      <template #cell(shift)="{ value }">
        <GroupStatusBadge type="shift" :value="value" />
      </template>

      <!-- Celda de Fecha de Inicio -->
      <template #cell(initial_date)="{ value }">
        <span class="text-secondary small">
          <i class="far fa-calendar-alt me-1 text-muted"></i> {{ value || 'N/A' }}
        </span>
      </template>

      <!-- Celda de Fecha de Fin -->
      <template #cell(final_date)="{ value }">
        <span class="text-secondary small">
          <i class="far fa-calendar-check me-1 text-muted"></i> {{ value || 'N/A' }}
        </span>
      </template>

      <!-- Celda de Estado -->
      <template #cell(status)="{ value }">
        <GroupStatusBadge type="status" :value="value" />
      </template>

      <!-- Celda de Archivo de Juicios Evaluativos -->
      <template #cell(evaluative_judgments_file)="{ item }">
        <div v-if="item.evaluative_judgments_file" class="d-flex align-items-center justify-content-center gap-1">
          <router-link
            :to="{ path: '/analisis-juicios', query: { groupId: item.id } }"
            class="btn btn-sm btn-outline-success py-0 px-2 fw-semibold"
            style="font-size: 0.78rem;"
            :title="`Analizar juicios: ${item.evaluative_judgments_file_name || 'Archivo XLS'}`"
          >
            <i class="fas fa-chart-pie me-1"></i> Analizar
          </router-link>
        </div>
        <span v-else class="text-muted small" title="Sin archivo de juicios">
          <i class="fas fa-minus text-muted"></i>
        </span>
      </template>

      <!-- Columna de Acciones -->
      <template #actions="{ item }">
        <div class="btn-group btn-group-sm" role="group" aria-label="Acciones de grupo">
          <!-- Analizar juicios si existe archivo -->
          <router-link
            v-if="item.evaluative_judgments_file"
            :to="{ path: '/analisis-juicios', query: { groupId: item.id } }"
            class="btn btn-outline-info"
            title="Analizar juicios evaluativos"
          >
            <i class="fas fa-chart-pie"></i>
          </router-link>

          <!-- Descargar archivo de juicios evaluativos si existe -->
          <button
            v-if="item.evaluative_judgments_file"
            type="button"
            class="btn btn-outline-success"
            :title="`Descargar ${item.evaluative_judgments_file_name || 'juicios evaluativos'}`"
            @click="groupStore.downloadJudgments(item)"
          >
            <i class="fas fa-download"></i>
          </button>

          <!-- Editar -->
          <button
            type="button"
            class="btn btn-outline-primary"
            title="Editar grupo"
            @click="handleOpenEdit(item)"
          >
            <i class="fas fa-edit"></i>
          </button>

          <!-- Eliminar -->
          <button
            type="button"
            class="btn btn-outline-danger"
            title="Eliminar grupo"
            @click="handleOpenDelete(item)"
          >
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Modal para Crear / Editar Grupo -->
    <GroupModal
      v-model="isModalOpen"
      :group="selectedGroup"
      :loading="groupStore.loading"
      :api-error="groupStore.error"
      @submit="handleSubmitGroup"
    />

    <!-- Diálogo de Confirmación de Eliminación -->
    <ConfirmDialog
      v-model="isDeleteConfirmOpen"
      title="Eliminar Grupo de Formación"
      :message="`¿Está seguro de eliminar el grupo con ficha ${groupToDelete?.number} (${groupToDelete?.program})? Esta acción no se puede deshacer.`"
      confirm-text="Sí, Eliminar"
      cancel-text="Cancelar"
      variant="danger"
      :loading="deleteLoading"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<style scoped>
.grupos-view {
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
