<script setup lang="ts">
import { OFFICIAL_HIMBAUAN } from '@/lib/constants'
import type { TableRow } from '@/lib/types'

defineProps<{
  dayHeaders: [string, string, string]
  rows: TableRow[]
  emptyMessage: string
  signDateText: string
  signUnit: string
  zoomLevel: number
}>()
</script>

<template>
  <div
    class="a4-sheet doc-serif px-11 py-10 flex flex-col justify-between text-black"
    :style="{
      transform: `scale(${zoomLevel})`,
      marginBottom: zoomLevel < 1 ? `${(zoomLevel - 1) * 1123}px` : '0px',
    }"
  >
    <div>
      <div class="bmkg-table-wrap">
        <table class="bmkg-table">
          <thead>
            <tr>
              <th class="w-[16%]">Provinsi</th>
              <th class="w-[28%]">{{ dayHeaders[0] }}</th>
              <th class="w-[28%]">{{ dayHeaders[1] }}</th>
              <th class="w-[28%]">{{ dayHeaders[2] }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td colspan="4" class="text-center py-6 text-gray-500 italic">
                {{ emptyMessage }}
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.prov">
              <td>
                <span class="bmkg-prov-name">{{ row.prov }}</span>
              </td>
              <td v-for="(lines, ci) in row.cells" :key="ci">
                <template v-if="lines && lines.length">
                  <div
                    v-for="(line, li) in lines"
                    :key="li"
                    class="mb-2 last:mb-0 text-[#374151]"
                  >
                    <template v-if="line.includes(':')">
                      <strong class="font-bold text-[#111827]">{{
                        line.slice(0, line.indexOf(':') + 1)
                      }}</strong>{{ line.slice(line.indexOf(':') + 1) }}
                    </template>
                    <template v-else>{{ line }}</template>
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-6 space-y-3 text-[12px] leading-relaxed text-justify text-gray-900">
        <p>{{ OFFICIAL_HIMBAUAN[0] }}</p>
        <p>{{ OFFICIAL_HIMBAUAN[1] }}</p>
        <p>{{ OFFICIAL_HIMBAUAN[2] }}</p>
      </div>

      <div class="mt-8 flex justify-end">
        <div class="text-left min-w-[235px] text-[12px] leading-relaxed">
          <div>{{ signDateText }}</div>
          <div class="font-bold mt-0.5">{{ signUnit || 'Direktorat Meteorologi Maritim' }}</div>
        </div>
      </div>
    </div>

    <div class="text-center text-[11px] text-gray-700 pt-6">- 2 -</div>
  </div>
</template>
