const LOGO_SRC = '/logo-bmkg.svg'

/** Load BMKG SVG logo into a PNG data URL for jsPDF (preserves aspect ratio). */
export function loadLogoPngDataUrl(
  maxSize = 400,
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const aspect = img.width / img.height || 160 / 199
      let w: number
      let h: number
      if (aspect >= 1) {
        w = maxSize
        h = Math.round(maxSize / aspect)
      } else {
        h = maxSize
        w = Math.round(maxSize * aspect)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D unavailable'))
        return
      }
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        width: w,
        height: h,
      })
    }
    img.onerror = () => reject(new Error('Gagal memuat logo-bmkg.svg'))
    img.src = LOGO_SRC
  })
}

export { LOGO_SRC }
