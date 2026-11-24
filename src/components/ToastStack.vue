<script setup lang="ts">
import type { ToastItem } from '@/lib/types'

defineProps<{
  toasts: ToastItem[]
}>()

const colors: Record<ToastItem['type'], string> = {
  info: 'bg-slate-900 text-white border-slate-700',
  success: 'bg-emerald-900 text-emerald-50 border-emerald-700',
  warning: 'bg-amber-900 text-amber-50 border-amber-700',
  error: 'bg-rose-900 text-rose-50 border-rose-700',
}

const icons: Record<ToastItem['type'], string> = {
  info: 'fa-circle-info text-sky-400',
  success: 'fa-circle-check text-emerald-400',
  warning: 'fa-triangle-exclamation text-amber-400',
  error: 'fa-circle-xmark text-rose-400',
}
</script>

<template>
  <div
    class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
  >
    <div
      v-for="t in toasts"
      :key="t.id"
      class="pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-medium transition-all duration-300"
      :class="colors[t.type]"
    >
      <i class="fa-solid mt-0.5" :class="icons[t.type]" />
      <div class="flex-1 leading-relaxed">{{ t.message }}</div>
    </div>
  </div>
</template>
