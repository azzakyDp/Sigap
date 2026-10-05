"""
Schema Pydantic untuk entitas User SIGAP Backend.

PERHATIAN PRIVASI (PRD 12.5):
UserResponse HANYA mendefinisikan field publik yang boleh dikembalikan ke client.
NIK dan password_hash SANGAT DILARANG dimasukkan ke schema response ini.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.models.enums import UserRole


class UserResponse(BaseModel):
    """
    Response schema standar untuk User.
    Explicit allow-list (hanya field di bawah ini yang diexpose).
    """

    id: int
    nama: str
    email: str
    nomor_hp: str
    role: UserRole
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
