"""
FastAPI Dependencies — Authentication & Role-Based Access Control (RBAC).
"""

from collections.abc import Callable
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user_repository import UserRepository

# Scheme Authorization Header: Bearer <token>
security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency untuk mengekstrak dan memvalidasi JWT dari Authorization header.
    Mengembalikan instance User aktif dari database.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException(
            message="Token autentikasi tidak ditemukan",
            status_code=401,
        )

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise UnauthorizedException(
                message="Token tidak valid",
                status_code=401,
            )
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise UnauthorizedException(
            message="Token tidak valid atau telah kadaluwarsa",
            status_code=401,
        )

    user = UserRepository.get_by_id(db, user_id)
    if not user:
        raise UnauthorizedException(
            message="User pemilik token tidak ditemukan",
            status_code=401,
        )

    return user


def require_role(*allowed_roles: UserRole) -> Callable:
    """
    Dependency factory untuk Role-Based Access Control (RBAC).

    Contoh penggunaan pada route:
        @router.get("/officer-only", dependencies=[Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))])
    """

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise UnauthorizedException(
                message="Anda tidak memiliki hak akses ke resource ini",
                status_code=403,
            )
        return current_user

    return role_checker
