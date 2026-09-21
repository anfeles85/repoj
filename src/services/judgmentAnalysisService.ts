import * as XLSX from 'xlsx'
import type {
  RawJudgmentRecord,
  GroupAnalysisSummary,
  ApprenticeStatusCount,
  CompetenceMatrixItem,
  OutcomeBreakdownItem,
  MonthlyEvolutionItem,
  ApprenticeDetail,
  ApprenticeCompetenceProgress,
  ApprenticePerformanceLevel,
  HeatmapData,
  HeatmapApprentice,
  HeatmapCompetence,
  HeatmapCellDetail,
  HeatmapCellStatus,
  GroupAnalyticsResult
} from '@/interfaces/JudgmentAnalysis'

/**
 * Normalizar texto eliminando tildes y caracteres especiales para comparaciones seguras
 */
const normalizeText = (text: unknown): string => {
  if (text === null || text === undefined) return ''
  return String(text)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Formatear clave YYYY-MM a etiqueta legible en español (ej: "Mar 2024")
 */
const formatMonthLabel = (yearMonthKey: string): string => {
  const [year, month] = yearMonthKey.split('-')
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ]
  const idx = parseInt(month, 10) - 1
  const name = monthNames[idx] || month
  return `${name} ${year}`
}

/**
 * Servicio encargado del procesamiento, parseo y analítica de archivos de Juicios Evaluativos
 */
export const judgmentAnalysisService = {
  /**
   * Parsear el archivo Excel en Base64 y convertirlo a registros de juicios evaluativos
   */
  parseExcelBase64(base64DataUrl: string): RawJudgmentRecord[] {
    // 1. Quitar prefijo data:...;base64, si viene incluido
    let pureBase64 = base64DataUrl
    const commaIndex = base64DataUrl.indexOf(',')
    if (commaIndex !== -1 && base64DataUrl.slice(0, commaIndex).includes('base64')) {
      pureBase64 = base64DataUrl.slice(commaIndex + 1)
    }

    // 2. Leer libro de trabajo con XLSX
    const workbook = XLSX.read(pureBase64, {
      type: 'base64',
      cellDates: true,
      raw: false
    })

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('El archivo Excel no contiene hojas de cálculo.')
    }

    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // 3. Convertir hoja a matriz 2D
    const sheetData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: ''
    })

    if (!sheetData || sheetData.length === 0) {
      throw new Error('La hoja de cálculo está vacía.')
    }

    // 4. Localizar la fila de encabezados dinámicamente
    let headerRowIndex = -1
    let colDocNum = -1
    let colFirstName = -1
    let colLastName = -1
    let colFullName = -1
    let colStatus = -1
    let colCompetence = -1
    let colOutcome = -1
    let colJudgment = -1
    let colDate = -1
    let colInstructor = -1

    for (let r = 0; r < Math.min(sheetData.length, 30); r++) {
      const row = sheetData[r]
      if (!Array.isArray(row)) continue

      let matchedColumnsCount = 0
      row.forEach((cell) => {
        const norm = normalizeText(cell)
        if (norm.includes('documento') || norm.includes('identificacion') || norm.includes('cedula')) {
          matchedColumnsCount++
        }
        if (norm.includes('aprendiz') || norm.includes('nombre') || norm.includes('apellidos')) {
          matchedColumnsCount++
        }
        if (norm.includes('competencia')) {
          matchedColumnsCount++
        }
        if (norm.includes('resultado') || norm.includes('rap') || norm.includes('aprendizaje')) {
          matchedColumnsCount++
        }
        if (norm.includes('juicio')) {
          matchedColumnsCount++
        }
      })

      // Si la fila tiene al menos 3 coincidencias clave, la tomamos como encabezado
      if (matchedColumnsCount >= 3) {
        headerRowIndex = r
        row.forEach((cell, colIdx) => {
          const norm = normalizeText(cell)
          if (!norm) return

          // 1. Documento del Aprendiz (Priorizar número de documento, omitir 'tipo de documento')
          if (
            norm.includes('numero') &&
            (norm.includes('documento') || norm.includes('identificacion') || norm.includes('doc'))
          ) {
            colDocNum = colIdx
          } else if (
            colDocNum === -1 &&
            (norm.includes('documento') || norm.includes('identificacion') || norm.includes('cedula')) &&
            !norm.includes('tipo')
          ) {
            colDocNum = colIdx
          }

          // 2. Nombres y Apellidos
          if (norm.includes('apellido')) {
            colLastName = colIdx
          } else if (norm === 'nombre' || norm === 'nombres' || norm.includes('primer nombre')) {
            colFirstName = colIdx
          } else if (
            colFullName === -1 &&
            ((norm.includes('aprendiz') && !norm.includes('aprendizaje')) ||
              norm.includes('nombre completo') ||
              norm.includes('nombre aprendiz'))
          ) {
            colFullName = colIdx
          }

          // 3. Estado del Aprendiz (omitir estado de juicio, ficha o evaluacion)
          if (
            norm.includes('estado') &&
            !norm.includes('juicio') &&
            !norm.includes('ficha') &&
            !norm.includes('evaluacion')
          ) {
            colStatus = colIdx
          }

          // 4. Competencia
          if (norm.includes('competencia') && !norm.includes('ficha')) {
            colCompetence = colIdx
          }

          // 5. Resultado de Aprendizaje
          if (norm.includes('resultado') || norm.includes('rap') || norm.includes('aprendizaje')) {
            colOutcome = colIdx
          }

          // 6. Juicio Evaluativo
          if (norm.includes('juicio') && !norm.includes('fecha') && !norm.includes('funcionario')) {
            colJudgment = colIdx
          }

          // 7. Fecha y Hora del Juicio (omitir fechas de inicio, fin o reporte)
          if (
            (norm.includes('fecha') || norm.includes('hora')) &&
            !norm.includes('inicio') &&
            !norm.includes('fin') &&
            !norm.includes('reporte')
          ) {
            colDate = colIdx
          }

          // 8. Funcionario / Instructor
          if (
            norm.includes('funcionario') ||
            norm.includes('instructor') ||
            norm.includes('evaluador')
          ) {
            colInstructor = colIdx
          }
        })
        break
      }
    }

    if (headerRowIndex === -1) {
      throw new Error(
        'No se pudo reconocer la estructura de columnas de SofiaPlus en el archivo. Verifique que contenga columnas de Aprendiz, Competencia, Resultado y Juicio.'
      )
    }

    // 5. Procesar filas de datos
    const records: RawJudgmentRecord[] = []

    for (let r = headerRowIndex + 1; r < sheetData.length; r++) {
      const row = sheetData[r]
      if (!Array.isArray(row) || row.length === 0) continue

      const rawDoc = colDocNum !== -1 ? String(row[colDocNum] || '').trim() : ''
      const firstName = colFirstName !== -1 ? String(row[colFirstName] || '').trim() : ''
      const lastName = colLastName !== -1 ? String(row[colLastName] || '').trim() : ''
      const fullName = colFullName !== -1 ? String(row[colFullName] || '').trim() : ''
      const rawName = (firstName + ' ' + lastName).trim() || fullName || ''
      const rawStatus = colStatus !== -1 ? String(row[colStatus] || '').trim() : 'EN FORMACION'
      const rawCompetence = colCompetence !== -1 ? String(row[colCompetence] || '').trim() : ''
      const rawOutcome = colOutcome !== -1 ? String(row[colOutcome] || '').trim() : ''
      const rawJudgment = colJudgment !== -1 ? String(row[colJudgment] || '').trim() : ''
      const rawInstructor = colInstructor !== -1 ? String(row[colInstructor] || '').trim() : ''

      // Extraer y normalizar fecha
      let judgmentDate: string | null = null
      if (colDate !== -1) {
        const val = row[colDate]
        if (typeof val === 'number' && val > 30000 && val < 65000) {
          try {
            const d = XLSX.SSF.parse_date_code(val)
            const m = String(d.m).padStart(2, '0')
            const day = String(d.d).padStart(2, '0')
            judgmentDate = `${d.y}-${m}-${day}`
          } catch {
            judgmentDate = String(val)
          }
        } else if (val instanceof Date) {
          judgmentDate = val.toISOString().slice(0, 10)
        } else if (val) {
          judgmentDate = String(val).trim()
        }
      }

      // Si la fila no tiene documento ni nombre, o no tiene resultado ni competencia, la ignoramos
      if (!rawDoc && !rawName) continue
      if (!rawCompetence && !rawOutcome) continue

      // Normalizar estado del aprendiz
      let apprenticeStatus = 'EN FORMACION'
      const normStatus = normalizeText(rawStatus)
      if (normStatus.includes('retiro') || normStatus.includes('voluntario')) {
        apprenticeStatus = 'RETIRO VOLUNTARIO'
      } else if (normStatus.includes('cancelado') || normStatus.includes('cancelacion')) {
        apprenticeStatus = 'CANCELADO'
      } else if (normStatus.includes('condicionado')) {
        apprenticeStatus = 'CONDICIONADO'
      } else if (normStatus.includes('trasladado') || normStatus.includes('traslado')) {
        apprenticeStatus = 'TRASLADADO'
      } else if (normStatus.includes('aplazado')) {
        apprenticeStatus = 'APLAZADO'
      } else if (normStatus.includes('formacion') || !rawStatus) {
        apprenticeStatus = 'EN FORMACION'
      } else {
        apprenticeStatus = rawStatus.toUpperCase()
      }

      // Normalizar juicio evaluativo
      let judgmentStatus: 'APROBADO' | 'POR EVALUAR' = 'POR EVALUAR'
      const normJudgment = normalizeText(rawJudgment)
      if (normJudgment.startsWith('aprob') || normJudgment === 'a') {
        judgmentStatus = 'APROBADO'
      } else {
        judgmentStatus = 'POR EVALUAR'
      }

      // Limpiar y separar códigos si existen
      const competenceName = rawCompetence || 'Competencia sin especificar'
      const outcomeName = rawOutcome || 'Resultado sin especificar'
      const document = rawDoc || (rawName ? `DOC-${rawName.replace(/\s+/g, '')}` : `APRENDIZ-${r}`)
      const apprenticeName = rawName || `Aprendiz ${document}`

      records.push({
        document,
        apprenticeName,
        apprenticeStatus,
        competenceCode: competenceName.slice(0, 15),
        competenceName,
        outcomeCode: outcomeName.slice(0, 15),
        outcomeName,
        judgmentStatus,
        judgmentDate,
        instructorName: rawInstructor || undefined
      })
    }

    if (records.length === 0) {
      throw new Error('El archivo no contiene registros válidos de juicios evaluativos.')
    }

    return records
  },

  /**
   * Generar todas las métricas, agregaciones y estructuras de visualización solicitadas
   */
  calculateGroupAnalytics(records: RawJudgmentRecord[]): GroupAnalyticsResult {
    // 1. Conjunto único de aprendices y competencias
    const apprenticeMap = new Map<string, { document: string; name: string; status: string }>()
    const competenceSet = new Set<string>()

    records.forEach((rec) => {
      const key = rec.document
      if (!apprenticeMap.has(key)) {
        apprenticeMap.set(key, {
          document: rec.document,
          name: rec.apprenticeName,
          status: rec.apprenticeStatus
        })
      }
      competenceSet.add(rec.competenceName)
    })

    const totalApprentices = apprenticeMap.size
    const totalCompetences = competenceSet.size
    const totalJudgments = records.length
    const approvedJudgments = records.filter((r) => r.judgmentStatus === 'APROBADO').length
    const pendingJudgments = totalJudgments - approvedJudgments
    const approvalPercentage = totalJudgments > 0 ? (approvedJudgments / totalJudgments) * 100 : 0

    // 2. Métrica especial de aprendices EN FORMACION
    // "Resultados pendientes por evaluación = total resultados evaluados de aprendices EN FORMACION / Total resultados de aprendices EN FORMACION"
    const inFormationRecords = records.filter((r) => r.apprenticeStatus === 'EN FORMACION')
    const inFormationTotal = inFormationRecords.length
    const inFormationApproved = inFormationRecords.filter((r) => r.judgmentStatus === 'APROBADO').length
    const inFormationPending = inFormationTotal - inFormationApproved
    const inFormationApprovalPercentage =
      inFormationTotal > 0 ? (inFormationApproved / inFormationTotal) * 100 : 0
    const pendingEvaluationsRate =
      inFormationTotal > 0 ? (inFormationApproved / inFormationTotal) * 100 : 0

    const summary: GroupAnalysisSummary = {
      totalApprentices,
      totalJudgments,
      approvedJudgments,
      pendingJudgments,
      approvalPercentage,
      totalCompetences,
      pendingEvaluationsRate,
      inFormationEvaluatedOutcomes: inFormationApproved,
      inFormationTotalOutcomes: inFormationTotal
    }

    // 3. Distribución de Aprendices por Estado
    const statusCounter = new Map<string, number>()
    apprenticeMap.forEach((app) => {
      const current = statusCounter.get(app.status) || 0
      statusCounter.set(app.status, current + 1)
    })

    // Lista priorizada de estados SENA
    const knownStatuses = [
      'EN FORMACION',
      'RETIRO VOLUNTARIO',
      'CANCELADO',
      'CONDICIONADO',
      'TRASLADADO'
    ]
    const statusDistribution: ApprenticeStatusCount[] = []

    knownStatuses.forEach((st) => {
      const count = statusCounter.get(st) || 0
      const pct = totalApprentices > 0 ? (count / totalApprentices) * 100 : 0
      statusDistribution.push({
        status: st,
        count,
        percentage: pct
      })
      statusCounter.delete(st)
    })

    // Cualquier otro estado adicional
    statusCounter.forEach((count, st) => {
      const pct = totalApprentices > 0 ? (count / totalApprentices) * 100 : 0
      statusDistribution.push({
        status: st,
        count,
        percentage: pct
      })
    })

    // 4. Matriz Competencia x Estado & Resultados de Aprendizaje por Competencia
    const competenceAgg = new Map<
      string,
      {
        name: string
        approved: number
        pending: number
        total: number
        outcomes: Map<string, { name: string; approved: number; pending: number; total: number }>
      }
    >()

    records.forEach((rec) => {
      let comp = competenceAgg.get(rec.competenceName)
      if (!comp) {
        comp = {
          name: rec.competenceName,
          approved: 0,
          pending: 0,
          total: 0,
          outcomes: new Map()
        }
        competenceAgg.set(rec.competenceName, comp)
      }

      comp.total++
      if (rec.judgmentStatus === 'APROBADO') {
        comp.approved++
      } else {
        comp.pending++
      }

      let outcome = comp.outcomes.get(rec.outcomeName)
      if (!outcome) {
        outcome = {
          name: rec.outcomeName,
          approved: 0,
          pending: 0,
          total: 0
        }
        comp.outcomes.set(rec.outcomeName, outcome)
      }

      outcome.total++
      if (rec.judgmentStatus === 'APROBADO') {
        outcome.approved++
      } else {
        outcome.pending++
      }
    })

    const competenceMatrix: CompetenceMatrixItem[] = []
    const outcomesByCompetence: Record<string, OutcomeBreakdownItem[]> = {}

    competenceAgg.forEach((comp, compName) => {
      const pct = comp.total > 0 ? (comp.approved / comp.total) * 100 : 0
      competenceMatrix.push({
        competenceId: compName,
        competenceName: compName,
        approved: comp.approved,
        pending: comp.pending,
        total: comp.total,
        percentage: pct
      })

      const outcomeList: OutcomeBreakdownItem[] = []
      comp.outcomes.forEach((out, outName) => {
        const outPct = out.total > 0 ? (out.approved / out.total) * 100 : 0
        outcomeList.push({
          outcomeId: outName,
          outcomeName: outName,
          approved: out.approved,
          pending: out.pending,
          total: out.total,
          percentage: outPct
        })
      })
      outcomeList.sort((a, b) => b.pending - a.pending)
      outcomesByCompetence[compName] = outcomeList
    })

    // Ordenar matriz de competencias por juicios pendientes descendente
    competenceMatrix.sort((a, b) => b.pending - a.pending)

    // 5. Evolución Temporal (Juicios evaluados por cada mes)
    const monthlyCounter = new Map<string, number>()
    records.forEach((rec) => {
      if (!rec.judgmentDate) return
      // Detectar formato YYYY-MM o fecha válida
      let yearMonth: string | null = null

      const dateStr = rec.judgmentDate.trim()
      // Caso 1: YYYY-MM-DD o ISO
      const isoMatch = dateStr.match(/^(\d{4})-(\d{2})/)
      if (isoMatch) {
        yearMonth = `${isoMatch[1]}-${isoMatch[2]}`
      } else {
        // Caso 2: DD/MM/YYYY o DD-MM-YYYY
        const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
        if (ddmmyyyy) {
          const y = ddmmyyyy[3]
          const m = ddmmyyyy[2].padStart(2, '0')
          yearMonth = `${y}-${m}`
        } else {
          // Intentar parsear nativo
          const parsed = new Date(dateStr)
          if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear()
            const m = String(parsed.getMonth() + 1).padStart(2, '0')
            if (y > 2000 && y < 2100) {
              yearMonth = `${y}-${m}`
            }
          }
        }
      }

      if (yearMonth) {
        // Contabilizar las evaluaciones realizadas
        const c = monthlyCounter.get(yearMonth) || 0
        monthlyCounter.set(yearMonth, c + 1)
      }
    })

    const monthlyEvolution: MonthlyEvolutionItem[] = []
    const sortedMonthKeys = Array.from(monthlyCounter.keys()).sort()
    sortedMonthKeys.forEach((key) => {
      monthlyEvolution.push({
        monthKey: key,
        label: formatMonthLabel(key),
        count: monthlyCounter.get(key) || 0
      })
    })

    // 6. Análisis por Aprendiz & Heatmap
    // Regla crucial: "una competencia se considera totalmente Evaluada si todos sus resultados de aprendizaje están APROBADOS"
    const apprenticeRecordsMap = new Map<string, RawJudgmentRecord[]>()
    records.forEach((rec) => {
      const list = apprenticeRecordsMap.get(rec.document) || []
      list.push(rec)
      apprenticeRecordsMap.set(rec.document, list)
    })

    const apprentices: ApprenticeDetail[] = []
    const heatmapMatrix: Record<string, Record<string, HeatmapCellDetail>> = {}
    const sortedCompetenceNames = Array.from(competenceSet).sort()

    // Crear lista de competencias para el heatmap con códigos cortos (C1, C2, ...)
    const heatmapCompetences: HeatmapCompetence[] = sortedCompetenceNames.map((name, i) => ({
      id: name,
      name,
      shortCode: `C${i + 1}`
    }))

    const heatmapApprentices: HeatmapApprentice[] = []

    apprenticeMap.forEach((app, doc) => {
      const userRecords = apprenticeRecordsMap.get(doc) || []
      const totalOutcomes = userRecords.length
      const approvedOutcomes = userRecords.filter((r) => r.judgmentStatus === 'APROBADO').length
      const pendingOutcomes = totalOutcomes - approvedOutcomes
      const progressPercentage =
        totalOutcomes > 0 ? (approvedOutcomes / totalOutcomes) * 100 : 0

      // Clasificación de Nivel:
      // 🟢 Alto: ≥ 90 %
      // 🟡 Medio: 70 - 89 %
      // 🟠 Bajo: 50 - 69 %
      // 🔴 Crítico: < 50 %
      let level: ApprenticePerformanceLevel = 'CRITICO'
      if (progressPercentage >= 90) {
        level = 'ALTO'
      } else if (progressPercentage >= 70) {
        level = 'MEDIO'
      } else if (progressPercentage >= 50) {
        level = 'BAJO'
      } else {
        level = 'CRITICO'
      }

      // Progreso detallado por competencia
      const compMap = new Map<string, { approved: number; total: number }>()
      userRecords.forEach((r) => {
        const c = compMap.get(r.competenceName) || { approved: 0, total: 0 }
        c.total++
        if (r.judgmentStatus === 'APROBADO') c.approved++
        compMap.set(r.competenceName, c)
      })

      const competenceProgress: ApprenticeCompetenceProgress[] = []
      heatmapMatrix[doc] = {}

      sortedCompetenceNames.forEach((cName) => {
        const stat = compMap.get(cName) || { approved: 0, total: 0 }
        const cPct = stat.total > 0 ? (stat.approved / stat.total) * 100 : 0
        const isFullyEvaluated = stat.total > 0 && stat.approved === stat.total

        competenceProgress.push({
          competenceId: cName,
          competenceName: cName,
          approved: stat.approved,
          total: stat.total,
          percentage: cPct,
          isFullyEvaluated
        })

        // Estado de celda del heatmap:
        // APROBADO si todos los RAPs están aprobados
        // POR_EVALUAR si ninguno está aprobado o no evaluado
        // PARCIAL si tiene algunos aprobados pero no todos
        let cellStatus: HeatmapCellStatus = 'POR_EVALUAR'
        if (stat.total > 0) {
          if (stat.approved === stat.total) {
            cellStatus = 'APROBADO'
          } else if (stat.approved > 0) {
            cellStatus = 'PARCIAL'
          } else {
            cellStatus = 'POR_EVALUAR'
          }
        }

        heatmapMatrix[doc][cName] = {
          status: cellStatus,
          approved: stat.approved,
          total: stat.total,
          percentage: cPct
        }
      })

      apprentices.push({
        id: doc,
        document: doc,
        name: app.name,
        status: app.status,
        totalOutcomes,
        approvedOutcomes,
        pendingOutcomes,
        progressPercentage,
        level,
        competenceProgress
      })

      heatmapApprentices.push({
        id: doc,
        document: doc,
        name: app.name,
        status: app.status
      })
    })

    // Ordenar aprendices alfabéticamente
    apprentices.sort((a, b) => a.name.localeCompare(b.name))
    heatmapApprentices.sort((a, b) => a.name.localeCompare(b.name))

    const heatmap: HeatmapData = {
      apprentices: heatmapApprentices,
      competences: heatmapCompetences,
      matrix: heatmapMatrix
    }

    return {
      summary,
      statusDistribution,
      competenceMatrix,
      outcomesByCompetence,
      monthlyEvolution,
      apprentices,
      heatmap,
      inFormationJudgments: {
        approved: inFormationApproved,
        pending: inFormationPending,
        total: inFormationTotal,
        approvalPercentage: inFormationApprovalPercentage
      }
    }
  }
}

export default judgmentAnalysisService
