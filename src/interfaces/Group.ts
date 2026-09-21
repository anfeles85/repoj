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
  evaluative_judgments_file?: string | null
  evaluative_judgments_file_name?: string | null
  created_at?: string
}

export interface CreateGroupPayload {
  number: number
  program: string
  shift: GroupShift
  initial_date: string
  final_date: string
  status?: GroupStatus
  evaluative_judgments_file?: string | null
  evaluative_judgments_file_name?: string | null
}

export interface UpdateGroupPayload {
  number?: number
  program?: string
  shift?: GroupShift
  initial_date?: string
  final_date?: string
  status?: GroupStatus
  evaluative_judgments_file?: string | null
  evaluative_judgments_file_name?: string | null
}

