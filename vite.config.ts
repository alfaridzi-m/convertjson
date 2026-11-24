import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const bmkgProxy = {
  '/api/bmkg/geojson': {
    target: 'https://maritim.bmkg.go.id',
    changeOrigin: true,
    rewrite: () => '/marine2026-data/meta/indonesia-prov.geojson',
  },
  '/api/bmkg/banjirrob': {
    target: 'https://maritim.bmkg.go.id',
    changeOrigin: true,
    rewrite: () => '/marine2026-data/w-banjirob/banjirrob_combine.json',
  },
}

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: bmkgProxy,
  },
  preview: {
    proxy: bmkgProxy,
  },
})
