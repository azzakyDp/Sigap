# SIGAP Frontend — Phase 3.5: Cleanup sebelum Phase 4

Sistem Informasi Pengaduan Gangguan Lalu Lintas (SIGAP) — Frontend React Application.

## Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: `lucide-react`
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Map Library**: Leaflet + React-Leaflet

---

## Design System Rules (Civic Light Interface)

Aplikasi frontend SIGAP mengusung desain **civic incident reporting platform** yang bersih, profesional, trustworthy, dan sangat mudah diakses (_accessible_).

- **Default Theme**: **LIGHT INTERFACE** (Background `#F8FAFC`, Surface `#FFFFFF`, Ink `#0F172A`, Ink Soft `#475569`, Muted `#9AA6B2`).
- **Primary Color**: `#2185D5` (Hover: `#1B6DAE`, Light: `#E8F2FB`).
- **Design Tokens**: Terpusat di `@theme` di `src/index.css`. `tailwind.config.js` tidak lagi digunakan (sisa v3).
- **Typography & Kontras**:
  - Teks sekunder/informasi menggunakan `text-ink-soft` (kontras rasio memenuhi standar AA).
  - Teks kecil primary menggunakan `text-primary-hover`.
  - Sentence case & `font-semibold text-ink-soft` untuk header tabel dan label navigasi.
- **Status Colors Helper**: Terpusat di `src/utils/statusColors.js`.

---

## 🚀 Cara Menjalankan Project

### 1. Install Dependensi

```bash
npm install
```

### 2. Konfigurasi Environment Variables

File `.env` di root folder `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Jalankan Mode Development

```bash
npm run dev
```

Aplikasi frontend akan berjalan di `http://localhost:5173`.

### 4. Build Verifikasi Produk

```bash
npm run build
```

---

## Struktur Folder Project

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js          # Instance Axios + Request/Response Interceptors
│   │   ├── auth.js            # Endpoint Autentikasi
│   │   ├── categories.js      # Endpoint Kategori Laporan
│   │   └── reports.js         # Endpoint Laporan Pengaduan
│   ├── components/
│   │   ├── ui/                # Komponen Primitif Reusable (Button, Input, Card, Badge, Modal, Table, Pagination, MapPicker)
│   │   ├── layout/            # Layout Aplikasi (Navbar, Sidebar, DashboardLayout)
│   │   └── report/            # Komponen Domain Laporan
│   │       ├── CategorySelect.jsx
│   │       ├── DynamicFieldsForm.jsx
│   │       ├── StatusTimeline.jsx   # Timeline Status Laporan (audience: 'citizen' | 'staff')
│   │       └── ReportDetailView.jsx # Tampilan Presentasional Detail Laporan
│   │   └── ProtectedRoute.jsx # Guard Route & Role-Based Access Control (RBAC)
│   ├── context/
│   │   └── AuthContext.jsx    # State User, Token, Login & Logout
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── CitizenDashboard.jsx
│   │   ├── VerifierDashboard.jsx
│   │   ├── OfficerDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── UnauthorizedPage.jsx
│   │   └── citizen/
│   │       ├── CreateReportPage.jsx # Formulir Pengaduan
│   │       ├── MyReportsPage.jsx     # Daftar & Tracking Laporan Saya
│   │       └── ReportDetailPage.jsx  # Halaman Detail Laporan Container (Citizen)
│   ├── utils/
│   │   ├── errors.js          # Helper getErrorMessage (aman penanganan error 422 array)
│   │   ├── formatters.js      # Helper formatDate terpusat & toApiDateTime
│   │   ├── statusColors.js    # Helper warna status & prioritas
│   │   └── url.js             # Helper getImageUrl terpusat
│   ├── App.jsx                # Routing React Router
│   ├── index.css              # Styling & Design Tokens Tailwind v4
│   └── main.jsx
├── .env
├── .gitignore
├── package.json
└── vite.config.js
```

---

## Perubahan Utama Phase 3.5 (Cleanup)

1. **Token & Styling Terpusat**:
   - `tailwind.config.js` dihapus; token `--color-ink-soft: #475569` didaftarkan di `@theme` `src/index.css`.
   - `text-muted` diganti dengan `text-ink-soft` untuk teks informasi/metadata agar memenuhi standar kontras visual.
   - Variabel `purple` pada `Badge` dan `bg-black/90` pada Lightbox dibersihkan (digantikan `bg-ink`).

2. **Utility & Error Handling Terpusat**:
   - `src/utils/formatters.js`: `formatDate` tunggal menggantikan duplikasi sebelumnya; `toApiDateTime` untuk konversi datetime-local ke ISO API.
   - `src/utils/url.js`: `getImageUrl` terpusat untuk resolusi gambar bukti.
   - `src/utils/errors.js`: `getErrorMessage` menghasilkan string aman dari error validasi (422 array) maupun error bisnis.

3. **Komponen Presentasional & Timeline**:
   - `ReportDetailView.jsx` mengekstrak tampilan detail agar siap dipakai ulang oleh role Verifier & Officer pada Phase 4 & 5.
   - `StatusTimeline.jsx` mendukung prop `audience` (`'citizen'` / `'staff'`) dengan logika penyaringan entri publik dan penghilangan kode mentah/nama staf pada mode citizen.

4. **Repository Hygiene**:
   - Menghapus folder `testing gambar/` dan mengecualikannya di `.gitignore`.
