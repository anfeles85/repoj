<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import DataTable from '@/components/common/DataTable.vue'
import type { TableColumn } from '@/interfaces/Pagination'

interface UserItem {
  id: number
  name: string
  email: string
  role: string
  status: 'Activo' | 'Inactivo'
  created_at: string
}

const authStore = useAuthStore()

const users = ref<UserItem[]>([
  {
    id: 1,
    name: 'Administrador REPOJ',
    email: 'admin@repoj.gov.co',
    role: 'Superadmin',
    status: 'Activo',
    created_at: '2026-01-01 10:00:00'
  },
  {
    id: 2,
    name: 'Carlos Mendoza',
    email: 'cmendoza@sena.edu.co',
    role: 'Auditor',
    status: 'Activo',
    created_at: '2026-02-14 09:30:00'
  },
  {
    id: 3,
    name: 'Luisa Fernanda Morales',
    email: 'lmorales@sena.edu.co',
    role: 'Instructor Evaluador',
    status: 'Activo',
    created_at: '2026-03-20 15:45:00'
  },
  {
    id: 4,
    name: 'Juan David Ramírez',
    email: 'jramirez@sena.edu.co',
    role: 'Operador',
    status: 'Inactivo',
    created_at: '2026-04-05 11:20:00'
  }
])

const columns: TableColumn<UserItem>[] = [
  { key: 'id', label: 'ID', width: '80px', align: 'center', sortable: true },
  { key: 'name', label: 'Nombre Completo', sortable: true },
  { key: 'email', label: 'Correo Electrónico', sortable: true },
  { key: 'role', label: 'Rol del Sistema', width: '180px', sortable: true },
  { key: 'status', label: 'Estado', width: '120px', align: 'center', sortable: true }
]
</script>

<template>
  <div class="usuarios-view">
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-2">
      <div>
        <h1 class="h3 mb-1 text-gray-800 fw-bold">Gestión de Usuarios</h1>
        <p class="text-muted small mb-0">
          Control de acceso, roles y permisos de operadores en REPOJ.
        </p>
      </div>
      <div>
        <span class="badge bg-success-subtle text-success border border-success-subtle p-2">
          <i class="fas fa-user-check me-1"></i> Sesión activa: {{ authStore.user?.role }}
        </span>
      </div>
    </div>

    <DataTable
      :items="users"
      :columns="columns"
      search-placeholder="Buscar usuarios por nombre o correo..."
      :show-actions="false"
    >
      <template #cell(name)="{ value }">
        <span class="fw-bold text-dark">{{ value }}</span>
      </template>

      <template #cell(role)="{ value }">
        <span class="badge bg-primary-subtle text-primary fw-semibold px-2 py-1">
          {{ value }}
        </span>
      </template>

      <template #cell(status)="{ value }">
        <span
          :class="[
            'badge rounded-pill px-2 py-1',
            value === 'Activo' ? 'bg-success' : 'bg-secondary'
          ]"
        >
          {{ value }}
        </span>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
/* Los estilos generales residen en main.css */
</style>
