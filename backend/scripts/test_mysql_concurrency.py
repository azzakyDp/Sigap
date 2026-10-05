"""
Script Uji Konkurensi MySQL SIGAP (True Multi-Connection MySQL Row Locking Test).

Menjalankan uji konkurensi langsung di atas MySQL `sigapdb` dengan 2 koneksi DB/SessionLocal terpisah
pada 2 thread sejalan (ThreadPoolExecutor) untuk memverifikasi bahwa `SELECT ... FOR UPDATE` (row lock)
berhasil mengunci dan men-serialisasi transaksi penugasan (assignment) ganda secara aman.

Penggunaan:
    python scripts/test_mysql_concurrency.py
"""

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
from app.models.enums import ReportPriority, ReportStatus, UserRole
from app.models.report import Report
from app.models.report_assignment import ReportAssignment
from app.models.report_category import ReportCategory
from app.models.user import User
from app.schemas.workflow import AssignReportRequest
from app.services.report_service import ReportService


def run_mysql_concurrency_test():
    print("==================================================================")
    print("  SIGAP MySQL Row Locking Concurrency Test (SELECT ... FOR UPDATE)")
    print("==================================================================")

    db_init = SessionLocal()
    try:
        # 1. Setup Data Uji di MySQL
        print("[1] Mempersiapkan data uji di MySQL local database...")

        # Pastikan Kategori Uji Ada
        cat = db_init.scalar(select(ReportCategory).where(ReportCategory.nama_kategori == "Uji Konkurensi"))
        if not cat:
            cat = ReportCategory(
                nama_kategori="Uji Konkurensi",
                default_priority=ReportPriority.HIGH,
                is_active=True,
            )
            db_init.add(cat)
            db_init.flush()

        # Users Uji (Verifier, Officer 1, Officer 2)
        verifier = db_init.scalar(select(User).where(User.email == "verifier_conc@sigap.id"))
        if not verifier:
            verifier = User(
                nama="Verifier Conc Test",
                nik="3524019999990001",
                email="verifier_conc@sigap.id",
                nomor_hp="081999990001",
                password_hash=hash_password("Password123!"),
                role=UserRole.VERIFIER,
            )
            db_init.add(verifier)

        officer1 = db_init.scalar(select(User).where(User.email == "officer1_conc@sigap.id"))
        if not officer1:
            officer1 = User(
                nama="Petugas Conc 1",
                nik="3524019999990002",
                email="officer1_conc@sigap.id",
                nomor_hp="081999990002",
                password_hash=hash_password("Password123!"),
                role=UserRole.OFFICER,
            )
            db_init.add(officer1)

        officer2 = db_init.scalar(select(User).where(User.email == "officer2_conc@sigap.id"))
        if not officer2:
            officer2 = User(
                nama="Petugas Conc 2",
                nik="3524019999990003",
                email="officer2_conc@sigap.id",
                nomor_hp="081999990003",
                password_hash=hash_password("Password123!"),
                role=UserRole.OFFICER,
            )
            db_init.add(officer2)

        db_init.commit()
        db_init.refresh(verifier)
        db_init.refresh(officer1)
        db_init.refresh(officer2)

        verifier_id = verifier.id
        officer1_id = officer1.id
        officer2_id = officer2.id

        # Buat Report Terverifikasi
        ts = int(time.time())
        report = Report(
            nomor_laporan=f"SIGAP-CONC-{ts}",
            citizen_id=verifier_id,
            category_id=cat.id,
            deskripsi="Laporan uji konkurensi MySQL row locking",
            waktu_kejadian=datetime.now(),
            latitude=-7.1189,
            longitude=112.4150,
            alamat_lokasi="Lokasi Uji Konkurensi",
            status=ReportStatus.VERIFIED,
            priority=ReportPriority.HIGH,
        )
        db_init.add(report)
        db_init.commit()
        db_init.refresh(report)
        report_id = report.id
        print(f"    + Laporan Uji Dibuat ID #{report_id} (Nomor: {report.nomor_laporan}, Status: VERIFIED)")

    finally:
        db_init.close()

    # 2. Eksekusi 2 Thread Paralel dengan 2 Session MySQL Terpisah
    print("\n[2] Menjalankan 2 Thread simultan dengan 2 Session MySQL terpisah...")
    report_service = ReportService()

    def assign_worker(target_officer_id: int, worker_name: str):
        db_thread = SessionLocal()
        try:
            print(f"    -> Thread [{worker_name}] mencoba assign Laporan #{report_id} ke Officer #{target_officer_id}...")
            req = AssignReportRequest(officer_id=target_officer_id, catatan=f"Assignment simultan dari {worker_name}")
            current_verifier = db_thread.get(User, verifier_id)
            res = report_service.assign_report(
                db=db_thread,
                current_user=current_verifier,
                report_id=report_id,
                payload=req,
            )
            print(f"    <- Thread [{worker_name}] SUKSES. Status Laporan: {res.status_raw}")
            return True, None
        except Exception as exc:
            print(f"    <- Thread [{worker_name}] GAGAL/DITOLAK: {exc}")
            return False, exc
        finally:
            db_thread.close()

    with ThreadPoolExecutor(max_workers=2) as executor:
        t1 = executor.submit(assign_worker, officer1_id, "Thread-1 (Officer 1)")
        t2 = executor.submit(assign_worker, officer2_id, "Thread-2 (Officer 2)")
        r1_success, err1 = t1.result()
        r2_success, err2 = t2.result()

    # 3. Verifikasi Konsistensi DB MySQL
    print("\n[3] Memeriksa konsistensi data akhir di MySQL database...")
    db_check = SessionLocal()
    try:
        active_assignments = (
            db_check.scalars(
                select(ReportAssignment).where(
                    ReportAssignment.report_id == report_id,
                    ReportAssignment.is_current.is_(True),
                )
            )
            .all()
        )
        total_assignments = (
            db_check.scalars(
                select(ReportAssignment).where(ReportAssignment.report_id == report_id)
            )
            .all()
        )

        print(f"    Total baris assignment tercatat: {len(total_assignments)}")
        print(f"    Total assignment aktif (is_current=True): {len(active_assignments)}")

        assert len(active_assignments) == 1, "GAGAL: Harus ada TEPAT SATU assignment aktif!"
        active_officer_id = active_assignments[0].officer_id
        print(f"    Officer aktif terpilih di MySQL: ID #{active_officer_id}")

        print("\n==================================================================")
        print("  HASIL: SUKSES 100%! Transaksi MySQL Row Lock (SELECT ... FOR UPDATE)")
        print("  berhasil mengamankan transaksi simultan tanpa race condition!")
        print("==================================================================")

    finally:
        db_check.close()


if __name__ == "__main__":
    run_mysql_concurrency_test()
