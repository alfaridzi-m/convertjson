<script setup lang="ts">
import { formatIndonesianDate, getThreeDatesISO } from '@/lib/dates'
import type { NormalizedByDate } from '@/lib/types'
import { computed } from 'vue'

const docNumber = defineModel<string>('docNumber', { required: true })
const signCity = defineModel<string>('signCity', { required: true })
const signUnit = defineModel<string>('signUnit', { required: true })

const props = defineProps<{
  geoSourceLabel: string
  robSourceLabel: string
  startDateH1: string
  normalizedByDate: NormalizedByDate
}>()

const emit = defineEmits<{
  download: []
}>()

const daySummaries = computed(() => {
  const dates = getThreeDatesISO(props.startDateH1)
  return dates.map((dt, idx) => {
    const count = Object.keys(props.normalizedByDate[dt] || {}).length
    return {
      label: `H+${idx + 1}`,
      date: formatIndonesianDate(dt, false),
      count,
      hasData: count > 0,
    }
  })
})
</script>

<template>
  <aside class="w-full lg:w-[370px] xl:w-[390px] shrink-0 flex flex-col gap-4">
    <section class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
      <div>
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <i class="fa-solid fa-file-signature text-sky-600" />
          Atribut Surat &amp; Penandatangan
        </h2>
        <p class="text-[11px] text-slate-400 mt-1">
          Seluruh data peta, periode 3 hari, tabel wilayah, dan himbauan diambil otomatis dari source BMKG.
        </p>
      </div>

      <div class="space-y-3.5 text-xs">
        <div>
          <label for="inputDocNumber" class="block font-semibold text-slate-700 mb-1.5">
            Nomor Surat (No:)
          </label>
          <input
            id="inputDocNumber"
            v-model="docNumber"
            type="text"
            placeholder="B/ME.01.02/PDBP/(Nomor Produk)/(UPT)/(Bulan Romawi)/(Tahun)"
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
          />
        </div>

        <div>
          <label for="inputSignCity" class="block font-semibold text-slate-700 mb-1.5">
            Kota
          </label>
          <input
            id="inputSignCity"
            v-model="signCity"
            type="text"
            placeholder="Masukkan kota penandatangan"
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
          />
        </div>

        <div>
          <label for="inputSignUnit" class="block font-semibold text-slate-700 mb-1.5">
            Unit Penandatangan
          </label>
          <input
            id="inputSignUnit"
            v-model="signUnit"
            type="text"
            placeholder="Masukkan unit penandatangan"
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
          />
        </div>
      </div>

      <div class="pt-2">
        <button
          type="button"
          class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2"
          @click="emit('download')"
        >
          <i class="fa-solid fa-file-arrow-down" />
          <span>Cetak / Download PDF Sekarang</span>
        </button>
      </div>
    </section>

    <section class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3.5">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
        <i class="fa-solid fa-satellite-dish text-emerald-600" />
        Status Source Data BMKG (Otomatis)
      </h2>

      <div class="space-y-2 text-xs">
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-slate-700">indonesia-prov.geojson</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              GeoJSON
            </span>
          </div>
          <div class="text-[11px] text-slate-500 mt-1 break-all">
            {{ geoSourceLabel }}
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-slate-700">banjirrob_combine.json</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
              JSON
            </span>
          </div>
          <div class="text-[11px] text-slate-500 mt-1 break-all">
            {{ robSourceLabel }}
          </div>
        </div>
      </div>

      <div>
        <div class="text-[11px] font-semibold text-slate-500 mb-2">
          Ringkasan Kejadian 3 Hari (H+1 s/d H+3)
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="day in daySummaries"
            :key="day.label"
            class="rounded-xl border p-2 text-center"
            :class="
              day.hasData
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            "
          >
            <div class="text-[10px] font-bold uppercase tracking-wider opacity-75">
              {{ day.label }}
            </div>
            <div class="text-[11px] font-bold truncate mt-0.5">{{ day.date }}</div>
            <div class="text-[10.5px] mt-0.5 font-medium">{{ day.count }} Provinsi</div>
          </div>
        </div>
      </div>
    </section>
  </aside>
</template>
