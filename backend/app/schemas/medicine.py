from datetime import datetime

from pydantic import BaseModel


class MedicineAvailabilityResponse(BaseModel):
    id: int
    medicine_name: str
    category: str | None = None
    in_stock: bool
    quantity: int | None = None
    unit: str | None = None
    price: float | None = None
    facility_id: int
    facility_name: str
    facility_type: str
    city: str
    state: str
    phone: str | None = None
    distance_km: float | None = None
    updated_at: datetime | None = None


class MedicineAvailabilityListResponse(BaseModel):
    medicines: list[MedicineAvailabilityResponse]
    count: int
