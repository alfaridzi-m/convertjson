<script setup lang="ts">
const zoomLevel = defineModel<number>('zoomLevel', { required: true })

const zooms = [0.65, 0.85, 1]
</script>

<template>
  <div class="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2 text-xs font-medium text-slate-600">
      <i class="fa-regular fa-eye text-sky-600" />
      <span>Pratinjau Dokumen PDF (Ukuran A4)</span>
      <span class="text-slate-300">|</span>
      <span class="text-[11px] text-slate-500">
        Klik provinsi berwarna oranye pada peta untuk memilih highlight info wilayah
      </span>
    </div>

    <div class="flex items-center gap-1.5">
      <button
        v-for="z in zooms"
        :key="z"
        type="button"
        class="px-2.5 py-1 rounded-lg text-xs font-medium transition"
        :class="
          zoomLevel === z
            ? 'bg-sky-600 text-white'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        "
        @click="zoomLevel = z"
      >
        {{ Math.round(z * 100) }}%
      </button>
    </div>
  </div>
</template>
