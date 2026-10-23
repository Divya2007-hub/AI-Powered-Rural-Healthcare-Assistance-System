from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.facility import FacilitiesListResponse
from app.services.facility_service import FacilityService

router = APIRouter(prefix="/facilities")


def get_facility_service(db: Session = Depends(get_db)) -> FacilityService:
    return FacilityService(db)


@router.get("/nearby", response_model=FacilitiesListResponse)
def list_nearby_facilities(
    city: str | None = Query(default=None, max_length=100),
    type: str | None = Query(default=None, alias="type", max_length=50),
    emergency_only: bool = False,
    limit: int = Query(default=20, ge=1, le=50),
    service: FacilityService = Depends(get_facility_service),
) -> FacilitiesListResponse:
    return service.list_nearby(city=city, facility_type=type, emergency_only=emergency_only, limit=limit)
