import { ref } from 'vue'
import type { ApiError } from '@/interfaces/ApiResponse'

export function useApiError() {
  const error = ref<ApiError | null>(null)
  const fieldErrors = ref<Record<string, string[]>>({})

  const setError = (err: unknown) => {
    const apiErr = err as ApiError
    if (apiErr && typeof apiErr === 'object' && 'errors' in apiErr) {
      error.value = apiErr
      fieldErrors.value = apiErr.fieldErrors || {}
    } else {
      const fallbackMsg = (err as Error)?.message || 'Ocurrió un error inesperado.'
      error.value = {
        status: 0,
        message: fallbackMsg,
        errors: [fallbackMsg],
        fieldErrors: {},
        isNetworkError: false
      }
      fieldErrors.value = {}
    }
  }

  const clearError = () => {
    error.value = null
    fieldErrors.value = {}
  }

  const getFieldError = (fieldName: string): string | undefined => {
    const list = fieldErrors.value[fieldName]
    return list && list.length > 0 ? list[0] : undefined
  }

  return {
    error,
    fieldErrors,
    setError,
    clearError,
    getFieldError
  }
}
