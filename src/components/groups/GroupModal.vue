<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Group, CreateGroupPayload, UpdateGroupPayload, GroupShift, GroupStatus } from '@/interfaces/Group'
import type { ApiError } from '@/interfaces/ApiResponse'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect, { type SelectOption } from '@/components/common/BaseSelect.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import groupService from '@/services/groupService'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    group?: Group | null
    loading?: boolean
    apiError?: ApiError | null
  }>(),
  {
    group: null,
    loading: false,
    apiError: null
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: CreateGroupPayload | UpdateGroupPayload): void
}>()

const isEditing = computed(() => !!props.group)
const modalTitle = computed(() => (isEditing.value ? 'Editar Grupo de Formación' : 'Crear Nuevo Grupo'))

// Campos del formulario
const groupNumber = ref<number | ''>('')
const program = ref('')
const shift = ref<GroupShift>('DIURNA')
const initialDate = ref('')
const finalDate = ref('')
const status = ref<GroupStatus>('EN EJECUCION')

// Archivo de Juicios Evaluativos
const fileInputRef = ref<HTMLInputElement | null>(null)
const existingFileName = ref<string | null>(null)
const existingFileData = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const selectedFileData = ref<string | null>(null)
const isExistingFileMarkedForDeletion = ref(false)
const fileError = ref<string>('')
const showDeleteConfirm = ref(false)

const clientError = ref('')
const fieldErrors = ref<Record<string, string>>({})

const shiftOptions: SelectOption[] = [
  { value: 'DIURNA', label: 'Diurna' },
  { value: 'MIXTA', label: 'Mixta' },
  { value: 'NOCTURNA', label: 'Nocturna' }
]

const statusOptions: SelectOption[] = [
  { value: 'EN EJECUCION', label: 'En Ejecución' },
  { value: 'PRODUCTIVA', label: 'Etapa Productiva' },
  { value: 'INACTIVA', label: 'Inactiva' },
  { value: 'CANCELADA', label: 'Cancelada' }
]

const hasExistingFile = computed(() => {
  return isEditing.value && !!existingFileData.value && !isExistingFileMarkedForDeletion.value
})

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  else return (bytes / 1048576).toFixed(1) + ' MB'
}

const resetForm = () => {
  clientError.value = ''
  fieldErrors.value = {}
  fileError.value = ''
  selectedFile.value = null
  selectedFileData.value = null
  isExistingFileMarkedForDeletion.value = false
  showDeleteConfirm.value = false
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }

  if (props.group) {
    groupNumber.value = props.group.number
    program.value = props.group.program || ''
    shift.value = props.group.shift || 'DIURNA'
    initialDate.value = props.group.initial_date || ''
    finalDate.value = props.group.final_date || ''
    status.value = props.group.status || 'EN EJECUCION'
    existingFileName.value = props.group.evaluative_judgments_file_name || null
    existingFileData.value = props.group.evaluative_judgments_file || null
  } else {
    groupNumber.value = ''
    program.value = ''
    shift.value = 'DIURNA'
    initialDate.value = ''
    finalDate.value = ''
    status.value = 'EN EJECUCION'
    existingFileName.value = null
    existingFileData.value = null
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm()
    }
  }
)

watch(
  () => props.group,
  () => {
    if (props.modelValue) {
      resetForm()
    }
  }
)

const close = () => {
  if (props.loading) return
  emit('update:modelValue', false)
}

const handleFileChange = async (event: Event) => {
  fileError.value = ''
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) {
    return
  }

  const file = target.files[0]

  // Validar extensión
  const lowerName = file.name.toLowerCase()
  if (!lowerName.endsWith('.xls') && !lowerName.endsWith('.xlsx')) {
    fileError.value = 'Formato inválido. El archivo debe ser un libro de Excel (.xls o .xlsx).'
    if (target) target.value = ''
    return
  }

  // Validar tamaño (10MB máximo)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    fileError.value = 'El archivo seleccionado supera el tamaño máximo permitido de 10 MB.'
    if (target) target.value = ''
    return
  }

  try {
    const base64 = await groupService.fileToBase64(file)
    selectedFile.value = file
    selectedFileData.value = base64
    isExistingFileMarkedForDeletion.value = false
  } catch (err) {
    fileError.value = 'Ocurrió un error al procesar el archivo. Intente nuevamente.'
  }
}

const triggerFileInput = () => {
  fileError.value = ''
  fileInputRef.value?.click()
}

const removeSelectedNewFile = () => {
  selectedFile.value = null
  selectedFileData.value = null
  fileError.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleDownloadExisting = () => {
  if (existingFileData.value) {
    const name = existingFileName.value || `juicios_evaluativos_${groupNumber.value || 'ficha'}.xls`
    groupService.downloadJudgmentsFile(existingFileData.value, name)
  }
}

const confirmDeleteExistingFile = () => {
  showDeleteConfirm.value = true
}

const onConfirmDeleteFile = () => {
  isExistingFileMarkedForDeletion.value = true
  selectedFile.value = null
  selectedFileData.value = null
  showDeleteConfirm.value = false
}

const undoDeleteExistingFile = () => {
  isExistingFileMarkedForDeletion.value = false
}

const validate = (): boolean => {
  clientError.value = ''
  fieldErrors.value = {}
  let isValid = true

  const numVal = Number(groupNumber.value)
  if (!groupNumber.value || isNaN(numVal) || numVal <= 0) {
    fieldErrors.value.number = 'El número de ficha debe ser un valor numérico positivo.'
    isValid = false
  }

  const trimmedProgram = program.value.trim()
  if (!trimmedProgram) {
    fieldErrors.value.program = 'El programa de formación es obligatorio.'
    isValid = false
  } else if (trimmedProgram.length < 3) {
    fieldErrors.value.program = 'El programa debe tener al menos 3 caracteres.'
    isValid = false
  }

  if (!initialDate.value) {
    fieldErrors.value.initial_date = 'La fecha de inicio es requerida.'
    isValid = false
  }

  if (!finalDate.value) {
    fieldErrors.value.final_date = 'La fecha de fin es requerida.'
    isValid = false
  } else if (initialDate.value && finalDate.value < initialDate.value) {
    fieldErrors.value.final_date = 'La fecha de fin no puede ser anterior a la fecha de inicio.'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (!validate()) return

  if (isEditing.value) {
    const payload: UpdateGroupPayload = {
      number: Number(groupNumber.value),
      program: program.value.trim(),
      shift: shift.value,
      initial_date: initialDate.value,
      final_date: finalDate.value,
      status: status.value
    }

    if (selectedFile.value && selectedFileData.value) {
      payload.evaluative_judgments_file = selectedFileData.value
      payload.evaluative_judgments_file_name = selectedFile.value.name
    } else if (isExistingFileMarkedForDeletion.value) {
      payload.evaluative_judgments_file = null
      payload.evaluative_judgments_file_name = null
    }

    emit('submit', payload)
  } else {
    const payload: CreateGroupPayload = {
      number: Number(groupNumber.value),
      program: program.value.trim(),
      shift: shift.value,
      initial_date: initialDate.value,
      final_date: finalDate.value,
      status: status.value
    }

    if (selectedFile.value && selectedFileData.value) {
      payload.evaluative_judgments_file = selectedFileData.value
      payload.evaluative_judgments_file_name = selectedFile.value.name
    }

    emit('submit', payload)
  }
}
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop-custom" @click.self="close">
    <div class="modal-dialog-custom">
      <div class="modal-content bg-white shadow-lg border-0 rounded-3">
        <!-- Encabezado del modal -->
        <div class="modal-header border-bottom py-3 px-4 bg-light">
          <div class="d-flex align-items-center gap-2">
            <div class="modal-icon-badge bg-primary-subtle text-primary">
              <i :class="isEditing ? 'fas fa-edit' : 'fas fa-users-rectangle'"></i>
            </div>
            <div>
              <h5 class="modal-title fw-bold text-dark mb-0">{{ modalTitle }}</h5>
              <p class="text-muted small mb-0">
                {{
                  isEditing
                    ? 'Actualice los datos de la ficha o grupo en Supabase'
                    : 'Registre un nuevo grupo de formación SENA en el sistema'
                }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="btn-close"
            :disabled="loading"
            aria-label="Cerrar"
            @click="close"
          ></button>
        </div>

        <!-- Alertas de error -->
        <div v-if="clientError || apiError?.message" class="px-4 pt-3">
          <AlertMessage
            variant="danger"
            :message="clientError || apiError?.message || ''"
            :errors="apiError?.errors"
            dismissible
            @dismiss="clientError = ''"
          />
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleSubmit" novalidate>
          <div class="modal-body px-4 py-3 bg-white">
            <div class="row g-2">
              <div class="col-sm-6">
                <!-- Número de Ficha -->
                <BaseInput
                  id="group-modal-number"
                  v-model.number="groupNumber"
                  label="Número de Ficha"
                  type="number"
                  placeholder="Ej: 2825410"
                  :error="fieldErrors.number || apiError?.fieldErrors?.number?.[0]"
                  :disabled="loading"
                  required
                >
                  <template #prepend>
                    <span class="input-group-text bg-light text-muted">
                      <i class="fas fa-hashtag"></i>
                    </span>
                  </template>
                </BaseInput>
              </div>

              <div class="col-sm-6">
                <!-- Jornada (Shift) -->
                <BaseSelect
                  id="group-modal-shift"
                  v-model="shift"
                  label="Jornada"
                  :options="shiftOptions"
                  :disabled="loading"
                  required
                />
              </div>
            </div>

            <!-- Programa de Formación -->
            <BaseInput
              id="group-modal-program"
              v-model="program"
              label="Programa de Formación"
              placeholder="Ej: Análisis y Desarrollo de Software"
              :error="fieldErrors.program || apiError?.fieldErrors?.program?.[0]"
              :disabled="loading"
              required
            >
              <template #prepend>
                <span class="input-group-text bg-light text-muted">
                  <i class="fas fa-graduation-cap"></i>
                </span>
              </template>
            </BaseInput>

            <div class="row g-2">
              <div class="col-sm-6">
                <!-- Fecha de Inicio -->
                <BaseInput
                  id="group-modal-initial-date"
                  v-model="initialDate"
                  label="Fecha de Inicio"
                  type="date"
                  :error="fieldErrors.initial_date || apiError?.fieldErrors?.initial_date?.[0]"
                  :disabled="loading"
                  required
                />
              </div>

              <div class="col-sm-6">
                <!-- Fecha de Fin -->
                <BaseInput
                  id="group-modal-final-date"
                  v-model="finalDate"
                  label="Fecha de Fin"
                  type="date"
                  :error="fieldErrors.final_date || apiError?.fieldErrors?.final_date?.[0]"
                  :disabled="loading"
                  required
                />
              </div>
            </div>

            <!-- Estado -->
            <div class="mt-2">
              <BaseSelect
                id="group-modal-status"
                v-model="status"
                label="Estado del Grupo"
                :options="statusOptions"
                :disabled="loading"
                required
              />
            </div>

            <!-- Archivo de Juicios Evaluativos (Opcional) -->
            <div class="mt-3 pt-3 border-top">
              <label class="form-label fw-semibold text-dark d-flex align-items-center justify-content-between mb-1">
                <span>
                  <i class="fas fa-file-excel text-success me-1"></i>
                  Juicios Evaluativos
                  <span class="badge bg-light text-secondary border fw-normal ms-1">Opcional</span>
                </span>
                <span class="text-muted small fw-normal">Formato .xls o .xlsx (Máx. 10 MB)</span>
              </label>

              <!-- Caso 1: Archivo existente en modo edición (no marcado para eliminar y sin nuevo archivo seleccionado) -->
              <div
                v-if="hasExistingFile && !selectedFile"
                class="file-card p-3 rounded-2 border bg-light d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2"
              >
                <div class="d-flex align-items-center gap-2 text-truncate">
                  <div class="file-icon-box bg-success-subtle text-success">
                    <i class="fas fa-file-excel"></i>
                  </div>
                  <div class="text-truncate">
                    <div class="fw-semibold text-dark text-truncate" :title="existingFileName || 'juicios_evaluativos.xls'">
                      {{ existingFileName || 'juicios_evaluativos.xls' }}
                    </div>
                    <small class="text-muted">Archivo actualmente almacenado</small>
                  </div>
                </div>

                <div class="d-flex align-items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-success"
                    title="Descargar archivo actual"
                    :disabled="loading"
                    @click="handleDownloadExisting"
                  >
                    <i class="fas fa-download me-1"></i> Descargar
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    title="Reemplazar por otro archivo"
                    :disabled="loading"
                    @click="triggerFileInput"
                  >
                    <i class="fas fa-sync-alt me-1"></i> Reemplazar
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    title="Eliminar archivo"
                    :disabled="loading"
                    @click="confirmDeleteExistingFile"
                  >
                    <i class="fas fa-trash-alt me-1"></i> Eliminar
                  </button>
                </div>
              </div>

              <!-- Caso 2: Archivo existente marcado para eliminación -->
              <div
                v-else-if="isExistingFileMarkedForDeletion && !selectedFile"
                class="alert alert-warning d-flex align-items-center justify-content-between p-2 mb-0 rounded-2"
              >
                <div class="d-flex align-items-center gap-2">
                  <i class="fas fa-exclamation-triangle text-warning"></i>
                  <small class="text-dark">El archivo será eliminado al guardar los cambios.</small>
                </div>
                <div class="d-flex gap-1">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary py-0 px-2"
                    @click="undoDeleteExistingFile"
                  >
                    <i class="fas fa-undo me-1"></i> Deshacer
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary py-0 px-2"
                    @click="triggerFileInput"
                  >
                    <i class="fas fa-upload me-1"></i> Subir nuevo
                  </button>
                </div>
              </div>

              <!-- Caso 3: Nuevo archivo seleccionado (para crear o para reemplazar) -->
              <div
                v-else-if="selectedFile"
                class="file-card p-3 rounded-2 border border-primary-subtle bg-light d-flex align-items-center justify-content-between gap-2"
              >
                <div class="d-flex align-items-center gap-2 text-truncate">
                  <div class="file-icon-box bg-primary-subtle text-primary">
                    <i class="fas fa-file-arrow-up"></i>
                  </div>
                  <div class="text-truncate">
                    <div class="fw-semibold text-dark text-truncate" :title="selectedFile.name">
                      {{ selectedFile.name }}
                    </div>
                    <small class="text-muted">
                      {{ formatFileSize(selectedFile.size) }} &bull;
                      <span class="text-primary fw-medium">
                        {{ isEditing && existingFileData ? 'Reemplazará al archivo actual' : 'Listo para subir' }}
                      </span>
                    </small>
                  </div>
                </div>

                <div class="d-flex align-items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    title="Quitar archivo seleccionado"
                    :disabled="loading"
                    @click="removeSelectedNewFile"
                  >
                    <i class="fas fa-times me-1"></i> Quitar
                  </button>
                </div>
              </div>

              <!-- Caso 4: No hay archivo ni guardado ni seleccionado -->
              <div
                v-else
                class="upload-dropzone p-3 text-center border rounded-2 bg-light cursor-pointer"
                @click="triggerFileInput"
              >
                <i class="fas fa-cloud-upload-alt fs-3 text-secondary mb-1"></i>
                <div class="small fw-semibold text-dark">Haga clic para adjuntar el archivo XLS de juicios evaluativos</div>
                <div class="text-muted" style="font-size: 0.75rem;">Archivos .xls o .xlsx</div>
              </div>

              <!-- Input de archivo oculto -->
              <input
                ref="fileInputRef"
                type="file"
                class="d-none"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                @change="handleFileChange"
              />

              <!-- Mensaje de error de validación de archivo -->
              <div v-if="fileError" class="text-danger small mt-1">
                <i class="fas fa-exclamation-circle me-1"></i> {{ fileError }}
              </div>
            </div>
          </div>

          <!-- Pie del modal con acciones -->
          <div class="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-end gap-2">
            <BaseButton
              type="button"
              variant="outline-secondary"
              :disabled="loading"
              @click="close"
            >
              Cancelar
            </BaseButton>

            <BaseButton
              type="submit"
              variant="primary"
              :loading="loading"
              icon="fas fa-save"
            >
              {{ isEditing ? 'Guardar Cambios' : 'Crear Grupo' }}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirmación para eliminar archivo existente -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      title="Eliminar Archivo de Juicios Evaluativos"
      message="¿Está seguro de eliminar el archivo de juicios evaluativos asociado a este grupo? El archivo se removerá de la base de datos al guardar los cambios."
      confirm-text="Sí, Eliminar Archivo"
      cancel-text="Cancelar"
      variant="danger"
      @confirm="onConfirmDeleteFile"
    />
  </div>
</template>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.15s ease-out;
}

.modal-dialog-custom {
  width: 100%;
  max-width: 560px;
  animation: scaleUp 0.15s ease-out;
}

.modal-content {
  background-color: #ffffff !important;
}

.modal-body {
  background-color: #ffffff !important;
}

.modal-icon-badge {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}

.file-card {
  transition: all 0.2s ease;
}

.file-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.upload-dropzone {
  border-style: dashed !important;
  border-width: 2px !important;
  border-color: #ced4da !important;
  transition: all 0.2s ease;
}

.upload-dropzone:hover {
  border-color: #39A900 !important;
  background-color: #f8fff5 !important;
}

.cursor-pointer {
  cursor: pointer;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

