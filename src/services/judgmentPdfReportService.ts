import html2pdf from 'html2pdf.js'
import type { Group } from '@/interfaces/Group'
import type { GroupAnalyticsResult, ApprenticeStatusCount } from '@/interfaces/JudgmentAnalysis'

// SVG oficial del SENA en formato nativo vector (verde institucional #39A900)
const SENA_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="56" height="56" style="display: block;">
  <path fill="#39A900" d="M504.2,20.5c-58.3,0.1-105.6,47.4-105.5,105.8c0.1,58.3,47.4,105.6,105.7,105.6 c58.3,0,105.6-47.3,105.6-105.7V126C609.9,67.6,562.6,20.4,504.2,20.5z M155.6,264.6c-18.6,0.1-37.5,1.1-55.2,5.6 c-11.7,3-23,7.8-30.3,15.4c-9.2,9.5-10.4,22.3-5.9,33.3c4,9.7,14.8,16.9,26.8,21.1c25.9,8.9,54.6,10.7,81.8,16.3 c5,1.2,10.6,2.6,13.7,6c3.2,4.1,1.3,9.7-4,12.2c-8.8,4.5-20.1,4.5-30.4,4.4c-9.4-0.4-19.7-1.2-27.2-5.9c-5.5-3.4-6.5-9.1-5.2-14.1 l-60.6,0c-0.2,9.2,1.6,18.9,8.4,26.8c5.6,6.8,14.8,11.5,24.6,14.4c15.7,4.6,32.7,6,49.4,6.4c22.7,0.4,45.8-0.3,67.6-5.4 c13-3.2,25.8-8.3,34.1-16.6c14.8-14.8,11.3-38.3-8.3-49.8c-9.8-5.7-21.5-9.2-33.4-11.5c-17.5-3.6-35.3-6.3-52.9-9.2 c-6.2-1.2-12.8-2.3-18-5.2c-5.5-2.9-5.9-9.8-0.3-12.9c7.2-4.1,16.8-4,25.4-4c9.1,0.2,19,0.7,26.5,5c4.2,2.3,5.9,6.3,5.9,10.1 l57.6-0.1c-0.2-7.3-1.6-14.9-6.9-21.2c-6.2-7.8-17.1-12.7-28.3-15.5C192.8,265.6,174.1,264.7,155.6,264.6L155.6,264.6z M280.6,268.9 l0,137.7l168.1,0l0-30H342.3v-26.7h94.9v-29.3h-94.9l0-21.9l102.6,0l-0.1-29.7L280.6,268.9z M557.5,269c0,0-51.9,0-77.9,0l0,137.7 l59,0l0-92.7l80.8,92.6l81,0.1l0-137.7l-59.1,0l0.1,92L557.5,269z M805.6,269.2c0,0-63.6,91.9-95.6,137.7l61.9,0l14.9-24.8h95.7 l13.9,24.9l68.8,0L874,269.2L805.6,269.2z M836.6,302.1l29.4,49.9l-60.7,0.1L836.6,302.1z M10.6,445.6l0.5,75l280.1-1 c14.3,3.1,22.6,12.4,19.7,33.5L138.6,854.7l56.1,52.5l266.9-461.6L10.6,445.6z M545.2,446.2l262.4,459.6l58-52.1L691.3,552.9 c-2.9-21.2,5.4-30.6,19.7-33.7l280.2,1l-0.1-73.7L545.2,446.2z M500.9,522.3L254.8,944.7l65.4,31.9L484.4,699 c5.7-4.6,11.4-7.1,17.1-7.3c6-0.2,12.2,2,18.3,6.8l163.8,278.4l67.4-35.2L500.9,522.3z" />
</svg>
`

function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CO').format(num)
}

function getStatusColor(status: string): { bg: string; text: string; bar: string } {
  switch (status.trim().toUpperCase()) {
    case 'EN FORMACION':
      return { bg: '#d1e7dd', text: '#0f5132', bar: '#39A900' }
    case 'CERTIFICADO':
      return { bg: '#cfe2ff', text: '#084298', bar: '#0d6efd' }
    case 'POR CERTIFICAR':
      return { bg: '#cff4fc', text: '#055160', bar: '#0dcaf0' }
    case 'CONDICIONADO':
      return { bg: '#fff3cd', text: '#664d03', bar: '#ffc107' }
    case 'APLAZADO':
      return { bg: '#e2e3e5', text: '#41464b', bar: '#212529' }
    case 'RETIRO VOLUNTARIO':
      return { bg: '#e2e3e5', text: '#41464b', bar: '#6c757d' }
    case 'CANCELADO':
      return { bg: '#f8d7da', text: '#842029', bar: '#dc3545' }
    case 'TRASLADADO':
      return { bg: '#cff4fc', text: '#055160', bar: '#0dcaf0' }
    default:
      return { bg: '#f8f9fa', text: '#212529', bar: '#6c757d' }
  }
}

async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return imageUrl
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(imageUrl)
      reader.readAsDataURL(blob)
    })
  } catch {
    return imageUrl
  }
}

export const judgmentPdfReportService = {
  /**
   * Genera y descarga directamente el PDF del análisis sin abrir pestañas nuevas en el navegador.
   * Totalmente renderizado en el cliente con html2pdf.js
   */
  async downloadPdfReport(
    group: Group,
    analytics: GroupAnalyticsResult,
    generatedBy: string = 'Usuario del Sistema'
  ): Promise<void> {
    const repojLogoBase64 = await getBase64ImageFromUrl(`${window.location.origin}/logo_repoj.png`)

    // Asegurar precarga de la imagen para que html2canvas no capture un espacio en blanco
    if (repojLogoBase64 && repojLogoBase64.startsWith('data:')) {
      const preImg = new Image()
      preImg.src = repojLogoBase64
      await new Promise<void>((resolve) => {
        if (preImg.complete) {
          resolve()
        } else {
          preImg.onload = () => resolve()
          preImg.onerror = () => resolve()
        }
      })
    }

    const now = new Date()
    const formattedDate = new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(now)

    const summary = analytics.summary
    const statusDistribution: ApprenticeStatusCount[] = analytics.statusDistribution || []
    const heatmap = analytics.heatmap
    const competences = heatmap.competences || []
    const apprentices = heatmap.apprentices || []

    // Construcción de filas de glosario en pares (2 columnas por fila para compatibilidad perfecta con html2canvas)
    let glossaryRowsHtml = ''
    for (let i = 0; i < competences.length; i += 2) {
      const c1 = competences[i]
      const c2 = competences[i + 1]
      glossaryRowsHtml += `
        <tr>
          <td style="width: 50%; padding: 3px 5px; vertical-align: top;">
            <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 3px; padding: 4px 6px; font-size: 8.5px;">
              <span style="font-weight: 800; color: #39A900;">${escapeHtml(c1.shortCode)}:</span>
              <span style="color: #212529;">${escapeHtml(c1.name)}</span>
            </div>
          </td>
          <td style="width: 50%; padding: 3px 5px; vertical-align: top;">
            ${
              c2
                ? `
            <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 3px; padding: 4px 6px; font-size: 8.5px;">
              <span style="font-weight: 800; color: #39A900;">${escapeHtml(c2.shortCode)}:</span>
              <span style="color: #212529;">${escapeHtml(c2.name)}</span>
            </div>`
                : ''
            }
          </td>
        </tr>
      `
    }

    const htmlContent = `
      <div id="pdf-report-canvas-root" style="
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #212529;
        background-color: #ffffff;
        padding: 12px 16px;
        width: 755px;
        font-size: 11px;
        line-height: 1.35;
        box-sizing: border-box;
      ">
        <style>
          #pdf-report-canvas-root * {
            box-sizing: border-box;
          }
          .pdf-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #39A900;
            padding-bottom: 10px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .pdf-header-left {
            width: 140px;
            display: flex;
            align-items: center;
          }
          .pdf-header-left img {
            max-height: 50px;
            max-width: 135px;
            object-fit: contain;
            display: block;
          }
          .pdf-header-center {
            text-align: center;
            flex: 1;
            padding: 0 10px;
          }
          .pdf-header-center h1 {
            margin: 0 0 3px 0;
            font-size: 18px;
            font-weight: 800;
            color: #39A900;
          }
          .pdf-header-center .subtitle {
            margin: 0 0 2px 0;
            font-size: 10.5px;
            font-weight: 600;
            color: #495057;
          }
          .pdf-header-center .date {
            margin: 0;
            font-size: 9px;
            color: #6c757d;
          }
          .pdf-header-right {
            width: 70px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }

          /* Información del Grupo */
          .group-box {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-left: 5px solid #39A900;
            border-radius: 5px;
            padding: 8px 12px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .group-table {
            width: 100%;
            border-collapse: collapse;
          }
          .group-table td {
            border: none;
            padding: 2px 6px;
            vertical-align: top;
            width: 25%;
          }
          .group-label {
            font-size: 8.5px;
            text-transform: uppercase;
            color: #6c757d;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .group-value {
            font-size: 11px;
            font-weight: 700;
            color: #212529;
            word-break: break-word;
          }
          .badge-status {
            display: inline-block;
            padding: 2px 7px;
            font-size: 9px;
            font-weight: 700;
            border-radius: 10px;
            background-color: #d1e7dd;
            color: #0f5132;
          }

          /* 6 Tarjetas de KPIs */
          .kpi-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 5px 0;
            margin-bottom: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .kpi-cell {
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-top: 3px solid #39A900;
            border-radius: 5px;
            padding: 7px 4px;
            text-align: center;
            vertical-align: middle;
            width: 16.66%;
          }
          .kpi-cell.primary { border-top-color: #0d6efd; }
          .kpi-cell.secondary { border-top-color: #6c757d; }
          .kpi-cell.success { border-top-color: #39A900; }
          .kpi-cell.warning { border-top-color: #ffc107; }
          .kpi-cell.info { border-top-color: #0dcaf0; }
          .kpi-cell.dark { border-top-color: #212529; }

          .kpi-val {
            font-size: 15px;
            font-weight: 800;
            color: #212529;
            margin-bottom: 1px;
          }
          .kpi-cell.success .kpi-val { color: #39A900; }
          .kpi-cell.warning .kpi-val { color: #d68b00; }
          .kpi-cell.info .kpi-val { color: #055160; }

          .kpi-tit {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            color: #6c757d;
          }
          .kpi-sub {
            font-size: 7px;
            color: #8c98a4;
          }

          /* Secciones */
          .section-wrap {
            background: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            margin-bottom: 12px;
          }
          .section-head {
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
            padding: 6px 12px;
            font-size: 10.5px;
            font-weight: 700;
            color: #212529;
            display: flex;
            justify-content: space-between;
            align-items: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Tablas */
          table.report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          table.report-table th {
            background-color: #f1f3f5;
            color: #495057;
            font-weight: 700;
            padding: 5px 6px;
            border: 1px solid #dee2e6;
          }
          table.report-table td {
            padding: 4px 6px;
            border: 1px solid #dee2e6;
            vertical-align: middle;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .bar-track {
            background-color: #e9ecef;
            height: 6px;
            border-radius: 3px;
            overflow: hidden;
            width: 100%;
          }
          .bar-fill {
            height: 100%;
            border-radius: 3px;
          }
          .tag-status {
            display: inline-block;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: 700;
          }

          /* Heatmap */
          .heatmap-tbl {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            text-align: center;
          }
          .heatmap-tbl th {
            background-color: #f1f3f5;
            color: #495057;
            font-weight: 700;
            padding: 4px 2px;
            border: 1px solid #dee2e6;
            font-size: 7.5px;
            text-align: center;
          }
          .heatmap-tbl td {
            padding: 2px 1px;
            border: 1px solid #dee2e6;
            vertical-align: middle;
          }
          .c-box {
            display: block;
            width: 100%;
            padding: 2px 1px;
            border-radius: 2px;
            font-weight: 700;
            font-size: 7.5px;
          }
          .c-aprob { background-color: #d1e7dd; color: #0f5132; border: 1px solid #badbcc; }
          .c-parc { background-color: #fff3cd; color: #664d03; border: 1px solid #ffecb5; }
          .c-pend { background-color: #f8d7da; color: #842029; border: 1px solid #f5c2c7; }

          .heatmap-legend {
            text-align: center;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #dee2e6;
            font-size: 8.5px;
            color: #495057;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .legend-item {
            display: inline-block;
            margin: 0 8px;
          }
          .leg-box {
            width: 9px;
            height: 9px;
            border-radius: 2px;
            display: inline-block;
            margin-right: 3px;
            vertical-align: -1px;
          }

          .pdf-foot {
            text-align: center;
            font-size: 8px;
            color: #8c98a4;
            border-top: 1px solid #dee2e6;
            padding-top: 6px;
            margin-top: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>

        <!-- Encabezado con logos institucionales y títulos -->
        <div class="pdf-header">
          <div class="pdf-header-left">
            ${
              repojLogoBase64
                ? `<img src="${repojLogoBase64}" alt="Logo REPOJ" />`
                : `<span style="font-weight: 800; color: #39A900; font-size: 18px;">REPOJ</span>`
            }
          </div>
          <div class="pdf-header-center">
            <h1>Análisis de Juicios Evaluativos</h1>
            <div class="subtitle">REPOJ — Sistema de Análisis y Seguimiento de Fichas de Formación</div>
            <p class="date">Fecha de generación: ${escapeHtml(formattedDate)} | Generado por: ${escapeHtml(generatedBy)}</p>
          </div>
          <div class="pdf-header-right">
            ${SENA_LOGO_SVG}
          </div>
        </div>

        <!-- Información de la Ficha / Grupo -->
        <div class="group-box">
          <table class="group-table">
            <tr>
              <td>
                <div class="group-label">Ficha de Formación</div>
                <div class="group-value">${escapeHtml(group.number)}</div>
              </td>
              <td>
                <div class="group-label">Programa de Formación</div>
                <div class="group-value">${escapeHtml(group.program)}</div>
              </td>
              <td>
                <div class="group-label">Jornada</div>
                <div class="group-value">${escapeHtml(group.shift)}</div>
              </td>
              <td>
                <div class="group-label">Estado de Ficha</div>
                <div class="group-value">
                  <span class="badge-status">${escapeHtml(group.status)}</span>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- 6 Tarjetas de KPIs Superiores (calculados sobre aprendices activos) -->
        <table class="kpi-table">
          <tr>
            <td class="kpi-cell primary">
              <div class="kpi-val">${formatNumber(summary.totalApprentices)}</div>
              <div class="kpi-tit">Aprendices</div>
              <div class="kpi-sub">Total registrados</div>
            </td>
            <td class="kpi-cell secondary">
              <div class="kpi-val">${formatNumber(summary.totalJudgments)}</div>
              <div class="kpi-tit">Total Juicios</div>
              <div class="kpi-sub">Registros archivo</div>
            </td>
            <td class="kpi-cell success">
              <div class="kpi-val">${formatNumber(summary.approvedJudgments)}</div>
              <div class="kpi-tit">Aprobados</div>
              <div class="kpi-sub">Aprendices activos</div>
            </td>
            <td class="kpi-cell warning">
              <div class="kpi-val">${formatNumber(summary.pendingJudgments)}</div>
              <div class="kpi-tit">Por Evaluar</div>
              <div class="kpi-sub">Aprendices activos</div>
            </td>
            <td class="kpi-cell info">
              <div class="kpi-val">${summary.approvalPercentage.toFixed(1)}%</div>
              <div class="kpi-tit">% Aprobación</div>
              <div class="kpi-sub">Aprendices activos</div>
            </td>
            <td class="kpi-cell dark">
              <div class="kpi-val">${formatNumber(summary.totalCompetences)}</div>
              <div class="kpi-tit">Competencias</div>
              <div class="kpi-sub">Del programa</div>
            </td>
          </tr>
        </table>

        <!-- Card 1: Distribución de Aprendices por Estado -->
        <div class="section-wrap">
          <div class="section-head">
            <span>Distribución de Aprendices por Estado</span>
            <span style="font-size: 9px; color: #6c757d;">Total: ${formatNumber(summary.totalApprentices)} aprendices</span>
          </div>
          <div style="padding: 6px 8px;">
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 32%;">Estado</th>
                  <th style="width: 18%; text-align: center;">Cantidad</th>
                  <th style="width: 18%; text-align: center;">Porcentaje</th>
                  <th style="width: 32%;">Distribución Visual</th>
                </tr>
              </thead>
              <tbody>
                ${statusDistribution
                  .map((st) => {
                    const colors = getStatusColor(st.status)
                    return `
                    <tr>
                      <td>
                        <span class="tag-status" style="background-color: ${colors.bg}; color: ${colors.text};">
                          ${escapeHtml(st.status)}
                        </span>
                      </td>
                      <td style="text-align: center; font-weight: 700;">${formatNumber(st.count)}</td>
                      <td style="text-align: center; font-weight: 700;">${st.percentage.toFixed(1)}%</td>
                      <td>
                        <div class="bar-track">
                          <div class="bar-fill" style="width: ${st.percentage}%; background-color: ${colors.bar};"></div>
                        </div>
                      </td>
                    </tr>`
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Card 2: Matriz de Calor de Aprendices por Competencia -->
        <div class="section-wrap">
          <div class="section-head">
            <span>Matriz de Calor de Aprendices por Competencia</span>
            <span style="font-size: 9px; color: #6c757d;">${apprentices.length} Aprendices × ${competences.length} Competencias</span>
          </div>
          <div style="padding: 6px 6px;">
            <table class="heatmap-tbl">
              <thead>
                <tr>
                  <th style="text-align: left; width: 155px; min-width: 140px;">Aprendiz</th>
                  <th style="width: 70px;">Estado</th>
                  ${competences
                    .map(
                      (c) => `<th title="${escapeHtml(c.name)}" style="min-width: 26px;">${escapeHtml(c.shortCode)}</th>`
                    )
                    .join('')}
                </tr>
              </thead>
              <tbody>
                ${apprentices
                  .map((app) => {
                    const stColors = getStatusColor(app.status)
                    return `
                    <tr>
                      <td style="text-align: left; font-weight: 600;">
                        ${escapeHtml(app.name)}
                        <div style="font-size: 7.5px; color: #6c757d; font-weight: normal;">Doc: ${escapeHtml(app.document)}</div>
                      </td>
                      <td>
                        <span class="tag-status" style="background-color: ${stColors.bg}; color: ${stColors.text}; font-size: 7px;">
                          ${escapeHtml(app.status)}
                        </span>
                      </td>
                      ${competences
                        .map((c) => {
                          const cell = heatmap.matrix[app.document]?.[c.id] || {
                            status: 'POR_EVALUAR',
                            approved: 0,
                            total: 0,
                            percentage: 0
                          }
                          let cellClass = 'c-pend'
                          let label = '0%'
                          if (cell.status === 'APROBADO') {
                            cellClass = 'c-aprob'
                            label = '100%'
                          } else if (cell.status === 'PARCIAL') {
                            cellClass = 'c-parc'
                            label = `${cell.percentage.toFixed(0)}%`
                          }
                          return `<td><span class="c-box ${cellClass}">${label}</span></td>`
                        })
                        .join('')}
                    </tr>`
                  })
                  .join('')}
              </tbody>
            </table>

            <!-- Leyenda oficial de colores de la Matriz de Calor -->
            <div class="heatmap-legend">
              <div class="legend-item">
                <span class="leg-box c-aprob"></span>
                <span><strong>Aprobado (100%):</strong> Todos los RAPs aprobados</span>
              </div>
              <div class="legend-item">
                <span class="leg-box c-parc"></span>
                <span><strong>Parcial:</strong> RAPs en proceso</span>
              </div>
              <div class="legend-item">
                <span class="leg-box c-pend"></span>
                <span><strong>Por evaluar:</strong> Sin resultados aprobados</span>
              </div>
            </div>

            <!-- Glosario de Competencias en tabla de 2 columnas -->
            <div style="margin-top: 8px; border-top: 1px solid #e9ecef; padding-top: 6px;">
              <div style="font-size: 9.5px; font-weight: 700; color: #212529; margin-bottom: 4px;">
                Glosario de Competencias:
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  ${glossaryRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="pdf-foot">
          Reporte oficial generado por REPOJ | Servicio Nacional de Aprendizaje SENA | Ficha ${escapeHtml(group.number)}
        </div>
      </div>
    `

    // Crear elemento contenedor para html2pdf sin posicionamiento absoluto negativo
    // html2pdf crea su propio overlay oculto para procesar el DOM con html2canvas
    const element = document.createElement('div')
    element.innerHTML = htmlContent

    const filename = `Reporte_Analisis_Juicios_Ficha_${group.number}.pdf`

    const opt = {
      margin: [6, 6, 6, 6],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'letter',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['css', 'legacy']
      }
    }

    // Ejecutar pipeline de html2pdf directamente desde el elemento
    await html2pdf().set(opt).from(element).save()
  }
}

export default judgmentPdfReportService
