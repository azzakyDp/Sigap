"""
Konfigurasi environment SIGAP Backend.

Semua nilai dibaca dari environment variable / file .env.
Jangan hardcode secret di sini.
"""

import json
from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DB_SSL_CA_PATH: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Application ---
    APP_NAME: str = "SIGAP Backend"
    APP_VERSION: str = "2.0.0"
    APP_ENV: str = "staging"  # development | staging | production
    DEBUG: bool = True

    # --- Database (MySQL) ---
    # Contoh: mysql+pymysql://user:password@host:3306/sigap_db
    DATABASE_URL: str = Field(default="mysql+pymysql://root:@localhost:3306/sigap_db")

    # --- JWT (disiapkan strukturnya, diaktifkan penuh di Phase 3 — Authentication) ---
    JWT_SECRET_KEY: str = Field(default="change-me-in-env")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- CORS ---
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://sigaplamongan.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            if "," in v:
                return [i.strip() for i in v.split(",") if i.strip()]
            return [v]
        return v

    # --- File / Object Storage ---
    STORAGE_BACKEND: str = "local"  # local | cloudinary
    STORAGE_LOCAL_PATH: str = "storage/uploads"

    # --- Cloudinary Settings ---
    CLOUDINARY_CLOUD_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_API_SECRET: str | None = None
    CLOUDINARY_FOLDER: str = "sigap/reports"

    # --- Dashboard / SLA ---
    URGENT_SLA_HOURS: int = 2

    # --- AI Service ---
    AI_PROVIDER: str | None = "gemini"
    AI_API_KEY: str | None = None
    AI_MODEL: str | None = "gemini-3.1-flash-lite"
    AI_MODEL_FALLBACK: str | None = "gemini-2.5-flash"
    AI_TIMEOUT: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()