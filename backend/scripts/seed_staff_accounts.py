"""
Script seed data akun staf SIGAP (Verifier, Officer, Admin).

Digunakan untuk keperluan testing lokal dan automated E2E test.
JANGAN PERNAH dijalankan di database production!

Penggunaan:
    python scripts/seed_staff_accounts.py
"""

import os
import sys
from pathlib import Path

# Fix sys.path agar dapat di-import dari root folder backend
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.user import User

STAFF_ACCOUNTS = [
    {
        "nama": "Verifier Satu",
        "email": "verifier1@sigap.test",
        "password_plain": "Verifier123!",
        "nik": "3201000000000001",
        "nomor_hp": "081200000001",
        "role": UserRole.VERIFIER,
    },
    {
        "nama": "Petugas Satu",
        "email": "officer1@sigap.test",
        "password_plain": "Officer123!",
        "nik": "3201000000000002",
        "nomor_hp": "081200000002",
        "role": UserRole.OFFICER,
    },
    {
        "nama": "Petugas Dua",
        "email": "officer2@sigap.test",
        "password_plain": "Officer123!",
        "nik": "3201000000000003",
        "nomor_hp": "081200000003",
        "role": UserRole.OFFICER,
    },
    {
        "nama": "Admin Utama",
        "email": "admin1@sigap.test",
        "password_plain": "Admin123!",
        "nik": "3201000000000004",
        "nomor_hp": "081200000004",
        "role": UserRole.ADMIN,
    },
]


def seed_staff():
    db = SessionLocal()
    try:
        import app.models  # Register all SQLAlchemy models
        from app.core.database import Base
        Base.metadata.create_all(bind=db.get_bind())

        print("Seeding staff accounts (VERIFIER, OFFICER, ADMIN)...")

        created_count = 0
        updated_count = 0

        for acc in STAFF_ACCOUNTS:
            stmt = select(User).where(User.email == acc["email"])
            user = db.scalar(stmt)

            hashed_pwd = hash_password(acc["password_plain"])

            if not user:
                user = User(
                    nama=acc["nama"],
                    email=acc["email"],
                    password_hash=hashed_pwd,
                    nik=acc["nik"],
                    nomor_hp=acc["nomor_hp"],
                    role=acc["role"],
                )
                db.add(user)
                created_count += 1
                print(f"  + Created account: {acc['email']} | Role: {acc['role'].value}")
            else:
                user.nama = acc["nama"]
                user.password_hash = hashed_pwd
                user.role = acc["role"]
                user.nik = acc["nik"]
                user.nomor_hp = acc["nomor_hp"]
                updated_count += 1
                print(f"  = Updated account: {acc['email']} | Role: {acc['role'].value}")

        db.commit()
        print(
            f"\nSUCCESS: Seeding staff finished! ({created_count} created, {updated_count} updated)\n"
            f"NOTE: Passwords are encrypted in DB. Refer to test environment docs for default credentials."
        )
    except Exception as e:
        db.rollback()
        print(f"ERROR: Seeding staff accounts failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_staff()
