<script setup lang="ts">
withDefaults(
  defineProps<{
    loading?: boolean
    message?: string
    overlay?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    loading: true,
    message: 'Cargando información...',
    overlay: false,
    size: 'md'
  }
)
</script>

<template>
  <div v-if="loading" :class="['loading-container', { 'loading-overlay': overlay }]">
    <div class="d-flex flex-column align-items-center justify-content-center p-4">
      <div
        class="spinner-border text-primary"
        :class="{
          'spinner-border-sm': size === 'sm',
          'loading-spinner-lg': size === 'lg'
        }"
        role="status"
      >
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p v-if="message" class="mt-3 mb-0 text-muted fw-semibold small">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.loading-container {
  width: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
}

.loading-spinner-lg {
  width: 3rem;
  height: 3rem;
  border-width: 0.3em;
}
</style>
