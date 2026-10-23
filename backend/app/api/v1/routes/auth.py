from fastapi import APIRouter, Depends, status

from app.api.deps import get_auth_service, get_bearer_token, get_current_user
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth")


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    user, token = service.register(
        name=payload.name,
        email=payload.email,
        password=payload.password,
        language=payload.language,
    )
    return AuthResponse(token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    user, token = service.login(email=payload.email, password=payload.password)
    return AuthResponse(token=token, user=UserResponse.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    token: str | None = Depends(get_bearer_token),
    service: AuthService = Depends(get_auth_service),
    _: User = Depends(get_current_user),
) -> None:
    if token:
        service.logout(token)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(user)
