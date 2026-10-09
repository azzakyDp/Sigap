# SIGAP Backend

Backend REST API untuk **SIGAP — Sistem Informasi Pengaduan Gangguan Lalu Lintas** (Kabupaten Lamongan).
Dikembangkan menggunakan FastAPI, SQLAlchemy 2.0, Alembic, dan MySQL, berkomunikasi melalui standar REST API (`/api/v1/`).

---

## Status Implementasi Fase Backend

- **Phase 1 — Environment & Application Foundation**: Setup FastAPI app foundation, Pydantic settings (`app/core/config.py`), SQLAlchemy database engine & session (`app/core/database.py`), dan exception handling terpusat (`app/core/exceptions.py`).
- **Phase 2 — Database Models & Alembic Migration**: 10 SQLAlchemy 2.0 models lengkap (`User`, `ReportCategory`, `CategoryField`, `Report`, `ReportFieldValue`, `ReportEvidence`, `ReportStatusHistory`, `ReportAssignment`, `ActionReport`, `AIAnalysis`, `ReportSequence`) & initial migration Alembic di MySQL.
- **Phase 3 — Authentication & RBAC**: Registrasi (`POST /api/v1/auth/register`), Login (`POST /api/v1/auth/login`), JWT issuance (`python-jose`), password hashing (`bcrypt`), otorisasi role (`CITIZEN`, `VERIFIER`, `OFFICER`, `ADMIN`), dan perlindungan privasi NIK (NIK disembunyikan total dari response JSON API).
- **Phase 4 — Report CRUD, Upload & Location**: Pembuatan pengaduan (`POST /api/v1/reports`), penanganan dynamic fields per kategori, validasi upload foto bukti (maksimal 5 foto, 5MB per file, pengecekan signature Magic Bytes `\xff\xd8\xff` / `\x89PNG`), generasi nomor laporan atomik `SIGAP-{YYYY}-{SEQUENCE}`, controlled file serve (`GET /api/v1/uploads/{path}`), dan pencarian sekitar koordinat lokasi Haversine (`GET /api/v1/reports/nearby`).
- **Phase 5 — Report Workflow (Verifikasi → Prioritas → Assignment → Penanganan)**: Modul Workflow Pengaduan Laporan Lengkap untuk `VERIFIER`, `OFFICER`, dan `ADMIN`. Diaudit & dilengkapi dengan database row locking (`SELECT ... FOR UPDATE`), penanganan `UNRESOLVED` reassign, validasi duplikat, dan pencatatan laporan tindakan progresif (`waktu_selesai` nullable).
- **Phase 6 — AI Contract, Schema & Trigger Flow**: Pembentukan kontrak Pydantic (`AIAnalysisResult`, `AIAnalysisResponse`), provider interface adapter (`GeminiProvider` stub), background task generation async (`run_analysis_job`), caching hasil `COMPLETED`, dan dua endpoint API (`GET /api/v1/reports/{id}/ai-analysis` & `POST /api/v1/reports/{id}/ai-analysis/reanalyze`) untuk `VERIFIER` & `ADMIN`.
- **Phase 7 — Gemini API Integration**: Integrasi SDK `google-genai` pada `GeminiProvider.analyze()`, pembangun prompt terstruktur (`app/services/ai/prompts.py`), pemrosesan foto bukti multimodal (maksimal 3 foto), penanganan timeout & exception rapi (berujung status `FAILED`), serta script pengujian manual `scripts/test_gemini_manual.py`. Panggilan `pytest` otomatis tetap ter-mock offline.
- **Prasyarat Phase 8 — Seed Dataset Sintetis**: Script idempotent `scripts/seed_report_dataset.py` untuk menguji dashboard/agregasi/peta sebaran Verifier dengan 100–150 laporan dummy realistis, gambar bukti sintetis (Pillow magic bytes), variasi lokasi & rentang tanggal (~4 bulan), serta dukungan flag `--reset` dan `--with-ai`.
- **Phase 8 — Dashboard & Agregasi Verifier**: Endpoint statistik ringkasan (`GET /api/v1/dashboard/summary`), tren waktu daily/weekly (`GET /api/v1/dashboard/trend`), dan antrean perhatian (`GET /api/v1/dashboard/needs-attention`) untuk role Verifier/Admin, dilengkapi SLA breach tracking (`URGENT_SLA_HOURS = 2`).



---

## Tech Stack

| Component          | Technology                     | Description                                |
| ------------------ | ------------------------------ | ------------------------------------------ |
| **Framework**      | FastAPI                        | Asynchronous Web Framework                 |
| **Database**       | MySQL (XAMPP / Production)     | Relational Database Management System      |
| **ORM**            | SQLAlchemy 2.0                 | Python SQL Toolkit & ORM                   |
| **Migrations**     | Alembic                        | Database Migration Tool                    |
| **Authentication** | JWT (`python-jose`) + `bcrypt` | Stateful/Stateless Auth & Password Hashing |
| **Validation**     | Pydantic v2                    | Request/Response Validation Schemas        |
| **Testing**        | `pytest`                       | Automated Unit & Integration Testing       |

---

## Diagram Transisi Status Laporan (State Machine)

```text
               ┌───────────────────────┐
               │ PENDING_VERIFICATION  │
               └───────────┬───────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
       ┌──────────┐  ┌──────────┐  ┌───────────┐
       │ VERIFIED │  │ REJECTED │  │ DUPLICATE │ (Workflow Berhenti)
       └─────┬────┘  └──────────┘  └───────────┘
             │ (Assign / Reassign)
             ▼
        ┌──────────┐
        │ ASSIGNED │
        └────┬─────┘
             │ (Start Handling)
             ▼
       ┌─────────────┐
       │ IN_PROGRESS │ ◄── (ActionReports dicatat berulang; waktu_selesai opsional jika ongoing)
       └──────┬──────┘
              │
        ┌─────┴─────┐
        ▼           ▼
   ┌──────────┐ ┌────────────┐
   │ RESOLVED │ │ UNRESOLVED │ ─── (Dapat di-reassign ke Officer lain untuk retry)
   └────┬─────┘ └─────┬──────┘
        │             │
        └──────┬──────┘
               │ (Close Report oleh VERIFIER/ADMIN)
               ▼
           ┌────────┐
           │ CLOSED │
           └────────┘
```

---

## Struktur Proyek

```text
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py        # Endpoint registrasi, login, me — Phase 3
│   │   │   ├── categories.py  # Endpoint master kategori & dynamic fields — Phase 4
│   │   │   ├── reports.py     # Endpoint CRUD & workflow pengaduan — Phase 4 & 5
│   │   │   └── uploads.py     # Controlled serve file foto bukti — Phase 4
│   │   └── dependencies.py    # RBAC & Auth dependencies (get_current_user, require_role) — Phase 3
│   ├── core/
│   │   ├──           # Settings Pydantic & variabel lingkungan (.env)
│   │   ├── database.py        # SQLAlchemy Engine & Session Local
│   │   ├── exceptions.py      # Custom exception handler (SigapException)
│   │   └── security.py        # Bcrypt hashing & JWT token helpers — Phase 3
│   ├── models/                # SQLAlchemy 2.0 models & domain enums — Phase 2, 4, 5
│   ├── schemas/               # Request/Response Pydantic schemas — Phase 3–5
│   ├── repositories/          # Data access layer (UserRepository, CategoryRepository, ReportRepository)
│   ├── services/
│   │   ├── report_service.py  # Terpusat business logic pengaduan & state machine — Phase 4 & 5
│   │   ├── storage_service.py # Pengelola file upload & magic bytes check — Phase 4
│   │   └── ai/                # Skeleton AI service — diaktifkan Phase 10
│   └── main.py                # Entrypoint aplikasi FastAPI
├── alembic/                   # Skrip migration database Alembic (Phase 2, 4, 5)
├── pytest.ini                 # Filter warnings pytest
├── scripts/
│   ├── seed_categories.py     # Script seed data master kategori pengaduan — Phase 4
│   └── test_mysql_concurrency.py # Script uji konkurensi row locking (FOR UPDATE) di MySQL
├── tests/                     # Automated unit & integration tests (28 test cases)
├── .env.example
├── requirements.txt
└── README.md
```

---

## Setup & Menjalankan Aplikasi

1. **Aktifkan Virtual Environment**:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate      # Linux/macOS: source .venv/bin/activate
   ```

2. **Install Dependency**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Konfigurasi Environment**:
   Salin `.env.example` menjadi `.env` dan sesuaikan URL database MySQL lokal Anda:

   ```bash
   cp .env.example .env
   ```

4. **Jalankan Migration Database & Seed Data**:

   ```bash
   alembic upgrade head
   python scripts/seed_categories.py
   python scripts/seed_staff_accounts.py
   ```

   > ⚠️ **PERINGATAN KEAMANAN**: `scripts/seed_staff_accounts.py` **HANYA** digunakan untuk lingkungan pengujian lokal / staging / E2E automated test. **JANGAN PERNAH** menjalankan skrip ini di lingkungan database produksi! Skrip ini membuat akun staf bawaan (`verifier1@sigap.test`, `officer1@sigap.test`, `officer2@sigap.test`, `admin1@sigap.test`).

5. **Jalankan Server Development**:

   ```bash
   uvicorn app.main:app --reload
   ```

   - API Docs (Swagger UI): `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/api/v1/health`

---

## Endpoint API Utama (Phase 1 — Phase 5)

| Method | Endpoint                              | Akses Modul      | Deskripsi Endpoint                                       |
| ------ | ------------------------------------- | ---------------- | -------------------------------------------------------- |
| POST   | `/api/v1/auth/register`               | Publik           | Registrasi akun masyarakat baru (`CITIZEN`).             |
| POST   | `/api/v1/auth/login`                  | Publik           | Authentikasi login user (Email/No HP + Password).        |
| GET    | `/api/v1/auth/me`                     | Authenticated    | Profil pengguna login (NIK terlindungi).                 |
| GET    | `/api/v1/categories`                  | Publik / CITIZEN | Master kategori & field dinamis pengaduan.               |
| POST   | `/api/v1/reports`                     | CITIZEN          | Membuat laporan pengaduan + upload foto bukti.           |
| GET    | `/api/v1/reports/me`                  | CITIZEN          | Daftar pengaduan milik pengguna (paginated).             |
| GET    | `/api/v1/reports/nearby`              | Publik / CITIZEN | Pencarian pengaduan di sekitar koordinat lokasi.         |
| GET    | `/api/v1/reports/{id}`                | Authenticated    | Detail 1 pengaduan + timeline status & action reports.   |
| GET    | `/api/v1/uploads/{path}`              | Publik           | Controlled serve foto bukti pengaduan.                   |
| GET    | `/api/v1/officers`                    | VERIFIER/ADMIN   | Daftar user ber-role `OFFICER` untuk penugasan.          |
| GET    | `/api/v1/reports`                     | VERIFIER/ADMIN   | Antrean laporan terfilter (status, kategori, tanggal).   |
| PATCH  | `/api/v1/reports/{id}/verify`         | VERIFIER/ADMIN   | Verifikasi laporan (`VERIFIED`/`REJECTED`/`DUPLICATE`).  |
| PATCH  | `/api/v1/reports/{id}/priority`       | VERIFIER/ADMIN   | Penyesuaian prioritas laporan.                           |
| POST   | `/api/v1/reports/{id}/assign`         | VERIFIER/ADMIN   | Penugasan / penugasan ulang (`reassign`) ke petugas.     |
| GET    | `/api/v1/reports/assigned-to-me`      | OFFICER          | Daftar pengaduan aktif yang ditugaskan ke officer login. |
| PATCH  | `/api/v1/reports/{id}/start-handling` | OFFICER          | Mulai penanganan lapangan (`ASSIGNED` → `IN_PROGRESS`).  |
| POST   | `/api/v1/reports/{id}/action-reports` | OFFICER          | Mencatat laporan tindakan hasil kerja di lapangan.       |
| PATCH  | `/api/v1/reports/{id}/resolve`        | OFFICER          | Penyelesaian laporan (`RESOLVED` / `UNRESOLVED`).        |
| PATCH  | `/api/v1/reports/{id}/close`          | VERIFIER/ADMIN   | Penutupan kasus pengaduan laporan (`CLOSED`).            |
| GET    | `/api/v1/reports/{id}/ai-analysis`    | VERIFIER/ADMIN   | Mendapatkan hasil analisis AI / memicu analisis baru.    |
| POST   | `/api/v1/reports/{id}/ai-analysis/reanalyze` | VERIFIER/ADMIN | Memicu paksa pembuatan analisis AI baru (re-analyze). |
| GET    | `/api/v1/dashboard/summary`           | VERIFIER/ADMIN   | Ringkasan statistik jumlah laporan per status, prioritas, & needs attention. |
| GET    | `/api/v1/dashboard/trend`             | VERIFIER/ADMIN   | Tren jumlah laporan masuk per hari atau minggu (maks. 180 hari).             |
| GET    | `/api/v1/dashboard/needs-attention`   | VERIFIER/ADMIN   | Antrean laporan yang membutuhkan perhatian (AI review / URGENT SLA breach). |

---

## Testing & Verification

### 1. Automated Test Suite (Pytest)

Menjalankan seluruh 37 unit & integration test suite (dengan provider Gemini yang ter-mock offline secara otomatis):

```bash
pytest -v
```

Hasil Pengujian:

```text
============================= 43 passed in 43.98s =============================
```

### 2. Live Gemini API Test & Estimasi Biaya (Phase 7)
- **Model Digunakan**: `gemini-2.0-flash-lite` (dapat dikonfigurasi via `.env` -> `AI_MODEL`).
- **Pengujian Manual dengan API Key Nyata**:
  ```bash
  python scripts/test_gemini_manual.py
  ```
- **Estimasi Biaya per Analisis Laporan** (berdasarkan pricing resmi Gemini 1.5/3.x Flash-Lite):
  - Input Teks: ~$0.075 / 1 juta token.
  - Input Gambar (multimodal): ~258 token per gambar (~$0.00002 per gambar).
  - Output Teks JSON: ~$0.30 / 1 juta token (~150 token per analisis).
  - **Estimasi Total Biaya per 1 Laporan Pengaduan**: ~$0.00005 USD (kurang lebih **Rp 0.8 per laporan**).



### 2. Multi-Connection MySQL Row Locking Test

Untuk menguji penguncian tingkat baris (`SELECT ... FOR UPDATE`) secara nyata pada koneksi/session MySQL terpisah, jalankan skrip pengujian konkurensi:

```bash
python scripts/test_mysql_concurrency.py
python scripts/test_mysql_ai_concurrency.py
```

Skrip ini membuat 2 OS thread terpisah dengan 2 session MySQL independen yang menembak laporan yang sama secara simultan, membuktikan bahwa transaksi MySQL InnoDB terkunci secara atomik dan menghasilkan tepat 1 assignment aktif (`is_current = True`) serta tepat 1 row `PENDING` AI Analysis tanpa race condition duplikasi.

### 3. Seed Dataset Sintetis (Prasyarat Phase 8 & 9)

Script `scripts/seed_report_dataset.py` meng-generate 100–150 laporan sintetis realistis yang tersebar di seluruh kategori, prioritas, status lifecycle, rentang tanggal (~4 bulan ke belakang), dan koordinat wilayah Lamongan. Data ini murni untuk uji Phase 8/9, bukan data produksi.

**Cara Penggunaan**:
```bash
# 1. Pastikan kategori & akun staff sudah di-seed
python scripts/seed_categories.py
python scripts/seed_staff_accounts.py

# 2. Jalankan seeder laporan (default 120 laporan, idempotent)
python scripts/seed_report_dataset.py

# 3. Jalankan ulang dengan --reset jika ingin menghapus & membuat ulang data seed
python scripts/seed_report_dataset.py --reset

# 4. Jalankan dengan AI analysis Gemini nyata untuk ~20 laporan
python scripts/seed_report_dataset.py --with-ai
```

**Fitur Utama Seed Script**:
- **Idempotent**: Semua laporan seed diberi prefix `SIGAP-SEED-`. Script mengecek keberadaan data seed dan melakukan skip jika sudah ada. `--reset` hanya menghapus data berprefix seed tanpa menyentuh akun staff atau data e2e Playwright.
- **Gambar Bukti Sintetis (Pillow)**: Menghasilkan gambar JPEG valid magic-bytes dengan kanvas warna solid + label teks kategori. Tanpa foto kecelakaan/korban asli.
- **Lifecycle & History Konsisten**: Menggunakan status lifecycle lengkap (`PENDING_VERIFICATION`, `VERIFIED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED`, `UNRESOLVED`, `DUPLICATE`) dengan pencatatan `ReportAssignment`, `ReportStatusHistory`, dan `ActionReport`.


---

## Catatan Desain Arsitektur & Resolusi Audit (Phase 5)

1. **Pencegahan Stale Snapshot MVCC InnoDB MySQL & Race Condition AI Analysis**:
   Dalam metode `assign_report` dan `get_or_trigger_analysis`, sistem mengeksekusi `SELECT ... FOR UPDATE` pada baris `Report` / `ReportAssignment` terkait. Ini memaksa MySQL InnoDB membaca data committed terbaru dan mengunci transaksi secara atomik untuk mencegah race condition assignment ganda atau duplikasi row `PENDING` AI Analysis pada request simultan.
   *Known Trade-off*: Penguncian `.with_for_update()` pada `Report` menyebabkan request `GET /ai-analysis` yang berjalan bersamaan untuk laporan yang sama akan ter-serialisasi di level transaksi DB. Hal ini ideal dan aman untuk alur kerja verifikasi laporan.
2. **ActionReport `waktu_selesai` Nullable**:
   Field `waktu_selesai` bersifat opsional (`datetime | None`) untuk mengizinkan officer mencatat tindakan penanganan bertahap/progresif saat baru tiba di lokasi.
3. **Penanganan Laporan `UNRESOLVED`**:
   Laporan berstatus `UNRESOLVED` dapat ditugaskan kembali (`assign`) ke petugas lain oleh Verifier untuk penanganan ulang dengan tim/alat berat tambahan, atau ditutup resmi (`close`) oleh Verifier/Admin.
4. **Validasi Referensi `DUPLICATE`**:
   Keputusan `DUPLICATE` mewajibkan `duplicate_of_report_id` terisi, menunjuk ID laporan yang ada, serta melarang referensi ke laporan itu sendiri.
5. **Urutan Evaluasi Otorisasi & Validation**:
   Pengecekan "User target penugasan harus ber-role `OFFICER`" dievaluasi mendahului pengecekan penugasan ulang ke officer yang sama (`no-op reassign`), sehingga error yang dihasilkan tepat dan jelas.


---

## Alur Pengembangan Selanjutnya

- Phase 0 (Repository Audit) → Phase 1 (selesai) → Phase 2 (selesai) → Phase 3 (selesai) → Phase 4 (selesai) → Phase 5 (selesai) → Phase 6 (selesai) → Phase 7 (selesai) → **Phase 8 (Dashboard & Agregasi Verifier - selesai)** → Phase 9 (AI Integration FE)...


