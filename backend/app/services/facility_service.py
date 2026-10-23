from math import asin, cos, radians, sin, sqrt

from sqlalchemy.orm import Session

from app.repositories.facility_repository import FacilityRepository
from app.schemas.facility import FacilitiesListResponse, FacilityResponse

EARTH_RADIUS_KM = 6371.0


def distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points using the haversine formula."""
    delta_lat = radians(lat2 - lat1)
    delta_lng = radians(lng2 - lng1)
    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(delta_lng / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * asin(sqrt(a))


class FacilityService:
    def __init__(self, db: Session) -> None:
        self._repo = FacilityRepository(db)

    def list_nearby(
        self,
        city: str | None = None,
        facility_type: str | None = None,
        emergency_only: bool = False,
        limit: int = 20,
        lat: float | None = None,
        lng: float | None = None,
        radius_km: float | None = None,
    ) -> FacilitiesListResponse:
        has_location = lat is not None and lng is not None
        facilities = self._repo.list_nearby(
            city=city,
            facility_type=facility_type,
            emergency_only=emergency_only,
            limit=None if has_location else limit,
        )

        if has_location:
            scored = []
            for facility in facilities:
                computed = None
                if facility.latitude is not None and facility.longitude is not None:
                    computed = distance_km(lat, lng, facility.latitude, facility.longitude)
                scored.append((facility, computed))

            if radius_km is not None:
                scored = [
                    (facility, computed)
                    for facility, computed in scored
                    if computed is not None and computed <= radius_km
                ]

            scored.sort(
                key=lambda item: (
                    item[1] is None,
                    item[1] if item[1] is not None else 0.0,
                    item[0].id,
                )
            )
            scored = scored[:limit]
            facilities = [facility for facility, _ in scored]
            distances = {
                facility.id: computed for facility, computed in scored
            }
        else:
            distances = {}

        items = []
        for facility in facilities:
            item = FacilityResponse.model_validate(facility)
            if facility.id in distances and distances[facility.id] is not None:
                item = item.model_copy(
                    update={"distance_km": round(distances[facility.id], 1)}
                )
            items.append(item)

        return FacilitiesListResponse(facilities=items, count=len(items))
