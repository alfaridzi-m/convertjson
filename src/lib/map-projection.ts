import { MAP_BOUNDS } from './constants'

export function mercatorX(lon: number): number {
  return (lon + 180) / 360
}

export function mercatorY(lat: number): number {
  const clamped = Math.max(-85, Math.min(85, lat))
  const rad = (clamped * Math.PI) / 180
  return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2
}

export interface Projector {
  minX: number
  maxX: number
  minY: number
  maxY: number
  scale: number
  offsetX: number
  offsetY: number
  project(lon: number, lat: number): [number, number]
}

export function createProjector(width: number, height: number): Projector {
  const minX = mercatorX(MAP_BOUNDS.minLon)
  const maxX = mercatorX(MAP_BOUNDS.maxLon)
  const minY = mercatorY(MAP_BOUNDS.maxLat)
  const maxY = mercatorY(MAP_BOUNDS.minLat)

  const spanX = maxX - minX
  const spanY = maxY - minY
  const scale = Math.min(width / spanX, height / spanY)
  const offsetX = (width - spanX * scale) / 2
  const offsetY = (height - spanY * scale) / 2

  return {
    minX,
    maxX,
    minY,
    maxY,
    scale,
    offsetX,
    offsetY,
    project(lon: number, lat: number) {
      return [
        (mercatorX(lon) - minX) * scale + offsetX,
        (mercatorY(lat) - minY) * scale + offsetY,
      ]
    },
  }
}

export function computeLargestRingCentroid(
  geometry: GeoJSON.Geometry | null | undefined,
): [number, number] | null {
  if (!geometry) return null
  const rings: number[][][] = []
  if (geometry.type === 'Polygon' && geometry.coordinates.length > 0) {
    rings.push(geometry.coordinates[0])
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      if (poly && poly.length > 0) rings.push(poly[0])
    }
  }
  if (rings.length === 0) return null

  let bestCentroid: [number, number] | null = null
  let maxAbsArea = -1

  for (const ring of rings) {
    let area = 0
    let cx = 0
    let cy = 0
    for (let i = 0, len = ring.length; i < len - 1; i++) {
      const [x0, y0] = ring[i]
      const [x1, y1] = ring[i + 1]
      const cross = x0 * y1 - x1 * y0
      area += cross
      cx += (x0 + x1) * cross
      cy += (y0 + y1) * cross
    }
    const absArea = Math.abs(area / 2)
    if (absArea > maxAbsArea && absArea > 0) {
      maxAbsArea = absArea
      bestCentroid = [cx / (3 * area), cy / (3 * area)]
    }
  }

  if (!bestCentroid) {
    const r0 = rings[0]
    const sum = r0.reduce(
      (acc, pt) => [acc[0] + pt[0], acc[1] + pt[1]] as [number, number],
      [0, 0] as [number, number],
    )
    return [sum[0] / r0.length, sum[1] / r0.length]
  }
  return bestCentroid
}
