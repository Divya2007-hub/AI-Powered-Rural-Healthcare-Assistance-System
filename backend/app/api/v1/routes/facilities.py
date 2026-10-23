from fastapi import APIRouter, Depends, HTTPException, Query
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
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    radius_km: float | None = Query(default=None, gt=0, le=500),
    service: FacilityService = Depends(get_facility_service),
) -> FacilitiesListResponse:
    if (lat is None) != (lng is None):
        raise HTTPException(
            status_code=422, detail="lat and lng must be provided together"
        )
    if radius_km is not None and lat is None:
        raise HTTPException(
            status_code=422, detail="radius_km requires lat and lng"
        )

    return service.list_nearby(
        city=city,
        facility_type=type,
        emergency_only=emergency_only,
        limit=limit,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
    )
