<script setup lang="ts">
import { drawBMKGLogo } from '@/lib/draw-logo'
import { nextTick, onMounted, ref } from 'vue'

defineProps<{
  docNumber: string
  validRangeText: string
  zoomLevel: number
}>()

const emit = defineEmits<{
  mapClick: [dayIndex: number, event: MouseEvent]
  ready: []
}>()

const kopLogoCanvas = ref<HTMLCanvasElement | null>(null)
const mapCanvas0 = ref<HTMLCanvasElement | null>(null)
const mapCanvas1 = ref<HTMLCanvasElement | null>(null)
const mapCanvas2 = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  await nextTick()
  drawBMKGLogo(kopLogoCanvas.value)
  emit('ready')
})

defineExpose({
  getMapCanvases: () =>
    [mapCanvas0.value, mapCanvas1.value, mapCanvas2.value] as (
      | HTMLCanvasElement
      | null
    )[],
  getLogoCanvas: () => kopLogoCanvas.value,
  mapRefs: [mapCanvas0, mapCanvas1, mapCanvas2],
})
</script>

<template>
  <div
    class="a4-sheet doc-serif px-10 py-8 flex flex-col justify-between text-black"
    :style="{
      transform: `scale(${zoomLevel})`,
      marginBottom: zoomLevel < 1 ? `${(zoomLevel - 1) * 1123}px` : '0px',
    }"
  >
    <div>
      <div class="flex items-center gap-4 pb-2.5 border-b-[2.5px] border-black">
        <div class="w-[68px] h-[68px] shrink-0 flex items-center justify-center">
          <canvas
            ref="kopLogoCanvas"
            width="200"
            height="200"
            class="w-full h-full object-contain"
          />
        </div>
        <div class="flex-1 text-center pr-4">
          <div class="font-bold text-[12.5px] leading-snug tracking-tight uppercase">
            THE AGENCY FOR METEOROLOGY, CLIMATOLOGY, AND<br />
            GEOPHYSICS OF THE REPUBLIC OF INDONESIA (BMKG)
          </div>
          <div class="text-[10.5px] leading-snug mt-0.5 text-gray-800">
            Jl. Angkasa I No. 2, Jakarta 10610 Telp: (021) 4246321 Fax: (021) 4246703<br />
            P. O. BOX 3540 JKT, Website: http://www.bmkg.go.id
          </div>
        </div>
      </div>

      <div class="text-center mt-3 mb-3">
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
        <div class="w-full rounded-lg overflow-hidden border border-slate-300 bg-[#05334d]">
          <canvas
            ref="mapCanvas0"
            width="1400"
            height="545"
            class="w-full h-auto block cursor-pointer"
            @click="emit('mapClick', 0, $event)"
          />
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

    <div class="text-center text-[10.5px] text-gray-500 pt-2">- 1 -</div>
  </div>
</template>
