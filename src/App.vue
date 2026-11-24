<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import AuthGate from '@/components/AuthGate.vue'
import AppHeader from '@/components/AppHeader.vue'
import SidebarForm from '@/components/SidebarForm.vue'
import PreviewToolbar from '@/components/PreviewToolbar.vue'
import A4Page1 from '@/components/A4Page1.vue'
import A4Page2 from '@/components/A4Page2.vue'
import ToastStack from '@/components/ToastStack.vue'
import { useToasts } from '@/composables/useToasts'
import {
  addDaysISO,
  formatIndonesianDate,
  getThreeDatesISO,
  toISODate,
} from '@/lib/dates'
import { fetchBanjirRob, fetchGeoJson } from '@/lib/fetch-bmkg'
import {
  prepareGeoFeatures,
  preloadEsriSatelliteTiles,
  renderSingleMapCanvas,
} from '@/lib/map-render'
import { parseBanjirRobJSON } from '@/lib/parse-banjirrob'
import { generateOfficialPDF } from '@/lib/pdf'
import { buildThreeDayTableData } from '@/lib/table-data'
import type {
  GeoJsonData,
  HitBox,
  NormalizedByDate,
  PreparedFeature,
} from '@/lib/types'

const { toasts, showToast } = useToasts()

const AUTH_KEY = 'bmkg-rob-auth'
const isAuthenticated = ref(sessionStorage.getItem(AUTH_KEY) === '1')

function onAuthenticated() {
  isAuthenticated.value = true
  preloadEsriSatelliteTiles(esriTilesCache, () => scheduleCanvasRedraw())
  loadAllBMKGData(false)
}

const docNumber = ref('')
const signCity = ref('Jakarta')
const signUnit = ref('Direktorat Meteorologi Maritim')
const zoomLevel = ref(1)
const pdfLoading = ref(false)
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

const geoSourceLabel = ref('Mengambil dari maritim.bmkg.go.id...')
const robSourceLabel = ref('Mengambil dari maritim.bmkg.go.id...')

const baseDateISO = ref(toISODate(new Date()))
const startDateH1ISO = ref(addDaysISO(toISODate(new Date()), 1))
const normalizedByDate = ref<NormalizedByDate>({})
const preparedFeatures = ref<PreparedFeature[]>([])
const selectedProvPerCanvas = ref<[string | null, string | null, string | null]>([
  null,
  null,
  null,
])
const canvasHitBoxes = ref<[HitBox[], HitBox[], HitBox[]]>([[], [], []])
const esriTilesCache = reactive<Record<string, HTMLImageElement>>({})

const page1Ref = ref<InstanceType<typeof A4Page1> | null>(null)

let redrawPending = false

const tableData = computed(() =>
  buildThreeDayTableData(startDateH1ISO.value, normalizedByDate.value),
)

const validRangeText = computed(() => {
  const { dates } = tableData.value
  return `Berlaku Tanggal ${formatIndonesianDate(dates[0], false)} - ${formatIndonesianDate(dates[2], false)}`
})

const dayHeaders = computed(
  () =>
    tableData.value.dates.map((d) => formatIndonesianDate(d, false)) as [
      string,
      string,
      string,
    ],
)

const emptyMessage = computed(() => {
  const { dates } = tableData.value
  return `Tidak terdapat wilayah potensi banjir pesisir (rob) pada periode ${formatIndonesianDate(dates[0], false)} s/d ${formatIndonesianDate(dates[2], false)}.`
})

const signDateText = computed(() => {
  const city = signCity.value.trim() || 'Jakarta'
  return `${city}, ${formatIndonesianDate(baseDateISO.value, false)}`
})

function scheduleCanvasRedraw() {
  if (redrawPending) return
  redrawPending = true
  requestAnimationFrame(() => {
    redrawPending = false
    renderAllCanvases()
  })
}

function renderAllCanvases() {
  const canvases = page1Ref.value?.getMapCanvases?.() || []
  const dates = getThreeDatesISO(startDateH1ISO.value)
  const nextHitBoxes: [HitBox[], HitBox[], HitBox[]] = [[], [], []]

  for (let i = 0; i < 3; i++) {
    const canvas = canvases[i]
    if (!canvas) continue
    nextHitBoxes[i] = renderSingleMapCanvas({
      canvas,
      dateISO: dates[i],
      dayIndex: i,
      normalizedByDate: normalizedByDate.value,
      preparedFeatures: preparedFeatures.value,
      selectedProv: selectedProvPerCanvas.value[i],
      esriTilesCache,
    })
  }
  canvasHitBoxes.value = nextHitBoxes
}

function autoResolveDatesFromSource() {
  const todayISO = toISODate(new Date())
  baseDateISO.value = todayISO
  const defaultH1 = addDaysISO(todayISO, 1)
  const defaultH2 = addDaysISO(todayISO, 2)
  const defaultH3 = addDaysISO(todayISO, 3)
  const availableDates = Object.keys(normalizedByDate.value).sort()
  const hasOverlap = [defaultH1, defaultH2, defaultH3].some(
    (d) => normalizedByDate.value[d],
  )
  if (hasOverlap || availableDates.length === 0) {
    startDateH1ISO.value = defaultH1
  } else {
    const upcomingDates = availableDates.filter((d) => d >= defaultH1)
    startDateH1ISO.value =
      upcomingDates.length > 0 ? upcomingDates[0] : availableDates[0]
  }
}

async function loadAllBMKGData(forceRefresh = false) {
  status.value = 'loading'

  let geoOk = false
  let robOk = false

  const robPromise = fetchBanjirRob(forceRefresh)
    .then((res) => {
      normalizedByDate.value = parseBanjirRobJSON(res.data)
      const dates = Object.keys(normalizedByDate.value).sort()
      robSourceLabel.value =
        dates.length > 0
          ? `Aktif (${dates.length} tanggal • ${res.via})`
          : `Loaded tapi kosong (${res.via})`
      robOk = true
    })
    .catch(() => {
      normalizedByDate.value = {}
      robSourceLabel.value =
        'Gagal memuat banjirrob_combine.json dari server BMKG'
      showToast('Gagal memuat banjirrob_combine.json', 'error')
    })

  const geoPromise = fetchGeoJson(forceRefresh)
    .then((res) => {
      const geo = res.data as GeoJsonData
      preparedFeatures.value = prepareGeoFeatures(geo)
      const count = (geo.features || []).length
      geoSourceLabel.value = `Aktif (${count} poligon provinsi • ${res.via})`
      geoOk = true
    })
    .catch(() => {
      geoSourceLabel.value =
        'Gagal memuat indonesia-prov.geojson dari server BMKG'
      showToast('Gagal memuat indonesia-prov.geojson', 'error')
    })

  await Promise.all([robPromise, geoPromise])
  autoResolveDatesFromSource()
  await nextTick()
  renderAllCanvases()

  if (geoOk && robOk) {
    status.value = 'ready'
    showToast('Source BMKG berhasil dimuat', 'success')
  } else if (geoOk || robOk) {
    status.value = 'ready'
    showToast('Sebagian source BMKG berhasil dimuat', 'warning')
  } else {
    status.value = 'error'
  }
}

function onMapClick(dayIndex: number, e: MouseEvent) {
  const canvases = page1Ref.value?.getMapCanvases?.() || []
  const cnv = canvases[dayIndex]
  if (!cnv) return

  const rect = cnv.getBoundingClientRect()
  const scaleX = cnv.width / rect.width
  const scaleY = cnv.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  const boxes = canvasHitBoxes.value[dayIndex] || []
  let hit: string | null = null
  for (const b of boxes) {
    if (x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2) {
      hit = b.prov
      break
    }
  }

  const next = [...selectedProvPerCanvas.value] as [
    string | null,
    string | null,
    string | null,
  ]
  next[dayIndex] = next[dayIndex] === hit ? null : hit
  selectedProvPerCanvas.value = next
  renderAllCanvases()
}

async function onDownloadPdf() {
  if (pdfLoading.value) return
  pdfLoading.value = true
  try {
    renderAllCanvases()
    await nextTick()
    const fileName = await generateOfficialPDF({
      docNumber: docNumber.value,
      signCity: signCity.value,
      signUnit: signUnit.value,
      baseDateISO: baseDateISO.value,
      startDateH1ISO: startDateH1ISO.value,
      normalizedByDate: normalizedByDate.value,
      mapCanvases: page1Ref.value?.getMapCanvases?.() || [],
    })
    showToast(`PDF "${fileName}" berhasil dibuat dan diunduh!`, 'success')
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : String(err)
    showToast(`Terjadi kesalahan saat membuat PDF: ${message}`, 'error')
  } finally {
    pdfLoading.value = false
  }
}

watch(
  [normalizedByDate, preparedFeatures, startDateH1ISO, selectedProvPerCanvas],
  () => scheduleCanvasRedraw(),
  { deep: true },
)

onMounted(() => {
  if (!isAuthenticated.value) return
  preloadEsriSatelliteTiles(esriTilesCache, () => scheduleCanvasRedraw())
  loadAllBMKGData(false)
})
</script>

<template>
  <AuthGate v-if="!isAuthenticated" @authenticated="onAuthenticated" />

  <div v-else class="bg-slate-100 text-slate-800 min-h-screen flex flex-col">
    <ToastStack :toasts="toasts" />

    <AppHeader
      :status="status"
      :pdf-loading="pdfLoading"
      @reload="loadAllBMKGData(true)"
      @download="onDownloadPdf"
    />

    <main class="flex-1 max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row gap-5 p-4 sm:p-5">
      <SidebarForm
        v-model:doc-number="docNumber"
        v-model:sign-city="signCity"
        v-model:sign-unit="signUnit"
        :geo-source-label="geoSourceLabel"
        :rob-source-label="robSourceLabel"
        :start-date-h1="startDateH1ISO"
        :normalized-by-date="normalizedByDate"
        @download="onDownloadPdf"
      />

      <section
        class="flex-1 min-w-0 flex flex-col bg-slate-200/75 rounded-2xl border border-slate-300/80 overflow-hidden"
      >
        <PreviewToolbar v-model:zoom-level="zoomLevel" />

        <div
          class="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center gap-8"
        >
          <A4Page1
            ref="page1Ref"
            :doc-number="docNumber"
            :valid-range-text="validRangeText"
            :map-day-labels="dayHeaders"
            :zoom-level="zoomLevel"
            @map-click="onMapClick"
            @ready="renderAllCanvases"
          />
          <A4Page2
            :day-headers="dayHeaders"
            :rows="tableData.rows"
            :empty-message="emptyMessage"
            :sign-date-text="signDateText"
            :sign-unit="signUnit"
            :zoom-level="zoomLevel"
          />
        </div>
      </section>
    </main>
  </div>
</template>
