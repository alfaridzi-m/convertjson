import { getThreeDatesISO } from './dates'
import { formatPesisirItem } from './provinces'
import type { NormalizedByDate, TableRow } from './types'

export function buildThreeDayTableData(
  startDateH1ISO: string,
  normalizedByDate: NormalizedByDate,
): { dates: [string, string, string]; rows: TableRow[] } {
  const dates = getThreeDatesISO(startDateH1ISO)
  const autoPrefix = true

  const provSet = new Set<string>()
  for (const dt of dates) {
    const dayObj = normalizedByDate[dt] || {}
    for (const p of Object.keys(dayObj)) {
      provSet.add(p)
    }
  }

  const rows: TableRow[] = []
  for (const prov of provSet) {
    const cells = dates.map((dt) => {
      const provData = (normalizedByDate[dt] || {})[prov]
      if (!provData) return []
      const lines: string[] = []
      for (const [kab, pesArr] of Object.entries(provData)) {
        const formattedPes = (pesArr || [])
          .map((item) => formatPesisirItem(item, autoPrefix))
          .filter(Boolean)

        if (kab === '_umum_' || !kab) {
          if (formattedPes.length > 0) lines.push(formattedPes.join(', '))
        } else if (formattedPes.length > 0) {
          lines.push(`${kab}: ${formattedPes.join(', ')}`)
        } else {
          lines.push(kab)
        }
      }
      return lines
    })

    rows.push({ prov, cells })
  }
  return { dates, rows }
}
