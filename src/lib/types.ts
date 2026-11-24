import type { FeatureCollection } from 'geojson'

export type NormalizedByDate = Record<
  string,
  Record<string, Record<string, string[]>>
>

export interface HitBox {
  prov: string
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface PreparedFeature {
  provName: string | null
  path: Path2D
  minBx: number
  minBy: number
  maxBx: number
  maxBy: number
  boxArea: number
  centroidXY: [number, number] | null
}

export interface TableRow {
  prov: string
  cells: string[][]
}

export interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export type GeoJsonData = FeatureCollection

export interface AppState {
  geoJson: GeoJsonData | null
  geoSourceLabel: string
  rawRobJson: unknown
  robSourceLabel: string
  normalizedByDate: NormalizedByDate
  baseDateISO: string
  startDateH1ISO: string
  selectedProvPerCanvas: [string | null, string | null, string | null]
  canvasHitBoxes: [HitBox[], HitBox[], HitBox[]]
  preparedFeatures: PreparedFeature[]
  esriTilesCache: Record<string, HTMLImageElement>
  esriReady: boolean
  zoomLevel: number
  status: 'idle' | 'loading' | 'ready' | 'error'
  loading: boolean
}
