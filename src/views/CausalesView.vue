<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Causal, CausalPayload } from '@/interfaces/Causal'
import type { TableColumn } from '@/interfaces/Pagination'
import type { ApiError } from '@/interfaces/ApiResponse'
import { useCausalStore } from '@/stores/causalStore'
import { useNotification } from '@/composables/useNotification'
import DataTable from '@/components/common/DataTable.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import CausalModal from '@/components/causales/CausalModal.vue'

const causalStore = useCausalStore()
const { notifySuccess, notifyError } = useNotification()

// Estado para el modal de Crear/Editar
const isModalOpen = ref(false)
const selectedCausal = ref<Causal | null>(null)
const modalLoading = ref(false)
const modalError = ref<ApiError | null>(null)

// Estado para el diálogo de confirmación de eliminación
const isConfirmOpen = ref(false)
const causalToDelete = ref<Causal | null>(null)
const deleteLoading = ref(false)

// Configuración de las columnas de la tabla
const columns: TableColumn<Causal>[] = [
  {
    key: 'id',
    label: 'ID',
    width: '90px',
    align: 'center',
    sortable: true
  },
  {
    key: 'description',
    label: 'Descripción de la Causal',
    sortable: true
  },
  {
    key: 'created_at',
    label: 'Fecha Creación',
    width: '180px',
    sortable: true,
    formatter: (val) => (val ? String(val).substring(0, 19) : '—')
  },
  {
    key: 'updated_at',
    label: 'Última Actualización',
    width: '180px',
    sortable: true,
    formatter: (val) => (val ? String(val).substring(0, 19) : '—')
  }
]

// Cargar causales al montar la vista
onMounted(async () => {
  await loadCausales()
})

const loadCausales = async () => {
  try {
    await causalStore.fetchCausales()
  } catch (err: any) {
    notifyError(
      err.message || 'No fue posible cargar el listado de causales.',
      'Error de Carga'
    )
  }
}

// Abrir modal en modo creación
const handleCreate = () => {
  selectedCausal.value = null
  modalError.value = null
  isModalOpen.value = true
}

// Abrir modal en modo edición
const handleEdit = (item: Causal) => {
  selectedCausal.value = { ...item }
  modalError.value = null
  isModalOpen.value = true
}

// Guardar (crear o actualizar)
const handleModalSubmit = async (payload: CausalPayload) => {
  modalLoading.value = true
  modalError.value = null

  try {
    if (selectedCausal.value) {
      // Actualización
      await causalStore.editCausal(selectedCausal.value.id, payload)
      notifySuccess('Causal actualizada correctamente.', 'Operación Exitosa')
    } else {
      // Creación
      await causalStore.addCausal(payload)
      notifySuccess('Nueva causal registrada con éxito.', 'Registro Creado')
    }
    isModalOpen.value = false
  } catch (err: any) {
    modalError.value = err as ApiError
    notifyError(
      err.message || 'Ocurrió un error al procesar la solicitud.',
      'Error en Guardado'
    )
  } finally {
    modalLoading.value = false
  }
}

// Iniciar eliminación
const handleDeletePrompt = (item: Causal) => {
  causalToDelete.value = item
  isConfirmOpen.value = true
}

// Confirmar eliminación
const handleConfirmDelete = async () => {
  if (!causalToDelete.value) return

  deleteLoading.value = true
  try {
    await causalStore.removeCausal(causalToDelete.value.id)
    notifySuccess('La causal fue eliminada satisfactoriamente.', 'Registro Eliminado')
    isConfirmOpen.value = false
    causalToDelete.value = null
  } catch (err: any) {
    notifyError(
      err.message || 'No se pudo eliminar la causal.',
      'Error al Eliminar'
    )
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="causales-view">
    <!-- Encabezado de la página -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-2">
      <div>
        <h1 class="h3 mb-1 text-gray-800 fw-bold">Módulo de Causales</h1>
        <p class="text-muted small mb-0">
          Administración de causales y motivos para el reporte de juicios evaluativos.
        </p>
      </div>

      <div>
        <BaseButton
          variant="primary"
          icon="fas fa-plus-circle"
          @click="handleCreate"
        >
          Nueva Causal
        </BaseButton>
      </div>
    </div>

    <!-- Alerta de error global de carga si existiera -->
    <AlertMessage
      v-if="causalStore.error"
      variant="danger"
      :title="causalStore.error.message"
      :errors="causalStore.error.errors"
      :dismissible="true"
      class="mb-4"
    />

    <!-- Tabla Reutilizable de Causales -->
    <DataTable
      :items="causalStore.causales"
      :columns="columns"
      :loading="causalStore.loading"
      search-placeholder="Buscar causal por ID o descripción..."
      empty-text="No hay causales registradas en la base de datos."
      :page-size="10"
      @edit="handleEdit"
      @delete="handleDeletePrompt"
      @refresh="loadCausales"
    >
      <!-- Personalización de celda de ID con badge -->
      <template #cell(id)="{ value }">
        <span class="badge bg-light text-primary border fw-bold px-2 py-1">
          #{{ value }}
        </span>
      </template>

      <!-- Personalización de celda de descripción -->
      <template #cell(description)="{ value }">
        <span class="fw-semibold text-dark">{{ value }}</span>
      </template>
    </DataTable>

    <!-- Modal Reutilizable para Crear / Editar Causal -->
    <CausalModal
      v-model="isModalOpen"
      :causal="selectedCausal"
      :loading="modalLoading"
      :api-error="modalError"
      @submit="handleModalSubmit"
    />

    <!-- Diálogo de Confirmación para Eliminar -->
    <ConfirmDialog
      v-model="isConfirmOpen"
      title="Eliminar Causal"
      :message="`¿Está seguro de que desea eliminar la causal #${causalToDelete?.id} &quot;${causalToDelete?.description}&quot;? Esta acción no se puede deshacer.`"
      confirm-text="Sí, Eliminar"
      cancel-text="Cancelar"
      variant="danger"
      :loading="deleteLoading"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<style scoped>
/* Los estilos generales residen en main.css */
</style>
