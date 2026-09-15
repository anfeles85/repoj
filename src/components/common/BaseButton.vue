<script setup lang="ts">
import type { ButtonSize } from '@/types'

withDefaults(
  defineProps<{
    variant?: string
    size?: ButtonSize
    loading?: boolean
    disabled?: boolean
    icon?: string
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    icon: '',
    type: 'button'
  }
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    :type="type"
    :class="[
      'btn',
      `btn-${variant}`,
      size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
      'd-inline-flex align-items-center justify-content-center gap-2'
    ]"
    :disabled="disabled || loading"
    @click="emit('click', $event)"
  >
    <span
      v-if="loading"
      class="spinner-border spinner-border-sm"
      role="status"
      aria-hidden="true"
    ></span>
    <i v-else-if="icon" :class="icon"></i>
    <span><slot /></span>
  </button>
</template>

<style scoped>
.btn {
  font-weight: 600;
  border-radius: 0.35rem;
  transition: all 0.15s ease-in-out;
}
</style>
