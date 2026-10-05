# Automated E2E Testing SIGAP (Playwright)

Modul pengujian otomatis End-to-End (E2E) untuk aplikasi SIGAP menggunakan Playwright.

---

## Prasyarat Pengujian

Sebelum menjalankan E2E test, pastikan:

1. **Backend Server Aktif**:
   Backend FastAPI harus berjalan di `http://localhost:8000` dan terhubung ke database Aiven/MySQL yang aktif.

   ```bash
   cd backend
   .venv\Scripts\activate
   uvicorn app.main:app --reload
   ```

2. **Database Telah Di-seed dengan Akun Staf**:
   Pastikan skrip seed akun staf telah dijalankan:

   ```bash
   cd backend
   python scripts/seed_staff_accounts.py
   python scripts/seed_categories.py
   ```

   *Akun staf bawaan:*
   - Verifier: `verifier1@sigap.test` / `Verifier123!`
   - Officer 1: `officer1@sigap.test` / `Officer123!`
   - Officer 2: `officer2@sigap.test` / `Officer123!`
   - Admin: `admin1@sigap.test` / `Admin123!`

3. **Frontend Server Aktif**:
   Frontend Vite harus berjalan di `http://localhost:5173`.

   ```bash
   cd frontend
   npm run dev
   ```

---

## Cara Menjalankan E2E Test

Jalankan seluruh suite E2E test dari direktori `frontend/`:

```bash
# Menjalankan seluruh test
npm run test:e2e

# Atau menggunakan npx playwright langsung
npx playwright test

# Menjalankan test tertentu dengan tampilan UI interactive
npx playwright test --ui

# Menjalankan spesifik satu file test
npx playwright test e2e/phase1-auth.spec.js
```

---

## Struktur File Test

- `e2e/helpers.js` — Helper pembuatan data registrasi citizen unik, login API, dan request API context.
- `e2e/phase1-auth.spec.js` — Skenario 1–6: Registrasi citizen, login valid/invalid, RBAC redirect `/verifier`, reload session, dan tampering token.
- `e2e/phase2-create-report.spec.js` — Skenario 7–11: Form laporan lengkap, format nomor `SIGAP-{YYYY}-{SEQUENCE}`, validasi foto/kategori/max 5 foto, dan koordinat peta.
- `e2e/phase3-tracking.spec.js` — Skenario 12–14: Empty state, pagination 11 laporan batch API, dan isolasi privasi antar-warga.
- `e2e/phase3.5-staff-timeline.spec.js` — Skenario 15–18: Alur lintas-role (Citizen → Verifier → Officer) dan verifikasi kerahasiaan nama staf & label timeline citizen.
