# SIGAP Design System — Dokumen Referensi Wajib

Dokumen ini dirujuk oleh **semua prompt Phase 1–7 frontend**. Setiap kali membangun komponen atau halaman baru, baca dokumen ini dulu — jangan menebak warna/spacing/border-radius sendiri.

## Karakter Visual
SIGAP adalah **civic incident reporting platform** (pelaporan gangguan lalu lintas). Kesan yang harus tercapai: **trustworthy, clean, professional, accessible, civic/public service, modern, simple**.

**Hindari sama sekali**: futuristic, gaming/cyberpunk, neon, corporate-heavy, glassmorphism-heavy, gradient-heavy, dark theme sebagai tema utama. **Light interface adalah default**, bukan pilihan opsional.

Prinsip umum: **Clarity > Decoration. Usability > Visual complexity. Consistency > Variety. Accessibility > Aesthetic effect.**

## Design Tokens

```js
colors: {
  primary: {
    DEFAULT: '#2185D5',
    hover: '#1B6DAE',
    light: '#E8F2FB',
  },
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#BCCCDC',
  muted: '#9AA6B2',
  ink: '#0F172A',
  danger: {
    DEFAULT: '#DC2626',
    hover: '#B91C1C',
    light: '#FEE2E2',
  },
  status: {
    amber:  { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
    blue:   { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
    green:  { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
    red:    { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
    orange: { bg: '#FFEDD5', text: '#9A3412', border: '#FDBA74' },
    gray:   { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  },
}
```

## Border Radius
- Input, Button, Badge, Select: `rounded-md` (6px)
- Card, Modal, Table container: `rounded-lg` (8px)
- Avatar/icon bulat penuh: `rounded-full`

## Navigation & Layout
Navbar/Sidebar: background putih (`bg-surface`/`bg-white`), border `#BCCCDC`. Active nav item: `text-primary bg-primary-light border border-primary/20`.

## Status Mapping (Persis Backend Enum)
| Status Enum | Warna Semantik | Label Teks Bahasa Indonesia |
|---|---|---|
| PENDING_VERIFICATION | amber | Menunggu Verifikasi |
| VERIFIED | blue | Terverifikasi |
| REJECTED | red | Ditolak |
| DUPLICATE | orange | Duplikat |
| ASSIGNED | blue | Disetujui Petugas |
| IN_PROGRESS | blue | Sedang Ditangani |
| UNRESOLVED | amber | Belum Selesai |
| RESOLVED | green | Selesai |
| CLOSED | gray | Ditutup |
