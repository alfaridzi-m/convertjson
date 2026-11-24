import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { OFFICIAL_HIMBAUAN } from './constants'
import { formatIndonesianDate } from './dates'
import { loadLogoPngDataUrl } from './draw-logo'
import { buildThreeDayTableData } from './table-data'
import type { NormalizedByDate } from './types'

export interface GeneratePdfOptions {
  docNumber: string
  signCity: string
  signUnit: string
  baseDateISO: string
  startDateH1ISO: string
  normalizedByDate: NormalizedByDate
  mapCanvases: (HTMLCanvasElement | null)[]
}

export async function generateOfficialPDF(opts: GeneratePdfOptions): Promise<string> {
  const {
    docNumber,
    signCity,
    signUnit,
    baseDateISO,
    startDateH1ISO,
    normalizedByDate,
    mapCanvases,
  } = opts

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const marginX = 14
  const contentW = pageW - marginX * 2
  const { dates, rows } = buildThreeDayTableData(startDateH1ISO, normalizedByDate)

  // Kop surat: gray band full page width (matches the 123px A4 preview)
  const px = pageW / 794
  const kopH = 123 * px
  doc.setFillColor(169, 169, 169)
  doc.rect(0, 0, pageW, kopH, 'F')

  try {
    const logo = await loadLogoPngDataUrl(400)
    const logoH = 86 * px
    const logoW = logoH * (logo.width / logo.height)
    doc.addImage(logo.dataUrl, 'PNG', 42 * px, 13 * px, logoW, logoH)
  } catch {
    // continue without logo if SVG fails to rasterize
  }

  const textCenterX = 450 * px

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16.1)
  doc.setTextColor(0, 0, 0)
  doc.text(
    'THE AGENCY FOR METEOROLOGY, CLIMATOLOGY, AND',
    textCenterX,
    9.0,
    { align: 'center' },
  )
  doc.text(
    'GEOPHYSICS OF THE REPUBLIC OF INDONESIA (BMKG)',
    textCenterX,
    16.4,
    { align: 'center' },
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.1)
  doc.text(
    'Jl. Angkasa I No. 2, Jakarta 10610 Telp : (021) 4246321 Fax : (021) 4246703',
    textCenterX,
    21.2,
    { align: 'center' },
  )

  const websitePrefix = 'P. O. BOX 3540 JKT, Website : '
  const websiteUrl = 'http://www.bmkg.go.id'
  const prefixW = doc.getTextWidth(websitePrefix)
  const urlW = doc.getTextWidth(websiteUrl)
  const lineStartX = textCenterX - (prefixW + urlW) / 2
  doc.setTextColor(0, 0, 0)
  doc.text(websitePrefix, lineStartX, 25.1)
  doc.setTextColor(0, 0, 255)
  doc.text(websiteUrl, lineStartX + prefixW, 25.1)
  doc.setTextColor(0, 0, 0)

  // Thin rule, gray gap, thicker rule — sitting on the gray band
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.26)
  doc.line(0, 118.5 * px, pageW, 118.5 * px)
  doc.setLineWidth(0.7)
  doc.line(0, 121 * px, pageW, 121 * px)

  let curY = kopH + 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('INFORMASI POTENSI BANJIR PESISIR (ROB)', pageW / 2, curY, {
    align: 'center',
  })

  curY += 4.6
  doc.setFontSize(10)
  doc.text('Wilayah Indonesia', pageW / 2, curY, { align: 'center' })

  const docNo = docNumber.trim()
  curY += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(docNo ? `No: ${docNo}` : 'No:', pageW / 2, curY, { align: 'center' })

  curY += 4.5
  doc.setFont('helvetica', 'bold')
  doc.text(
    `Berlaku Tanggal ${formatIndonesianDate(dates[0], false)} - ${formatIndonesianDate(dates[2], false)}`,
    pageW / 2,
    curY,
    { align: 'center' },
  )

  curY += 3.5
  const mapW = contentW
  const mapH = 68

  for (let i = 0; i < 3; i++) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(30, 30, 30)
    doc.text(
      `Tanggal H+${i + 1} — ${formatIndonesianDate(dates[i], false)}`,
      marginX,
      curY,
    )
    curY += 3.2

    const cnv = mapCanvases[i]
    if (cnv) {
      const imgData = cnv.toDataURL('image/jpeg', 0.94)
      doc.addImage(imgData, 'JPEG', marginX, curY, mapW, mapH)
    }
    doc.setDrawColor(180, 190, 200)
    doc.setLineWidth(0.25)
    doc.rect(marginX, curY, mapW, mapH)
    curY += mapH + 3.2
  }

  doc.addPage()

  const tableHead = [
    [
      'Provinsi',
      formatIndonesianDate(dates[0], false),
      formatIndonesianDate(dates[1], false),
      formatIndonesianDate(dates[2], false),
    ],
  ]

  const rowKabPrefixes = rows.map((r) => {
    const prefixes = new Set<string>()
    r.cells.forEach((lines) => {
      ;(lines || []).forEach((line) => {
        const idx = line.indexOf(':')
        if (idx > 0) prefixes.add(line.slice(0, idx + 1))
      })
    })
    return prefixes
  })

  const hasDataRows = rows.length > 0
  const tableBody = hasDataRows
    ? rows.map((r) => [
        r.prov,
        r.cells[0].join('\n\n'),
        r.cells[1].join('\n\n'),
        r.cells[2].join('\n\n'),
      ])
    : [
        [
          {
            content: `Tidak terdapat potensi banjir pesisir (rob) pada periode ${formatIndonesianDate(dates[0], false)} - ${formatIndonesianDate(dates[2], false)}.`,
            colSpan: 4,
            styles: {
              halign: 'center' as const,
              fontStyle: 'italic' as const,
              textColor: [107, 114, 128] as [number, number, number],
            },
          },
        ],
      ]

  doc.setLineHeightFactor(1.35)

  autoTable(doc, {
    startY: 16,
    margin: { left: marginX, right: marginX, bottom: 20 },
    head: tableHead,
    body: tableBody as never,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.3,
      cellPadding: { top: 3.2, right: 4.2, bottom: 3.2, left: 3.4 },
      textColor: [55, 65, 81],
      fillColor: [255, 255, 255],
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
      valign: 'top',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [213, 115, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.8,
      halign: 'left',
      valign: 'middle',
      lineWidth: 0,
      cellPadding: { top: 3.2, right: 3.4, bottom: 3.2, left: 3.4 },
    },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold', textColor: [198, 93, 12] },
      1: { cellWidth: (contentW - 30) / 3 },
      2: { cellWidth: (contentW - 30) / 3 },
      3: { cellWidth: (contentW - 30) / 3 },
    },
    willDrawCell(data) {
      if (data.section === 'body' && hasDataRows) {
        const cell = data.cell as typeof data.cell & { _customLines?: string[] }
        cell._customLines = Array.isArray(data.cell.text)
          ? [...data.cell.text]
          : []
        data.cell.text = []
      }
    },
    didDrawCell(data) {
      if (
        data.section === 'head' &&
        (data.column.index === 0 || data.column.index === 3)
      ) {
        doc.setFillColor(255, 255, 255)
        if (data.column.index === 0) {
          doc.triangle(
            data.cell.x,
            data.cell.y,
            data.cell.x + 1.4,
            data.cell.y,
            data.cell.x,
            data.cell.y + 1.4,
            'F',
          )
        } else {
          const rx = data.cell.x + data.cell.width
          doc.triangle(
            rx,
            data.cell.y,
            rx - 1.4,
            data.cell.y,
            rx,
            data.cell.y + 1.4,
            'F',
          )
        }
      }

      if (data.section !== 'body' || !hasDataRows) return
      const cell = data.cell as typeof data.cell & { _customLines?: string[] }
      const lines = cell._customLines || []
      if (lines.length === 0) return

      const padLeft = 3.4
      const padTop = 3.2
      const fontSizePt = data.cell.styles.fontSize || 8.3
      const fontSizeMm = fontSizePt * (25.4 / 72)
      const lineStep = fontSizeMm * 1.35

      const startX = data.cell.x + padLeft
      let curTextY = data.cell.y + padTop + fontSizeMm * 0.82

      if (data.column.index === 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(fontSizePt)
        doc.setTextColor(198, 93, 12)
        doc.setDrawColor(198, 93, 12)
        doc.setLineWidth(0.22)

        for (const line of lines) {
          if (!line) continue
          doc.text(line, startX, curTextY)
          const tw = doc.getTextWidth(line)
          doc.line(startX, curTextY + 0.65, startX + tw, curTextY + 0.65)
          curTextY += lineStep
        }
      } else {
        const prefixes = rowKabPrefixes[data.row.index] || new Set<string>()
        doc.setFontSize(fontSizePt)

        for (const line of lines) {
          if (line.trim() === '') {
            curTextY += lineStep * 0.52
            continue
          }

          let matchedPrefix: string | null = null
          const colonIdx = line.indexOf(':')
          if (colonIdx > 0) {
            const candidate = line.slice(0, colonIdx + 1)
            if (prefixes.has(candidate)) {
              matchedPrefix = candidate
            }
          }

          if (matchedPrefix) {
            const restText = line.slice(matchedPrefix.length)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(17, 24, 39)
            doc.text(matchedPrefix, startX, curTextY)
            const prefixW = doc.getTextWidth(matchedPrefix)

            if (restText) {
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(55, 65, 81)
              doc.text(restText, startX + prefixW, curTextY)
            }
          } else {
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(55, 65, 81)
            doc.text(line, startX, curTextY)
          }

          curTextY += lineStep
        }
      }
    },
  })

  doc.setLineHeightFactor(1.15)

  const lastAutoTable = (
    doc as unknown as { lastAutoTable?: { finalY: number } }
  ).lastAutoTable
  let afterTableY = (lastAutoTable?.finalY ?? 40) + 8

  const [p1, p2, p3] = OFFICIAL_HIMBAUAN

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(0, 0, 0)

  const lines1 = doc.splitTextToSize(p1, contentW) as string[]
  const lines2 = doc.splitTextToSize(p2, contentW) as string[]
  const lines3 = doc.splitTextToSize(p3, contentW) as string[]

  const neededHeight =
    (lines1.length + lines2.length + lines3.length) * 4.6 + 38
  if (afterTableY + neededHeight > pageH - 18) {
    doc.addPage()
    afterTableY = 20
  }

  const writeParagraph = (linesArr: string[]) => {
    if (!linesArr.length) return
    doc.text(linesArr, marginX, afterTableY, {
      maxWidth: contentW,
      align: 'justify',
    })
    afterTableY += linesArr.length * 4.5 + 3.5
  }

  writeParagraph(lines1)
  writeParagraph(lines2)
  writeParagraph(lines3)

  afterTableY += 5
  const signX = pageW - marginX - 62
  const city = signCity.trim() || 'Jakarta'
  const unit = signUnit.trim() || 'Direktorat Meteorologi Maritim'

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.text(
    `${city}, ${formatIndonesianDate(baseDateISO, false)}`,
    signX,
    afterTableY,
  )
  afterTableY += 5
  doc.setFont('helvetica', 'bold')
  doc.text(unit, signX, afterTableY)

  const totalPages = doc.getNumberOfPages()
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(75, 85, 99)
    doc.text(`- ${p} -`, pageW / 2, pageH - 10, { align: 'center' })
  }

  const fileName = `Informasi_Potensi_Banjir_Pesisir_BMKG_${dates[0]}_sd_${dates[2]}.pdf`
  doc.save(fileName)
  return fileName
}
