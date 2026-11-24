<script setup lang="ts">
import { LOGO_SRC } from '@/lib/draw-logo'
import { nextTick, onMounted, ref } from 'vue'

defineProps<{
  docNumber: string
  validRangeText: string
  mapDayLabels: [string, string, string]
  zoomLevel: number
}>()

const emit = defineEmits<{
  mapClick: [dayIndex: number, event: MouseEvent]
  ready: []
}>()

const mapCanvas0 = ref<HTMLCanvasElement | null>(null)
const mapCanvas1 = ref<HTMLCanvasElement | null>(null)
const mapCanvas2 = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  await nextTick()
  emit('ready')
})

defineExpose({
  getMapCanvases: () =>
    [mapCanvas0.value, mapCanvas1.value, mapCanvas2.value] as (
      | HTMLCanvasElement
      | null
    )[],
  mapRefs: [mapCanvas0, mapCanvas1, mapCanvas2],
})
</script>

<template>
  <div
    class="a4-sheet doc-serif flex flex-col justify-between text-black"
    :style="{
      transform: `scale(${zoomLevel})`,
      marginBottom: zoomLevel < 1 ? `${(zoomLevel - 1) * 1123}px` : '0px',
    }"
  >
    <div>
      <!-- Kop surat resmi BMKG -->
      <div class="kop-surat">
        <img :src="LOGO_SRC" alt="Logo BMKG" class="kop-logo" />
        <div class="kop-copy">
          <p class="kop-title">
            THE AGENCY FOR METEOROLOGY, CLIMATOLOGY, AND<br />
            GEOPHYSICS OF THE REPUBLIC OF INDONESIA (BMKG)
          </p>
          <p class="kop-addr">
            Jl. Angkasa I No. 2, Jakarta 10610 Telp : (021) 4246321 Fax : (021) 4246703
          </p>
          <p class="kop-web">
            P. O. BOX 3540 JKT, Website :
            <span>http://www.bmkg.go.id</span>
          </p>
        </div>
      </div>

      <div class="px-10 pt-3 pb-8">
      <div class="text-center mb-3">
        <h2 class="font-bold text-[14px] leading-tight uppercase">
          INFORMASI POTENSI BANJIR PESISIR (ROB)
        </h2>
        <div class="font-bold text-[12.5px] leading-tight mt-0.5">Wilayah Indonesia</div>
        <div class="text-[11.5px] leading-tight mt-1 font-medium">
          {{ docNumber.trim() ? `No: ${docNumber.trim()}` : 'No: -' }}
        </div>
        <div class="text-[11.5px] leading-tight mt-0.5 font-semibold">
          {{ validRangeText }}
        </div>
      </div>

      <div class="space-y-2.5 mt-2">
        <div>
          <div class="text-[11px] font-bold mb-0.5 text-gray-800">
            Tanggal H+1 — {{ mapDayLabels[0] }}
          </div>
          <div class="w-full rounded-lg overflow-hidden border border-slate-300 bg-[#05334d]">
            <canvas
              ref="mapCanvas0"
              width="1400"
              height="545"
              class="w-full h-auto block cursor-pointer"
              @click="emit('mapClick', 0, $event)"
            />
          </div>
        </div>
        <div>
          <div class="text-[11px] font-bold mb-0.5 text-gray-800">
            Tanggal H+2 — {{ mapDayLabels[1] }}
          </div>
          <div class="w-full rounded-lg overflow-hidden border border-slate-300 bg-[#05334d]">
            <canvas
              ref="mapCanvas1"
              width="1400"
              height="545"
              class="w-full h-auto block cursor-pointer"
              @click="emit('mapClick', 1, $event)"
            />
          </div>
        </div>
        <div>
          <div class="text-[11px] font-bold mb-0.5 text-gray-800">
            Tanggal H+3 — {{ mapDayLabels[2] }}
          </div>
          <div class="w-full rounded-lg overflow-hidden border border-slate-300 bg-[#05334d]">
            <canvas
              ref="mapCanvas2"
              width="1400"
              height="545"
              class="w-full h-auto block cursor-pointer"
              @click="emit('mapClick', 2, $event)"
            />
          </div>
        </div>
      </div>
      </div>
    </div>

    <div class="text-center text-[10.5px] text-gray-500 pt-2 pb-6">- 1 -</div>
  </div>
</template>
