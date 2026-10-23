from fastapi import APIRouter, Depends

from app.schemas.triage import TriageRequest, TriageResponse
from app.services.triage_service import TriageService

router = APIRouter(prefix="/triage")


def get_triage_service() -> TriageService:
    return TriageService()


@router.post("/symptoms", response_model=TriageResponse)
def assess_symptoms(
    payload: TriageRequest,
    service: TriageService = Depends(get_triage_service),
) -> TriageResponse:
    return service.assess(payload)
