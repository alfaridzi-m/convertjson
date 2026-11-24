import {
  BMKG_BANJIRROB_API,
  BMKG_BANJIRROB_URL,
  BMKG_GEOJSON_API,
  BMKG_GEOJSON_URL,
  GEO_CACHE_NAME,
} from './constants'

export interface FetchResult<T = unknown> {
  data: T
  via: string
}

async function fetchWithTimeout(
  url: string,
  { timeoutMs = 9000, cache: cacheMode = 'no-store' as RequestCache } = {},
): Promise<Response> {
  const ctrl = new AbortController()
  const timeoutId = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: ctrl.signal, cache: cacheMode })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchJsonSmart(
  localApiPath: string,
  upstreamUrl: string,
  { useCache = false, timeoutMs = 9000 }: { useCache?: boolean; timeoutMs?: number } = {},
): Promise<FetchResult> {
  if (useCache && 'caches' in window) {
    try {
      const cache = await caches.open(GEO_CACHE_NAME)
      const cachedRes = await cache.match(localApiPath)
      if (cachedRes) {
        const cachedData = await cachedRes.json()
        if (cachedData && typeof cachedData === 'object') {
          return { data: cachedData, via: 'Browser Cache' }
        }
      }
    } catch {
      // ignore
    }
  }

  const endpoints = [
    { label: 'Vite Proxy BMKG', url: localApiPath, delayMs: 0 },
    {
      label: 'Direct BMKG',
      url: upstreamUrl,
      delayMs: 80,
    },
    {
      label: 'Fast Proxy 1',
      url: `https://corsproxy.io/?url=${encodeURIComponent(upstreamUrl)}`,
      delayMs: 160,
    },
    {
      label: 'Fast Proxy 2',
      url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(upstreamUrl)}`,
      delayMs: 220,
    },
  ]

  const controllers = endpoints.map(() => new AbortController())

  const tasks = endpoints.map(
    (ep, idx) =>
      new Promise<FetchResult>(async (resolve, reject) => {
        const ctrl = controllers[idx]
        const timeoutId = setTimeout(() => ctrl.abort(), timeoutMs)
        try {
          if (ep.delayMs > 0) {
            await new Promise((r) => setTimeout(r, ep.delayMs))
            if (ctrl.signal.aborted) throw new Error('Aborted')
          }
          const res = await fetch(ep.url, {
            signal: ctrl.signal,
            cache: useCache ? 'force-cache' : 'no-store',
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (!data || typeof data !== 'object') throw new Error('Invalid JSON')
          clearTimeout(timeoutId)
          resolve({ data, via: ep.label })
        } catch (err) {
          clearTimeout(timeoutId)
          reject(err)
        }
      }),
  )

  try {
    const winner = await Promise.any(tasks)
    controllers.forEach((c) => c.abort())

    if (useCache && 'caches' in window) {
      try {
        const cache = await caches.open(GEO_CACHE_NAME)
        await cache.put(
          localApiPath,
          new Response(JSON.stringify(winner.data), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      } catch {
        // ignore
      }
    }
    return winner
  } catch {
    controllers.forEach((c) => c.abort())
    throw new Error(`Tidak dapat mengakses ${upstreamUrl}`)
  }
}

export async function fetchGeoJson(forceRefresh = false) {
  if (forceRefresh && 'caches' in window) {
    try {
      const cache = await caches.open(GEO_CACHE_NAME)
      await cache.delete(BMKG_GEOJSON_API)
    } catch {
      // ignore
    }
  }
  return fetchJsonSmart(BMKG_GEOJSON_API, BMKG_GEOJSON_URL, {
    useCache: !forceRefresh,
    timeoutMs: 12000,
  })
}

export async function fetchBanjirRob(forceRefresh = false) {
  return fetchJsonSmart(BMKG_BANJIRROB_API, BMKG_BANJIRROB_URL, {
    useCache: false,
    timeoutMs: forceRefresh ? 12000 : 9000,
  })
}

export { fetchWithTimeout }
