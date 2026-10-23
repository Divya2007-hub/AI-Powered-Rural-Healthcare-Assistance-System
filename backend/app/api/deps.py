from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService

bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str | None:
    return credentials.credentials if credentials else None


def get_current_user(
    token: str | None = Depends(get_bearer_token),
    service: AuthService = Depends(get_auth_service),
) -> User:
    user = service.resolve_token(token) if token else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_user_optional(
    token: str | None = Depends(get_bearer_token),
    service: AuthService = Depends(get_auth_service),
) -> User | None:
    return service.resolve_token(token) if token else None
