"""
Script Uji Konkurensi MySQL AI Analysis SIGAP (True Multi-Connection MySQL Row Locking Test).

Menjalankan uji konkurensi langsung di atas MySQL `sigapdb` dengan 2 koneksi DB/SessionLocal terpisah
pada 2 thread sejalan (ThreadPoolExecutor) untuk memverifikasi bahwa `SELECT ... FOR UPDATE` (row lock)
berhasil mengunci dan men-serialisasi pembuatan AI Analysis (PENDING) secara aman tanpa duplikasi.

Penggunaan:
    python scripts/test_mysql_ai_concurrency.py
"""

import asyncio
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

# Fix sys.path agar dapat di-import dari root folder backend
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.ai_analysis import AIAnalysis
from app.models.enums import AIAnalysisStatus, ReportPriority, ReportStatus, UserRole
from app.models.report import Report
from app.models.report_category import ReportCategory
from app.models.user import User
from app.services.ai.ai_service import AIAnalysisService


class DummyBackgroundTasks:
    def add_task(self, func, *args, **kwargs):
        pass


def run_mysql_ai_concurrency_test():
    print("==================================================================")
    print("  SIGAP MySQL AI Analysis Concurrency Test (SELECT ... FOR UPDATE)")
    print("==================================================================")

    db_init = SessionLocal()
    try:
        # Ensure tables exist
        from app.core.database import Base
        Base.metadata.create_all(bind=db_init.get_bind())

        # 1. Setup Data Uji di MySQL
        print("[1] Mempersiapkan data uji laporan di MySQL database...")


        cat = db_init.scalar(select(ReportCategory).where(ReportCategory.nama_kategori == "Uji AI Konkurensi"))
        if not cat:
            cat = ReportCategory(
                nama_kategori="Uji AI Konkurensi",
                default_priority=ReportPriority.HIGH,
                is_active=True,
            )
            db_init.add(cat)
            db_init.flush()

        verifier = db_init.scalar(select(User).where(User.email == "verifier_ai_conc@sigap.id"))
        if not verifier:
            verifier = User(
                nama="Verifier AI Conc Test",
                nik="3524019999990009",
                email="verifier_ai_conc@sigap.id",
                nomor_hp="081999990009",
                password_hash=hash_password("Password123!"),
                role=UserRole.VERIFIER,
            )
            db_init.add(verifier)

        db_init.commit()
        db_init.refresh(verifier)

        ts = int(time.time())
        report = Report(
            nomor_laporan=f"SIGAP-AI-CONC-{ts}",
            citizen_id=verifier.id,
            category_id=cat.id,
            deskripsi="Laporan uji konkurensi AI Analysis MySQL row locking",
            waktu_kejadian=datetime.now(),
            latitude=-7.1189,
            longitude=112.4150,
            alamat_lokasi="Lokasi Uji AI Konkurensi",
            status=ReportStatus.PENDING_VERIFICATION,
            priority=ReportPriority.HIGH,
        )
        db_init.add(report)
        db_init.commit()
        db_init.refresh(report)
        report_id = report.id
        print(f"    + Laporan Uji Dibuat ID #{report_id} (Nomor: {report.nomor_laporan})")

    finally:
        db_init.close()

    # 2. Eksekusi 2 Thread Paralel dengan 2 Session MySQL Terpisah
    print("\n[2] Menjalankan 2 Thread simultan memicu get_or_trigger_analysis dengan 2 Session MySQL terpisah...")
    ai_service = AIAnalysisService()

    def worker(worker_name: str):
        db_thread = SessionLocal()
        try:
            print(f"    -> Thread [{worker_name}] memanggil get_or_trigger_analysis untuk Report #{report_id}...")
            bg_tasks = DummyBackgroundTasks()
            res = asyncio.run(
                ai_service.get_or_trigger_analysis(
                    db=db_thread,
                    report_id=report_id,
                    background_tasks=bg_tasks,
                )
            )
            print(f"    <- Thread [{worker_name}] SUKSES. ID AIAnalysis: #{res.id}, Status: {res.status}")
            return res
        finally:
            db_thread.close()

    with ThreadPoolExecutor(max_workers=2) as executor:
        t1 = executor.submit(worker, "Thread-1")
        t2 = executor.submit(worker, "Thread-2")
        res1 = t1.result()
        res2 = t2.result()

    # 3. Verifikasi Konsistensi DB MySQL
    print("\n[3] Memeriksa konsistensi data akhir tabel ai_analyses di MySQL database...")
    db_check = SessionLocal()
    try:
        analyses = (
            db_check.scalars(
                select(AIAnalysis).where(AIAnalysis.report_id == report_id)
            )
            .all()
        )

        print(f"    Total baris AIAnalysis untuk Report #{report_id}: {len(analyses)}")
        for a in analyses:
            print(f"    - ID: #{a.id}, Status: {a.status}, Model: {a.model_name}")

        assert len(analyses) == 1, f"GAGAL: Harus ada TEPAT SATU row AIAnalysis, tapi ditemukan {len(analyses)}"
        assert res1.id == res2.id, f"GAGAL: Thread 1 ID (#{res1.id}) != Thread 2 ID (#{res2.id})"

        print("\n==================================================================")
        print("  HASIL: SUKSES 100%! Transaksi MySQL Row Lock (SELECT ... FOR UPDATE)")
        print("  berhasil mencegah duplikasi PENDING row pada request simultan!")
        print("==================================================================")

    finally:
        db_check.close()


if __name__ == "__main__":
    run_mysql_ai_concurrency_test()
