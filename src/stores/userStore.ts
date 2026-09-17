import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, CreateUserPayload, UpdateUserPayload, UserStatus } from '@/interfaces/User'
import type { ApiError } from '@/interfaces/ApiResponse'
import userService from '@/services/userService'
import { useNotificationStore } from './notificationStore'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  const notificationStore = useNotificationStore()

  /**
   * Cargar listado completo de usuarios desde Supabase
   */
  const fetchUsers = async () => {
    loading.value = true
    error.value = null
    try {
      users.value = await userService.getUsers()
    } catch (err) {
      error.value = err as ApiError
      notificationStore.addNotification(
        error.value.message || 'Error al cargar los usuarios de Supabase',
        'danger',
        'Error de Carga'
      )
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear usuario Instructor o Coordinador en Supabase
   */
  const createUser = async (payload: CreateUserPayload): Promise<User> => {
    loading.value = true
    error.value = null
    try {
      const newUser = await userService.createUser(payload)
      users.value.unshift(newUser)
      notificationStore.addNotification(
        `Usuario ${newUser.fullname} creado con éxito como ${newUser.role}.`,
        'success',
        'Usuario Creado'
      )
      return newUser
    } catch (err) {
      error.value = err as ApiError
      notificationStore.addNotification(
        error.value.message || 'Error al crear el usuario',
        'danger',
        'Error al Crear'
      )
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar usuario existente en Supabase
   */
  const updateUser = async (id: number, payload: UpdateUserPayload): Promise<User> => {
    loading.value = true
    error.value = null
    try {
      const updated = await userService.updateUser(id, payload)
      const index = users.value.findIndex((u) => u.id === id)
      if (index !== -1) {
        users.value[index] = updated
      }
      notificationStore.addNotification(
        `Usuario ${updated.fullname} actualizado correctamente.`,
        'success',
        'Usuario Actualizado'
      )
      return updated
    } catch (err) {
      error.value = err as ApiError
      notificationStore.addNotification(
        error.value.message || 'Error al actualizar el usuario',
        'danger',
        'Error al Actualizar'
      )
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Alternar estado activo/inactivo en Supabase
   */
  const toggleUserStatus = async (id: number, targetStatus?: UserStatus): Promise<User> => {
    loading.value = true
    error.value = null
    try {
      const updated = await userService.toggleUserStatus(id, targetStatus)
      const index = users.value.findIndex((u) => u.id === id)
      if (index !== -1) {
        users.value[index] = updated
      }
      notificationStore.addNotification(
        `El usuario ${updated.fullname} ahora está ${updated.status}.`,
        'info',
        'Estado Modificado'
      )
      return updated
    } catch (err) {
      error.value = err as ApiError
      notificationStore.addNotification(
        error.value.message || 'Error al modificar el estado del usuario',
        'danger',
        'Error de Estado'
      )
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar usuario de Supabase
   */
  const deleteUser = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await userService.deleteUser(id)
      users.value = users.value.filter((u) => u.id !== id)
      notificationStore.addNotification(
        'Usuario eliminado exitosamente del sistema.',
        'warning',
        'Usuario Eliminado'
      )
    } catch (err) {
      error.value = err as ApiError
      notificationStore.addNotification(
        error.value.message || 'Error al eliminar el usuario',
        'danger',
        'Error al Eliminar'
      )
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    currentUser,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser
  }
})

export default useUserStore
