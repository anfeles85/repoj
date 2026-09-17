<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Group, CreateGroupPayload, UpdateGroupPayload, GroupShift, GroupStatus } from '@/interfaces/Group'
import type { ApiError } from '@/interfaces/ApiResponse'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect, { type SelectOption } from '@/components/common/BaseSelect.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'

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

const resetForm = () => {
  clientError.value = ''
  fieldErrors.value = {}

  if (props.group) {
    groupNumber.value = props.group.number
    program.value = props.group.program || ''
    shift.value = props.group.shift || 'DIURNA'
    initialDate.value = props.group.initial_date || ''
    finalDate.value = props.group.final_date || ''
    status.value = props.group.status || 'EN EJECUCION'
  } else {
    groupNumber.value = ''
    program.value = ''
    shift.value = 'DIURNA'
    initialDate.value = ''
    finalDate.value = ''
    status.value = 'EN EJECUCION'
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
