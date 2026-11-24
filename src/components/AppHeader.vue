<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { drawBMKGLogo } from '@/lib/draw-logo'

defineProps<{
  status: 'idle' | 'loading' | 'ready' | 'error'
  pdfLoading: boolean
}>()

const emit = defineEmits<{
  reload: []
  download: []
}>()

const navLogoCanvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  drawBMKGLogo(navLogoCanvas.value)
})

const statusClass: Record<string, string> = {
  idle: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  loading: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  ready: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  error: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
}

const statusLabel: Record<string, string> = {
  idle: 'Siap',
  loading: 'Memuat Data...',
  ready: 'Data Siap',
  error: 'Gagal Memuat',
}
</script>

<template>
  <header class="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
    <div class="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/10 p-1.5 flex items-center justify-center border border-white/15">
          <canvas
            ref="navLogoCanvas"
            width="80"
            height="80"
            class="w-full h-full object-contain"
          />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-bold text-sm sm:text-base tracking-tight">
              BMKG Maritim • Generator PDF Banjir Pesisir (Rob)
            </h1>
            <span
              class="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border"
              :class="statusClass[status]"
            >
              <span
                class="w-1.5 h-1.5 rounded-full"
                :class="{
                  'bg-amber-400 animate-pulse': status === 'loading',
                  'bg-emerald-400': status === 'ready',
                  'bg-rose-400': status === 'error',
                  'bg-slate-400': status === 'idle',
                }"
              />
              {{ statusLabel[status] }}
            </span>
          </div>
          <p class="text-xs text-slate-400 hidden sm:block">
            Konversi otomatis
            <code class="text-sky-300">banjirrob_combine.json</code> &amp;
            <code class="text-emerald-300">indonesia-prov.geojson</code> ke Dokumen PDF Resmi
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-60"
          :disabled="status === 'loading'"
          @click="emit('reload')"
        >
          <i
            class="fa-solid fa-arrows-rotate text-emerald-400"
            :class="{ 'fa-spin': status === 'loading' }"
          />
          <span>Muat Ulang Source BMKG</span>
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/25 transition flex items-center gap-2 disabled:opacity-60"
          :disabled="pdfLoading"
          @click="emit('download')"
        >
          <i
            class="fa-solid"
            :class="pdfLoading ? 'fa-spinner fa-spin' : 'fa-file-pdf'"
          />
          <span>{{ pdfLoading ? 'Menyusun PDF...' : 'Download PDF' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
