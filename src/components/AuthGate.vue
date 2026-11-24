<script setup lang="ts">
import { ref } from 'vue'

const PASSWORD = 'maritimbanjir'
const AUTH_KEY = 'bmkg-rob-auth'

const emit = defineEmits<{
  authenticated: []
}>()

const password = ref('')
const error = ref('')
const shake = ref(false)

function submit() {
  if (password.value === PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, '1')
    error.value = ''
    emit('authenticated')
    return
  }

  error.value = 'Password salah. Coba lagi.'
  shake.value = true
  password.value = ''
  setTimeout(() => {
    shake.value = false
  }, 400)
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-900 px-4"
  >
    <form
      class="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8"
      :class="{ 'animate-shake': shake }"
      @submit.prevent="submit"
    >
      <label class="block text-sm font-medium text-slate-700 mb-1.5" for="auth-password">
        Password
      </label>
      <input
        id="auth-password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        autofocus
        class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        placeholder="••••••••"
      />

      <p v-if="error" class="mt-2 text-sm text-rose-600">{{ error }}</p>

      <button
        type="submit"
        class="mt-5 w-full rounded-xl bg-slate-900 text-white font-semibold py-2.5 hover:bg-slate-800 transition-colors"
      >
        Masuk
      </button>
    </form>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-6px);
  }
  40%,
  80% {
    transform: translateX(6px);
  }
}

.animate-shake {
  animation: shake 0.4s ease;
}
</style>
