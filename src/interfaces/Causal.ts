export interface Causal {
  id: number
  description: string
  created_at: string | null
  updated_at: string | null
}

export interface CausalPayload {
  description: string
}
