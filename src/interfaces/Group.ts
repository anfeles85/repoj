export type GroupShift = 'DIURNA' | 'MIXTA' | 'NOCTURNA'

export type GroupStatus = 'EN EJECUCION' | 'CANCELADA' | 'PRODUCTIVA' | 'INACTIVA'

export interface Group {
  id: number
  number: number
  program: string
  shift: GroupShift
  initial_date: string
  final_date: string
  status: GroupStatus
  created_at?: string
}

export interface CreateGroupPayload {
  number: number
  program: string
  shift: GroupShift
  initial_date: string
  final_date: string
  status?: GroupStatus
}

export interface UpdateGroupPayload {
  number?: number
  program?: string
  shift?: GroupShift
  initial_date?: string
  final_date?: string
  status?: GroupStatus
}
