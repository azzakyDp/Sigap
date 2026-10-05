"""
Router Autentikasi (POST /register, POST /login, GET /me).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException, ValidationException
from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrasi Akun Masyarakat (CITIZEN)",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> UserResponse:
    """
    Endpoint registrasi publik untuk masyarakat (CITIZEN).

    Validasi Keunikan: NIK, Email, dan Nomor HP wajib unik.
    Keamanan Privasi (PRD 12.5): Field NIK tidak dikembalikan pada response body.
    """
    # 1. Cek keunikan NIK
    if UserRepository.get_by_nik(db, payload.nik):
        raise ValidationException("NIK sudah terdaftar dalam sistem")

    # 2. Cek keunikan Email
    if UserRepository.get_by_email(db, payload.email):
        raise ValidationException("Email sudah terdaftar")

    # 3. Cek keunikan Nomor HP
    if UserRepository.get_by_nomor_hp(db, payload.nomor_hp):
        raise ValidationException("Nomor HP sudah terdaftar")

    # 4. Create user
    new_user = User(
        nama=payload.nama.strip(),
        nik=payload.nik.strip(),
        email=payload.email.lower().strip(),
        nomor_hp=payload.nomor_hp.strip(),
        password_hash=hash_password(payload.password),
        role=UserRole.CITIZEN,
    )
    saved_user = UserRepository.create(db, new_user)
    return UserResponse.model_validate(saved_user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login User (Email / Nomor HP + Password)",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Endpoint login publik.

    Menerima email atau nomor HP + password.
    Error kredensial salah bersifat generik ("Email/nomor HP atau password salah")
    untuk mencegah user enumeration attack (PRD 12.1).
    """
    identifier = payload.identifier.strip()
    user = UserRepository.get_by_identifier(db, identifier)

    if not user or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedException(
            message="Email/nomor HP atau password salah",
            status_code=401,
        )

    # Issue JWT Token (sub = user.id, role = user.role.value)
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.value,
        }
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Mendapatkan profil user terautentikasi",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Mendapatkan informasi profil user saat ini (perlu Authorization: Bearer token)."""
    return UserResponse.model_validate(current_user)
