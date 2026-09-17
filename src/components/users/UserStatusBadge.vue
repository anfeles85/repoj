<script setup lang="ts">
import type { UserRole, UserStatus } from '@/interfaces/User'

defineProps<{
  type: 'role' | 'status'
  value: UserRole | UserStatus | string
}>()
</script>

<template>
  <!-- Badge para Rol -->
  <template v-if="type === 'role'">
    <span
      v-if="String(value).toUpperCase() === 'ADMINISTRADOR' || String(value).toLowerCase() === 'admin'"
      class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 fw-bold"
    >
      <i class="fas fa-user-shield me-1"></i> Administrador
    </span>
    <span
      v-else-if="String(value).toUpperCase() === 'INSTRUCTOR'"
      class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-semibold"
    >
      <i class="fas fa-chalkboard-teacher me-1"></i> Instructor
    </span>
    <span
      v-else-if="String(value).toUpperCase() === 'COORDINADOR'"
      class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 fw-semibold"
    >
      <i class="fas fa-user-tie me-1"></i> Coordinador
    </span>
    <span v-else class="badge bg-secondary px-2 py-1">
      {{ value }}
    </span>
  </template>

  <!-- Badge para Estado -->
  <template v-else-if="type === 'status'">
    <span
      v-if="String(value).toUpperCase() === 'ACTIVO'"
      class="badge rounded-pill bg-success px-2 py-1 text-white fw-semibold"
    >
      <i class="fas fa-check-circle me-1"></i> Activo
    </span>
    <span
      v-else
      class="badge rounded-pill bg-secondary px-2 py-1 text-white fw-semibold"
    >
      <i class="fas fa-ban me-1"></i> Inactivo
    </span>
  </template>
</template>
