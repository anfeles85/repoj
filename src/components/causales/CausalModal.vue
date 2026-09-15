<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Causal, CausalPayload } from '@/interfaces/Causal'
import type { ApiError } from '@/interfaces/ApiResponse'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    causal?: Causal | null
    loading?: boolean
    apiError?: ApiError | null
  }>(),
  {
    causal: null,
    loading: false,
    apiError: null
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: CausalPayload): void
}>()

const description = ref('')
const clientError = ref('')

const isEditing = computed(() => !!props.causal)
const modalTitle = computed(() => (isEditing.value ? 'Editar Causal' : 'Nueva Causal'))

// Extraer error específico del campo descripción desde el error de la API o la validación cliente
const descriptionError = computed(() => {
  if (clientError.value) return clientError.value
  if (props.apiError?.fieldErrors?.description?.[0]) {
    return props.apiError.fieldErrors.description[0]
  }
  return ''
})

// Sincronizar formulario al abrir o cambiar la causal seleccionada
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      clientError.value = ''
      if (props.causal) {
        description.value = props.causal.description
      } else {
        description.value = ''
      }
    }
  }
)

watch(
  () => props.causal,
  (val) => {
    if (val) {
      description.value = val.description
    } else {
      description.value = ''
    }
    clientError.value = ''
  }
)

const close = () => {
  if (props.loading) return
  emit('update:modelValue', false)
}

const handleSubmit = () => {
  clientError.value = ''
  const trimmed = description.value.trim()

  if (!trimmed) {
    clientError.value = 'El campo descripción es obligatorio.'
    return
  }

  if (trimmed.length < 3) {
    clientError.value = 'La descripción debe tener al menos 3 caracteres.'
    return
  }

  emit('submit', { description: trimmed })
}
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop-custom" @click.self="close">
    <div class="modal-dialog-custom">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <!-- Encabezado del modal -->
        <div class="modal-header border-bottom py-3 px-4 bg-light">
          <div class="d-flex align-items-center gap-2">
            <div class="modal-icon-badge bg-primary-subtle text-primary">
              <i :class="isEditing ? 'fas fa-edit' : 'fas fa-plus-circle'"></i>
            </div>
            <h5 class="modal-title fw-bold text-dark mb-0">{{ modalTitle }}</h5>
          </div>
          <button
            type="button"
            class="btn-close"
            :disabled="loading"
            aria-label="Cerrar modal"
            @click="close"
          ></button>
        </div>

        <!-- Formulario del modal -->
        <form @submit.prevent="handleSubmit">
          <div class="modal-body p-4">
            <!-- Alerta general de error de API si no es atribuible a un solo campo -->
            <AlertMessage
              v-if="apiError && (!apiError.fieldErrors || Object.keys(apiError.fieldErrors).length === 0)"
              variant="danger"
              :message="apiError.message"
              :errors="apiError.errors"
              :dismissible="false"
              class="mb-3"
            />

            <!-- Campo Descripción con validación y error asociado -->
            <BaseInput
              v-model="description"
              label="Descripción de la Causal"
              placeholder="Ej. Reparación contador o Revisión técnica..."
              :required="true"
              :error="descriptionError"
              :disabled="loading"
              :autofocus="true"
              help-text="Ingrese un texto claro y descriptivo del motivo o causal."
            />
          </div>

          <!-- Pie del modal con acciones -->
          <div class="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-end gap-2">
            <BaseButton
              variant="outline-secondary"
              type="button"
              :disabled="loading"
              @click="close"
            >
              Cancelar
            </BaseButton>

            <BaseButton
              variant="primary"
              type="submit"
              icon="fas fa-save"
              :loading="loading"
            >
              {{ isEditing ? 'Actualizar' : 'Guardar' }}
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
  max-width: 520px;
  animation: scaleUp 0.15s ease-out;
}

.modal-icon-badge {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
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
