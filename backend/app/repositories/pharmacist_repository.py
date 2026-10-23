from sqlalchemy.orm import Session

from app.models.medicine import MedicineStock


class PharmacistRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_for_facility(self, facility_id: int) -> list[MedicineStock]:
        return (
            self._db.query(MedicineStock)
            .filter(MedicineStock.facility_id == facility_id)
            .order_by(MedicineStock.medicine_name.asc(), MedicineStock.id.asc())
            .all()
        )

    def get_for_facility(self, facility_id: int, stock_id: int) -> MedicineStock | None:
        return (
            self._db.query(MedicineStock)
            .filter(MedicineStock.id == stock_id, MedicineStock.facility_id == facility_id)
            .first()
        )

    def add(self, stock: MedicineStock) -> MedicineStock:
        self._db.add(stock)
        self._db.commit()
        self._db.refresh(stock)
        return stock

    def save(self, stock: MedicineStock) -> MedicineStock:
        self._db.commit()
        self._db.refresh(stock)
        return stock

    def delete(self, stock: MedicineStock) -> None:
        self._db.delete(stock)
        self._db.commit()
