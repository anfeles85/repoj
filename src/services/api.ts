import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/interfaces/ApiResponse'

/**
 * Instancia centralizada de Axios para la aplicación REPOJ
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 10000
})

/**
 * Normaliza cualquier error en una estructura unificada ApiError.
 */
export function normalizeApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<Record<string, unknown>>

  if (!axiosError || !axiosError.isAxiosError) {
    return {
      status: 0,
      message: (error as Error)?.message || 'Ocurrió un error inesperado.',
      errors: [(error as Error)?.message || 'Error inesperado'],
      fieldErrors: {},
      isNetworkError: false
    }
  }

  // Error sin respuesta del servidor (Network Error, servicio inaccesible)
  if (!axiosError.response) {
    const isNetwork = axiosError.code === 'ERR_NETWORK' || !axiosError.status
    return {
      status: 0,
      message: isNetwork
        ? 'No se pudo conectar con el servidor. Verifique su conexión de red.'
        : axiosError.message,
      errors: ['Error de comunicación con el servicio.'],
      fieldErrors: {},
      isNetworkError: true
    }
  }

  const status = axiosError.response.status
  const data = axiosError.response.data || {}

  let message = (data.message as string) || ''
  const errors: string[] = []
  const fieldErrors: Record<string, string[]> = {}

  if (data.errors) {
    if (Array.isArray(data.errors)) {
      data.errors.forEach((err) => {
        if (typeof err === 'string') errors.push(err)
      })
    } else if (typeof data.errors === 'object' && data.errors !== null) {
      const errObj = data.errors as Record<string, unknown>
      for (const [field, fieldErrList] of Object.entries(errObj)) {
        if (Array.isArray(fieldErrList)) {
          fieldErrors[field] = fieldErrList.map((msg) => String(msg))
          fieldErrList.forEach((msg) => errors.push(String(msg)))
        } else if (typeof fieldErrList === 'string') {
          fieldErrors[field] = [fieldErrList]
          errors.push(fieldErrList)
        }
      }
    }
  }

  switch (status) {
    case 400:
      message = message || 'Solicitud incorrecta. Verifique los datos enviados.'
      break
    case 401:
      message = message || 'Sesión no autorizada o expirada. Por favor inicie sesión nuevamente.'
      break
    case 403:
      message = message || 'Acceso denegado. No posee permisos para realizar esta operación.'
      break
    case 404:
      message = message || 'El recurso solicitado no fue encontrado.'
      break
    case 422:
      message = message || 'Los datos proporcionados no son válidos.'
      break
    case 500:
      message = message || 'Error interno del servidor. Inténtelo más tarde.'
      break
    default:
      message = message || `Error del servidor (código ${status}).`
  }

  return {
    status,
    message,
    errors: errors.length > 0 ? errors : [message],
    fieldErrors,
    isNetworkError: false
  }
}

/**
 * Interceptor de Solicitud: Inserta token JWT si existe en la sesión
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('repoj_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(normalizeApiError(error))
)

/**
 * Interceptor de Respuesta
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const normalized = normalizeApiError(error)
    if (normalized.status === 401) {
      localStorage.removeItem('repoj_token')
      localStorage.removeItem('repoj_user')
    }
    return Promise.reject(normalized)
  }
)

export default api
