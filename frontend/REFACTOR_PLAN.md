# SIGAP Frontend Refactor Plan

## Konteks
Aplikasi sudah berfungsi tetapi belum dihosting dan belum punya pengguna nyata.
Refactor ini HANYA untuk lapisan frontend (src/). Fungsi, auth flow, role permission,
API contract, data model tidak boleh berubah. Env, backend, dan konfigurasi build di luar scope.

## Tujuan
UI terasa seperti dokumen operasional yang tenang: putih dan abu sebagai dasar, biru hanya
untuk yang bisa diklik atau dipilih, warna semantik hanya untuk status. Struktur dibangun dari
tipografi, divider, whitespace, bukan kotak.

## Keputusan
1. Peta = view dalam antrean: satu item sidebar, URL /verifier?view=map. Rute /verifier/map
   dihapus (tanpa redirect), e2e disesuaikan. Admin ikut karena memakai halaman yang sama.
2. Admin = "verifier plus". Hapus data palsu AdminDashboard, ganti state kosong jujur atau
   tautan ke antrean. KPI/monitoring = dependency backend, di luar scope.
3. Tambah token border-strong (ukur kontras, target >= 3:1 untuk batas input). #9AA6B2
   tidak dipakai untuk teks. Palet utama tidak berubah.
4. Alignment: ukur bounding box ikon vs wadah di browser, perbaiki di komponen bersama,
   laporkan penyebabnya. Tidak ada perbaikan per elemen.
5. Summary AI tampil penuh dalam kotak max-h + overflow-y-auto, tanpa toggle. Uji dengan
   teks panjang sementara (jangan di-commit sebagai data).
6. DashboardLayout -> layout route (Outlet), commit terpisah. Auth/role guard tidak berubah.
7. Landing masuk scope, paling akhir.
8. Bug P0 dikerjakan lebih dulu, terpisah dari redesign.

## Design system
- Warna: primary #2185D5 (CTA, link, fokus, item terpilih), bg #F8FAFC, surface #FFFFFF,
  border #BCCCDC (hanya pemisah). Semantik hanya untuk status. Badge role netral.
- Tipografi: ukuran 12/14/16/20/24. Bobot 400/500/600; 700 hanya judul halaman. Tanpa
  extrabold/black dan tanpa ukuran arbitrer text-[10px]/[11px]. Label = teks biasa warna
  ink-soft; nilai = bobot normal. Lebar paragraf maks ~65 karakter. Pengecualian: judul hero landing memakai token text-display (32px, >=768px), satu kali.
- Spacing: basis 4px. Jarak antar-section 24, padding card 16-20.
- Radius: 6 kontrol, 8 surface, full hanya avatar/dot. Shadow hanya untuk overlay.
- Ikon: 16px inline, 20px navigasi. Tanpa lingkaran pembungkus. Hapus ikon dekoratif.
- Card: hanya blok independen dengan aksi/konteks sendiri (Bukti, Lokasi+peta, Asisten AI,
  Timeline, form). Sisanya section datar: heading + divider. Dilarang card di dalam card.
- Tombol: primary, secondary, ghost, danger (hanya aksi destruktif). size sm/md. Satu primary
  per tampilan. "Keluar" = ghost.
- Panel AI: surface netral, label "Asisten AI · saran, bukan keputusan", tanpa ikon biru dan
  tanpa efek futuristik.
- Dilarang: gradient, glassmorphism, blob, tilt 3D, hover:scale, icon-circle dekoratif.

## Rute nyata
citizen: /dashboard, /reports/create, /reports/me, /reports/:id
verifier+admin: /verifier, /verifier/reports/:id (admin: /admin)
officer: /officer, /officer/reports/:id

## Aturan tetap
Tanpa data atau fitur palsu. Masalah backend/env/konfigurasi hanya dilaporkan.
