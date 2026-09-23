<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="d-flex flex-column align-items-center justify-content-center py-5 text-center">
    <img src="/logo_repoj.png" alt="Logo REPOJ" class="mb-3 notfound-logo" />
    <div class="display-1 fw-bolder text-primary mb-2">404</div>
    <h2 class="fw-bold text-dark mb-3">Página No Encontrada</h2>
    <p class="text-muted mb-4" style="max-width: 480px;">
      La ruta o recurso al que intenta acceder no existe en el sistema REPOJ o ha sido trasladado a otra dirección.
    </p>
    <BaseButton
      variant="primary"
      icon="fas fa-home"
      @click="goHome"
    >
      Regresar al Dashboard
    </BaseButton>
  </div>
</template>

<style scoped>
.notfound-logo {
  height: 80px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 10px rgba(57, 169, 0, 0.15));
}
</style>
