import {
  expandDateRangeISO,
  parseDatesFromValue,
} from './dates'
import { matchCanonicalProvince } from './provinces'
import type { NormalizedByDate } from './types'

type TraverseCtx = {
  dates: string[]
  prov: string | null
  kab: string
}

export function parseBanjirRobJSON(raw: unknown): NormalizedByDate {
  const result: Record<string, Record<string, Record<string, Set<string>>>> = {}

  function recordEntry(
    dates: string[],
    prov: string,
    kab: string,
    pesisirItems: unknown,
  ) {
    if (!prov || !dates || dates.length === 0) return
    const canonicalProv = matchCanonicalProvince(prov) || prov.trim()
    const cleanKab = (kab || '').toString().trim().replace(/:$/, '')

    const items: string[] = []
    const rawArr = Array.isArray(pesisirItems) ? pesisirItems : [pesisirItems]
    for (const rawItem of rawArr) {
      if (!rawItem) continue
      if (typeof rawItem === 'string') {
        if (!cleanKab && rawItem.includes(':')) {
          const idx = rawItem.indexOf(':')
          const subKab = rawItem.slice(0, idx).trim()
          const subPes = rawItem
            .slice(idx + 1)
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
          recordEntry(dates, canonicalProv, subKab, subPes)
          continue
        }
        const splitComma = rawItem
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        items.push(...splitComma)
      } else if (typeof rawItem === 'object') {
        const obj = rawItem as Record<string, unknown>
        const nameCandidate =
          obj.pesisir ||
          obj.kecamatan ||
          obj.nama_kecamatan ||
          obj.nama ||
          obj.lokasi ||
          obj.wilayah ||
          obj.area
        if (nameCandidate) {
          items.push(
            ...(Array.isArray(nameCandidate)
              ? nameCandidate.map(String)
              : [String(nameCandidate)]),
          )
        }
      }
    }

    for (const dt of dates) {
      if (!result[dt]) result[dt] = {}
      if (!result[dt][canonicalProv]) result[dt][canonicalProv] = {}
      const kabKey = cleanKab || '_umum_'
      if (!result[dt][canonicalProv][kabKey]) {
        result[dt][canonicalProv][kabKey] = new Set()
      }
      for (const p of items) {
        if (p) result[dt][canonicalProv][kabKey].add(p)
      }
    }
  }

  const IGNORE_META_KEYS = new Set([
    'updated',
    'updated_at',
    'created_at',
    'issued',
    'issued_at',
    'generated_at',
    'last_update',
    'timestamp',
    'waktu_buat',
    'tgl_rilis',
  ])

  const START_KEYS = [
    'tgl_awal',
    'tanggal_awal',
    'tgl_mulai',
    'tanggal_mulai',
    'berlaku_awal',
    'waktu_awal',
    'start_date',
    'date_start',
    'date_from',
    'valid_from',
    'valid_start',
    'mulai',
    'awal',
    'dari',
    'start',
    'from',
  ]
  const END_KEYS = [
    'tgl_akhir',
    'tanggal_akhir',
    'tgl_selesai',
    'tanggal_selesai',
    'berlaku_akhir',
    'waktu_akhir',
    'end_date',
    'date_end',
    'date_to',
    'valid_to',
    'valid_end',
    'sampai',
    'akhir',
    'selesai',
    'berakhir',
    'end',
    'to',
  ]
  const SINGLE_DATE_KEYS = [
    'tanggal',
    'tgl',
    'date',
    'dates',
    'periode',
    'valid_date',
    'berlaku',
    'jadwal',
    'hari',
  ]
  const PROV_KEYS = [
    'provinsi',
    'nama_provinsi',
    'prov',
    'propinsi',
    'province',
    'wadmpr',
    'nama_prov',
    'wilayah_provinsi',
  ]
  const KAB_KEYS = [
    'kabupaten',
    'kabkot',
    'kab_kota',
    'kota',
    'nama_kabkot',
    'nama_kabupaten',
    'nama_kota',
    'kab',
    'regency',
    'wadmkk',
  ]
  const PESISIR_KEYS = [
    'pesisir',
    'kecamatan',
    'nama_kecamatan',
    'kec',
    'lokasi',
    'daerah',
    'area',
    'pantai',
    'list_pesisir',
    'list_kecamatan',
    'daftar_pesisir',
    'wadmkc',
    'detail_wilayah',
  ]

  function traverse(node: unknown, ctx: TraverseCtx) {
    if (!node) return

    if (Array.isArray(node)) {
      for (const item of node) {
        if (typeof item === 'string' && ctx.prov && ctx.dates.length > 0) {
          recordEntry(ctx.dates, ctx.prov, ctx.kab, item)
        } else {
          traverse(item, ctx)
        }
      }
      return
    }

    if (typeof node !== 'object') {
      if (typeof node === 'string' && ctx.prov && ctx.dates.length > 0) {
        recordEntry(ctx.dates, ctx.prov, ctx.kab, node)
      }
      return
    }

    const obj = node as Record<string, unknown>

    if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
      traverse(obj.features, ctx)
      return
    }
    if (obj.type === 'Feature' && obj.properties) {
      traverse(obj.properties, ctx)
      return
    }

    const nextCtx: TraverseCtx = {
      dates: [...ctx.dates],
      prov: ctx.prov,
      kab: ctx.kab,
    }

    let dStart: string | null = null
    let dEnd: string | null = null
    for (const k of START_KEYS) {
      if (obj[k]) {
        const parsed = parseDatesFromValue(obj[k])
        if (parsed.length) {
          dStart = parsed[0]
          break
        }
      }
    }
    for (const k of END_KEYS) {
      if (obj[k]) {
        const parsed = parseDatesFromValue(obj[k])
        if (parsed.length) {
          dEnd = parsed[parsed.length - 1]
          break
        }
      }
    }
    if (dStart || dEnd) {
      nextCtx.dates = expandDateRangeISO(dStart || dEnd, dEnd || dStart)
    }

    for (const k of SINGLE_DATE_KEYS) {
      if (obj[k] !== undefined) {
        const parsed = parseDatesFromValue(obj[k])
        if (parsed.length) nextCtx.dates = parsed
      }
    }

    for (const k of PROV_KEYS) {
      if (typeof obj[k] === 'string' && (obj[k] as string).trim()) {
        nextCtx.prov =
          matchCanonicalProvince(obj[k] as string) || (obj[k] as string).trim()
        break
      }
    }

    let foundExplicitKab = false
    for (const k of KAB_KEYS) {
      if (typeof obj[k] === 'string' && (obj[k] as string).trim()) {
        nextCtx.kab = (obj[k] as string).trim()
        foundExplicitKab = true
        break
      }
    }

    let consumedLeafPesisir = false
    for (const k of PESISIR_KEYS) {
      if (obj[k] !== undefined && obj[k] !== null) {
        const val = obj[k]
        if (
          typeof val === 'string' ||
          (Array.isArray(val) && val.every((x) => typeof x === 'string'))
        ) {
          if (nextCtx.prov && nextCtx.dates.length > 0) {
            recordEntry(nextCtx.dates, nextCtx.prov, nextCtx.kab, val)
            consumedLeafPesisir = true
          }
        }
      }
    }

    if (!consumedLeafPesisir && obj.wilayah !== undefined) {
      if (
        typeof obj.wilayah === 'string' ||
        (Array.isArray(obj.wilayah) &&
          obj.wilayah.every((x) => typeof x === 'string'))
      ) {
        if (nextCtx.prov && nextCtx.dates.length > 0) {
          recordEntry(nextCtx.dates, nextCtx.prov, nextCtx.kab, obj.wilayah)
          consumedLeafPesisir = true
        }
      }
    }

    if (
      nextCtx.prov &&
      nextCtx.dates.length > 0 &&
      foundExplicitKab &&
      !consumedLeafPesisir
    ) {
      const hasNestedObjects = Object.values(obj).some(
        (v) => v && typeof v === 'object',
      )
      if (!hasNestedObjects) {
        recordEntry(nextCtx.dates, nextCtx.prov, nextCtx.kab, [])
      }
    }

    for (const [key, val] of Object.entries(obj)) {
      if (IGNORE_META_KEYS.has(key.toLowerCase())) continue
      if (val === null || val === undefined) continue
      if (PESISIR_KEYS.includes(key) && consumedLeafPesisir) continue

      const keyDates = parseDatesFromValue(key)
      const keyProv = matchCanonicalProvince(key)

      if (keyDates.length > 0) {
        traverse(val, { ...nextCtx, dates: keyDates })
      } else if (keyProv) {
        if (typeof val !== 'object' && nextCtx.dates.length > 0) {
          recordEntry(
            nextCtx.dates,
            keyProv,
            '',
            typeof val === 'string' ? val : [],
          )
        } else {
          traverse(val, { ...nextCtx, prov: keyProv, kab: '' })
        }
      } else if (
        nextCtx.prov &&
        !foundExplicitKab &&
        (Array.isArray(val) || typeof val === 'object' || typeof val === 'string')
      ) {
        const reservedContainerKeys = new Set([
          'data',
          'wilayah',
          'detail',
          'items',
          'list',
          'result',
          'results',
          'features',
          'jadwal',
          'rob',
          'banjirrob',
        ])
        if (
          !reservedContainerKeys.has(key.toLowerCase()) &&
          !SINGLE_DATE_KEYS.includes(key.toLowerCase()) &&
          !PROV_KEYS.includes(key.toLowerCase())
        ) {
          if (
            Array.isArray(val) &&
            val.every((x) => typeof x === 'string') &&
            nextCtx.dates.length > 0
          ) {
            recordEntry(nextCtx.dates, nextCtx.prov, key, val)
          } else if (
            typeof val === 'string' &&
            nextCtx.dates.length > 0 &&
            !START_KEYS.includes(key) &&
            !END_KEYS.includes(key)
          ) {
            const metaSkip = new Set([
              'id',
              'kode',
              'status',
              'level',
              'kategori',
              'warna',
              'color',
              'upt',
              'stasiun',
              'nomor',
              'catatan',
              'keterangan',
            ])
            if (!metaSkip.has(key.toLowerCase())) {
              recordEntry(nextCtx.dates, nextCtx.prov, key, val)
            }
          } else if (typeof val === 'object') {
            traverse(val, { ...nextCtx, kab: key })
          }
        } else {
          traverse(val, nextCtx)
        }
      } else if (typeof val === 'object') {
        traverse(val, nextCtx)
      }
    }
  }

  traverse(raw, { dates: [], prov: null, kab: '' })

  const finalNormalized: NormalizedByDate = {}
  for (const dt of Object.keys(result).sort()) {
    finalNormalized[dt] = {}
    for (const prov of Object.keys(result[dt])) {
      finalNormalized[dt][prov] = {}
      for (const [kab, setItems] of Object.entries(result[dt][prov])) {
        finalNormalized[dt][prov][kab] = Array.from(setItems)
      }
    }
  }
  return finalNormalized
}
