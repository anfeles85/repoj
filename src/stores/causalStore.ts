import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Causal, CausalPayload } from '@/interfaces/Causal'
import type { ApiError } from '@/interfaces/ApiResponse'
import {
  getCausales,
  createCausal as apiCreateCausal,
  updateCausal as apiUpdateCausal,
  deleteCausal as apiDeleteCausal
} from '@/services/causalService'

export const useCausalStore = defineStore('causal', () => {
  const causales = ref<Causal[]>([])
  const loading = ref<boolean>(false)
  const error = ref<ApiError | null>(null)
  const searchQuery = ref<string>('')

  const filteredCausales = computed(() => {
    if (!searchQuery.value.trim()) {
      return causales.value
    }
    const query = searchQuery.value.toLowerCase().trim()
    return causales.value.filter(
      (c) =>
        c.description.toLowerCase().includes(query) ||
        String(c.id).includes(query)
    )
  })

  const totalCount = computed(() => causales.value.length)

  const fetchCausales = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      causales.value = await getCausales()
    } catch (err) {
      error.value = err as ApiError
      throw err
    } finally {
      loading.value = false
    }
  }

  const addCausal = async (payload: CausalPayload): Promise<Causal> => {
    loading.value = true
    error.value = null
    try {
      const created = await apiCreateCausal(payload)
      causales.value.unshift(created)
      return created
    } catch (err) {
      error.value = err as ApiError
      throw err
    } finally {
      loading.value = false
    }
  }

  const editCausal = async (id: number, payload: CausalPayload): Promise<Causal> => {
    loading.value = true
    error.value = null
    try {
      const updated = await apiUpdateCausal(id, payload)
      const index = causales.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        causales.value[index] = updated
      }
      return updated
    } catch (err) {
      error.value = err as ApiError
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeCausal = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await apiDeleteCausal(id)
      causales.value = causales.value.filter((c) => c.id !== id)
    } catch (err) {
      error.value = err as ApiError
      throw err
    } finally {
      loading.value = false
    }
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  return {
    causales,
    loading,
    error,
    searchQuery,
    filteredCausales,
    totalCount,
    fetchCausales,
    addCausal,
    editCausal,
    removeCausal,
    setSearchQuery
  }
})
