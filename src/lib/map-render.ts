import { formatIndonesianDate } from './dates'
import { createProjector, computeLargestRingCentroid } from './map-projection'
import { getFeatureProvinceName } from './provinces'
import type {
  GeoJsonData,
  HitBox,
  NormalizedByDate,
  PreparedFeature,
} from './types'

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function drawWarningBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  ctx.save()
  const half = size * 0.56
  const topY = y - size * 0.58
  const botY = y + size * 0.42

  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 7
  ctx.shadowOffsetY = 2

  ctx.beginPath()
  ctx.moveTo(x, topY)
  ctx.lineTo(x + half, botY)
  ctx.lineTo(x - half, botY)
  ctx.closePath()

  const grad = ctx.createLinearGradient(x, topY, x, botY)
  grad.addColorStop(0, '#fbbf24')
  grad.addColorStop(1, '#ea580c')
  ctx.fillStyle = grad
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.lineWidth = Math.max(2, size * 0.08)
  ctx.strokeStyle = '#7c2d12'
  ctx.lineJoin = 'round'
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = `900 ${Math.round(size * 0.54)}px Inter, Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('!', x, y + size * 0.04)

  ctx.restore()
}

export function prepareGeoFeatures(geoJson: GeoJsonData | null): PreparedFeature[] {
  const prepared: PreparedFeature[] = []
  if (!geoJson || !Array.isArray(geoJson.features)) return prepared

  const proj = createProjector(1400, 545)

  for (const feature of geoJson.features) {
    const geom = feature.geometry
    if (!geom || geom.type === 'GeometryCollection') continue

    const provName = getFeatureProvinceName(feature)
    const polys =
      geom.type === 'Polygon'
        ? [geom.coordinates]
        : geom.type === 'MultiPolygon'
          ? geom.coordinates
          : []

    const path = new Path2D()
    let minBx = Infinity
    let minBy = Infinity
    let maxBx = -Infinity
    let maxBy = -Infinity

    for (const poly of polys) {
      for (const ring of poly) {
        if (!ring || ring.length === 0) continue
        let lastPx = -9999
        let lastPy = -9999
        for (let i = 0; i < ring.length; i++) {
          const [px, py] = proj.project(ring[i][0], ring[i][1])
          if (i === 0) {
            path.moveTo(px, py)
            lastPx = px
            lastPy = py
          } else if (
            i === ring.length - 1 ||
            Math.abs(px - lastPx) > 0.45 ||
            Math.abs(py - lastPy) > 0.45
          ) {
            path.lineTo(px, py)
            lastPx = px
            lastPy = py
          }

          if (px < minBx) minBx = px
          if (py < minBy) minBy = py
          if (px > maxBx) maxBx = px
          if (py > maxBy) maxBy = py
        }
        path.closePath()
      }
    }

    let centroidXY: [number, number] | null = null
    const cLonLat = computeLargestRingCentroid(geom)
    if (cLonLat) {
      centroidXY = proj.project(cLonLat[0], cLonLat[1])
    }

    prepared.push({
      provName,
      path,
      minBx,
      minBy,
      maxBx,
      maxBy,
      boxArea: minBx < Infinity ? (maxBx - minBx) * (maxBy - minBy) : 0,
      centroidXY,
    })
  }
  return prepared
}

export function preloadEsriSatelliteTiles(
  esriTilesCache: Record<string, HTMLImageElement>,
  onTileLoaded: () => void,
) {
  const W = 1400
  const H = 545
  const proj = createProjector(W, H)
  const z = 5
  const n = Math.pow(2, z)

  const viewMinX = proj.minX - proj.offsetX / proj.scale
  const viewMaxX = proj.minX + (W - proj.offsetX) / proj.scale
  const viewMinY = proj.minY - proj.offsetY / proj.scale
  const viewMaxY = proj.minY + (H - proj.offsetY) / proj.scale

  const txStart = Math.max(0, Math.floor(viewMinX * n))
  const txEnd = Math.min(n - 1, Math.floor(viewMaxX * n))
  const tyStart = Math.max(0, Math.floor(viewMinY * n))
  const tyEnd = Math.min(n - 1, Math.floor(viewMaxY * n))

  for (let ty = tyStart; ty <= tyEnd; ty++) {
    for (let tx = txStart; tx <= txEnd; tx++) {
      const key = `${z}/${ty}/${tx}`
      if (esriTilesCache[key]) continue
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        esriTilesCache[key] = img
        onTileLoaded()
      }
      img.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${ty}/${tx}`
    }
  }
}

export interface MapRenderContext {
  canvas: HTMLCanvasElement
  dateISO: string
  dayIndex: number
  normalizedByDate: NormalizedByDate
  preparedFeatures: PreparedFeature[]
  selectedProv: string | null
  esriTilesCache: Record<string, HTMLImageElement>
}

export function renderSingleMapCanvas(ctxIn: MapRenderContext): HitBox[] {
  const {
    canvas,
    dateISO,
    dayIndex: _dayIndex,
    normalizedByDate,
    preparedFeatures,
    selectedProv,
    esriTilesCache,
  } = ctxIn
  void _dayIndex

  const ctx = canvas.getContext('2d')
  if (!ctx) return []
  const W = canvas.width
  const H = canvas.height
  const proj = createProjector(W, H)

  ctx.clearRect(0, 0, W, H)

  const oceanGrad = ctx.createLinearGradient(0, 0, 0, H)
  oceanGrad.addColorStop(0, '#063d5c')
  oceanGrad.addColorStop(0.55, '#07486b')
  oceanGrad.addColorStop(1, '#032942')
  ctx.fillStyle = oceanGrad
  ctx.fillRect(0, 0, W, H)

  let drewSatellite = false
  if (Object.keys(esriTilesCache).length > 0) {
    const z = 5
    const n = Math.pow(2, z)
    for (const [key, img] of Object.entries(esriTilesCache)) {
      const [, tyStr, txStr] = key.split('/')
      const tx = Number(txStr)
      const ty = Number(tyStr)
      const x0 = (tx / n - proj.minX) * proj.scale + proj.offsetX
      const y0 = (ty / n - proj.minY) * proj.scale + proj.offsetY
      const tileSize = (1 / n) * proj.scale
      try {
        ctx.drawImage(img, x0, y0, tileSize + 0.8, tileSize + 0.8)
        drewSatellite = true
      } catch {
        // ignore
      }
    }
  }

  if (!drewSatellite) {
    ctx.strokeStyle = 'rgba(148, 210, 245, 0.10)'
    ctx.lineWidth = 1
    for (let lon = 95; lon <= 140; lon += 5) {
      const [gx] = proj.project(lon, 0)
      ctx.beginPath()
      ctx.moveTo(gx, 0)
      ctx.lineTo(gx, H)
      ctx.stroke()
    }
    for (let lat = -10; lat <= 5; lat += 5) {
      const [, gy] = proj.project(115, lat)
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.lineTo(W, gy)
      ctx.stroke()
    }
  }

  const dayEvents = normalizedByDate[dateISO] || {}
  const affectedProvs = new Set(Object.keys(dayEvents))
  const hitBoxes: HitBox[] = []
  const warningCentroids = new Map<
    string,
    { x: number; y: number; areaWeight: number }
  >()

  for (const item of preparedFeatures) {
    const provName = item.provName
    const isAffected = !!(provName && affectedProvs.has(provName))
    const isSelected = !!(provName && selectedProv === provName)

    if (isAffected) {
      ctx.fillStyle = isSelected
        ? 'rgba(245, 158, 11, 0.85)'
        : 'rgba(234, 152, 28, 0.72)'
      ctx.fill(item.path)
      ctx.lineWidth = isSelected ? 2.8 : 1.9
      ctx.strokeStyle = isSelected ? '#ffffff' : '#f59e0b'
      ctx.stroke(item.path)

      if (item.minBx < Infinity && provName) {
        hitBoxes.push({
          prov: provName,
          x1: item.minBx,
          y1: item.minBy,
          x2: item.maxBx,
          y2: item.maxBy,
        })
      }

      if (item.centroidXY && provName) {
        const [cx, cy] = item.centroidXY
        const prev = warningCentroids.get(provName)
        if (!prev || item.boxArea > prev.areaWeight) {
          warningCentroids.set(provName, {
            x: cx,
            y: cy,
            areaWeight: item.boxArea,
          })
        }
      }
    } else {
      ctx.fillStyle = drewSatellite ? 'rgba(92, 118, 74, 0.28)' : '#5d774a'
      ctx.fill(item.path)
      ctx.lineWidth = 1.0
      ctx.strokeStyle = drewSatellite
        ? 'rgba(226, 232, 240, 0.45)'
        : 'rgba(226, 232, 240, 0.55)'
      ctx.stroke(item.path)
    }
  }

  if (preparedFeatures.length === 0) {
    ctx.save()
    drawRoundedRect(ctx, W / 2 - 140, H / 2 - 20, 280, 40, 10)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)'
    ctx.fill()
    ctx.fillStyle = '#f8fafc'
    ctx.font = '600 13px Inter, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Memuat poligon peta provinsi BMKG...', W / 2, H / 2)
    ctx.restore()
  }

  for (const [, pos] of warningCentroids.entries()) {
    drawWarningBadge(ctx, pos.x, pos.y, 34)
  }

  ctx.save()
  drawRoundedRect(ctx, 22, 20, 38, 72, 6)
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.22)'
  ctx.shadowBlur = 6
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(22, 56)
  ctx.lineTo(60, 56)
  ctx.stroke()
  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 22px Inter, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('+', 41, 38)
  ctx.fillText('−', 41, 74)
  ctx.restore()

  {
    const activeSelected =
      selectedProv && affectedProvs.has(selectedProv) ? selectedProv : null
    const cardW = 315
    const cardH = activeSelected ? 156 : 168
    const cardX = W - cardW - 24
    const cardY = 22

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 3
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 14)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.shadowColor = 'transparent'

    let curY = cardY + 26
    ctx.textAlign = 'left'

    if (activeSelected) {
      ctx.fillStyle = '#0f122a'
      ctx.font = '700 18px Inter, Arial, sans-serif'
      ctx.fillText(activeSelected, cardX + 20, curY)
      curY += 26
    }

    ctx.fillStyle = '#64748b'
    ctx.font = '500 13px Inter, Arial, sans-serif'
    ctx.fillText('Periode', cardX + 20, curY)
    curY += 22

    ctx.fillStyle = '#9a3412'
    ctx.font = '700 16px Inter, Arial, sans-serif'
    ctx.fillText(formatIndonesianDate(dateISO, false), cardX + 20, curY)
    curY += 18

    if (!activeSelected) {
      drawRoundedRect(ctx, cardX + 20, curY, cardW - 40, 32, 8)
      ctx.fillStyle = '#fff7ed'
      ctx.fill()
      ctx.fillStyle = '#9a3412'
      ctx.font = '500 12.5px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      const statusMsg =
        affectedProvs.size > 0
          ? 'Pilih wilayah pada peta terlebih dahulu'
          : 'Tidak ada potensi banjir rob'
      ctx.fillText(statusMsg, cardX + cardW / 2, curY + 20)
      curY += 40
    } else {
      curY += 8
    }

    drawRoundedRect(ctx, cardX + 20, curY, cardW - 40, 36, 8)
    ctx.fillStyle = activeSelected ? '#d97706' : '#e6ae65'
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 13.5px Inter, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Lihat Wilayah', cardX + cardW / 2, curY + 23)
    ctx.restore()
  }

  {
    const fullDateLabel = formatIndonesianDate(dateISO, true)
    const pillW = 300
    const pillH = 42
    const pillX = (W - pillW) / 2
    const pillY = H - pillH - 16

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.28)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 2
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 11)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.shadowColor = 'transparent'

    ctx.fillStyle = '#d97706'
    ctx.font = '700 15px Inter, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('‹', pillX + 22, pillY + pillH / 2)
    ctx.fillText('›', pillX + pillW - 22, pillY + pillH / 2)

    ctx.fillStyle = '#1e293b'
    ctx.font = '600 14.5px Inter, Arial, sans-serif'
    ctx.fillText(fullDateLabel, W / 2, pillY + pillH / 2 + 1)
    ctx.restore()
  }

  ctx.save()
  const attrText = drewSatellite
    ? 'Leaflet | Imagery © Esri'
    : 'BMKG Maritim | Peta Indonesia'
  ctx.font = '500 11px Inter, Arial, sans-serif'
  const tw = ctx.measureText(attrText).width + 16
  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  ctx.fillRect(W - tw, H - 20, tw, 20)
  ctx.fillStyle = '#334155'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillText(attrText, W - 8, H - 10)
  ctx.restore()

  return hitBoxes
}
