<script setup lang="ts">
import BaseButton from './BaseButton.vue'

withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    loading?: boolean
    variant?: 'danger' | 'primary' | 'warning'
  }>(),
  {
    title: '¿Está seguro de continuar?',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    loading: false,
    variant: 'danger'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const close = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const onConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop-custom" @click.self="close">
    <div class="modal-dialog-custom">
      <div class="modal-content shadow-lg border-0 rounded-3">
        <div class="modal-header border-0 pb-0 pt-4 px-4">
          <div class="d-flex align-items-center gap-2">
            <div
              :class="[
                'icon-circle',
                variant === 'danger'
                  ? 'bg-danger-subtle text-danger'
                  : 'bg-primary-subtle text-primary'
              ]"
            >
              <i
                :class="
                  variant === 'danger'
                    ? 'fas fa-exclamation-triangle'
                    : 'fas fa-question-circle'
                "
              ></i>
            </div>
            <h5 class="modal-title fw-bold text-dark mb-0">{{ title }}</h5>
          </div>
          <button
            type="button"
            class="btn-close"
            :disabled="loading"
            aria-label="Cerrar"
            @click="close"
          ></button>
        </div>

        <div class="modal-body px-4 py-3 text-secondary">
          <p class="mb-0">{{ message }}</p>
        </div>

        <div class="modal-footer border-0 px-4 pb-4 pt-2 d-flex justify-content-end gap-2">
          <BaseButton
            variant="outline-secondary"
            :disabled="loading"
            @click="close"
          >
            {{ cancelText }}
          </BaseButton>

          <BaseButton
            :variant="variant"
            :loading="loading"
            @click="onConfirm"
          >
            {{ confirmText }}
          </BaseButton>
        </div>
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
  max-width: 480px;
  animation: scaleUp 0.15s ease-out;
}

.icon-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
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
