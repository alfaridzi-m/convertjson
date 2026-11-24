import type { Feature } from 'geojson'
import { PROVINCE_ALIASES } from './constants'

export function cleanProvinceKey(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return ''
  return raw
    .toLowerCase()
    .replace(/^provinsi\s+/i, '')
    .replace(/^propinsi\s+/i, '')
    .replace(/^prov\.?\s+/i, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const ALIAS_LOOKUP = (() => {
  const map = new Map<string, string>()
  for (const [canonical, aliases] of Object.entries(PROVINCE_ALIASES)) {
    map.set(cleanProvinceKey(canonical), canonical)
    for (const a of aliases) {
      map.set(cleanProvinceKey(a), canonical)
    }
  }
  return map
})()

export function matchCanonicalProvince(str: string | null | undefined): string | null {
  if (!str || typeof str !== 'string') return null
  const cleaned = cleanProvinceKey(str)
  if (!cleaned) return null
  if (ALIAS_LOOKUP.has(cleaned)) return ALIAS_LOOKUP.get(cleaned)!

  for (const [aliasKey, canonical] of ALIAS_LOOKUP.entries()) {
    if (aliasKey.length >= 4 && cleaned === aliasKey) {
      return canonical
    }
  }
  return null
}

export function getFeatureProvinceName(feature: Feature): string | null {
  if (!feature || !feature.properties) return null
  const props = feature.properties as Record<string, unknown>
  const candidateKeys = [
    'provinsi',
    'Provinsi',
    'PROVINSI',
    'Propinsi',
    'PROPINSI',
    'propinsi',
    'WADMPR',
    'wadmpr',
    'NAME_1',
    'name',
    'NAME',
    'nama',
    'NAMA',
    'nama_prov',
    'NAMA_PROV',
    'prov_name',
    'state',
    'prov',
  ]
  for (const k of candidateKeys) {
    if (props[k] && typeof props[k] === 'string') {
      const matched = matchCanonicalProvince(props[k] as string)
      if (matched) return matched
      return (props[k] as string).trim()
    }
  }
  for (const val of Object.values(props)) {
    if (typeof val === 'string') {
      const matched = matchCanonicalProvince(val)
      if (matched) return matched
    }
  }
  return null
}

export function formatPesisirItem(name: string, autoPrefix: boolean): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  if (!autoPrefix) return trimmed
  const hasPrefix =
    /^(pesisir|pantai|perairan|kepulauan|kep\.|pulau|teluk|muara|pelabuhan|kecamatan|kec\.|kota|kab\.|kabupaten)\b/i.test(
      trimmed,
    )
  return hasPrefix ? trimmed : `Pesisir ${trimmed}`
}
