from sqlalchemy.orm import Session, joinedload

from app.models.facility import Facility
from app.models.medicine import MedicineStock


class MedicineRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def search(
        self,
        medicine: str | None = None,
        city: str | None = None,
        in_stock: bool | None = None,
        limit: int = 50,
    ) -> list[MedicineStock]:
        query = self._db.query(MedicineStock).join(Facility).options(joinedload(MedicineStock.facility))

        if medicine:
            query = query.filter(MedicineStock.medicine_name.ilike(f"%{medicine}%"))
        if city:
            query = query.filter(Facility.city.ilike(f"%{city}%"))
        if in_stock is not None:
            query = query.filter(MedicineStock.in_stock.is_(in_stock))

        return (
            query.order_by(Facility.distance_km.asc().nullslast(), MedicineStock.medicine_name.asc())
            .limit(limit)
            .all()
        )
