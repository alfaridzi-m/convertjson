# BMKG Maritim — Generator PDF Banjir Pesisir (Rob)

Vue 3 + Vite + TypeScript + Tailwind port of `generator_pdf_banjir_rob_bmkg.html`.

## Features

- Live A4 preview (kop surat, 3 peta H+1..H+3, tabel wilayah, himbauan, TTD)
- Fetch otomatis `banjirrob_combine.json` & `indonesia-prov.geojson` dari BMKG
- Vite proxy `/api/bmkg/*` (tanpa CORS proxy publik di jalur utama)
- Download PDF resmi via jsPDF + autoTable

## Setup

```bash
npm install
npm run dev
```

Buka http://localhost:5173

## Scripts

- `npm run dev` — development server + BMKG proxy
- `npm run build` — production build
- `npm run preview` — preview build (proxy tetap aktif)

## Catatan

File HTML asli `generator_pdf_banjir_rob_bmkg.html` disimpan sebagai referensi.
