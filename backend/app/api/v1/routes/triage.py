from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_optional
from app.core.database import get_db
from app.models.user import User
from app.schemas.triage import TriageRequest, TriageResponse
from app.services.history_service import HistoryService
from app.services.triage_service import TriageService

router = APIRouter(prefix="/triage")


def get_triage_service() -> TriageService:
    return TriageService()


@router.post("/symptoms", response_model=TriageResponse)
def assess_symptoms(
    payload: TriageRequest,
    service: TriageService = Depends(get_triage_service),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> TriageResponse:
    result = service.assess(payload)
    if user is not None:
        HistoryService(db).save_triage(user, payload, result)
    return result
