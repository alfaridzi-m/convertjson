import { ref } from 'vue'
import type { ToastItem } from '@/lib/types'

let toastSeq = 0

export function useToasts() {
  const toasts = ref<ToastItem[]>([])

  function showToast(
    message: string,
    type: ToastItem['type'] = 'info',
  ) {
    const id = ++toastSeq
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 4200)
  }

  return { toasts, showToast }
}
