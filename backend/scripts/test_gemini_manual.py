"""
Script Pengujian Manual Gemini API Sungguhan (Phase 7 Verification).

Menjalankan pemanggilan nyata ke Gemini API via google-genai SDK menggunakan
AI_API_KEY dari .env pada 2 laporan sampel (tanpa foto dan dengan foto bukti).

Penggunaan:
    python scripts/test_gemini_manual.py
"""

import asyncio
import os
from pathlib import Path
import sys
import time
from datetime import datetime

# Fix sys.path agar dapat di-import dari root folder backend
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models.enums import ReportPriority, ReportStatus, UserRole
from app.models.report import Report
from app.models.report_category import ReportCategory
from app.models.report_evidence import ReportEvidence
from app.models.user import User
from app.services.ai.provider import GeminiProvider
from app.services.ai.schemas import AnalysisType

VALID_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xff\xd9"


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


import app.core.database as db_module
db_module.SessionLocal = TestSessionLocal


def run_gemini_manual_test():

    print("==================================================================")
    print("  SIGAP Gemini API Live Test (google-genai SDK)")
    print("==================================================================")
    print(f"  AI Provider : {settings.AI_PROVIDER}")
    print(f"  AI Model    : {settings.AI_MODEL}")
    print(f"  AI Timeout  : {settings.AI_TIMEOUT}s")
    print(f"  API Key Set : {'Ya' if settings.AI_API_KEY else 'TIDAK'}")
    print("==================================================================\n")

    if not settings.AI_API_KEY:
        print("[ERROR] AI_API_KEY belum diisi di file .env!")
        return

    # Inisialisasi DB SQLite sementara untuk penyiapan objek Report
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()


    try:
        # 1. Setup Master Kategori
        cat_jalan = db.query(ReportCategory).filter(ReportCategory.nama_kategori == "Jalan Berlubang").first()
        if not cat_jalan:
            cat_jalan = ReportCategory(nama_kategori="Jalan Berlubang", default_priority=ReportPriority.HIGH, is_active=True)
            db.add(cat_jalan)

        cat_lampu = db.query(ReportCategory).filter(ReportCategory.nama_kategori == "Lampu Penerangan Jalan Padam").first()
        if not cat_lampu:
            cat_lampu = ReportCategory(nama_kategori="Lampu Penerangan Jalan Padam", default_priority=ReportPriority.MEDIUM, is_active=True)
            db.add(cat_lampu)

        db.commit()

        # 2. Setup User Reporter
        user = db.query(User).first()
        if not user:
            user = User(
                nama="Pelapor Test Gemini",
                nik="3524010000000001",
                email="reporter_gemini@sigap.id",
                nomor_hp="081234567890",
                password_hash="fakehash",
                role=UserRole.CITIZEN,
            )
            db.add(user)
            db.commit()

        # 3. Sampel Report 1: Tanpa Foto Bukti
        report_no_photo = Report(
            nomor_laporan=f"SIGAP-TEST-NOIMG-{int(time.time())}",
            citizen_id=user.id,
            category_id=cat_jalan.id,
            deskripsi="Ada lubang sangat dalam berdiameter 1 meter di Jalan Raya Babat-Lamongan Km 5. Sangat membahayakan pengendara motor di malam hari.",
            waktu_kejadian=datetime.now(),
            latitude=-7.1189,
            longitude=112.4167,
            alamat_lokasi="Jl. Raya Babat-Lamongan Km 5",
            status=ReportStatus.PENDING_VERIFICATION,
        )
        db.add(report_no_photo)
        db.commit()
        db.refresh(report_no_photo)

        # 4. Sampel Report 2: Dengan Foto Bukti (Simulasi Simpan Foto)
        evidence_dir = Path(settings.STORAGE_LOCAL_PATH) / "evidences" / "test"
        evidence_dir.mkdir(parents=True, exist_ok=True)
        img_file = evidence_dir / "sample_hole.jpg"
        img_file.write_bytes(VALID_JPEG_BYTES)
        rel_img_path = "evidences/test/sample_hole.jpg"

        report_with_photo = Report(
            nomor_laporan=f"SIGAP-TEST-IMG-{int(time.time())}",
            citizen_id=user.id,
            category_id=cat_lampu.id,
            deskripsi="Lampu PJU padam 3 titik berturut-turut di persimpangan jalan utama, situasi sangat gelap dan rawan kecelakaan.",
            waktu_kejadian=datetime.now(),
            latitude=-7.1150,
            longitude=112.4200,
            alamat_lokasi="Jl. Merdeka No. 45",
            status=ReportStatus.PENDING_VERIFICATION,
        )
        db.add(report_with_photo)
        db.commit()
        db.refresh(report_with_photo)

        ev = ReportEvidence(
            report_id=report_with_photo.id,
            file_path=rel_img_path,
        )

        db.add(ev)
        db.commit()
        db.refresh(report_with_photo)

        provider = GeminiProvider()

        # TEST 1: Panggilan Gemini tanpa foto
        print("------------------------------------------------------------------")
        print(f"[TEST 1] Memanggil Gemini API untuk Report #{report_no_photo.id} (TANPA FOTO)...")
        res1 = asyncio.run(provider.analyze(report_no_photo, AnalysisType.CATEGORY_PRIORITY_SUGGESTION))
        print("  <- RESULT TEST 1 SUKSES:")
        print(f"     Model              : {res1.model_name}")
        print(f"     Suggested Category : {res1.suggested_category}")
        print(f"     Suggested Priority : {res1.suggested_priority}")
        print(f"     Confidence         : {res1.confidence}")
        print(f"     Needs Human Review : {res1.needs_human_review}")
        print(f"     Summary            : {res1.summary}")
        print(f"     Evidence Points    : {res1.evidence}")
        print(f"     Warnings           : {res1.warnings}\n")

        # TEST 2: Panggilan Gemini dengan foto
        print("------------------------------------------------------------------")
        print(f"[TEST 2] Memanggil Gemini API untuk Report #{report_with_photo.id} (DENGAN FOTO BUKTI)...")
        res2 = asyncio.run(provider.analyze(report_with_photo, AnalysisType.CATEGORY_PRIORITY_SUGGESTION))
        print("  <- RESULT TEST 2 SUKSES:")
        print(f"     Model              : {res2.model_name}")
        print(f"     Suggested Category : {res2.suggested_category}")
        print(f"     Suggested Priority : {res2.suggested_priority}")
        print(f"     Confidence         : {res2.confidence}")
        print(f"     Needs Human Review : {res2.needs_human_review}")
        print(f"     Summary            : {res2.summary}")
        print(f"     Evidence Points    : {res2.evidence}")
        print(f"     Warnings           : {res2.warnings}\n")

        print("==================================================================")
        print("  PENGUJIAN MANUAL GEMINI API SELESAI 100% SUKSES!")
        print("==================================================================")

    finally:
        db.close()


if __name__ == "__main__":
    run_gemini_manual_test()
