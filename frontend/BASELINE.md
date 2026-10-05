# BASELINE — Hasil Uji Sebelum Refactor (Pre-Refactor)

## 1. Versi Dependency Utama
- **React**: 19.0.0
- **React DOM**: 19.0.0
- **React Router DOM**: 7.1.5
- **Tailwind CSS**: 4.0.0
- **Vite**: 6.0.0
- **Lucide React**: 1.48.0
- **Leaflet**: 1.9.4
- **React Leaflet**: 5.0.0
- **Axios**: 1.7.9
- **Playwright**: 1.63.0

## 2. Hasil Production Build (`npm run build`)
- **Status**: BERHASIL (Success, built in ~4.25s)
- **Warning**:
  - `(!) Some chunks are larger than 500 kB after minification.`
  - Bundle `dist/assets/index-CQZagZ4a.js`: **648.80 kB** (gzip: 189.13 kB).

## 3. Hasil Pengujian E2E (`npx playwright test`)
- **Total Specs**: 25
- **Lulus (Passed)**: 1
  - `e2e/phase1-auth.spec.js`: 3. Access /verifier without login -> redirect to /login
- **Gagal (Failed)**: 24
  - `e2e/phase1-auth.spec.js`: 1, 2, 4, 5, 6
  - `e2e/phase2-create-report.spec.js`: 7, 8, 9, 10, 11
  - `e2e/phase3-tracking.spec.js`: 12, 13, 14
  - `e2e/phase3.5-staff-timeline.spec.js`: 15-18
  - `e2e/phase4-verifier.spec.js`: 1, 2, 3
  - `e2e/phase5-officer.spec.js`: 1, 2
  - `e2e/phase6-map.spec.js`: 1
  - `e2e/phase7-ai-panel.spec.js`: 1, 2
  - `e2e/verification-status-failed.spec.js`: 1
  - `e2e/verification-unmount-polling.spec.js`: 1

### Catatan Kegagalan E2E:
Seluruh 24 spec yang gagal mengalami kesalahan koneksi backend ke database MySQL Aiven (`mysql-390388af-sigaplamongan26.g.aivencloud.com`: `[Errno 11001] getaddrinfo failed` / `500 Internal Server Error`). Ini merupakan **dependency di luar scope** (koneksi database / environment backend remote tidak terjangkau).

## 4. Status Repository & Branch
- **Branch saat ini**: `refactor/ui`
- **Tag Baseline**: `baseline-pre-refactor`
