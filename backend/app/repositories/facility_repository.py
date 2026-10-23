from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.facility import Facility


class FacilityRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_nearby(
        self,
        city: str | None = None,
        facility_type: str | None = None,
        emergency_only: bool = False,
        limit: int = 20,
    ) -> list[Facility]:
        query = self._db.query(Facility)

        if city:
            query = query.filter(Facility.city.ilike(f"%{city}%"))
        if facility_type:
            query = query.filter(Facility.type.ilike(f"%{facility_type}%"))
        if emergency_only:
            query = query.filter(or_(Facility.emergency_services.is_(True), Facility.open_24x7.is_(True)))

        return query.order_by(Facility.distance_km.asc().nullslast(), Facility.id.asc()).limit(limit).all()
