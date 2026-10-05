"""
Repository layer untuk entitas User.
"""

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.user import User


class UserRepository:
    """Metode akses data untuk model User."""

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> User | None:
        stmt = select(User).where(User.id == user_id)
        return db.scalar(stmt)

    @staticmethod
    def get_by_email(db: Session, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return db.scalar(stmt)

    @staticmethod
    def get_by_nomor_hp(db: Session, nomor_hp: str) -> User | None:
        stmt = select(User).where(User.nomor_hp == nomor_hp)
        return db.scalar(stmt)

    @staticmethod
    def get_by_nik(db: Session, nik: str) -> User | None:
        stmt = select(User).where(User.nik == nik)
        return db.scalar(stmt)

    @staticmethod
    def get_by_identifier(db: Session, identifier: str) -> User | None:
        """Query User berdasarkan email ATAU nomor HP (untuk login)."""
        stmt = select(User).where(
            or_(User.email == identifier, User.nomor_hp == identifier)
        )
        return db.scalar(stmt)

    @staticmethod
    def get_users_by_role(db: Session, role: UserRole) -> list[User]:
        """Mengambil seluruh user berdasarkan role (misal: OFFICER)."""
        stmt = select(User).where(User.role == role).order_by(User.nama.asc())
        return list(db.scalars(stmt).all())

    @staticmethod
    def create(db: Session, user: User) -> User:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
