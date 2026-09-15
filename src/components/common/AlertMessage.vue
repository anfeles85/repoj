<script setup lang="ts">
import { computed } from 'vue'
import type { AlertVariant } from '@/types'

const props = withDefaults(
  defineProps<{
    variant?: AlertVariant
    title?: string
    message?: string
    errors?: string[]
    dismissible?: boolean
  }>(),
  {
    variant: 'danger',
    title: '',
    message: '',
    errors: () => [],
    dismissible: false
  }
)

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()

const iconClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'fas fa-check-circle text-success'
    case 'warning':
      return 'fas fa-exclamation-triangle text-warning'
    case 'info':
      return 'fas fa-info-circle text-info'
    case 'danger':
    default:
      return 'fas fa-times-circle text-danger'
  }
})
</script>

<template>
  <div
    v-if="message || (errors && errors.length > 0)"
    :class="[
      'alert',
      `alert-${variant}`,
      { 'alert-dismissible fade show': dismissible },
      'd-flex align-items-start gap-3 shadow-sm'
    ]"
    role="alert"
  >
    <div class="alert-icon fs-5 mt-1">
      <i :class="iconClass"></i>
    </div>

    <div class="flex-grow-1">
      <h6 v-if="title" class="alert-heading mb-1 fw-bold">{{ title }}</h6>
      <p v-if="message" class="mb-1">{{ message }}</p>

      <ul v-if="errors && errors.length > 0" class="mb-0 ps-3 mt-2 small">
        <li v-for="(err, idx) in errors" :key="idx">{{ err }}</li>
      </ul>
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="btn-close"
      aria-label="Cerrar"
      @click="emit('dismiss')"
    ></button>
  </div>
</template>

<style scoped>
.alert {
  border-radius: 0.35rem;
}
</style>
