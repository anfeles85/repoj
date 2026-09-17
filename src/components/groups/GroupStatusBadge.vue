<script setup lang="ts">
import type { GroupShift, GroupStatus } from '@/interfaces/Group'

defineProps<{
  type: 'shift' | 'status'
  value: GroupShift | GroupStatus | string
}>()
</script>

<template>
  <!-- Badge para Jornada (Shift) -->
  <template v-if="type === 'shift'">
    <span
      v-if="String(value).toUpperCase() === 'DIURNA'"
      class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 fw-semibold"
    >
      <i class="fas fa-sun me-1"></i> Diurna
    </span>
    <span
      v-else-if="String(value).toUpperCase() === 'MIXTA'"
      class="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1 fw-semibold"
    >
      <i class="fas fa-cloud-sun me-1"></i> Mixta
    </span>
    <span
      v-else-if="String(value).toUpperCase() === 'NOCTURNA'"
      class="badge bg-dark-subtle text-dark-emphasis border border-dark-subtle px-2 py-1 fw-semibold"
    >
      <i class="fas fa-moon me-1"></i> Nocturna
    </span>
    <span v-else class="badge bg-secondary px-2 py-1">
      {{ value }}
    </span>
  </template>

  <!-- Badge para Estado (Status) -->
  <template v-else-if="type === 'status'">
    <span
      v-if="String(value).toUpperCase() === 'EN EJECUCION'"
      class="badge rounded-pill bg-success px-2 py-1 text-white fw-semibold"
    >
      <i class="fas fa-play-circle me-1"></i> En Ejecución
    </span>
    <span
      v-else-if="String(value).toUpperCase() === 'PRODUCTIVA'"
      class="badge rounded-pill bg-primary px-2 py-1 text-white fw-semibold"
    >
      <i class="fas fa-briefcase me-1"></i> Etapa Productiva
    </span>
    <span
      v-else-if="String(value).toUpperCase() === 'INACTIVA'"
      class="badge rounded-pill bg-secondary px-2 py-1 text-white fw-semibold"
    >
      <i class="fas fa-pause-circle me-1"></i> Inactiva
    </span>
    <span
      v-else-if="String(value).toUpperCase() === 'CANCELADA'"
      class="badge rounded-pill bg-danger px-2 py-1 text-white fw-semibold"
    >
      <i class="fas fa-times-circle me-1"></i> Cancelada
    </span>
    <span v-else class="badge rounded-pill bg-secondary px-2 py-1 text-white fw-semibold">
      {{ value }}
    </span>
  </template>
</template>
