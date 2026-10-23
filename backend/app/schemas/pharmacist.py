from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PharmacistStockItem(BaseModel):
    id: int
    medicine_name: str
    category: str | None = None
    in_stock: bool
    quantity: int | None = None
    unit: str | None = None
    price: float | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PharmacistStockListResponse(BaseModel):
    facility_id: int
    facility_name: str
    medicines: list[PharmacistStockItem]
    count: int


class StockCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    medicine_name: str = Field(min_length=1, max_length=120)
    category: str | None = Field(default=None, max_length=60)
    in_stock: bool = True
    quantity: int | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, max_length=30)
    price: float | None = Field(default=None, ge=0)


class StockUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    category: str | None = Field(default=None, max_length=60)
    in_stock: bool | None = None
    quantity: int | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, max_length=30)
    price: float | None = Field(default=None, ge=0)
