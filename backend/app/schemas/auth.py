"""
Schema Pydantic untuk Autentikasi (Register & Login).
"""

import re
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    """Payload request untuk registrasi akun baru (CITIZEN)."""

    nama: str = Field(..., min_length=2, max_length=255, description="Nama lengkap")
    nik: str = Field(..., min_length=16, max_length=16, description="NIK 16 digit")
    email: EmailStr = Field(..., description="Email aktif")
    nomor_hp: str = Field(..., min_length=10, max_length=15, description="Nomor HP 10-15 digit")
    password: str = Field(..., min_length=8, description="Password minimal 8 karakter")

    @field_validator("nik")
    @classmethod
    def validate_nik(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("NIK harus berupa 16 digit angka.")
        return v

    @field_validator("nomor_hp")
    @classmethod
    def validate_nomor_hp(cls, v: str) -> str:
        # Menghapus prefiks +62 / 62 jika ada
        v_clean = v.strip()
        if v_clean.startswith("+62"):
            v_clean = "0" + v_clean[3:]
        elif v_clean.startswith("62"):
            v_clean = "0" + v_clean[2:]

        if not v_clean.isdigit():
            raise ValueError("Nomor HP harus berupa digit angka.")
        return v_clean

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password harus mengandung minimal 1 huruf besar (uppercase).")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password harus mengandung minimal 1 huruf kecil (lowercase).")
        if not re.search(r"\d", v):
            raise ValueError("Password harus mengandung minimal 1 digit angka.")
        return v


class LoginRequest(BaseModel):
    """Payload request untuk login (email atau nomor HP + password)."""

    identifier: str = Field(..., description="Email atau nomor HP terdaftar")
    password: str = Field(..., description="Password akun")


class TokenResponse(BaseModel):
    """Response sukses login yang berisi access token & data user."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
