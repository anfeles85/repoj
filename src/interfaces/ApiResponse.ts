/**
 * Respuesta genérica estándar de backend
 */
export interface ApiResponse<T = unknown> {
  success?: boolean
  message?: string
  data?: T
  errors?: string[] | Record<string, string[]>
}

/**
 * Estructura estándar de error devuelta por validación en Laravel
 */
export interface LaravelValidationErrorResponse {
  message: string
  errors: Record<string, string[]>
}

/**
 * Estructura estándar de error genérico (ej. API Express, Flask o servicios REST genéricos)
 */
export interface GenericErrorResponse {
  success?: boolean
  message: string
  errors?: string[]
}

/**
 * Error normalizado por el frontend para ser consumido uniformemente
 * por componentes, vistas y composables sin lidiar con formatos dispares.
 */
export interface ApiError {
  status: number
  message: string
  errors: string[]
  fieldErrors: Record<string, string[]>
  isNetworkError: boolean
}
