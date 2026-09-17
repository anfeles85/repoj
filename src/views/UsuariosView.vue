<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import DataTable from '@/components/common/DataTable.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'
import UserModal from '@/components/users/UserModal.vue'
import UserStatusBadge from '@/components/users/UserStatusBadge.vue'
import type { User, CreateUserPayload, UpdateUserPayload } from '@/interfaces/User'
import type { TableColumn } from '@/interfaces/Pagination'

const userStore = useUserStore()
const authStore = useAuthStore()

// Filtros locales adicionales
const selectedRoleFilter = ref<string>('')
const selectedStatusFilter = ref<string>('')

// Control del Modal de Crear/Editar
const isModalOpen = ref(false)
const selectedUser = ref<User | null>(null)

// Control del Diálogo de Confirmación de Eliminación
const isDeleteConfirmOpen = ref(false)
const userToDelete = ref<User | null>(null)
const deleteLoading = ref(false)

// Columnas de la tabla coincidentes con Supabase
const columns: TableColumn<User>[] = [
  { key: 'id', label: 'ID', width: '70px', align: 'center', sortable: true },
  { key: 'fullname', label: 'Nombre Completo', sortable: true },
  { key: 'email', label: 'Correo Electrónico', sortable: true },
  { key: 'role', label: 'Rol', width: '170px', align: 'center', sortable: true },
  { key: 'status', label: 'Estado', width: '130px', align: 'center', sortable: true }
]

// Lista con filtros aplicados
const filteredUsers = computed(() => {
  return userStore.users.filter((user) => {
    const matchRole = !selectedRoleFilter.value || user.role === selectedRoleFilter.value
    const matchStatus = !selectedStatusFilter.value || user.status === selectedStatusFilter.value
    return matchRole && matchStatus
  })
})

onMounted(() => {
  userStore.fetchUsers()
})

// Abrir modal para crear
const handleOpenCreate = () => {
  selectedUser.value = null
  isModalOpen.value = true
}

// Abrir modal para editar
const handleOpenEdit = (user: User) => {
  selectedUser.value = { ...user }
  isModalOpen.value = true
}

// Guardar usuario (Crear o Editar)
const handleSubmitUser = async (payload: CreateUserPayload | UpdateUserPayload) => {
  try {
    if (selectedUser.value) {
      await userStore.updateUser(selectedUser.value.id, payload as UpdateUserPayload)
    } else {
      await userStore.createUser(payload as CreateUserPayload)
    }
    isModalOpen.value = false
    selectedUser.value = null
  } catch {
    // El error se maneja en el store y se refleja en las alertas
  }
}

// Alternar estado activo / inactivo
const handleToggleStatus = async (user: User) => {
  if (user.role === 'ADMINISTRADOR') return
  try {
    await userStore.toggleUserStatus(user.id)
  } catch {
    // Error administrado en el store
  }
}

// Solicitar confirmación para eliminar
const handleOpenDelete = (user: User) => {
  if (user.role === 'ADMINISTRADOR') return
  userToDelete.value = user
  isDeleteConfirmOpen.value = true
}

// Confirmar eliminación
const handleConfirmDelete = async () => {
  if (!userToDelete.value) return
  deleteLoading.value = true
  try {
    await userStore.deleteUser(userToDelete.value.id)
    isDeleteConfirmOpen.value = false
    userToDelete.value = null
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="usuarios-view">
    <!-- Encabezado de página -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
      <div>
        <h1 class="h3 mb-1 text-gray-800 fw-bold">Gestión de Usuarios</h1>
        <p class="text-muted small mb-0">
          Administración de instructores y coordinadores del sistema REPOJ en Supabase.
        </p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-primary-subtle text-primary border border-primary-subtle p-2">
          <i class="fas fa-user-shield me-1"></i> Sesión: {{ authStore.userRoleLabel }}
        </span>

        <BaseButton
          variant="primary"
          icon="fas fa-user-plus"
          @click="handleOpenCreate"
        >
          Nuevo Usuario
        </BaseButton>
      </div>
    </div>

    <!-- Mensaje de error general si ocurre al cargar -->
    <AlertMessage
      v-if="userStore.error && !isModalOpen"
      variant="danger"
      :message="userStore.error.message"
      :errors="userStore.error.errors"
      dismissible
      class="mb-3"
      @dismiss="userStore.error = null"
    />

    <!-- Filtros rápidos por Rol y Estado -->
    <div class="card shadow-sm border-0 mb-3">
      <div class="card-body py-2 px-3">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-sm-auto text-muted small fw-bold">
            <i class="fas fa-filter me-1"></i> Filtrar por:
          </div>

          <div class="col-12 col-sm-auto">
            <select v-model="selectedRoleFilter" class="form-select form-select-sm bg-light">
              <option value="">Todos los Roles</option>
              <option value="INSTRUCTOR">Instructores</option>
              <option value="COORDINADOR">Coordinadores</option>
              <option value="ADMINISTRADOR">Administradores</option>
            </select>
          </div>

          <div class="col-12 col-sm-auto">
            <select v-model="selectedStatusFilter" class="form-select form-select-sm bg-light">
              <option value="">Todos los Estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>

          <div
            v-if="selectedRoleFilter || selectedStatusFilter"
            class="col-12 col-sm-auto ms-sm-auto"
          >
            <button
              type="button"
              class="btn btn-link btn-sm text-decoration-none text-danger p-0"
              @click="selectedRoleFilter = ''; selectedStatusFilter = ''"
            >
              <i class="fas fa-times me-1"></i> Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla interactiva con DataTable -->
    <DataTable
      :items="filteredUsers"
      :columns="columns"
      :loading="userStore.loading"
      search-placeholder="Buscar usuario por nombre o correo..."
      :page-size="10"
      @refresh="userStore.fetchUsers"
    >
      <template #cell(fullname)="{ value, item }">
        <div class="d-flex align-items-center gap-2">
          <div class="user-table-avatar">
            {{ value ? value.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div>
            <div class="fw-bold text-dark">{{ value }}</div>
            <div v-if="item.created_at" class="text-muted small" style="font-size: 0.75rem;">
              Registrado: {{ item.created_at.substring(0, 10) }}
            </div>
          </div>
        </div>
      </template>

      <template #cell(email)="{ value }">
        <span class="text-secondary">{{ value }}</span>
      </template>

      <template #cell(role)="{ value }">
        <UserStatusBadge type="role" :value="value" />
      </template>

      <template #cell(status)="{ value }">
        <UserStatusBadge type="status" :value="value" />
      </template>

      <!-- Columna de Acciones Personalizada -->
      <template #actions="{ item }">
        <div class="btn-group btn-group-sm" role="group" aria-label="Acciones de usuario">
          <!-- Editar -->
          <button
            type="button"
            class="btn btn-outline-primary"
            title="Editar usuario"
            @click="handleOpenEdit(item)"
          >
            <i class="fas fa-edit"></i>
          </button>

          <!-- Activar / Desactivar (Protegido para Admin) -->
          <button
            type="button"
            :class="[
              'btn',
              item.status === 'ACTIVO' ? 'btn-outline-warning' : 'btn-outline-success'
            ]"
            :disabled="item.role === 'ADMINISTRADOR'"
            :title="
              item.role === 'ADMINISTRADOR'
                ? 'El Administrador no puede ser desactivado'
                : item.status === 'ACTIVO'
                  ? 'Desactivar usuario'
                  : 'Activar usuario'
            "
            @click="handleToggleStatus(item)"
          >
            <i :class="item.status === 'ACTIVO' ? 'fas fa-user-slash' : 'fas fa-user-check'"></i>
          </button>

          <!-- Eliminar (Protegido para Admin) -->
          <button
            type="button"
            class="btn btn-outline-danger"
            :disabled="item.role === 'ADMINISTRADOR'"
            :title="
              item.role === 'ADMINISTRADOR'
                ? 'El Administrador no puede ser eliminado'
                : 'Eliminar usuario'
            "
            @click="handleOpenDelete(item)"
          >
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Modal para Crear / Editar Usuario -->
    <UserModal
      v-model="isModalOpen"
      :user="selectedUser"
      :loading="userStore.loading"
      :api-error="userStore.error"
      @submit="handleSubmitUser"
    />

    <!-- Diálogo de Confirmación de Eliminación -->
    <ConfirmDialog
      v-model="isDeleteConfirmOpen"
      title="Eliminar Usuario"
      :message="`¿Está seguro de eliminar al usuario '${userToDelete?.fullname}' (${userToDelete?.email})? Esta acción no se puede deshacer.`"
      confirm-text="Sí, Eliminar"
      cancel-text="Cancelar"
      variant="danger"
      :loading="deleteLoading"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<style scoped>
.user-table-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #eaecf4;
  color: #4e73df;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}
</style>
