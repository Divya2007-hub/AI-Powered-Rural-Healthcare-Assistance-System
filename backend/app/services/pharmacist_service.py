from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.medicine import MedicineStock
from app.models.user import User
from app.repositories.pharmacist_repository import PharmacistRepository
from app.schemas.pharmacist import (
    PharmacistStockItem,
    PharmacistStockListResponse,
    StockCreateRequest,
    StockUpdateRequest,
)


class PharmacistService:
    def __init__(self, db: Session) -> None:
        self._repo = PharmacistRepository(db)

    def list_stock(self, user: User) -> PharmacistStockListResponse:
        rows = self._repo.list_for_facility(user.facility_id)
        items = [PharmacistStockItem.model_validate(row) for row in rows]
        return PharmacistStockListResponse(
            facility_id=user.facility_id,
            facility_name=user.facility.name,
            medicines=items,
            count=len(items),
        )

    def create_stock(self, user: User, payload: StockCreateRequest) -> PharmacistStockItem:
        stock = MedicineStock(facility_id=user.facility_id, **payload.model_dump())
        return PharmacistStockItem.model_validate(self._repo.add(stock))

    def update_stock(
        self,
        user: User,
        stock_id: int,
        payload: StockUpdateRequest,
    ) -> PharmacistStockItem:
        stock = self._repo.get_for_facility(user.facility_id, stock_id)
        if stock is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medicine stock entry not found.",
            )

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(stock, field, value)

        return PharmacistStockItem.model_validate(self._repo.save(stock))

    def delete_stock(self, user: User, stock_id: int) -> None:
        stock = self._repo.get_for_facility(user.facility_id, stock_id)
        if stock is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medicine stock entry not found.",
            )
        self._repo.delete(stock)
