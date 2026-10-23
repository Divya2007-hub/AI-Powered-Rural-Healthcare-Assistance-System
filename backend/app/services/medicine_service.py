from sqlalchemy.orm import Session

from app.repositories.medicine_repository import MedicineRepository
from app.schemas.medicine import MedicineAvailabilityListResponse, MedicineAvailabilityResponse


class MedicineService:
    def __init__(self, db: Session) -> None:
        self._repo = MedicineRepository(db)

    def search(
        self,
        medicine: str | None = None,
        city: str | None = None,
        in_stock: bool | None = None,
        limit: int = 50,
    ) -> MedicineAvailabilityListResponse:
        rows = self._repo.search(medicine=medicine, city=city, in_stock=in_stock, limit=limit)

        items = [
            MedicineAvailabilityResponse(
                id=row.id,
                medicine_name=row.medicine_name,
                category=row.category,
                in_stock=row.in_stock,
                quantity=row.quantity,
                unit=row.unit,
                price=row.price,
                facility_id=row.facility_id,
                facility_name=row.facility.name,
                facility_type=row.facility.type,
                city=row.facility.city,
                state=row.facility.state,
                phone=row.facility.phone,
                distance_km=row.facility.distance_km,
                updated_at=row.updated_at,
            )
            for row in rows
        ]

        return MedicineAvailabilityListResponse(medicines=items, count=len(items))
