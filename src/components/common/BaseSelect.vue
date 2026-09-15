<script setup lang="ts">
import { computed } from 'vue'

export interface SelectOption {
  value: string | number
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined
    options: SelectOption[]
    label?: string
    id?: string
    placeholder?: string
    required?: boolean
    error?: string
    helpText?: string
    disabled?: boolean
  }>(),
  {
    label: '',
    id: () => `select-${Math.random().toString(36).substring(2, 9)}`,
    placeholder: 'Seleccione una opción...',
    required: false,
    error: '',
    helpText: '',
    disabled: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const hasError = computed(() => !!props.error)

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="mb-3">
    <label v-if="label" :for="id" class="form-label fw-bold small text-dark mb-1">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>

    <select
      :id="id"
      :value="modelValue ?? ''"
      :disabled="disabled"
      :required="required"
      :class="['form-select', { 'is-invalid': hasError }]"
      @change="handleChange"
    >
      <option v-if="placeholder" value="" disabled selected>
        {{ placeholder }}
      </option>
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>

    <div v-if="hasError" class="invalid-feedback d-block">
      {{ error }}
    </div>

    <div v-if="helpText && !hasError" class="form-text text-muted small">
      {{ helpText }}
    </div>
  </div>
</template>

<style scoped>
.form-select:focus {
  border-color: #bac8f3;
  box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
}
</style>
