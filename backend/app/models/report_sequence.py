"""
Model ReportSequence SIGAP Backend (Sequence konkuransi aman per tahun).
"""

from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ReportSequence(Base):
    """
    Tabel penampung counter sequence nomor laporan per tahun.
    Digunakan bersama SELECT FOR UPDATE untuk mencegah race condition.
    """

    __tablename__ = "report_sequences"

    year: Mapped[int] = mapped_column(Integer, primary_key=True)
    current_value: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
