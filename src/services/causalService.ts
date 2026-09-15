import api from './api'
import type { Causal, CausalPayload } from '@/interfaces/Causal'

/**
 * Obtiene la lista completa de causales desde la API
 */
export const getCausales = async (): Promise<Causal[]> => {
  const response = await api.get<Causal[]>('/causal')
  return response.data
}

/**
 * Obtiene una causal específica por su ID
 */
export const getCausalById = async (id: number): Promise<Causal> => {
  const response = await api.get<Causal>(`/causal/${id}`)
  return response.data
}

/**
 * Registra una nueva causal en la API
 */
export const createCausal = async (payload: CausalPayload): Promise<Causal> => {
  const response = await api.post<Causal>('/causal', payload)
  return response.data
}

/**
 * Actualiza la información de una causal existente
 */
export const updateCausal = async (id: number, payload: CausalPayload): Promise<Causal> => {
  const response = await api.put<Causal>(`/causal/${id}`, payload)
  return response.data
}

/**
 * Elimina una causal por su ID
 */
export const deleteCausal = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/causal/${id}`)
  return response.data
}
