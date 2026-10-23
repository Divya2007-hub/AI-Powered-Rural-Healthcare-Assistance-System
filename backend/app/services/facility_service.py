from sqlalchemy.orm import Session

from app.repositories.facility_repository import FacilityRepository
from app.schemas.facility import FacilitiesListResponse, FacilityResponse


class FacilityService:
    def __init__(self, db: Session) -> None:
        self._repo = FacilityRepository(db)

    def list_nearby(
        self,
        city: str | None = None,
        facility_type: str | None = None,
        emergency_only: bool = False,
        limit: int = 20,
    ) -> FacilitiesListResponse:
        facilities = self._repo.list_nearby(
            city=city,
            facility_type=facility_type,
            emergency_only=emergency_only,
            limit=limit,
        )
        items = [FacilityResponse.model_validate(facility) for facility in facilities]
        return FacilitiesListResponse(facilities=items, count=len(items))
