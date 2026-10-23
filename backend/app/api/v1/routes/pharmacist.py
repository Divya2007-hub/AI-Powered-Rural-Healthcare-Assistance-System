from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_pharmacist
from app.core.database import get_db
from app.models.user import User
from app.schemas.pharmacist import (
    PharmacistStockItem,
    PharmacistStockListResponse,
    StockCreateRequest,
    StockUpdateRequest,
)
from app.services.pharmacist_service import PharmacistService

router = APIRouter(prefix="/pharmacist")


def get_pharmacist_service(db: Session = Depends(get_db)) -> PharmacistService:
    return PharmacistService(db)


@router.get("/stock", response_model=PharmacistStockListResponse)
def list_stock(
    user: User = Depends(get_current_pharmacist),
    service: PharmacistService = Depends(get_pharmacist_service),
) -> PharmacistStockListResponse:
    return service.list_stock(user)


@router.post("/stock", response_model=PharmacistStockItem, status_code=status.HTTP_201_CREATED)
def create_stock(
    payload: StockCreateRequest,
    user: User = Depends(get_current_pharmacist),
    service: PharmacistService = Depends(get_pharmacist_service),
) -> PharmacistStockItem:
    return service.create_stock(user, payload)


@router.patch("/stock/{stock_id}", response_model=PharmacistStockItem)
def update_stock(
    stock_id: int,
    payload: StockUpdateRequest,
    user: User = Depends(get_current_pharmacist),
    service: PharmacistService = Depends(get_pharmacist_service),
) -> PharmacistStockItem:
    return service.update_stock(user, stock_id, payload)


@router.delete("/stock/{stock_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stock(
    stock_id: int,
    user: User = Depends(get_current_pharmacist),
    service: PharmacistService = Depends(get_pharmacist_service),
) -> None:
    service.delete_stock(user, stock_id)
