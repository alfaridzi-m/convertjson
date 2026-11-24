export function drawBMKGLogo(canvas: HTMLCanvasElement | null) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) * 0.44

  ctx.clearRect(0, 0, w, h)
  ctx.save()

  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  ctx.fillStyle = '#005baa'
  ctx.fillRect(cx - r, cy - r, r * 2, r * 0.92)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(cx - r, cy - r * 0.12, r * 2, r * 0.62)

  const stripeColors = ['#16a34a', '#15803d', '#16a34a']
  stripeColors.forEach((color, idx) => {
    const sy = cy - r * 0.04 + idx * (r * 0.17)
    ctx.beginPath()
    ctx.moveTo(cx - r, sy + r * 0.06)
    ctx.quadraticCurveTo(cx, sy - r * 0.12, cx + r, sy + r * 0.06)
    ctx.lineWidth = Math.max(2.5, r * 0.095)
    ctx.strokeStyle = color
    ctx.stroke()
  })

  ctx.fillStyle = '#0f2942'
  ctx.beginPath()
  ctx.moveTo(cx - r, cy + r * 0.46)
  ctx.bezierCurveTo(
    cx - r * 0.35,
    cy + r * 0.28,
    cx + r * 0.35,
    cy + r * 0.65,
    cx + r,
    cy + r * 0.42,
  )
  ctx.lineTo(cx + r, cy + r)
  ctx.lineTo(cx - r, cy + r)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = Math.max(2, r * 0.08)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy - r * 0.42, r * 0.24, Math.PI * 0.15, Math.PI * 1.45)
  ctx.stroke()

  ctx.restore()

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.lineWidth = Math.max(1.5, r * 0.04)
  ctx.strokeStyle = '#cbd5e1'
  ctx.stroke()
}
