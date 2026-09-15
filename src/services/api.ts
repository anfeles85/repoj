import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/interfaces/ApiResponse'
import { mockStorage } from './mockStorage'

/**
 * Instancia centralizada de Axios para la aplicación REPOJ
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
})

/**
 * Función para normalizar cualquier error devuelto por Axios en una estructura unificada ApiError.
 * Maneja tanto el formato genérico { success: false, message, errors: [] }
 * como el formato de Laravel { message, errors: { campo: [] } }.
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

  // Error sin respuesta del servidor (Network Error, Backend no levantado)
  if (!axiosError.response) {
    const isNetwork = axiosError.code === 'ERR_NETWORK' || !axiosError.status
    return {
      status: 0,
      message: isNetwork
        ? 'No se pudo conectar con el servidor de la API. Verifique su conexión a internet o asegúrese de que el backend esté en ejecución.'
        : axiosError.message,
      errors: [
        'Error de comunicación con el servidor. Verifique si el servicio backend está activo.'
      ],
      fieldErrors: {},
      isNetworkError: true
    }
  }

  const status = axiosError.response.status
  const data = axiosError.response.data || {}

  let message = (data.message as string) || ''
  const errors: string[] = []
  const fieldErrors: Record<string, string[]> = {}

  // Parsear 'errors' si vienen en la respuesta
  if (data.errors) {
    if (Array.isArray(data.errors)) {
      // Formato genérico: array de strings
      data.errors.forEach((err) => {
        if (typeof err === 'string') {
          errors.push(err)
        }
      })
    } else if (typeof data.errors === 'object' && data.errors !== null) {
      // Formato Laravel: objeto { campo: ["mensaje 1", "mensaje 2"] }
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

  // Asignar mensaje amigable según el código HTTP si no se especificó uno
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
      message = message || 'Error interno del servidor. Inténtelo más tarde o contacte al administrador.'
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
 * Interceptor de Solicitud:
 * Inserta automáticamente el token JWT / Bearer en las cabeceras si está presente en localStorage
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('repoj_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(normalizeApiError(error))
  }
)

/**
 * Interceptor de Respuesta:
 * 1. Pasa las respuestas exitosas directamente.
 * 2. Si hay error y está habilitado VITE_USE_MOCK_FALLBACK ante falla de red,
 *    simula la respuesta con almacenamiento local persistente para desarrollo fluido.
 * 3. En caso de error real, normaliza con normalizeApiError.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK'
    const useMock = import.meta.env.VITE_USE_MOCK_FALLBACK === 'true'

    // Si el backend no está disponible y estamos en modo desarrollo con mock activado
    if (isNetworkError && useMock && error.config) {
      const url = (error.config.url || '').toLowerCase()
      const method = (error.config.method || 'get').toLowerCase()

      // Endpoint /causal o /causales
      if (url.includes('/causal')) {
        console.warn(
          `[REPOJ API] Backend no disponible en ${api.defaults.baseURL}. Ejecutando fallback simulado persistente para ${method.toUpperCase()} ${url}`
        )

        try {
          // Extraer posible ID de la URL: ej. /causal/3 o /causales/3
          const idMatch = url.match(/\/causals?\/(\d+)/i)
          const targetId = idMatch ? parseInt(idMatch[1], 10) : null

          let mockData: unknown = null

          if (method === 'get') {
            if (targetId) {
              const item = mockStorage.getById(targetId)
              if (!item) {
                return Promise.reject({
                  status: 404,
                  message: `Causal con ID ${targetId} no encontrada`,
                  errors: ['Registro no encontrado'],
                  fieldErrors: {},
                  isNetworkError: false
                } as ApiError)
              }
              mockData = item
            } else {
              mockData = mockStorage.getAll()
            }
          } else if (method === 'post') {
            const body = typeof error.config.data === 'string'
              ? JSON.parse(error.config.data)
              : error.config.data || {}

            if (!body.description || !body.description.trim()) {
              return Promise.reject({
                status: 422,
                message: 'The given data was invalid.',
                errors: ['The description field is required.'],
                fieldErrors: { description: ['El campo descripción es obligatorio.'] },
                isNetworkError: false
              } as ApiError)
            }
            mockData = mockStorage.create({ description: body.description.trim() })
          } else if (method === 'put' || method === 'patch') {
            if (!targetId) throw new Error('ID no provisto para actualización')
            const body = typeof error.config.data === 'string'
              ? JSON.parse(error.config.data)
              : error.config.data || {}

            if (!body.description || !body.description.trim()) {
              return Promise.reject({
                status: 422,
                message: 'The given data was invalid.',
                errors: ['The description field is required.'],
                fieldErrors: { description: ['El campo descripción es obligatorio.'] },
                isNetworkError: false
              } as ApiError)
            }
            mockData = mockStorage.update(targetId, { description: body.description.trim() })
          } else if (method === 'delete') {
            if (!targetId) throw new Error('ID no provisto para eliminación')
            mockStorage.delete(targetId)
            mockData = { success: true, message: 'Causal eliminada con éxito' }
          }

          // Retornar estructura compatible con AxiosResponse
          return {
            data: mockData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: error.config
          }
        } catch (mockErr: any) {
          return Promise.reject({
            status: 500,
            message: mockErr.message || 'Error en operación simulada',
            errors: [mockErr.message || 'Error simulado'],
            fieldErrors: {},
            isNetworkError: false
          } as ApiError)
        }
      }
    }

    const normalized = normalizeApiError(error)

    // Si es 401 (No autorizado / token expirado), limpiar sesión
    if (normalized.status === 401) {
      localStorage.removeItem('repoj_token')
      localStorage.removeItem('repoj_user')
      // Si existiera ruta de login: window.location.href = '/login'
    }

    return Promise.reject(normalized)
  }
)

export default api
