export interface RawJudgmentRecord {
  document: string
  apprenticeName: string
  apprenticeStatus: string
  competenceCode: string
  competenceName: string
  outcomeCode: string
  outcomeName: string
  judgmentStatus: 'APROBADO' | 'POR EVALUAR' | string
  judgmentDate: string | null
  instructorName?: string
}

export interface GroupAnalysisSummary {
  totalApprentices: number
  totalJudgments: number
  approvedJudgments: number
  pendingJudgments: number
  approvalPercentage: number
  totalCompetences: number
  pendingEvaluationsRate: number // total resultados evaluados de aprendices EN FORMACION / Total resultados de aprendices EN FORMACION
  inFormationEvaluatedOutcomes: number
  inFormationTotalOutcomes: number
}

export interface ApprenticeStatusCount {
  status: string
  count: number
  percentage: number
}

export interface CompetenceMatrixItem {
  competenceId: string
  competenceName: string
  approved: number
  pending: number
  total: number
  percentage: number
}

export interface OutcomeBreakdownItem {
  outcomeId: string
  outcomeName: string
  approved: number
  pending: number
  total: number
  percentage: number
}

export interface MonthlyEvolutionItem {
  monthKey: string // YYYY-MM
  label: string // e.g. "Mar 2024"
  count: number
}

export type ApprenticePerformanceLevel = 'ALTO' | 'MEDIO' | 'BAJO' | 'CRITICO'

export interface ApprenticeCompetenceProgress {
  competenceId: string
  competenceName: string
  approved: number
  total: number
  percentage: number
  isFullyEvaluated: boolean
}

export interface ApprenticeDetail {
  id: string
  document: string
  name: string
  status: string
  totalOutcomes: number
  approvedOutcomes: number
  pendingOutcomes: number
  progressPercentage: number
  level: ApprenticePerformanceLevel
  competenceProgress: ApprenticeCompetenceProgress[]
}

export interface HeatmapApprentice {
  id: string
  document: string
  name: string
  status: string
}

export interface HeatmapCompetence {
  id: string
  name: string
  shortCode: string
}

export type HeatmapCellStatus = 'APROBADO' | 'PARCIAL' | 'POR_EVALUAR'

export interface HeatmapCellDetail {
  status: HeatmapCellStatus
  approved: number
  total: number
  percentage: number
}

export interface HeatmapData {
  apprentices: HeatmapApprentice[]
  competences: HeatmapCompetence[]
  matrix: Record<string, Record<string, HeatmapCellDetail>> // [apprenticeId][competenceId]
}

export interface GroupAnalyticsResult {
  summary: GroupAnalysisSummary
  statusDistribution: ApprenticeStatusCount[]
  competenceMatrix: CompetenceMatrixItem[]
  outcomesByCompetence: Record<string, OutcomeBreakdownItem[]>
  monthlyEvolution: MonthlyEvolutionItem[]
  apprentices: ApprenticeDetail[]
  heatmap: HeatmapData
  inFormationJudgments: {
    approved: number
    pending: number
    total: number
    approvalPercentage: number
  }
}
