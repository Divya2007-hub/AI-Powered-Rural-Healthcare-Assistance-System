from fastapi import APIRouter, Depends

from app.api.deps import get_auth_service, get_current_user
from app.models.user import User
from app.schemas.auth import UpdateProfileRequest, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/users")


@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    updated = service.update_profile(user, name=payload.name, language=payload.language)
    return UserResponse.model_validate(updated)
