"""
Konfigurasi environment SIGAP Backend.

Semua nilai dibaca dari environment variable / file .env.
Jangan hardcode secret di sini.
"""

from functools import lru_cache

from pydantic import Field
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
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"  # development | staging | production
    DEBUG: bool = True

    # --- Database (MySQL) ---
    # Contoh: mysql+pymysql://user:password@host:3306/sigap_db
    DATABASE_URL: str = Field(default="mysql+pymysql://root:@localhost:3306/sigap_db")

    # --- JWT (disiapkan strukturnya, diaktifkan penuh di Phase 3 — Authentication) ---
    JWT_SECRET_KEY: str = Field(default="change-me-in-env")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # --- File / Object Storage (disiapkan strukturnya, diaktifkan di Phase 5) ---
    STORAGE_BACKEND: str = "local"  # local | s3 | dst (ditentukan saat Phase 5)
    STORAGE_LOCAL_PATH: str = "storage/uploads"

    # --- Dashboard / SLA ---
    URGENT_SLA_HOURS: int = 2

    # --- AI Service (skeleton saja — Phase 1 tidak mengaktifkan pemanggilan AI apa pun) ---
    # Diisi & dipakai mulai Phase 10 sesuai AI Requirements SIGAP.
    AI_PROVIDER: str | None = None
    AI_API_KEY: str | None = None
    AI_MODEL: str | None = None
    AI_TIMEOUT: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()