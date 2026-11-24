import { INDONESIAN_DAYS, INDONESIAN_MONTHS } from './constants'

export function toISODate(dateObj: Date): string {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysISO(isoStr: string, days: number): string {
  const [y, m, d] = isoStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return toISODate(dt)
}

export function formatIndonesianDate(isoStr: string, withDayName = false): string {
  if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return '-'
  const [y, m, d] = isoStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const base = `${d} ${INDONESIAN_MONTHS[m - 1]} ${y}`
  return withDayName ? `${INDONESIAN_DAYS[dt.getDay()]}, ${base}` : base
}

export const MONTH_NAME_MAP: Record<string, number> = {
  januari: 1,
  jan: 1,
  january: 1,
  februari: 2,
  feb: 2,
  pebruari: 2,
  february: 2,
  maret: 3,
  mar: 3,
  march: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  jun: 6,
  june: 6,
  juli: 7,
  jul: 7,
  july: 7,
  agustus: 8,
  agu: 8,
  ags: 8,
  aug: 8,
  august: 8,
  september: 9,
  sep: 9,
  sept: 9,
  oktober: 10,
  okt: 10,
  oct: 10,
  october: 10,
  november: 11,
  nov: 11,
  nopember: 11,
  desember: 12,
  des: 12,
  dec: 12,
  december: 12,
}

export function parseSingleDateISO(val: string | null | undefined): string | null {
  if (!val || typeof val !== 'string') return null
  const s = val.trim()

  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/)
  if (m) {
    const yr = Number(m[1])
    const mo = Number(m[2])
    const da = Number(m[3])
    if (yr >= 2020 && yr <= 2100 && mo >= 1 && mo <= 12 && da >= 1 && da <= 31) {
      return `${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`
    }
  }

  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s.*)?$/)
  if (m) {
    const da = Number(m[1])
    const mo = Number(m[2])
    const yr = Number(m[3])
    if (yr >= 2020 && yr <= 2100 && mo >= 1 && mo <= 12 && da >= 1 && da <= 31) {
      return `${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`
    }
  }

  m = s.match(/(?:[a-zA-Z]+,\s*)?(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/)
  if (m) {
    const da = Number(m[1])
    const mo = MONTH_NAME_MAP[m[2].toLowerCase()]
    const yr = Number(m[3])
    if (mo && yr >= 2020 && yr <= 2100 && da >= 1 && da <= 31) {
      return `${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`
    }
  }

  return null
}

export function expandDateRangeISO(startISO: string | null, endISO: string | null): string[] {
  if (!startISO || !endISO) return startISO ? [startISO] : endISO ? [endISO] : []
  if (endISO < startISO) return [startISO]
  const list: string[] = []
  let cur = startISO
  let guard = 0
  while (cur <= endISO && guard < 40) {
    list.push(cur)
    cur = addDaysISO(cur, 1)
    guard++
  }
  return list
}

export function parseDatesFromValue(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) {
    const acc: string[] = []
    for (const item of val) {
      acc.push(...parseDatesFromValue(item))
    }
    return [...new Set(acc)]
  }
  if (typeof val !== 'string') return []

  const single = parseSingleDateISO(val)
  if (single) return [single]

  let m = val.match(
    /(\d{1,2})\s*(?:-|–|s\/d|sd|sampai(?:\s+dengan)?)\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i,
  )
  if (m) {
    const d1 = Number(m[1])
    const d2 = Number(m[2])
    const mo = MONTH_NAME_MAP[m[3].toLowerCase()]
    const yr = Number(m[4])
    if (mo) {
      const s1 = `${yr}-${String(mo).padStart(2, '0')}-${String(d1).padStart(2, '0')}`
      const s2 = `${yr}-${String(mo).padStart(2, '0')}-${String(d2).padStart(2, '0')}`
      return expandDateRangeISO(s1, s2)
    }
  }

  const parts = val.split(/\s*(?:s\/d|sd|sampai(?:\s+dengan)?|\s-\s|–)\s*/i)
  if (parts.length === 2) {
    let dStart = parseSingleDateISO(parts[0])
    const dEnd = parseSingleDateISO(parts[1])
    if (!dStart && dEnd) {
      const yearSuffix = dEnd.slice(0, 4)
      dStart = parseSingleDateISO(`${parts[0].trim()} ${yearSuffix}`)
    }
    if (dStart && dEnd) return expandDateRangeISO(dStart, dEnd)
  }

  return []
}

export function getThreeDatesISO(startDateH1ISO: string): [string, string, string] {
  const h1 = startDateH1ISO || addDaysISO(toISODate(new Date()), 1)
  return [h1, addDaysISO(h1, 1), addDaysISO(h1, 2)]
}
