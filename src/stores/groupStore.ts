import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Group, CreateGroupPayload, UpdateGroupPayload } from '@/interfaces/Group'
import type { ApiError } from '@/interfaces/ApiResponse'
import groupService from '@/services/groupService'
import { useNotificationStore } from './notificationStore'

export const useGroupStore = defineStore('group', () => {
  const groups = ref<Group[]>([])
  const currentGroup = ref<Group | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  const notificationStore = useNotificationStore()

  /**
   * Cargar listado completo de grupos desde Supabase
   */
  const fetchGroups = async () => {
    loading.value = true
    error.value = null
    try {
      groups.value = await groupService.getGroups()
    } catch (err) {
      error.value = err as ApiError
      notificationStore.addNotification(
        error.value.message || 'Error al cargar los grupos desde Supabase',
        'danger',
        'Error de Carga'
      )
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear un nuevo grupo en Supabase
   */
  const createGroup = async (payload: CreateGroupPayload): Promise<Group> => {
    loading.value = true
    error.value = null
    try {
      const newGroup = await groupService.createGroup(payload)
      groups.value.unshift(newGroup)
      notificationStore.addNotification(
        `Grupo con ficha ${newGroup.number} creado con éxito.`,
        'success',
        'Grupo Creado'
      )
      return newGroup
    } catch (err) {
      error.value = err as ApiError
      notificationStore.addNotification(
        error.value.message || 'Error al crear el grupo',
        'danger',
        'Error al Crear'
      )
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar un grupo existente en Supabase
   */
  const updateGroup = async (id: number, payload: UpdateGroupPayload): Promise<Group> => {
    loading.value = true
    error.value = null
    try {
      const updated = await groupService.updateGroup(id, payload)
      const index = groups.value.findIndex((g) => g.id === id)
      if (index !== -1) {
        groups.value[index] = updated
      }
      notificationStore.addNotification(
        `Grupo ficha ${updated.number} actualizado correctamente.`,
        'success',
        'Grupo Actualizado'
      )
      return updated
    } catch (err) {
      error.value = err as ApiError
      notificationStore.addNotification(
        error.value.message || 'Error al actualizar el grupo',
        'danger',
        'Error al Actualizar'
      )
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar un grupo de Supabase
   */
  const deleteGroup = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await groupService.deleteGroup(id)
      groups.value = groups.value.filter((g) => g.id !== id)
      notificationStore.addNotification(
        'Grupo eliminado exitosamente del sistema.',
        'warning',
        'Grupo Eliminado'
      )
    } catch (err) {
      error.value = err as ApiError
      notificationStore.addNotification(
        error.value.message || 'Error al eliminar el grupo',
        'danger',
        'Error al Eliminar'
      )
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Descargar archivo de juicios evaluativos asociado a un grupo
   */
  const downloadJudgments = (group: Group): void => {
    if (!group.evaluative_judgments_file) {
      notificationStore.addNotification(
        'Este grupo no posee un archivo de juicios evaluativos cargado.',
        'warning',
        'Sin Archivo'
      )
      return
    }
    const fileName = group.evaluative_judgments_file_name || `juicios_evaluativos_${group.number}.xls`
    groupService.downloadJudgmentsFile(group.evaluative_judgments_file, fileName)
    notificationStore.addNotification(
      `Descargando archivo: ${fileName}`,
      'success',
      'Descarga Iniciada'
    )
  }

  return {
    groups,
    currentGroup,
    loading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    downloadJudgments
  }
})

export default useGroupStore
