from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.medicine import MedicineAvailabilityListResponse
from app.services.medicine_service import MedicineService

router = APIRouter(prefix="/medicines")


def get_medicine_service(db: Session = Depends(get_db)) -> MedicineService:
    return MedicineService(db)


@router.get("/availability", response_model=MedicineAvailabilityListResponse)
def search_medicine_availability(
    medicine: str | None = Query(default=None, max_length=120),
    city: str | None = Query(default=None, max_length=100),
    in_stock: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    service: MedicineService = Depends(get_medicine_service),
) -> MedicineAvailabilityListResponse:
    return service.search(medicine=medicine, city=city, in_stock=in_stock, limit=limit)
