"""
Script Seed Dataset Sintetis SIGAP (Prasyarat Phase 8 & Phase 9).

Mengisi database dengan dataset laporan pengaduan dummy (100–150 laporan) yang terdistribusi
di seluruh kategori, prioritas, status lifecycle, rentang tanggal (~4 bulan), dan koordinat lokasi.
Gambar bukti dibuat sintetis (solid color canvas dengan teks label via Pillow) tanpa foto asli/privasi.

Penggunaan:
    python scripts/seed_report_dataset.py
    python scripts/seed_report_dataset.py --reset
    python scripts/seed_report_dataset.py --with-ai
    python scripts/seed_report_dataset.py --count 150 --reset --with-ai
"""

import argparse
import asyncio
import io
import os
import random
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

from PIL import Image, ImageDraw

# Fix sys.path agar dapat di-import dari root folder backend
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import BackgroundTasks, UploadFile
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.action_report import ActionReport
from app.models.ai_analysis import AIAnalysis
from app.models.category_field import CategoryField
from app.models.enums import AIAnalysisStatus, ReportPriority, ReportStatus, UserRole
from app.models.report import Report
from app.models.report_assignment import ReportAssignment
from app.models.report_category import ReportCategory
from app.models.report_evidence import ReportEvidence
from app.models.report_field_value import ReportFieldValue
from app.models.report_status_history import ReportStatusHistory
from app.models.user import User
from app.services.ai.ai_service import AIAnalysisService, run_analysis_job
from app.services.storage_service import StorageService

SEED_PREFIX = "SIGAP-SEED-"

CATEGORY_COLORS = {
    "Jalan Rusak / Berlubang": (192, 57, 43),          # Merah Crimson
    "Lampu Lalu Lintas Padam / Rusak": (243, 156, 18), # Oranye Kuning
    "Rambu Lalu Lintas Rusak / Tertutup": (41, 128, 185),# Biru
    "Pohon Tumbang / Penghalang Jalan": (39, 174, 96), # Hijau
}

# Template Deskripsi & Lokasi Realistis Wilayah Lamongan
REPORT_TEMPLATES = {
    "Jalan Rusak / Berlubang": {
        "descriptions": [
            "Terdapat lubang cukup dalam berdiameter 80 cm di tengah jalan raya utama. Sangat membahayakan pengendara sepeda motor pada malam hari.",
            "Aspal terkelupas sepanjang 15 meter menyebabkan jalan bergelombang parah dan sering memicu rem mendadak kendaraan berat.",
            "Retakan aspal melebar dan ambles di dekat jembatan, perlu penambalan darurat sebelum retakan makin meluas.",
            "Jalan berlubang besar yang tertutup genangan air saat hujan deras, membuat banyak pengendara terperosok.",
            "Kerusakan jalan parah dengan batu kerikil berserakan di tikungan tajam, sangat licin saat basah.",
        ],
        "locations": [
            ("Jl. Raya Babat-Lamongan Km 4, Kec. Deket", -7.1189, 112.4167),
            ("Jl. Merdeka No. 45, Sidokumpul, Kec. Lamongan", -7.1210, 112.4150),
            ("Jl. Panglima Sudirman No. 12, Kec. Lamongan", -7.1165, 112.4210),
            ("Jl. Sunan Drajat No. 88, Kec. Lamongan", -7.1250, 112.4100),
            ("Jl. Raya Sugio-Lamongan Km 2, Kec. Sugio", -7.1500, 112.3800),
            ("Jl. Raya Kembangbahu, Kec. Kembangbahu", -7.1850, 112.3700),
        ],
    },
    "Lampu Lalu Lintas Padam / Rusak": {
        "descriptions": [
            "Lampu PJU padam 4 titik berturut-turut menyebabkan persimpangan jalan sangat gelap dan rawan tindak kejahatan.",
            "Traffic light di simpang empat tidak menyala pada aspek hijau, membuat arus kendaraan semrawut dan saling serobot.",
            "Tiang lampu penerangan miring tersenggol truk dan kabelnya menjuntai ke badan jalan.",
            "Lampu kuning berkedip (warning light) mati total sejak dua hari lalu di area persimpangan padat.",
            "Penerangan jalan umum redup dan sering mati hidup (flicker) mengganggu konsentrasi pengemudi.",
        ],
        "locations": [
            ("Simpang Empat Alun-Alun Lamongan, Kec. Lamongan", -7.1195, 112.4180),
            ("Jl. Veteran No. 10, Kec. Lamongan", -7.1220, 112.4125),
            ("Simpang Tiga Tugu Wingko Babat, Kec. Babat", -7.1050, 112.1650),
            ("Jl. Raya Tikung-Lamongan Km 3, Kec. Tikung", -7.1600, 112.4300),
            ("Jl. Lingkar Utara Lamongan, Kec. Deket", -7.1080, 112.4350),
        ],
    },
    "Rambu Lalu Lintas Rusak / Tertutup": {
        "descriptions": [
            "Rambu dilarang parkir roboh dan diletakkan sembarangan di pinggir trotoar.",
            "Rambu petunjuk arah jalan tertutup rimbunnya ranting pohon sehingga tidak terlihat oleh pengguna jalan dari kejauhan.",
            "Rambu penyeberangan jalan (zebra cross) pudar dan tiangnya berkarat hingga patah.",
            "Rambu peringatan tikungan tajam dicorat-coret vandalisme sehingga cat petunjuknya terkelupas.",
            "Cermin tikungan (convex mirror) buram dan pecah di belokan rawan kecelakaan.",
        ],
        "locations": [
            ("Jl. Ahmad Yani No. 30, Kec. Lamongan", -7.1170, 112.4190),
            ("Jl. Sunan Giri No. 15, Kec. Lamongan", -7.1235, 112.4140),
            ("Jl. Raya Mantup-Lamongan Km 5, Kec. Mantup", -7.2100, 112.3900),
            ("Jl. Raya Sukodadi, Kec. Sukodadi", -7.1350, 112.3200),
        ],
    },
    "Pohon Tumbang / Penghalang Jalan": {
        "descriptions": [
            "Batang pohon asam tua tumbang melintang menutupi sebagian badan jalan akibat hujan deras dan angin kencang.",
            "Dahan besar patah dan tersangkut kabel di atas jalan raya, berpotensi jatuh menimpa pengendara yang melintas.",
            "Material tanah longsor kecil dan bebatuan menutupi separuh bahu jalan utama.",
            "Tumpukan sampah dan puing bangunan dibuang sembarangan di badan jalan mengganggu arus lalu lintas.",
            "Pohon pelindung jalan miring parah dan akarnya terangkat dari trotoar.",
        ],
        "locations": [
            ("Jl. Raya Ploso-Babat Km 8, Kec. Kedungpring", -7.1800, 112.2100),
            ("Jl. Kusuma Bangsa No. 5, Kec. Lamongan", -7.1155, 112.4160),
            ("Jl. Raya Karanggeneng-Paciran, Kec. Karanggeneng", -7.0200, 112.3600),
            ("Jl. Raya Sambeng, Kec. Sambeng", -7.2500, 112.3500),
        ],
    },
}


def generate_placeholder_evidence_image(category_name: str, index: int) -> bytes:
    """
    Menghasilkan gambar JPEG sintetis valid (magic bytes \\xff\\xd8\\xff) menggunakan Pillow.
    Solid canvas berwarna sesuai kategori dengan label teks keterangan.
    """
    bg_color = CATEGORY_COLORS.get(category_name, (52, 73, 94))
    img = Image.new("RGB", (800, 600), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Bingkai dan teks sederhana
    draw.rectangle([20, 20, 780, 580], outline=(255, 255, 255), width=4)
    draw.text((40, 50), "SIGAP DATASET EVIDENCE (SYNTHETIC)", fill=(255, 255, 255))
    draw.text((40, 100), f"Kategori : {category_name}", fill=(255, 255, 255))
    draw.text((40, 150), f"Foto Bukti #{index}", fill=(255, 255, 255))
    draw.text((40, 200), f"Waktu Gen: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", fill=(240, 240, 240))
    draw.text((40, 250), "Gambar ini dibuat secara sintetis untuk data uji.", fill=(220, 220, 220))

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def reset_seed_data(db: Session, storage_service: StorageService):
    """
    Menghapus HANYA data laporan berprefix SIGAP-SEED- beserta relasinya.
    """
    print("[RESET] Menghapus data seed lama berprefix SIGAP-SEED-...")
    seed_reports = db.scalars(select(Report).where(Report.nomor_laporan.like(f"{SEED_PREFIX}%"))).all()
    seed_ids = [r.id for r in seed_reports]

    if not seed_ids:
        print("  - Tidak ada data seed lama yang ditemukan.")
        return

    # Delete related records
    db.execute(delete(AIAnalysis).where(AIAnalysis.report_id.in_(seed_ids)))
    db.execute(delete(ActionReport).where(ActionReport.report_id.in_(seed_ids)))
    db.execute(delete(ReportAssignment).where(ReportAssignment.report_id.in_(seed_ids)))
    db.execute(delete(ReportStatusHistory).where(ReportStatusHistory.report_id.in_(seed_ids)))
    db.execute(delete(ReportFieldValue).where(ReportFieldValue.report_id.in_(seed_ids)))

    # Delete evidence files & records
    evidences = db.scalars(select(ReportEvidence).where(ReportEvidence.report_id.in_(seed_ids))).all()
    for ev in evidences:
        try:
            local_path = storage_service.resolve_local_path(ev.file_path)
            if local_path.exists():
                local_path.unlink()
        except Exception:
            pass

    db.execute(delete(ReportEvidence).where(ReportEvidence.report_id.in_(seed_ids)))
    db.execute(delete(Report).where(Report.id.in_(seed_ids)))
    db.commit()

    print(f"  + Berhasil menghapus {len(seed_ids)} laporan seed lama beserta seluruh relasinya.")


def ensure_citizen_users(db: Session) -> list[User]:
    """
    Memastikan 10 akun dummy CITIZEN tersedia khusus untuk seeding.
    """
    citizens = []
    for i in range(1, 11):
        email = f"citizen-seed-{i:02d}@sigap.test"
        user = db.scalar(select(User).where(User.email == email))
        if not user:
            user = User(
                nama=f"Warga Lamongan {i:02d}",
                email=email,
                password_hash=hash_password("Citizen123!"),
                nik=f"352401990000{i:04d}",
                nomor_hp=f"08129990{i:04d}",
                role=UserRole.CITIZEN,
            )
            db.add(user)
            db.flush()
        citizens.append(user)
    db.commit()
    return citizens


def seed_dataset(total_count: int = 120, reset: bool = False, with_ai: bool = False):
    print("==================================================================")
    print("  SIGAP Dataset Sintetis Seeder (Prasyarat Phase 8)")
    print("==================================================================")
    print(f"  Total Laporan Target : {total_count}")
    print(f"  Flag --reset        : {reset}")
    print(f"  Flag --with-ai      : {with_ai}")
    print("==================================================================\n")

    db = SessionLocal()
    storage_service = StorageService()

    try:
        import app.models  # Ensure all SQLAlchemy models are registered
        from app.core.database import Base
        Base.metadata.create_all(bind=db.get_bind())

        if reset:

            reset_seed_data(db, storage_service)

        # 1. Cek Akun Staf (Verifier, Officers, Admin)
        verifier = db.scalar(select(User).where(User.email == "verifier1@sigap.test"))
        officer1 = db.scalar(select(User).where(User.email == "officer1@sigap.test"))
        officer2 = db.scalar(select(User).where(User.email == "officer2@sigap.test"))
        admin = db.scalar(select(User).where(User.email == "admin1@sigap.test"))

        if not all([verifier, officer1, officer2, admin]):
            print("[ERROR] Akun staf belum lengkap! Jalankan dahulu:")
            print("        python scripts/seed_staff_accounts.py")
            sys.exit(1)

        officers = [officer1, officer2]

        # 2. Cek Kategori Master
        categories = db.scalars(select(ReportCategory).where(ReportCategory.is_active.is_(True))).all()
        if not categories:
            print("[ERROR] Kategori master belum ada! Jalankan dahulu:")
            print("        python scripts/seed_categories.py")
            sys.exit(1)

        # 3. Pastikan Akun Citizen Seed Ada
        citizens = ensure_citizen_users(db)

        # 4. Cek Laporan Seed yang Sudah Ada (Idempotency Check)
        existing_seed_count = db.scalar(
            select(func.count(Report.id)).where(Report.nomor_laporan.like(f"{SEED_PREFIX}%"))
        ) or 0

        if existing_seed_count >= total_count:
            print(f"[INFO] Sudah terdapat {existing_seed_count} laporan seed di database.")
            print("       Gunakan flag --reset jika ingin membuat ulang dataset seed.")
            return

        needed_count = total_count - existing_seed_count
        print(f"[1] Generasi {needed_count} laporan baru (Seed Prefix: {SEED_PREFIX})...\n")

        # Sebaran Status Lifecycle Laporan
        statuses_target = [
            ReportStatus.PENDING_VERIFICATION,
            ReportStatus.VERIFIED,
            ReportStatus.ASSIGNED,
            ReportStatus.IN_PROGRESS,
            ReportStatus.RESOLVED,
            ReportStatus.CLOSED,
            ReportStatus.REJECTED,
            ReportStatus.UNRESOLVED,
            ReportStatus.DUPLICATE,
        ]

        priorities = [ReportPriority.LOW, ReportPriority.MEDIUM, ReportPriority.HIGH, ReportPriority.URGENT]

        created_reports: list[Report] = []

        now = datetime.now()

        for idx in range(existing_seed_count + 1, total_count + 1):
            category = categories[(idx - 1) % len(categories)]
            citizen = citizens[(idx - 1) % len(citizens)]

            # Pilih Status
            target_status = statuses_target[(idx - 1) % len(statuses_target)]

            # Template Teks & Lokasi
            cat_tmpl = REPORT_TEMPLATES.get(category.nama_kategori, REPORT_TEMPLATES["Jalan Rusak / Berlubang"])
            desc_template = random.choice(cat_tmpl["descriptions"])
            loc_name, base_lat, base_lng = random.choice(cat_tmpl["locations"])

            # Variasi Koordinat Kecil (±0.005)
            lat = round(base_lat + random.uniform(-0.005, 0.005), 6)
            lng = round(base_lng + random.uniform(-0.005, 0.005), 6)

            # Prioritas
            priority = category.default_priority
            if random.random() < 0.25:  # 25% variasi acak prioritas
                priority = random.choice(priorities)

            # Tanggal Kejadian (~1 s/d 120 hari lalu)
            days_ago = random.randint(1, 120)
            hours_offset = random.randint(0, 23)
            created_dt = now - timedelta(days=days_ago, hours=hours_offset)

            ticket_num = f"{SEED_PREFIX}{created_dt.year}-{idx:04d}"

            report = Report(
                nomor_laporan=ticket_num,
                citizen_id=citizen.id,
                category_id=category.id,
                deskripsi=f"{desc_template} (Seed #{idx:03d})",
                waktu_kejadian=created_dt - timedelta(hours=2),
                latitude=lat,
                longitude=lng,
                alamat_lokasi=loc_name,
                status=ReportStatus.PENDING_VERIFICATION,
                priority=priority,
                created_at=created_dt,
                updated_at=created_dt,
            )
            db.add(report)
            db.flush()

            # Dynamic Fields
            for field_spec in category.fields:
                val = "Normal"
                if field_spec.field_type == "number":
                    val = str(random.randint(10, 150))
                elif field_spec.field_type == "boolean":
                    val = "true" if random.random() > 0.5 else "false"
                elif field_spec.field_type == "select":
                    val = "Sedang" if "kerusakan" in field_spec.field_name else "Mati Total"
                elif field_spec.field_type == "text":
                    val = "Utara / Selatan"

                fv = ReportFieldValue(
                    report_id=report.id,
                    category_field_id=field_spec.id,
                    value=val,
                )
                db.add(fv)

            # Generate 0 - 3 Evidence Photos
            num_photos = random.choices([0, 1, 2, 3], weights=[15, 45, 30, 10])[0]
            for photo_idx in range(1, num_photos + 1):
                img_bytes = generate_placeholder_evidence_image(category.nama_kategori, photo_idx)
                upload_file = UploadFile(
                    filename=f"seed_evidence_{report.id}_{photo_idx}.jpg",
                    file=io.BytesIO(img_bytes),
                    headers={"content-type": "image/jpeg"},
                )
                rel_path, pub_url = storage_service.save_evidence_file(upload_file)

                ev = ReportEvidence(
                    report_id=report.id,
                    file_path=rel_path,
                    uploaded_at=created_dt,
                )
                db.add(ev)

            # Status History Awal (PENDING_VERIFICATION)
            hist_init = ReportStatusHistory(
                report_id=report.id,
                status_from=None,
                status_to=ReportStatus.PENDING_VERIFICATION,
                changed_by=citizen.id,
                catatan="Pengaduan laporan baru berhasil dibuat oleh masyarakat",
                changed_at=created_dt,
            )
            db.add(hist_init)

            # Transisi Status Sesuai Lifecycle
            assigned_officer = random.choice(officers)

            if target_status in [
                ReportStatus.VERIFIED,
                ReportStatus.ASSIGNED,
                ReportStatus.IN_PROGRESS,
                ReportStatus.RESOLVED,
                ReportStatus.UNRESOLVED,
                ReportStatus.CLOSED,
            ]:
                t_verify = created_dt + timedelta(hours=random.randint(1, 6))
                report.status = ReportStatus.VERIFIED
                db.add(
                    ReportStatusHistory(
                        report_id=report.id,
                        status_from=ReportStatus.PENDING_VERIFICATION,
                        status_to=ReportStatus.VERIFIED,
                        changed_by=verifier.id,
                        catatan="Laporan terverifikasi valid oleh petugas verifikator",
                        changed_at=t_verify,
                    )
                )

            if target_status in [
                ReportStatus.ASSIGNED,
                ReportStatus.IN_PROGRESS,
                ReportStatus.RESOLVED,
                ReportStatus.UNRESOLVED,
                ReportStatus.CLOSED,
            ]:
                t_assign = created_dt + timedelta(hours=random.randint(7, 12))
                report.status = ReportStatus.ASSIGNED
                db.add(
                    ReportAssignment(
                        report_id=report.id,
                        officer_id=assigned_officer.id,
                        assigned_by=verifier.id,
                        is_current=True,
                        assigned_at=t_assign,
                    )
                )
                db.add(
                    ReportStatusHistory(
                        report_id=report.id,
                        status_from=ReportStatus.VERIFIED,
                        status_to=ReportStatus.ASSIGNED,
                        changed_by=verifier.id,
                        catatan=f"Penugasan ke petugas {assigned_officer.nama}",
                        changed_at=t_assign,
                    )
                )

            if target_status in [
                ReportStatus.IN_PROGRESS,
                ReportStatus.RESOLVED,
                ReportStatus.UNRESOLVED,
                ReportStatus.CLOSED,
            ]:
                t_progress = created_dt + timedelta(hours=random.randint(13, 24))
                report.status = ReportStatus.IN_PROGRESS
                db.add(
                    ReportStatusHistory(
                        report_id=report.id,
                        status_from=ReportStatus.ASSIGNED,
                        status_to=ReportStatus.IN_PROGRESS,
                        changed_by=assigned_officer.id,
                        catatan="Petugas mulai melakukan penanganan di lokasi",
                        changed_at=t_progress,
                    )
                )
                # Tambah ActionReport
                db.add(
                    ActionReport(
                        report_id=report.id,
                        officer_id=assigned_officer.id,
                        jenis_tindakan="Pemeriksaan dan Perbaikan Lapangan",
                        deskripsi=f"Telah dilakukan tindakan penanganan sementara untuk {category.nama_kategori}",
                        waktu_kedatangan=t_progress,
                        waktu_selesai=t_progress + timedelta(hours=2),
                        hasil="Penanganan selesai sebagian / terpasang rambu darurat",
                        created_at=t_progress,
                    )
                )

            if target_status in [ReportStatus.RESOLVED, ReportStatus.CLOSED]:
                t_resolve = created_dt + timedelta(days=random.randint(1, 3))
                report.status = ReportStatus.RESOLVED
                db.add(
                    ReportStatusHistory(
                        report_id=report.id,
                        status_from=ReportStatus.IN_PROGRESS,
                        status_to=ReportStatus.RESOLVED,
                        changed_by=assigned_officer.id,
                        catatan="Penanganan perbaikan lapangan telah selesai 100%",
                        changed_at=t_resolve,
                    )
                )

            if target_status == ReportStatus.UNRESOLVED:
                t_unresolve = created_dt + timedelta(days=random.randint(1, 3))
                report.status = ReportStatus.UNRESOLVED
                db.add(
                    ReportStatusHistory(
                        report_id=report.id,
                        status_from=ReportStatus.IN_PROGRESS,
                        status_to=ReportStatus.UNRESOLVED,
                        changed_by=assigned_officer.id,
                        catatan="Penanganan memerlukan alat berat tambahan / reassign",
                        changed_at=t_unresolve,
                    )
                )

            if target_status == ReportStatus.CLOSED:
                t_close = created_dt + timedelta(days=random.randint(3, 5))
                report.status = ReportStatus.CLOSED
                db.add(
                    ReportStatusHistory(
                        report_id=report.id,
                        status_from=ReportStatus.RESOLVED,
                        status_to=ReportStatus.CLOSED,
                        changed_by=verifier.id,
                        catatan="Pengaduan ditutup secara resmi oleh verifikator",
                        changed_at=t_close,
                    )
                )

            if target_status == ReportStatus.REJECTED:
                t_reject = created_dt + timedelta(hours=random.randint(2, 8))
                report.status = ReportStatus.REJECTED
                db.add(
                    ReportStatusHistory(
                        report_id=report.id,
                        status_from=ReportStatus.PENDING_VERIFICATION,
                        status_to=ReportStatus.REJECTED,
                        changed_by=verifier.id,
                        catatan="Laporan ditolak: Lokasi diluar wewenang atau informasi tidak valid",
                        changed_at=t_reject,
                    )
                )

            if target_status == ReportStatus.DUPLICATE:
                t_dup = created_dt + timedelta(hours=random.randint(2, 8))
                report.status = ReportStatus.DUPLICATE
                # Cari target duplicate jika ada
                target_dup_id = created_reports[0].id if created_reports else 1
                db.add(
                    ReportStatusHistory(
                        report_id=report.id,
                        status_from=ReportStatus.PENDING_VERIFICATION,
                        status_to=ReportStatus.DUPLICATE,
                        changed_by=verifier.id,
                        catatan=f"Laporan duplikat dari Laporan ID #{target_dup_id}",
                        changed_at=t_dup,
                    )
                )

            created_reports.append(report)

        db.commit()
        print(f"[2] SUKSES: Berhasil men-generate {len(created_reports)} laporan seed baru!")

        # 5. Optional Flag --with-ai
        if with_ai:
            print("\n[3] Flag --with-ai diaktifkan: Memicu AI Analysis nyata pada ~20 laporan...")
            ai_service = AIAnalysisService()
            target_ai_reports = [r for r in created_reports if r.status in [ReportStatus.VERIFIED, ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED, ReportStatus.CLOSED]][:20]

            success_ai_count = 0
            for r_ai in target_ai_reports:
                try:
                    print(f"    -> Memicu AI Analysis untuk Report ID #{r_ai.id} ({r_ai.nomor_laporan})...")
                    bg = BackgroundTasks()
                    res_ai = asyncio.run(ai_service.get_or_trigger_analysis(db, r_ai.id, bg))
                    # Run background task directly if queued
                    if bg.tasks:
                        for task_func, task_args, task_kwargs in bg.tasks:
                            asyncio.run(task_func(*task_args, **task_kwargs))
                    success_ai_count += 1
                except Exception as ai_err:
                    print(f"    [WARN] AI Trigger gagal untuk Report #{r_ai.id}: {ai_err}")

            print(f"  + Selesai memicu AI Analysis pada {success_ai_count} laporan!")

        print("\n==================================================================")
        print(f"  SEEDING SELESAI: Total {total_count} laporan seed tersedia di DB.")
        print("==================================================================")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding gagal: {e}")
        raise e
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="SIGAP Dataset Sintetis Seeder (Phase 8 Pre-requisite)")
    parser.add_argument("--reset", action="store_true", help="Hapus data seed lama berprefix SIGAP-SEED- sebelum seeding")
    parser.add_argument("--with-ai", action="store_true", help="Picu analisis AI nyata pada ~20 laporan (memanggil Gemini API)")
    parser.add_argument("--count", type=int, default=120, help="Jumlah total laporan seed yang ingin di-generate (default: 120)")

    args = parser.parse_args()
    seed_dataset(total_count=args.count, reset=args.reset, with_ai=args.with_ai)


if __name__ == "__main__":
    main()
