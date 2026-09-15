<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined
    label?: string
    id?: string
    type?: string
    placeholder?: string
    required?: boolean
    error?: string
    helpText?: string
    disabled?: boolean
    autofocus?: boolean
  }>(),
  {
    label: '',
    id: () => `input-${Math.random().toString(36).substring(2, 9)}`,
    type: 'text',
    placeholder: '',
    required: false,
    error: '',
    helpText: '',
    disabled: false,
    autofocus: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
}>()

const hasError = computed(() => !!props.error)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="mb-3">
    <label v-if="label" :for="id" class="form-label fw-bold small text-dark mb-1">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>

    <div class="input-group has-validation">
      <slot name="prepend" />
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :autofocus="autofocus"
        :class="['form-control', { 'is-invalid': hasError }]"
        @input="handleInput"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />
      <slot name="append" />

      <div v-if="hasError" class="invalid-feedback d-block">
        {{ error }}
      </div>
    </div>

    <div v-if="helpText && !hasError" class="form-text text-muted small">
      {{ helpText }}
    </div>
  </div>
</template>

<style scoped>
.form-label {
  letter-spacing: 0.02rem;
}

.form-control:focus {
  border-color: #bac8f3;
  box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
}
</style>
